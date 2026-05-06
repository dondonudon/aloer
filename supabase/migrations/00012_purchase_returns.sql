-- Migration: Purchase order void and partial returns
-- Mirrors the sales void/return feature (00007_sale_returns.sql + void_sale in 00001),
-- but applied to purchase_orders. The inventory direction is INVERTED:
-- voiding/returning a purchase removes stock instead of restoring it.
-- Guards:
--   * Void blocked if any supplier_payments exist for the PO.
--   * Void blocked if any batch from the PO has been touched (qty_remaining < qty_in).
--   * Return blocked if the PO's batches no longer have enough qty_remaining to cover
--     the requested return quantity.

CREATE SEQUENCE purchase_return_number_seq START 1;

-- ============================================================
-- ALTER: purchase_orders — add void columns + 'voided' status
-- ============================================================

ALTER TABLE purchase_orders ADD COLUMN voided_at  timestamptz;
ALTER TABLE purchase_orders ADD COLUMN voided_by  uuid REFERENCES auth.users(id);
ALTER TABLE purchase_orders ADD COLUMN void_reason text;

ALTER TABLE purchase_orders DROP CONSTRAINT purchase_orders_status_check;
ALTER TABLE purchase_orders ADD  CONSTRAINT purchase_orders_status_check
  CHECK (status IN ('draft', 'received', 'cancelled', 'voided'));

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE purchase_returns (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  return_number      text        UNIQUE NOT NULL,
  purchase_order_id  uuid        NOT NULL REFERENCES purchase_orders(id),
  refund_method      text        NOT NULL CHECK (refund_method IN ('cash', 'transfer')),
  total_refund       numeric     NOT NULL CHECK (total_refund >= 0),
  notes              text,
  created_by         uuid        REFERENCES auth.users(id),
  created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE purchase_return_items (
  id            uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id     uuid    NOT NULL REFERENCES purchase_returns(id) ON DELETE CASCADE,
  product_id    uuid    NOT NULL REFERENCES products(id),
  quantity      numeric NOT NULL CHECK (quantity > 0),
  unit_cost     numeric NOT NULL CHECK (unit_cost >= 0),
  refund_amount numeric NOT NULL CHECK (refund_amount >= 0)
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_purchase_returns_po          ON purchase_returns (purchase_order_id);
CREATE INDEX idx_purchase_return_items_return ON purchase_return_items (return_id);
CREATE INDEX idx_purchase_return_items_product ON purchase_return_items (product_id);

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE purchase_returns      ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_return_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can manage purchase returns" ON purchase_returns
  FOR ALL USING (is_owner());

CREATE POLICY "Owner can manage purchase return items" ON purchase_return_items
  FOR ALL USING (is_owner());

-- ============================================================
-- FUNCTION: void_purchase_order
-- Reverses a received PO entirely:
--   * Stock: each batch created by receive_purchase_order must still hold its
--     full original quantity_in. We deduct quantity_in back to 0 and emit
--     an OUT movement (reference_type = 'purchase_void') for audit.
--   * Journal: reverse of receive — debit Cash/Bank/AP, credit Inventory.
-- Blocks: existing supplier_payments, partially-consumed batches.
-- ============================================================

CREATE OR REPLACE FUNCTION void_purchase_order(p_po_id uuid, p_reason text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_po RECORD;
  v_batch RECORD;
  v_supplier_payment_count int;
  v_journal_id uuid := gen_random_uuid();
  v_debit_account_id uuid;
BEGIN
  SELECT * INTO v_po FROM purchase_orders WHERE id = p_po_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Purchase order not found';
  END IF;

  IF v_po.status != 'received' THEN
    RAISE EXCEPTION 'Can only void a received purchase order';
  END IF;

  -- Block if any supplier payment exists (settled credit POs are too tangled to auto-reverse)
  SELECT COUNT(*) INTO v_supplier_payment_count
    FROM supplier_payments WHERE purchase_order_id = p_po_id;

  IF v_supplier_payment_count > 0 THEN
    RAISE EXCEPTION 'Cannot void purchase order: supplier payments exist. Reverse those first.';
  END IF;

  -- Each batch from this PO must still hold its original quantity_in (untouched)
  FOR v_batch IN
    SELECT * FROM inventory_batches
     WHERE reference_type = 'purchase_order' AND reference_id = p_po_id
     FOR UPDATE
  LOOP
    IF v_batch.quantity_remaining < v_batch.quantity_in THEN
      RAISE EXCEPTION 'Cannot void purchase order: stock for product % has already been used or sold (% of % remaining).',
        v_batch.product_id, v_batch.quantity_remaining, v_batch.quantity_in;
    END IF;
  END LOOP;

  -- Now perform the reversal
  FOR v_batch IN
    SELECT * FROM inventory_batches
     WHERE reference_type = 'purchase_order' AND reference_id = p_po_id
  LOOP
    UPDATE inventory_batches
       SET quantity_remaining = quantity_remaining - v_batch.quantity_in
     WHERE id = v_batch.id;

    INSERT INTO inventory_movements (id, product_id, batch_id, type, quantity, reference_type, reference_id, created_by, created_at)
    VALUES (
      gen_random_uuid(),
      v_batch.product_id,
      v_batch.id,
      'OUT',
      v_batch.quantity_in,
      'purchase_void',
      p_po_id,
      auth.uid(),
      now()
    );
  END LOOP;

  UPDATE purchase_orders
     SET status      = 'voided',
         voided_at   = now(),
         voided_by   = auth.uid(),
         void_reason = p_reason
   WHERE id = p_po_id;

  -- Reversing journal: DR Cash/Bank/AP, CR Inventory
  INSERT INTO journal_entries (id, reference_type, reference_id, description, created_at)
  VALUES (v_journal_id, 'purchase_void', p_po_id, 'Void PO ' || v_po.po_number, now());

  IF v_po.payment_method = 'cash' THEN
    SELECT id INTO v_debit_account_id FROM accounts WHERE code = '1001';
  ELSIF v_po.payment_method = 'transfer' THEN
    SELECT id INTO v_debit_account_id FROM accounts WHERE code = '1002';
  ELSIF v_po.payment_method = 'credit' THEN
    SELECT id INTO v_debit_account_id FROM accounts WHERE code = '2001'; -- Accounts Payable
  ELSE
    RAISE EXCEPTION 'Invalid payment method: %', v_po.payment_method;
  END IF;

  INSERT INTO journal_lines (id, journal_entry_id, account_id, debit, credit) VALUES
    (gen_random_uuid(), v_journal_id, v_debit_account_id,                             v_po.total_amount, 0),
    (gen_random_uuid(), v_journal_id, (SELECT id FROM accounts WHERE code = '1100'), 0, v_po.total_amount);

  RETURN jsonb_build_object('po_id', p_po_id, 'status', 'voided');
END;
$$;

GRANT EXECUTE ON FUNCTION void_purchase_order(uuid, text) TO authenticated;

-- ============================================================
-- FUNCTION: create_purchase_return
-- Partial return of received PO items to the supplier.
--   * Stock: deducts FIFO from this PO's batches (oldest first by created_at).
--     Errors if any item lacks sufficient remaining quantity in this PO's batches.
--   * Journal: DR Cash/Bank (refund received from supplier), CR Inventory.
-- ============================================================

CREATE OR REPLACE FUNCTION create_purchase_return(p_payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_po              RECORD;
  v_return_id       uuid    := gen_random_uuid();
  v_return_number   text;
  v_journal_id      uuid    := gen_random_uuid();
  v_total_refund    numeric := 0;
  v_refund_method   text;
  v_debit_account_id uuid;

  item              jsonb;
  v_product_id      uuid;
  v_qty_return      numeric;
  v_unit_cost       numeric;
  v_refund          numeric;

  v_purchased_qty   numeric;
  v_already_returned numeric;
  v_returnable      numeric;

  v_available_in_po numeric;
  v_qty_to_take     numeric;
  v_take            numeric;

  batch RECORD;
BEGIN
  SELECT * INTO v_po FROM purchase_orders WHERE id = (p_payload->>'purchase_order_id')::uuid FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Purchase order not found';
  END IF;

  IF v_po.status != 'received' THEN
    RAISE EXCEPTION 'Can only create a return on a received purchase order';
  END IF;

  v_refund_method := p_payload->>'refund_method';
  IF v_refund_method NOT IN ('cash', 'transfer') THEN
    RAISE EXCEPTION 'Invalid refund method: %', v_refund_method;
  END IF;

  -- Validation pass: per-item ceilings + per-PO stock availability
  FOR item IN SELECT * FROM jsonb_array_elements(p_payload->'items')
  LOOP
    v_product_id := (item->>'product_id')::uuid;
    v_qty_return := (item->>'quantity')::numeric;

    IF v_qty_return IS NULL OR v_qty_return <= 0 THEN
      RAISE EXCEPTION 'Return quantity must be positive for product: %', v_product_id;
    END IF;

    SELECT COALESCE(SUM(quantity), 0)
      INTO v_purchased_qty
      FROM purchase_order_items
     WHERE purchase_order_id = v_po.id AND product_id = v_product_id;

    IF v_purchased_qty = 0 THEN
      RAISE EXCEPTION 'Product % was not part of this purchase order', v_product_id;
    END IF;

    SELECT COALESCE(SUM(pri.quantity), 0)
      INTO v_already_returned
      FROM purchase_return_items pri
      JOIN purchase_returns pr ON pr.id = pri.return_id
     WHERE pr.purchase_order_id = v_po.id AND pri.product_id = v_product_id;

    v_returnable := v_purchased_qty - v_already_returned;

    IF v_qty_return > v_returnable THEN
      RAISE EXCEPTION 'Cannot return % units of product %. Only % units are still returnable.',
        v_qty_return, v_product_id, v_returnable;
    END IF;

    -- Stock availability within this PO's batches
    SELECT COALESCE(SUM(quantity_remaining), 0)
      INTO v_available_in_po
      FROM inventory_batches
     WHERE reference_type = 'purchase_order'
       AND reference_id   = v_po.id
       AND product_id     = v_product_id;

    IF v_available_in_po < v_qty_return THEN
      RAISE EXCEPTION 'Insufficient stock to return % units of product %: only % units remain in this PO''s batches.',
        v_qty_return, v_product_id, v_available_in_po;
    END IF;
  END LOOP;

  -- Generate return number
  v_return_number := 'PRET-' || to_char(now(), 'YYYYMMDD') || '-' || lpad(nextval('purchase_return_number_seq')::text, 4, '0');

  INSERT INTO purchase_returns (id, return_number, purchase_order_id, refund_method, total_refund, notes, created_by, created_at)
  VALUES (v_return_id, v_return_number, v_po.id, v_refund_method, 0, p_payload->>'notes', auth.uid(), now());

  -- Process each item: insert items + deduct inventory FIFO from this PO's batches
  FOR item IN SELECT * FROM jsonb_array_elements(p_payload->'items')
  LOOP
    v_product_id := (item->>'product_id')::uuid;
    v_qty_return := (item->>'quantity')::numeric;

    -- Use the original purchase cost as the unit refund (weighted across PO line items
    -- if a product appears more than once on the PO — same approach as sale_return uses
    -- average sold cost).
    SELECT
      CASE WHEN COALESCE(SUM(quantity), 0) = 0 THEN 0
           ELSE SUM(quantity * cost_price) / SUM(quantity)
      END
      INTO v_unit_cost
      FROM purchase_order_items
     WHERE purchase_order_id = v_po.id AND product_id = v_product_id;

    v_refund       := v_qty_return * v_unit_cost;
    v_total_refund := v_total_refund + v_refund;

    INSERT INTO purchase_return_items (id, return_id, product_id, quantity, unit_cost, refund_amount)
    VALUES (gen_random_uuid(), v_return_id, v_product_id, v_qty_return, v_unit_cost, v_refund);

    -- Deduct stock FIFO from this PO's batches only
    v_qty_to_take := v_qty_return;

    FOR batch IN
      SELECT * FROM inventory_batches
       WHERE reference_type = 'purchase_order'
         AND reference_id   = v_po.id
         AND product_id     = v_product_id
         AND quantity_remaining > 0
       ORDER BY created_at ASC
       FOR UPDATE
    LOOP
      EXIT WHEN v_qty_to_take <= 0;

      v_take := LEAST(batch.quantity_remaining, v_qty_to_take);

      UPDATE inventory_batches
         SET quantity_remaining = quantity_remaining - v_take
       WHERE id = batch.id;

      INSERT INTO inventory_movements (id, product_id, batch_id, type, quantity, reference_type, reference_id, created_by, created_at)
      VALUES (
        gen_random_uuid(),
        batch.product_id,
        batch.id,
        'OUT',
        v_take,
        'purchase_return',
        v_return_id,
        auth.uid(),
        now()
      );

      v_qty_to_take := v_qty_to_take - v_take;
    END LOOP;

    IF v_qty_to_take > 0 THEN
      RAISE EXCEPTION 'Stock changed concurrently for product %; please retry', v_product_id;
    END IF;
  END LOOP;

  UPDATE purchase_returns SET total_refund = v_total_refund WHERE id = v_return_id;

  -- Journal: DR Cash/Bank (supplier refund received), CR Inventory
  INSERT INTO journal_entries (id, reference_type, reference_id, description, created_at)
  VALUES (v_journal_id, 'purchase_return', v_return_id, 'Return ' || v_return_number || ' for PO ' || v_po.po_number, now());

  IF v_refund_method = 'cash' THEN
    SELECT id INTO v_debit_account_id FROM accounts WHERE code = '1001';
  ELSE
    SELECT id INTO v_debit_account_id FROM accounts WHERE code = '1002';
  END IF;

  INSERT INTO journal_lines (id, journal_entry_id, account_id, debit, credit) VALUES
    (gen_random_uuid(), v_journal_id, v_debit_account_id,                             v_total_refund, 0),
    (gen_random_uuid(), v_journal_id, (SELECT id FROM accounts WHERE code = '1100'), 0, v_total_refund);

  RETURN jsonb_build_object(
    'return_id',     v_return_id,
    'return_number', v_return_number,
    'total_refund',  v_total_refund
  );
END;
$$;

GRANT EXECUTE ON FUNCTION create_purchase_return(jsonb) TO authenticated;
