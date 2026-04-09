-- Migration: Partial sale returns
-- Adds sale_returns and sale_return_items tables plus the create_sale_return RPC.

CREATE SEQUENCE return_number_seq START 1;

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE sale_returns (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  return_number  text        UNIQUE NOT NULL,
  sale_id        uuid        NOT NULL REFERENCES sales(id),
  refund_method  text        NOT NULL CHECK (refund_method IN ('cash', 'transfer')),
  total_refund   numeric     NOT NULL CHECK (total_refund >= 0),
  total_cogs_returned numeric NOT NULL DEFAULT 0 CHECK (total_cogs_returned >= 0),
  notes          text,
  created_by     uuid        REFERENCES auth.users(id),
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE sale_return_items (
  id            uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id     uuid    NOT NULL REFERENCES sale_returns(id) ON DELETE CASCADE,
  product_id    uuid    NOT NULL REFERENCES products(id),
  quantity      numeric NOT NULL CHECK (quantity > 0),
  unit_price    numeric NOT NULL CHECK (unit_price >= 0),
  refund_amount numeric NOT NULL CHECK (refund_amount >= 0)
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_sale_returns_sale ON sale_returns (sale_id);
CREATE INDEX idx_sale_return_items_return ON sale_return_items (return_id);
CREATE INDEX idx_sale_return_items_product ON sale_return_items (product_id);

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE sale_returns      ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_return_items ENABLE ROW LEVEL SECURITY;

-- Only owners may create / view returns
CREATE POLICY "Owner can manage sale returns" ON sale_returns
  FOR ALL USING (is_owner());

CREATE POLICY "Users can view sale returns for accessible sales" ON sale_returns
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sales
      WHERE sales.id = sale_returns.sale_id
        AND (sales.created_by = auth.uid() OR is_owner())
    )
  );

CREATE POLICY "Owner can manage sale return items" ON sale_return_items
  FOR ALL USING (is_owner());

CREATE POLICY "Users can view sale return items" ON sale_return_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sale_returns sr
      JOIN sales ON sales.id = sr.sale_id
      WHERE sr.id = sale_return_items.return_id
        AND (sales.created_by = auth.uid() OR is_owner())
    )
  );

-- ============================================================
-- FUNCTION: create_sale_return
-- ============================================================

