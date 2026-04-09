-- Migration: add idempotency_key to sales and update create_sale_transaction RPC
-- Prevents duplicate sales when the frontend retries a failed request.

-- ============================================================
-- SCHEMA CHANGE
-- ============================================================

ALTER TABLE sales ADD COLUMN IF NOT EXISTS idempotency_key text;
CREATE UNIQUE INDEX IF NOT EXISTS sales_idempotency_key_idx ON sales (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- ============================================================
-- FUNCTION: create_sale_transaction (with idempotency)
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

  -- idempotency: existing sale lookup
  v_existing sales%ROWTYPE;

  item jsonb;
  v_product_exists boolean;
  batch RECORD;
  qty_needed numeric;
  take_qty numeric;

  payment jsonb;
  v_pay_method text;
  v_pay_amount numeric;
  v_pay_account_id uuid;
BEGIN

  v_idempotency_key := NULLIF(TRIM(sale_payload->>'idempotencyKey'), '');

  -- ── Idempotency short-circuit ────────────────────────────────────────────────
  -- If a sale with this key already exists, return its data without re-processing.
  IF v_idempotency_key IS NOT NULL THEN
    SELECT * INTO v_existing
    FROM sales
    WHERE idempotency_key = v_idempotency_key
    LIMIT 1;

    IF FOUND THEN
      RETURN jsonb_build_object(
        'sale_id',        v_existing.id,
        'invoice_number', v_existing.invoice_number,
        'total',          v_existing.total_amount,
        'cogs',           v_existing.total_cogs,
        'idempotent',     true
      );
    END IF;
  END IF;
  -- ────────────────────────────────────────────────────────────────────────────

  v_invoice := 'INV-' || to_char(now(), 'YYYYMMDD') || '-' || lpad(nextval('invoice_number_seq')::text, 4, '0');

  v_discount_amount      := GREATEST(0, COALESCE((sale_payload->>'discountAmount')::numeric, 0));
  v_campaign_savings     := GREATEST(0, COALESCE((sale_payload->>'campaignSavings')::numeric, 0));
  v_cart_campaign_discount := GREATEST(0, COALESCE((sale_payload->>'cartCampaignDiscount')::numeric, 0));

  -- Credit sales require a reseller
  IF COALESCE((sale_payload->>'isCreditSale')::boolean, false)
     AND (sale_payload->>'resellerId') IS NULL THEN
    RAISE EXCEPTION 'A reseller must be selected for credit sales';
  END IF;

  -- Determine payment method label
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

  FOR item IN SELECT * FROM jsonb_array_elements(sale_payload->'items')
  LOOP
    SELECT EXISTS(
      SELECT 1 FROM products WHERE id = (item->>'productId')::uuid AND is_active = true
    ) INTO v_product_exists;

    IF NOT v_product_exists THEN
      RAISE EXCEPTION 'Product not found or inactive: %', item->>'productId';
    END IF;

    qty_needed := (item->>'quantity')::numeric;

    IF qty_needed <= 0 THEN
      RAISE EXCEPTION 'Quantity must be positive for product: %', item->>'productId';
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

      v_cogs   := v_cogs + (take_qty * batch.cost_price);
      qty_needed := qty_needed - take_qty;
    END LOOP;

    IF qty_needed > 0 THEN
      RAISE EXCEPTION 'Insufficient stock for product: %', item->>'productId';
    END IF;

  END LOOP;

  v_net_total := GREATEST(0, v_total - v_discount_amount - v_cart_campaign_discount);
  UPDATE sales SET total_amount = v_net_total, total_cogs = v_cogs WHERE id = v_sale_id;

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
      v_pay_method  := payment->>'method';
      v_pay_amount  := (payment->>'amount')::numeric;

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
    'sale_id',        v_sale_id,
    'invoice_number', v_invoice,
    'total',          v_net_total,
    'cogs',           v_cogs
  );

END;
$$;
