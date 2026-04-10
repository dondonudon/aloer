-- Migration: add stock reservations for cart/session holds
-- Keeps long-lived carts and multi-device flows from over-allocating stock.

-- ============================================================
-- SCHEMA CHANGE
-- ============================================================

CREATE TABLE IF NOT EXISTS stock_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity numeric NOT NULL CHECK (quantity > 0),
  reference text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (reference, product_id)
);

CREATE INDEX IF NOT EXISTS idx_stock_reservations_product_expires
  ON stock_reservations (product_id, expires_at);

CREATE INDEX IF NOT EXISTS idx_stock_reservations_reference
  ON stock_reservations (reference);

ALTER TABLE stock_reservations ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- FUNCTION: get_stock_report
-- ============================================================

CREATE OR REPLACE FUNCTION get_stock_report()
RETURNS TABLE (
  id            uuid,
  sku           text,
  name          text,
  category      text,
  stock_on_hand numeric,
  stock_value   numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    p.id,
    p.sku,
    p.name,
    p.category,
    COALESCE(SUM(b.quantity_remaining), 0)               AS stock_on_hand,
    COALESCE(SUM(b.quantity_remaining * b.cost_price), 0) AS stock_value
  FROM products p
  LEFT JOIN inventory_batches b ON b.product_id = p.id
  WHERE p.is_active = true
  GROUP BY p.id, p.sku, p.name, p.category
  ORDER BY p.name;
$$;

GRANT EXECUTE ON FUNCTION get_stock_report() TO authenticated;

-- ============================================================
-- FUNCTION: reserve_stock
-- ============================================================

CREATE OR REPLACE FUNCTION reserve_stock(reservation_payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_reference text := NULLIF(TRIM(reservation_payload->>'reference'), '');
  v_expires_at timestamptz := COALESCE(NULLIF(reservation_payload->>'expiresAt', '')::timestamptz, now() + interval '15 minutes');
  v_total_quantity numeric := 0;

  item RECORD;
  v_product_id uuid;
  v_requested numeric;
  v_product_exists boolean;
  v_physical_stock numeric;
  v_reserved_elsewhere numeric;
  v_available_stock numeric;
BEGIN
  IF v_reference IS NULL THEN
    RAISE EXCEPTION 'Reservation reference is required';
  END IF;

  IF jsonb_typeof(reservation_payload->'items') IS DISTINCT FROM 'array'
     OR jsonb_array_length(reservation_payload->'items') = 0 THEN
    RAISE EXCEPTION 'At least one reservation item is required';
  END IF;

  DELETE FROM stock_reservations
  WHERE reference = v_reference;

  FOR item IN
    SELECT
      (line->>'productId')::uuid AS product_id,
      SUM((line->>'quantity')::numeric) AS quantity
    FROM jsonb_array_elements(reservation_payload->'items') line
    GROUP BY (line->>'productId')::uuid
    ORDER BY (line->>'productId')::uuid
  LOOP
    v_product_id := item.product_id;
    v_requested := item.quantity;

    IF v_requested <= 0 THEN
      RAISE EXCEPTION 'Quantity must be positive for product: %', v_product_id;
    END IF;

    SELECT EXISTS(
      SELECT 1 FROM products WHERE id = v_product_id AND is_active = true
    ) INTO v_product_exists;

    IF NOT v_product_exists THEN
      RAISE EXCEPTION 'Product not found or inactive: %', v_product_id;
    END IF;

    SELECT COALESCE(SUM(quantity_remaining), 0)
    INTO v_physical_stock
    FROM inventory_batches
    WHERE product_id = v_product_id;

    SELECT COALESCE(SUM(quantity), 0)
    INTO v_reserved_elsewhere
    FROM stock_reservations
    WHERE product_id = v_product_id
      AND expires_at > now()
      AND reference <> v_reference;

    v_available_stock := v_physical_stock - v_reserved_elsewhere;

    IF v_available_stock < v_requested THEN
      RAISE EXCEPTION 'Insufficient stock for product: %', v_product_id;
    END IF;

    INSERT INTO stock_reservations (
      id,
      product_id,
      quantity,
      reference,
      expires_at,
      created_by,
      created_at
    ) VALUES (
      gen_random_uuid(),
      v_product_id,
      v_requested,
      v_reference,
      v_expires_at,
      auth.uid(),
      now()
    );

    v_total_quantity := v_total_quantity + v_requested;
  END LOOP;

  RETURN jsonb_build_object(
    'reference', v_reference,
    'expires_at', v_expires_at,
    'total_quantity', v_total_quantity
  );
END;
$$;

GRANT EXECUTE ON FUNCTION reserve_stock(jsonb) TO authenticated;

-- ============================================================
-- FUNCTION: release_stock_reservations
-- ============================================================

CREATE OR REPLACE FUNCTION release_stock_reservations(p_reference text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_reference text := NULLIF(TRIM(p_reference), '');
  v_deleted integer := 0;
BEGIN
  IF v_reference IS NULL THEN
    RAISE EXCEPTION 'Reservation reference is required';
  END IF;

  DELETE FROM stock_reservations
  WHERE reference = v_reference;

  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  RETURN jsonb_build_object(
    'reference', v_reference,
    'released', v_deleted
  );
END;
$$;

GRANT EXECUTE ON FUNCTION release_stock_reservations(text) TO authenticated;

-- ============================================================
-- FUNCTION: create_sale_transaction
-- ============================================================

CREATE OR REPLACE FUNCTION create_sale_transaction(sale_payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sale_id uuid := gen_random_uuid();
  v_journal_id uuid := gen_random_uuid();
  v_invoice text;
  v_total numeric := 0;
  v_cogs numeric := 0;
  v_net_total numeric;
  v_discount_amount numeric := 0;
  v_campaign_savings numeric := 0;
  v_cart_campaign_discount numeric := 0;
  v_payment_method text;
  v_idempotency_key text;
  v_reservation_reference text;

  v_existing sales%ROWTYPE;

  item jsonb;
  v_product_exists boolean;
  v_available_stock numeric;
  v_reserved_for_reference numeric;
  v_reserved_elsewhere numeric;
  batch RECORD;
  qty_needed numeric;
  take_qty numeric;

  payment jsonb;
  v_pay_method text;
  v_pay_amount numeric;
  v_pay_account_id uuid;
BEGIN

  v_idempotency_key := NULLIF(TRIM(sale_payload->>'idempotencyKey'), '');
  v_reservation_reference := NULLIF(TRIM(sale_payload->>'reservationReference'), '');

  IF v_idempotency_key IS NOT NULL THEN
    SELECT * INTO v_existing
    FROM sales
    WHERE idempotency_key = v_idempotency_key
    LIMIT 1;

    IF FOUND THEN
      RETURN jsonb_build_object(
        'sale_id', v_existing.id,
        'invoice_number', v_existing.invoice_number,
        'total', v_existing.total_amount,
        'cogs', v_existing.total_cogs,
        'idempotent', true
      );
    END IF;
  END IF;

  v_invoice := 'INV-' || to_char(now(), 'YYYYMMDD') || '-' || lpad(nextval('invoice_number_seq')::text, 4, '0');

  v_discount_amount := GREATEST(0, COALESCE((sale_payload->>'discountAmount')::numeric, 0));
  v_campaign_savings := GREATEST(0, COALESCE((sale_payload->>'campaignSavings')::numeric, 0));
  v_cart_campaign_discount := GREATEST(0, COALESCE((sale_payload->>'cartCampaignDiscount')::numeric, 0));

  IF COALESCE((sale_payload->>'isCreditSale')::boolean, false)
     AND (sale_payload->>'resellerId') IS NULL THEN
    RAISE EXCEPTION 'A reseller must be selected for credit sales';
  END IF;

  IF COALESCE((sale_payload->>'isCreditSale')::boolean, false) THEN
    v_payment_method := 'credit';
  ELSIF jsonb_array_length(sale_payload->'payments') = 0 THEN
    RAISE EXCEPTION 'At least one payment is required';
  ELSIF jsonb_array_length(sale_payload->'payments') = 1 THEN
    v_payment_method := sale_payload->'payments'->0->>'method';
  ELSE
    v_payment_method := 'mixed';
  END IF;

  INSERT INTO sales (id, invoice_number, total_amount, total_cogs, discount_amount, campaign_savings, cart_campaign_discount, payment_method, reseller_id, status, created_by, created_at, idempotency_key)
  VALUES (
    v_sale_id,
    v_invoice,
    0,
    0,
    v_discount_amount,
    v_campaign_savings,
    v_cart_campaign_discount,
    v_payment_method,
    NULLIF(sale_payload->>'resellerId', '')::uuid,
    'completed',
    auth.uid(),
    now(),
    v_idempotency_key
  );

  FOR item IN
    SELECT value
    FROM jsonb_array_elements(sale_payload->'items') AS value
    ORDER BY (value->>'productId')
  LOOP
    SELECT is_active
    INTO v_product_exists
    FROM products
    WHERE id = (item->>'productId')::uuid
    FOR UPDATE;

    IF NOT FOUND OR NOT v_product_exists THEN
      RAISE EXCEPTION 'Product not found or inactive: %', item->>'productId';
    END IF;

    qty_needed := (item->>'quantity')::numeric;

    IF qty_needed <= 0 THEN
      RAISE EXCEPTION 'Quantity must be positive for product: %', item->>'productId';
    END IF;

    SELECT COALESCE(SUM(quantity_remaining), 0)
    INTO v_available_stock
    FROM inventory_batches
    WHERE product_id = (item->>'productId')::uuid;

    SELECT COALESCE(SUM(quantity), 0)
    INTO v_reserved_for_reference
    FROM stock_reservations
    WHERE product_id = (item->>'productId')::uuid
      AND expires_at > now()
      AND v_reservation_reference IS NOT NULL
      AND reference = v_reservation_reference;

    SELECT COALESCE(SUM(quantity), 0)
    INTO v_reserved_elsewhere
    FROM stock_reservations
    WHERE product_id = (item->>'productId')::uuid
      AND expires_at > now()
      AND (
        v_reservation_reference IS NULL
        OR reference <> v_reservation_reference
      );

    IF v_reservation_reference IS NOT NULL AND v_reserved_for_reference < qty_needed THEN
      RAISE EXCEPTION 'Reservation does not cover product: %', item->>'productId';
    END IF;

    IF (v_available_stock - v_reserved_elsewhere) < qty_needed THEN
      RAISE EXCEPTION 'Insufficient stock for product: %', item->>'productId';
    END IF;

    INSERT INTO sale_items (id, sale_id, product_id, quantity, price, subtotal)
    VALUES (
      gen_random_uuid(),
      v_sale_id,
      (item->>'productId')::uuid,
      qty_needed,
      (item->>'price')::numeric,
      qty_needed * (item->>'price')::numeric
    );

    v_total := v_total + qty_needed * (item->>'price')::numeric;

    FOR batch IN
      SELECT * FROM inventory_batches
      WHERE product_id = (item->>'productId')::uuid
        AND quantity_remaining > 0
      ORDER BY created_at ASC
      FOR UPDATE
    LOOP
      EXIT WHEN qty_needed <= 0;

      take_qty := LEAST(batch.quantity_remaining, qty_needed);

      INSERT INTO inventory_movements (id, product_id, batch_id, type, quantity, reference_type, reference_id, created_by, created_at)
      VALUES (
        gen_random_uuid(),
        batch.product_id,
        batch.id,
        'OUT',
        take_qty,
        'sale',
        v_sale_id,
        auth.uid(),
        now()
      );

      UPDATE inventory_batches
      SET quantity_remaining = quantity_remaining - take_qty
      WHERE id = batch.id;

      v_cogs := v_cogs + (take_qty * batch.cost_price);
      qty_needed := qty_needed - take_qty;
    END LOOP;

    IF qty_needed > 0 THEN
      RAISE EXCEPTION 'Insufficient stock for product: %', item->>'productId';
    END IF;
  END LOOP;

  v_net_total := GREATEST(0, v_total - v_discount_amount - v_cart_campaign_discount);
  UPDATE sales SET total_amount = v_net_total, total_cogs = v_cogs WHERE id = v_sale_id;

  IF v_reservation_reference IS NOT NULL THEN
    DELETE FROM stock_reservations
    WHERE reference = v_reservation_reference;
  END IF;

  INSERT INTO journal_entries (id, reference_type, reference_id, description, created_at)
  VALUES (v_journal_id, 'sale', v_sale_id, 'Sale ' || v_invoice, now());

  IF v_payment_method = 'credit' THEN
    INSERT INTO journal_lines (id, journal_entry_id, account_id, debit, credit) VALUES
      (gen_random_uuid(), v_journal_id, (SELECT id FROM accounts WHERE code = '1003'), v_net_total, 0),
      (gen_random_uuid(), v_journal_id, (SELECT id FROM accounts WHERE code = '4001'), 0, v_net_total),
      (gen_random_uuid(), v_journal_id, (SELECT id FROM accounts WHERE code = '5001'), v_cogs, 0),
      (gen_random_uuid(), v_journal_id, (SELECT id FROM accounts WHERE code = '1100'), 0, v_cogs);
  ELSE
    FOR payment IN SELECT * FROM jsonb_array_elements(sale_payload->'payments')
    LOOP
      v_pay_method := payment->>'method';
      v_pay_amount := (payment->>'amount')::numeric;

      IF v_pay_method = 'cash' THEN
        SELECT id INTO v_pay_account_id FROM accounts WHERE code = '1001';
      ELSIF v_pay_method = 'transfer' THEN
        SELECT id INTO v_pay_account_id FROM accounts WHERE code = '1002';
      ELSE
        RAISE EXCEPTION 'Invalid payment method: %', v_pay_method;
      END IF;

      INSERT INTO journal_lines (id, journal_entry_id, account_id, debit, credit)
      VALUES (gen_random_uuid(), v_journal_id, v_pay_account_id, v_pay_amount, 0);

      INSERT INTO sale_payments (id, sale_id, payment_method, amount)
      VALUES (gen_random_uuid(), v_sale_id, v_pay_method, v_pay_amount);
    END LOOP;

    INSERT INTO journal_lines (id, journal_entry_id, account_id, debit, credit) VALUES
      (gen_random_uuid(), v_journal_id, (SELECT id FROM accounts WHERE code = '4001'), 0, v_net_total),
      (gen_random_uuid(), v_journal_id, (SELECT id FROM accounts WHERE code = '5001'), v_cogs, 0),
      (gen_random_uuid(), v_journal_id, (SELECT id FROM accounts WHERE code = '1100'), 0, v_cogs);
  END IF;

  RETURN jsonb_build_object(
    'sale_id', v_sale_id,
    'invoice_number', v_invoice,
    'total', v_net_total,
    'cogs', v_cogs
  );
END;
$$;