CREATE OR REPLACE FUNCTION create_sale_return(p_payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sale          RECORD;
  v_return_id     uuid        := gen_random_uuid();
  v_return_number text;
  v_journal_id    uuid        := gen_random_uuid();
  v_total_refund  numeric     := 0;
  v_total_cogs    numeric     := 0;

  item            jsonb;
  v_product_id    uuid;
  v_qty_return    numeric;
  v_unit_price    numeric;
  v_refund        numeric;

  v_sold_qty      numeric;
  v_already_returned numeric;
  v_returnable    numeric;

  v_avg_cost      numeric;
  v_sold_cogs     numeric;
  v_item_cogs     numeric;

  v_batch_id      uuid;
  v_cash_account  uuid;
  v_refund_method text;
BEGIN
  -- Lock the sale row
  SELECT * INTO v_sale FROM sales WHERE id = (p_payload->>'sale_id')::uuid FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sale not found';
  END IF;

  IF v_sale.status != 'completed' THEN
    RAISE EXCEPTION 'Can only create a return on a completed sale';
  END IF;

  v_refund_method := p_payload->>'refund_method';
  IF v_refund_method NOT IN ('cash', 'transfer') THEN
    RAISE EXCEPTION 'Invalid refund method: %', v_refund_method;
  END IF;

  -- Validate and accumulate totals for each return item
  FOR item IN SELECT * FROM jsonb_array_elements(p_payload->'items')
  LOOP
    v_product_id  := (item->>'product_id')::uuid;
    v_qty_return  := (item->>'quantity')::numeric;

    IF v_qty_return IS NULL OR v_qty_return <= 0 THEN
      RAISE EXCEPTION 'Return quantity must be positive for product: %', v_product_id;
    END IF;

    -- How many were sold in the original sale?
    SELECT COALESCE(SUM(quantity), 0)
      INTO v_sold_qty
      FROM sale_items
     WHERE sale_id = v_sale.id AND product_id = v_product_id;

    IF v_sold_qty = 0 THEN
      RAISE EXCEPTION 'Product % was not part of this sale', v_product_id;
    END IF;

    -- How many have already been returned?
    SELECT COALESCE(SUM(sri.quantity), 0)
      INTO v_already_returned
      FROM sale_return_items sri
      JOIN sale_returns sr ON sr.id = sri.return_id
     WHERE sr.sale_id = v_sale.id AND sri.product_id = v_product_id;

    v_returnable := v_sold_qty - v_already_returned;

    IF v_qty_return > v_returnable THEN
      RAISE EXCEPTION 'Cannot return % units of product %. Only % units are still returnable.',
        v_qty_return, v_product_id, v_returnable;
    END IF;

    -- Selling price from the original sale item
    SELECT price INTO v_unit_price
      FROM sale_items
     WHERE sale_id = v_sale.id AND product_id = v_product_id
     LIMIT 1;

    v_refund        := v_qty_return * v_unit_price;
    v_total_refund  := v_total_refund + v_refund;

    -- Compute average cost price for this product in the original sale
    -- (sum of cost per OUT movement / total quantity OUT)
    SELECT
      COALESCE(SUM(im.quantity * ib.cost_price), 0),
      COALESCE(SUM(im.quantity), 0)
    INTO v_sold_cogs, v_sold_qty
    FROM inventory_movements im
    JOIN inventory_batches ib ON ib.id = im.batch_id
    WHERE im.reference_type = 'sale'
      AND im.reference_id   = v_sale.id
      AND im.product_id     = v_product_id
      AND im.type           = 'OUT';

    IF v_sold_qty > 0 THEN
      v_avg_cost := v_sold_cogs / v_sold_qty;
    ELSE
      v_avg_cost := 0;
    END IF;

    v_item_cogs   := v_qty_return * v_avg_cost;
    v_total_cogs  := v_total_cogs + v_item_cogs;

  END LOOP;

  -- Generate return number
  v_return_number := 'RET-' || to_char(now(), 'YYYYMMDD') || '-' || lpad(nextval('return_number_seq')::text, 4, '0');

  -- Insert sale_returns record
  INSERT INTO sale_returns (id, return_number, sale_id, refund_method, total_refund, total_cogs_returned, notes, created_by, created_at)
  VALUES (
    v_return_id,
    v_return_number,
    v_sale.id,
    v_refund_method,
    v_total_refund,
    v_total_cogs,
    p_payload->>'notes',
    auth.uid(),
    now()
  );

  -- Process each item: insert sale_return_items + restore inventory
  FOR item IN SELECT * FROM jsonb_array_elements(p_payload->'items')
  LOOP
    v_product_id := (item->>'product_id')::uuid;
    v_qty_return := (item->>'quantity')::numeric;

    SELECT price INTO v_unit_price
      FROM sale_items
     WHERE sale_id = v_sale.id AND product_id = v_product_id
     LIMIT 1;

    v_refund := v_qty_return * v_unit_price;

    -- Re-compute average cost for this item
    SELECT
      COALESCE(SUM(im.quantity * ib.cost_price), 0),
      COALESCE(SUM(im.quantity), 0)
    INTO v_sold_cogs, v_sold_qty
    FROM inventory_movements im
    JOIN inventory_batches ib ON ib.id = im.batch_id
    WHERE im.reference_type = 'sale'
      AND im.reference_id   = v_sale.id
      AND im.product_id     = v_product_id
      AND im.type           = 'OUT';

    IF v_sold_qty > 0 THEN
      v_avg_cost := v_sold_cogs / v_sold_qty;
    ELSE
      v_avg_cost := 0;
    END IF;

    INSERT INTO sale_return_items (id, return_id, product_id, quantity, unit_price, refund_amount)
    VALUES (gen_random_uuid(), v_return_id, v_product_id, v_qty_return, v_unit_price, v_refund);

    -- Restore inventory: new batch credited back
    v_batch_id := gen_random_uuid();

    INSERT INTO inventory_batches (id, product_id, quantity_in, quantity_remaining, cost_price, reference_type, reference_id, created_at)
    VALUES (v_batch_id, v_product_id, v_qty_return, v_qty_return, v_avg_cost, 'sale_return', v_return_id, now());

    INSERT INTO inventory_movements (id, product_id, batch_id, type, quantity, reference_type, reference_id, created_by, created_at)
    VALUES (
      gen_random_uuid(),
      v_product_id,
      v_batch_id,
      'RETURN',
      v_qty_return,
      'sale_return',
      v_return_id,
      auth.uid(),
      now()
    );
  END LOOP;

  -- Journal entry: reverse revenue and COGS for the returned items
  --   DR Sales Revenue  (4001)  v_total_refund
  --   CR Cash / Bank    (1001 or 1002)  v_total_refund
  --   DR Inventory      (1100)  v_total_cogs
  --   CR COGS           (5001)  v_total_cogs

  INSERT INTO journal_entries (id, reference_type, reference_id, description, created_at)
  VALUES (v_journal_id, 'sale_return', v_return_id, 'Return ' || v_return_number || ' for ' || v_sale.invoice_number, now());

  IF v_refund_method = 'cash' THEN
    SELECT id INTO v_cash_account FROM accounts WHERE code = '1001';
  ELSE
    SELECT id INTO v_cash_account FROM accounts WHERE code = '1002';
  END IF;

  INSERT INTO journal_lines (id, journal_entry_id, account_id, debit, credit) VALUES
    (gen_random_uuid(), v_journal_id, (SELECT id FROM accounts WHERE code = '4001'), v_total_refund, 0),
    (gen_random_uuid(), v_journal_id, v_cash_account,                                0,              v_total_refund),
    (gen_random_uuid(), v_journal_id, (SELECT id FROM accounts WHERE code = '1100'), v_total_cogs,   0),
    (gen_random_uuid(), v_journal_id, (SELECT id FROM accounts WHERE code = '5001'), 0,              v_total_cogs);

  RETURN jsonb_build_object(
    'return_id',     v_return_id,
    'return_number', v_return_number,
    'total_refund',  v_total_refund,
    'total_cogs',    v_total_cogs
  );
END;
$$;

GRANT EXECUTE ON FUNCTION create_sale_return(jsonb) TO authenticated;
