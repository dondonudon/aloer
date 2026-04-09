-- Product Price History
-- Preserves every price change so historical margin and audit trails are never lost.

-- ============================================================
-- TABLE
-- ============================================================

CREATE TABLE product_prices (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id     uuid        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  price          numeric     NOT NULL CHECK (price >= 0),
  bulk_price     numeric     CHECK (bulk_price IS NULL OR bulk_price >= 0),
  bulk_min_qty   numeric     CHECK (bulk_min_qty IS NULL OR bulk_min_qty > 1),
  effective_from timestamptz NOT NULL DEFAULT now(),
  created_by     uuid        REFERENCES auth.users(id)
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_product_prices_product_time
  ON product_prices (product_id, effective_from DESC);

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE product_prices ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read price history (needed for margin reporting)
CREATE POLICY "product_prices_select" ON product_prices
  FOR SELECT TO authenticated USING (true);

-- Only owners can insert (trigger runs as the calling user, inserts go through RLS)
CREATE POLICY "product_prices_insert" ON product_prices
  FOR INSERT TO authenticated WITH CHECK (is_owner());

-- ============================================================
-- TRIGGER: auto-record price whenever products table changes
-- ============================================================

CREATE OR REPLACE FUNCTION record_product_price()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- INSERT   → always record the initial price
  -- UPDATE   → only record when a price-related column actually changed
  IF TG_OP = 'INSERT'
     OR OLD.selling_price  <> NEW.selling_price
     OR OLD.bulk_price      IS DISTINCT FROM NEW.bulk_price
     OR OLD.bulk_min_qty    IS DISTINCT FROM NEW.bulk_min_qty
  THEN
    INSERT INTO product_prices
      (product_id, price, bulk_price, bulk_min_qty, effective_from, created_by)
    VALUES
      (NEW.id, NEW.selling_price, NEW.bulk_price, NEW.bulk_min_qty, now(), auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_product_prices
  AFTER INSERT OR UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION record_product_price();

-- ============================================================
-- BACKFILL: seed initial price for every existing product
-- Use created_at as effective_from so the history is complete.
-- ============================================================

INSERT INTO product_prices
  (product_id, price, bulk_price, bulk_min_qty, effective_from, created_by)
SELECT
  id,
  selling_price,
  bulk_price,
  bulk_min_qty,
  created_at,
  NULL
FROM products;
