-- POS System: Complete Schema (squashed initial migration)
-- Combines all schema, RLS, seed data, and business logic functions
-- into a single authoritative migration.

-- ============================================================
-- SEQUENCES
-- ============================================================

CREATE SEQUENCE invoice_number_seq START 1;
CREATE SEQUENCE po_number_seq START 1;
CREATE SEQUENCE adj_number_seq START 1;

-- ============================================================
-- TABLES
-- ============================================================

-- User Roles (RBAC)
CREATE TABLE user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner', 'cashier')),
  theme text CHECK (theme IN ('light', 'dark')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

-- Products
CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  sku text UNIQUE NOT NULL,
  category text,
  unit text NOT NULL DEFAULT 'pcs',
  selling_price numeric NOT NULL CHECK (selling_price >= 0),
  bulk_price numeric CHECK (bulk_price IS NULL OR bulk_price >= 0),
  bulk_min_qty numeric CHECK (bulk_min_qty IS NULL OR bulk_min_qty > 1),
  latest_cost_price numeric CHECK (latest_cost_price IS NULL OR latest_cost_price >= 0),
  image_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Suppliers
CREATE TABLE suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text,
  address text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Resellers (customers who purchase on credit or at bulk)
CREATE TABLE resellers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text,
  address text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Categories
CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Accounts (Chart of Accounts)
CREATE TABLE accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('asset', 'liability', 'equity', 'revenue', 'expense')),
  is_system boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Inventory Batches (FIFO)
CREATE TABLE inventory_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id),
  quantity_in numeric NOT NULL CHECK (quantity_in > 0),
  quantity_remaining numeric NOT NULL CHECK (quantity_remaining >= 0),
  cost_price numeric NOT NULL CHECK (cost_price >= 0),
  expiry_date date,
  reference_type text,
  reference_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Inventory Movements
CREATE TABLE inventory_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id),
  batch_id uuid NOT NULL REFERENCES inventory_batches(id),
  type text NOT NULL CHECK (type IN ('IN', 'OUT', 'ADJUSTMENT', 'RETURN')),
  quantity numeric NOT NULL CHECK (quantity > 0),
  reference_type text NOT NULL,
  reference_id uuid NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Sales
CREATE TABLE sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text UNIQUE NOT NULL,
  total_amount numeric NOT NULL DEFAULT 0,
  total_cogs numeric NOT NULL DEFAULT 0,
  discount_amount numeric NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  campaign_savings numeric NOT NULL DEFAULT 0 CHECK (campaign_savings >= 0),
  cart_campaign_discount numeric NOT NULL DEFAULT 0 CHECK (cart_campaign_discount >= 0),
  payment_method text NOT NULL CHECK (payment_method IN ('cash', 'transfer', 'mixed', 'credit')),
  reseller_id uuid REFERENCES resellers(id),
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'voided')),
  voided_at timestamptz,
  voided_by uuid REFERENCES auth.users(id),
  void_reason text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Sale Items
CREATE TABLE sale_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL REFERENCES sales(id),
  product_id uuid NOT NULL REFERENCES products(id),
  quantity numeric NOT NULL CHECK (quantity > 0),
  price numeric NOT NULL CHECK (price >= 0),
  subtotal numeric NOT NULL CHECK (subtotal >= 0)
);

-- Sale Payment Tenders (split/mixed payments)
CREATE TABLE sale_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL REFERENCES sales(id),
  payment_method text NOT NULL CHECK (payment_method IN ('cash', 'transfer')),
  amount numeric NOT NULL CHECK (amount > 0)
);

-- Sale Credit Payment Collections (AR settlements)
CREATE TABLE sale_credit_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL REFERENCES sales(id),
  amount numeric NOT NULL CHECK (amount > 0),
  payment_method text NOT NULL CHECK (payment_method IN ('cash', 'transfer')),
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Purchase Orders
CREATE TABLE purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number text UNIQUE NOT NULL,
  supplier_id uuid REFERENCES suppliers(id),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'received', 'cancelled')),
  payment_method text NOT NULL CHECK (payment_method IN ('cash', 'transfer', 'credit')),
  notes text,
  total_amount numeric NOT NULL DEFAULT 0,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  received_at timestamptz
);

-- Purchase Order Items
CREATE TABLE purchase_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id uuid NOT NULL REFERENCES purchase_orders(id),
  product_id uuid NOT NULL REFERENCES products(id),
  quantity numeric NOT NULL CHECK (quantity > 0),
  cost_price numeric NOT NULL CHECK (cost_price >= 0),
  expiry_date date,
  subtotal numeric NOT NULL CHECK (subtotal >= 0)
);

-- Supplier Payments (AP settlements)
CREATE TABLE supplier_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id uuid NOT NULL REFERENCES purchase_orders(id),
  amount numeric NOT NULL CHECK (amount > 0),
  payment_method text NOT NULL CHECK (payment_method IN ('cash', 'transfer')),
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Inventory Adjustments
CREATE TABLE inventory_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  adjustment_number text UNIQUE NOT NULL,
  reason text NOT NULL,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Inventory Adjustment Items
CREATE TABLE inventory_adjustment_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  adjustment_id uuid NOT NULL REFERENCES inventory_adjustments(id),
  product_id uuid NOT NULL REFERENCES products(id),
  batch_id uuid REFERENCES inventory_batches(id),
  quantity_change numeric NOT NULL,
  cost_price numeric NOT NULL CHECK (cost_price >= 0),
  reason text
);

-- Journal Entries
CREATE TABLE journal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_type text NOT NULL,
  reference_id uuid NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Journal Lines
CREATE TABLE journal_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_entry_id uuid NOT NULL REFERENCES journal_entries(id),
  account_id uuid NOT NULL REFERENCES accounts(id),
  debit numeric NOT NULL DEFAULT 0 CHECK (debit >= 0),
  credit numeric NOT NULL DEFAULT 0 CHECK (credit >= 0)
);

-- Store Settings (single-row config)
CREATE TABLE store_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_name text NOT NULL DEFAULT 'My Store',
  store_icon_url text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Campaigns (time-limited auto-applied discounts)
CREATE TABLE campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  discount_type text NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value numeric NOT NULL CHECK (discount_value > 0),
  trigger_type text NOT NULL DEFAULT 'always'
    CHECK (trigger_type IN ('always', 'min_cart_total', 'min_product_qty')),
  trigger_value numeric,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_date_range CHECK (end_date > start_date)
);

-- Campaign Products (which products a campaign applies to)
CREATE TABLE campaign_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  min_quantity numeric NOT NULL DEFAULT 1 CHECK (min_quantity > 0),
  UNIQUE(campaign_id, product_id)
);

-- ============================================================
-- TRIGGERS
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_inventory_batches_product_remaining ON inventory_batches (product_id, created_at) WHERE quantity_remaining > 0;
CREATE INDEX idx_inventory_movements_reference ON inventory_movements (reference_type, reference_id);
CREATE INDEX idx_sales_created_at ON sales (created_at);
CREATE INDEX idx_sales_status ON sales (status);
CREATE INDEX idx_sales_reseller ON sales (reseller_id);
CREATE INDEX idx_journal_entries_reference ON journal_entries (reference_type, reference_id);
CREATE INDEX idx_journal_lines_entry ON journal_lines (journal_entry_id);
CREATE INDEX idx_journal_lines_account ON journal_lines (account_id);
CREATE INDEX idx_user_roles_user ON user_roles (user_id);
CREATE INDEX idx_supplier_payments_po ON supplier_payments (purchase_order_id);
CREATE INDEX idx_sale_payments_sale ON sale_payments (sale_id);
CREATE INDEX idx_sale_credit_payments_sale ON sale_credit_payments (sale_id);
CREATE INDEX idx_campaigns_active_dates ON campaigns (is_active, start_date, end_date);
CREATE INDEX idx_campaign_products_product ON campaign_products (product_id);

-- ============================================================
-- SEED DATA
-- ============================================================

-- Chart of Accounts
INSERT INTO accounts (code, name, type, is_system) VALUES
  ('1001', 'Cash',                        'asset',    true),
  ('1002', 'Bank / Transfer',             'asset',    true),
  ('1003', 'Accounts Receivable',         'asset',    true),
  ('1100', 'Inventory',                   'asset',    true),
  ('2001', 'Accounts Payable',            'liability',true),
  ('3001', 'Owner Equity',               'equity',   true),
  ('4001', 'Sales Revenue',              'revenue',  true),
  ('5001', 'Cost of Goods Sold',         'expense',  true),
  ('5002', 'Inventory Adjustment Expense','expense',  true);

-- Default store settings row
INSERT INTO store_settings (store_name) VALUES ('My Store');

-- ============================================================
-- RLS: ENABLE
-- ============================================================

ALTER TABLE user_roles               ENABLE ROW LEVEL SECURITY;
ALTER TABLE products                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers                ENABLE ROW LEVEL SECURITY;
ALTER TABLE resellers                ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories               ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_batches        ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements      ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items               ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_payments            ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_credit_payments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders          ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items     ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_payments        ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_adjustments    ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_adjustment_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries          ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_lines            ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings           ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns                ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_products        ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- HELPER FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION is_owner()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'owner'
  );
$$;

-- ============================================================
-- RLS: POLICIES
-- ============================================================

-- User Roles
CREATE POLICY "Users can view own role" ON user_roles
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Owner can manage roles" ON user_roles
  FOR ALL USING (is_owner());

-- Products
CREATE POLICY "Anyone authenticated can read active products" ON products
  FOR SELECT USING (auth.uid() IS NOT NULL AND is_active = true);
CREATE POLICY "Owner can read all products" ON products
  FOR SELECT USING (is_owner());
CREATE POLICY "Owner can insert products" ON products
  FOR INSERT WITH CHECK (is_owner());
CREATE POLICY "Owner can update products" ON products
  FOR UPDATE USING (is_owner());

-- Suppliers
CREATE POLICY "Anyone authenticated can read active suppliers" ON suppliers
  FOR SELECT USING (auth.uid() IS NOT NULL AND is_active = true);
CREATE POLICY "Owner can read all suppliers" ON suppliers
  FOR SELECT USING (is_owner());
CREATE POLICY "Owner can insert suppliers" ON suppliers
  FOR INSERT WITH CHECK (is_owner());
CREATE POLICY "Owner can update suppliers" ON suppliers
  FOR UPDATE USING (is_owner());

-- Resellers
CREATE POLICY "Anyone authenticated can read active resellers" ON resellers
  FOR SELECT USING (auth.uid() IS NOT NULL AND is_active = true);
CREATE POLICY "Owner can read all resellers" ON resellers
  FOR SELECT USING (is_owner());
CREATE POLICY "Owner can manage resellers" ON resellers
  FOR ALL USING (is_owner());

-- Categories
CREATE POLICY "categories_select" ON categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "categories_insert" ON categories FOR INSERT TO authenticated WITH CHECK (is_owner());
CREATE POLICY "categories_update" ON categories FOR UPDATE TO authenticated USING (is_owner());
CREATE POLICY "categories_delete" ON categories FOR DELETE TO authenticated USING (is_owner());

-- Accounts
CREATE POLICY "Anyone authenticated can read accounts" ON accounts
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Owner can manage accounts" ON accounts
  FOR ALL USING (is_owner());

-- Inventory Batches
CREATE POLICY "Anyone authenticated can read inventory batches" ON inventory_batches
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Inventory Movements
CREATE POLICY "Anyone authenticated can read inventory movements" ON inventory_movements
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Sales
CREATE POLICY "Cashiers can view own sales" ON sales
  FOR SELECT USING (created_by = auth.uid());
CREATE POLICY "Owner can view all sales" ON sales
  FOR SELECT USING (is_owner());

-- Sale Items
CREATE POLICY "Users can view sale items for accessible sales" ON sale_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sales
      WHERE sales.id = sale_items.sale_id
        AND (sales.created_by = auth.uid() OR is_owner())
    )
  );

-- Sale Payments
CREATE POLICY "Users can view sale payments for accessible sales" ON sale_payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sales
      WHERE sales.id = sale_payments.sale_id
        AND (sales.created_by = auth.uid() OR is_owner())
    )
  );

-- Sale Credit Payments
CREATE POLICY "Owner can manage sale credit payments" ON sale_credit_payments
  FOR ALL USING (is_owner());
CREATE POLICY "Users can view sale credit payments for accessible sales" ON sale_credit_payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sales
      WHERE sales.id = sale_credit_payments.sale_id
        AND (sales.created_by = auth.uid() OR is_owner())
    )
  );

-- Purchase Orders
CREATE POLICY "Owner can manage purchase orders" ON purchase_orders
  FOR ALL USING (is_owner());
CREATE POLICY "Owner can manage purchase order items" ON purchase_order_items
  FOR ALL USING (is_owner());

-- Supplier Payments
CREATE POLICY "Owner can manage supplier payments" ON supplier_payments
  FOR ALL USING (is_owner());

-- Inventory Adjustments
CREATE POLICY "Owner can manage inventory adjustments" ON inventory_adjustments
  FOR ALL USING (is_owner());
CREATE POLICY "Owner can manage inventory adjustment items" ON inventory_adjustment_items
  FOR ALL USING (is_owner());

-- Journal Entries & Lines
CREATE POLICY "Owner can view journal entries" ON journal_entries
  FOR SELECT USING (is_owner());
CREATE POLICY "Owner can view journal lines" ON journal_lines
  FOR SELECT USING (is_owner());

-- Store Settings
CREATE POLICY "Anyone authenticated can read store settings" ON store_settings
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Only owner can update store settings" ON store_settings
  FOR UPDATE TO authenticated USING (is_owner()) WITH CHECK (is_owner());

-- Campaigns
CREATE POLICY "campaigns_select" ON campaigns FOR SELECT TO authenticated USING (true);
CREATE POLICY "campaigns_insert" ON campaigns FOR INSERT TO authenticated WITH CHECK (is_owner());
CREATE POLICY "campaigns_update" ON campaigns FOR UPDATE TO authenticated USING (is_owner());
CREATE POLICY "campaigns_delete" ON campaigns FOR DELETE TO authenticated USING (is_owner());
CREATE POLICY "campaign_products_select" ON campaign_products FOR SELECT TO authenticated USING (true);
CREATE POLICY "campaign_products_insert" ON campaign_products FOR INSERT TO authenticated WITH CHECK (is_owner());
CREATE POLICY "campaign_products_delete" ON campaign_products FOR DELETE TO authenticated USING (is_owner());

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

  INSERT INTO sales (id, invoice_number, total_amount, total_cogs, discount_amount, campaign_savings, cart_campaign_discount, payment_method, reseller_id, status, created_by, created_at)
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
    now()
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

-- ============================================================
-- FUNCTION: receive_purchase_order
-- ============================================================

CREATE OR REPLACE FUNCTION receive_purchase_order(p_po_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_po RECORD;
  v_item RECORD;
  v_journal_id uuid := gen_random_uuid();
  v_batch_id uuid;
  v_total numeric := 0;
  v_credit_account_id uuid;
BEGIN
  SELECT * INTO v_po FROM purchase_orders WHERE id = p_po_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Purchase order not found';
  END IF;

  IF v_po.status != 'draft' THEN
    RAISE EXCEPTION 'Purchase order is not in draft status';
  END IF;

  FOR v_item IN SELECT * FROM purchase_order_items WHERE purchase_order_id = p_po_id
  LOOP
    v_batch_id := gen_random_uuid();

    INSERT INTO inventory_batches (id, product_id, quantity_in, quantity_remaining, cost_price, expiry_date, reference_type, reference_id, created_at)
    VALUES (
      v_batch_id,
      v_item.product_id,
      v_item.quantity,
      v_item.quantity,
      v_item.cost_price,
      v_item.expiry_date,
      'purchase_order',
      p_po_id,
      now()
    );

    INSERT INTO inventory_movements (id, product_id, batch_id, type, quantity, reference_type, reference_id, created_by, created_at)
    VALUES (
      gen_random_uuid(),
      v_item.product_id,
      v_batch_id,
      'IN',
      v_item.quantity,
      'purchase_order',
      p_po_id,
      auth.uid(),
      now()
    );

    -- Update latest cost price on the product
    UPDATE products
    SET latest_cost_price = v_item.cost_price
    WHERE id = v_item.product_id;

    v_total := v_total + v_item.subtotal;
  END LOOP;

  UPDATE purchase_orders SET status = 'received', received_at = now(), total_amount = v_total WHERE id = p_po_id;

  IF v_po.payment_method = 'cash' THEN
    SELECT id INTO v_credit_account_id FROM accounts WHERE code = '1001';
  ELSIF v_po.payment_method = 'transfer' THEN
    SELECT id INTO v_credit_account_id FROM accounts WHERE code = '1002';
  ELSIF v_po.payment_method = 'credit' THEN
    SELECT id INTO v_credit_account_id FROM accounts WHERE code = '2001'; -- Accounts Payable
  ELSE
    RAISE EXCEPTION 'Invalid payment method: %', v_po.payment_method;
  END IF;

  INSERT INTO journal_entries (id, reference_type, reference_id, description, created_at)
  VALUES (v_journal_id, 'purchase_order', p_po_id, 'PO ' || v_po.po_number, now());

  INSERT INTO journal_lines (id, journal_entry_id, account_id, debit, credit) VALUES
    (gen_random_uuid(), v_journal_id, (SELECT id FROM accounts WHERE code = '1100'), v_total, 0),
    (gen_random_uuid(), v_journal_id, v_credit_account_id, 0, v_total);

  RETURN jsonb_build_object('po_id', p_po_id, 'total', v_total, 'status', 'received');
END;
$$;

-- ============================================================
-- FUNCTION: create_inventory_adjustment
-- ============================================================

CREATE OR REPLACE FUNCTION create_inventory_adjustment(adj_payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_adj_id uuid := gen_random_uuid();
  v_adj_number text;
  v_journal_id uuid := gen_random_uuid();
  v_positive_total numeric := 0;
  v_negative_total numeric := 0;

  item jsonb;
  v_product_exists boolean;
  v_qty_change numeric;
  v_cost numeric;
  v_batch_id uuid;
  batch RECORD;
  qty_needed numeric;
  take_qty numeric;
BEGIN

  v_adj_number := 'ADJ-' || to_char(now(), 'YYYYMMDD') || '-' || lpad(nextval('adj_number_seq')::text, 4, '0');

  INSERT INTO inventory_adjustments (id, adjustment_number, reason, notes, created_by, created_at)
  VALUES (
    v_adj_id,
    v_adj_number,
    adj_payload->>'reason',
    adj_payload->>'notes',
    auth.uid(),
    now()
  );

  FOR item IN SELECT * FROM jsonb_array_elements(adj_payload->'items')
  LOOP
    SELECT EXISTS(
      SELECT 1 FROM products WHERE id = (item->>'productId')::uuid AND is_active = true
    ) INTO v_product_exists;

    IF NOT v_product_exists THEN
      RAISE EXCEPTION 'Product not found or inactive: %', item->>'productId';
    END IF;

    v_qty_change := (item->>'quantityChange')::numeric;
    v_cost       := (item->>'costPrice')::numeric;

    IF v_qty_change = 0 THEN
      RAISE EXCEPTION 'Quantity change cannot be zero for product: %', item->>'productId';
    END IF;

    IF v_cost <= 0 THEN
      RAISE EXCEPTION 'Cost price must be positive for product: %', item->>'productId';
    END IF;

    INSERT INTO inventory_adjustment_items (id, adjustment_id, product_id, batch_id, quantity_change, cost_price, reason)
    VALUES (
      gen_random_uuid(),
      v_adj_id,
      (item->>'productId')::uuid,
      NULL,
      v_qty_change,
      v_cost,
      item->>'reason'
    );

    IF v_qty_change > 0 THEN
      v_batch_id := gen_random_uuid();

      INSERT INTO inventory_batches (id, product_id, quantity_in, quantity_remaining, cost_price, expiry_date, reference_type, reference_id, created_at)
      VALUES (
        v_batch_id,
        (item->>'productId')::uuid,
        v_qty_change,
        v_qty_change,
        v_cost,
        (item->>'expiryDate')::date,
        'adjustment',
        v_adj_id,
        now()
      );

      INSERT INTO inventory_movements (id, product_id, batch_id, type, quantity, reference_type, reference_id, created_by, created_at)
      VALUES (
        gen_random_uuid(),
        (item->>'productId')::uuid,
        v_batch_id,
        'ADJUSTMENT',
        v_qty_change,
        'adjustment',
        v_adj_id,
        auth.uid(),
        now()
      );

      v_positive_total := v_positive_total + (v_qty_change * v_cost);

    ELSE
      qty_needed := abs(v_qty_change);

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
          'ADJUSTMENT',
          take_qty,
          'adjustment',
          v_adj_id,
          auth.uid(),
          now()
        );

        UPDATE inventory_batches
        SET quantity_remaining = quantity_remaining - take_qty
        WHERE id = batch.id;

        v_negative_total := v_negative_total + (take_qty * batch.cost_price);
        qty_needed := qty_needed - take_qty;
      END LOOP;

      IF qty_needed > 0 THEN
        RAISE EXCEPTION 'Insufficient stock for adjustment on product: %', item->>'productId';
      END IF;
    END IF;

  END LOOP;

  INSERT INTO journal_entries (id, reference_type, reference_id, description, created_at)
  VALUES (v_journal_id, 'adjustment', v_adj_id, 'Adjustment ' || v_adj_number, now());

  IF v_positive_total > 0 THEN
    INSERT INTO journal_lines (id, journal_entry_id, account_id, debit, credit) VALUES
      (gen_random_uuid(), v_journal_id, (SELECT id FROM accounts WHERE code = '1100'), v_positive_total, 0),
      (gen_random_uuid(), v_journal_id, (SELECT id FROM accounts WHERE code = '5002'), 0, v_positive_total);
  END IF;

  IF v_negative_total > 0 THEN
    INSERT INTO journal_lines (id, journal_entry_id, account_id, debit, credit) VALUES
      (gen_random_uuid(), v_journal_id, (SELECT id FROM accounts WHERE code = '5002'), v_negative_total, 0),
      (gen_random_uuid(), v_journal_id, (SELECT id FROM accounts WHERE code = '1100'), 0, v_negative_total);
  END IF;

  RETURN jsonb_build_object(
    'adjustment_id',     v_adj_id,
    'adjustment_number', v_adj_number,
    'positive_total',    v_positive_total,
    'negative_total',    v_negative_total
  );

END;
$$;

-- ============================================================
-- FUNCTION: void_sale
-- ============================================================

CREATE OR REPLACE FUNCTION void_sale(p_sale_id uuid, p_reason text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sale RECORD;
  v_movement RECORD;
  v_sp RECORD;
  v_journal_id uuid := gen_random_uuid();
  v_debit_account_id uuid;
BEGIN
  SELECT * INTO v_sale FROM sales WHERE id = p_sale_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sale not found';
  END IF;

  IF v_sale.status != 'completed' THEN
    RAISE EXCEPTION 'Sale is not in completed status';
  END IF;

  UPDATE sales
  SET status = 'voided', voided_at = now(), voided_by = auth.uid(), void_reason = p_reason
  WHERE id = p_sale_id;

  FOR v_movement IN
    SELECT * FROM inventory_movements
    WHERE reference_type = 'sale' AND reference_id = p_sale_id AND type = 'OUT'
  LOOP
    UPDATE inventory_batches
    SET quantity_remaining = quantity_remaining + v_movement.quantity
    WHERE id = v_movement.batch_id;

    INSERT INTO inventory_movements (id, product_id, batch_id, type, quantity, reference_type, reference_id, created_by, created_at)
    VALUES (
      gen_random_uuid(),
      v_movement.product_id,
      v_movement.batch_id,
      'RETURN',
      v_movement.quantity,
      'void',
      p_sale_id,
      auth.uid(),
      now()
    );
  END LOOP;

  INSERT INTO journal_entries (id, reference_type, reference_id, description, created_at)
  VALUES (v_journal_id, 'void', p_sale_id, 'Void ' || v_sale.invoice_number, now());

  IF v_sale.payment_method = 'credit' THEN
    INSERT INTO journal_lines (id, journal_entry_id, account_id, debit, credit) VALUES
      (gen_random_uuid(), v_journal_id, (SELECT id FROM accounts WHERE code = '1003'), 0, v_sale.total_amount);
  ELSIF v_sale.payment_method = 'mixed' THEN
    FOR v_sp IN SELECT * FROM sale_payments WHERE sale_id = p_sale_id
    LOOP
      IF v_sp.payment_method = 'cash' THEN
        SELECT id INTO v_debit_account_id FROM accounts WHERE code = '1001';
      ELSE
        SELECT id INTO v_debit_account_id FROM accounts WHERE code = '1002';
      END IF;
      INSERT INTO journal_lines (id, journal_entry_id, account_id, debit, credit)
      VALUES (gen_random_uuid(), v_journal_id, v_debit_account_id, 0, v_sp.amount);
    END LOOP;
  ELSE
    IF v_sale.payment_method = 'cash' THEN
      SELECT id INTO v_debit_account_id FROM accounts WHERE code = '1001';
    ELSE
      SELECT id INTO v_debit_account_id FROM accounts WHERE code = '1002';
    END IF;
    INSERT INTO journal_lines (id, journal_entry_id, account_id, debit, credit)
    VALUES (gen_random_uuid(), v_journal_id, v_debit_account_id, 0, v_sale.total_amount);
  END IF;

  INSERT INTO journal_lines (id, journal_entry_id, account_id, debit, credit) VALUES
    (gen_random_uuid(), v_journal_id, (SELECT id FROM accounts WHERE code = '4001'), v_sale.total_amount, 0),
    (gen_random_uuid(), v_journal_id, (SELECT id FROM accounts WHERE code = '5001'), 0, v_sale.total_cogs),
    (gen_random_uuid(), v_journal_id, (SELECT id FROM accounts WHERE code = '1100'), v_sale.total_cogs, 0);

  RETURN jsonb_build_object('sale_id', p_sale_id, 'status', 'voided');
END;
$$;

-- ============================================================
-- FUNCTION: pay_supplier (AP Settlement)
-- ============================================================

CREATE OR REPLACE FUNCTION pay_supplier(p_payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_po RECORD;
  v_payment_id uuid := gen_random_uuid();
  v_journal_id uuid := gen_random_uuid();
  v_amount numeric;
  v_payment_method text;
  v_debit_account_id uuid;
  v_paid_so_far numeric;
  v_outstanding numeric;
BEGIN
  SELECT * INTO v_po FROM purchase_orders WHERE id = (p_payload->>'po_id')::uuid FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Purchase order not found';
  END IF;

  IF v_po.status != 'received' THEN
    RAISE EXCEPTION 'Can only pay a received purchase order';
  END IF;

  IF v_po.payment_method != 'credit' THEN
    RAISE EXCEPTION 'Purchase order is not on credit terms';
  END IF;

  v_amount         := (p_payload->>'amount')::numeric;
  v_payment_method := p_payload->>'payment_method';

  IF v_amount IS NULL OR v_amount <= 0 THEN
    RAISE EXCEPTION 'Payment amount must be positive';
  END IF;

  SELECT COALESCE(SUM(amount), 0) INTO v_paid_so_far
  FROM supplier_payments WHERE purchase_order_id = v_po.id;

  v_outstanding := v_po.total_amount - v_paid_so_far;

  IF v_amount > v_outstanding THEN
    RAISE EXCEPTION 'Payment amount exceeds outstanding balance of %', v_outstanding;
  END IF;

  INSERT INTO supplier_payments (id, purchase_order_id, amount, payment_method, notes, created_by, created_at)
  VALUES (
    v_payment_id,
    v_po.id,
    v_amount,
    v_payment_method,
    p_payload->>'notes',
    auth.uid(),
    now()
  );

  IF v_payment_method = 'cash' THEN
    SELECT id INTO v_debit_account_id FROM accounts WHERE code = '1001';
  ELSIF v_payment_method = 'transfer' THEN
    SELECT id INTO v_debit_account_id FROM accounts WHERE code = '1002';
  ELSE
    RAISE EXCEPTION 'Invalid payment method: %', v_payment_method;
  END IF;

  INSERT INTO journal_entries (id, reference_type, reference_id, description, created_at)
  VALUES (v_journal_id, 'supplier_payment', v_payment_id, 'AP Payment for ' || v_po.po_number, now());

  INSERT INTO journal_lines (id, journal_entry_id, account_id, debit, credit) VALUES
    (gen_random_uuid(), v_journal_id, (SELECT id FROM accounts WHERE code = '2001'), v_amount, 0),
    (gen_random_uuid(), v_journal_id, v_debit_account_id, 0, v_amount);

  RETURN jsonb_build_object(
    'payment_id',  v_payment_id,
    'amount',      v_amount,
    'outstanding', v_outstanding - v_amount
  );
END;
$$;

-- ============================================================
-- FUNCTION: collect_sale_payment (AR Settlement)
-- ============================================================

CREATE OR REPLACE FUNCTION collect_sale_payment(p_payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sale RECORD;
  v_payment_id uuid := gen_random_uuid();
  v_journal_id uuid := gen_random_uuid();
  v_amount numeric;
  v_payment_method text;
  v_credit_account_id uuid;
  v_collected_so_far numeric;
  v_outstanding numeric;
BEGIN
  SELECT * INTO v_sale FROM sales WHERE id = (p_payload->>'sale_id')::uuid FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sale not found';
  END IF;

  IF v_sale.status != 'completed' THEN
    RAISE EXCEPTION 'Can only collect on a completed sale';
  END IF;

  IF v_sale.payment_method != 'credit' THEN
    RAISE EXCEPTION 'Sale is not on credit terms';
  END IF;

  v_amount         := (p_payload->>'amount')::numeric;
  v_payment_method := p_payload->>'payment_method';

  IF v_amount IS NULL OR v_amount <= 0 THEN
    RAISE EXCEPTION 'Collection amount must be positive';
  END IF;

  SELECT COALESCE(SUM(amount), 0) INTO v_collected_so_far
  FROM sale_credit_payments WHERE sale_id = v_sale.id;

  v_outstanding := v_sale.total_amount - v_collected_so_far;

  IF v_amount > v_outstanding THEN
    RAISE EXCEPTION 'Collection amount exceeds outstanding balance of %', v_outstanding;
  END IF;

  INSERT INTO sale_credit_payments (id, sale_id, amount, payment_method, notes, created_by, created_at)
  VALUES (
    v_payment_id,
    v_sale.id,
    v_amount,
    v_payment_method,
    p_payload->>'notes',
    auth.uid(),
    now()
  );

  IF v_payment_method = 'cash' THEN
    SELECT id INTO v_credit_account_id FROM accounts WHERE code = '1001';
  ELSIF v_payment_method = 'transfer' THEN
    SELECT id INTO v_credit_account_id FROM accounts WHERE code = '1002';
  ELSE
    RAISE EXCEPTION 'Invalid payment method: %', v_payment_method;
  END IF;

  INSERT INTO journal_entries (id, reference_type, reference_id, description, created_at)
  VALUES (v_journal_id, 'sale_collection', v_payment_id, 'AR Collection for ' || v_sale.invoice_number, now());

  INSERT INTO journal_lines (id, journal_entry_id, account_id, debit, credit) VALUES
    (gen_random_uuid(), v_journal_id, v_credit_account_id, v_amount, 0),
    (gen_random_uuid(), v_journal_id, (SELECT id FROM accounts WHERE code = '1003'), 0, v_amount);

  RETURN jsonb_build_object(
    'payment_id',  v_payment_id,
    'amount',      v_amount,
    'outstanding', v_outstanding - v_amount
  );
END;
$$;

-- ─── Profit & Loss report function ──────────────────────────────────────────
-- Returns revenue and expense account balances for a given date range.
-- Amounts: revenue = credit - debit (positive = income),
--          expense = debit - credit (positive = cost).
CREATE OR REPLACE FUNCTION get_profit_loss(
  p_start_date timestamptz,
  p_end_date   timestamptz
)
RETURNS TABLE (
  code   text,
  name   text,
  type   text,
  amount numeric
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    a.code,
    a.name,
    a.type,
    CASE
      WHEN a.type = 'revenue' THEN COALESCE(SUM(jl.credit) - SUM(jl.debit), 0)
      WHEN a.type = 'expense' THEN COALESCE(SUM(jl.debit) - SUM(jl.credit), 0)
    END AS amount
  FROM accounts a
  JOIN journal_lines jl ON jl.account_id = a.id
  JOIN journal_entries je ON je.id = jl.journal_entry_id
  WHERE a.type IN ('revenue', 'expense')
    AND je.created_at >= p_start_date
    AND je.created_at <= p_end_date
  GROUP BY a.id, a.code, a.name, a.type
  ORDER BY a.type, a.code;
$$;
