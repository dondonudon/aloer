-- Product Units & Conversions
-- Enables multi-unit support per product (e.g. buy by carton, sell by pcs).
--
-- Example:
--   product: Frozen Chicken
--   unit "pcs"    | conversion_to_base = 1  | is_base = true
--   unit "carton" | conversion_to_base = 20 | is_base = false  → 1 carton = 20 pcs

-- ============================================================
-- TABLE
-- ============================================================

CREATE TABLE product_units (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id         uuid        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  unit_name          text        NOT NULL,
  conversion_to_base numeric     NOT NULL CHECK (conversion_to_base > 0),
  is_base            boolean     NOT NULL DEFAULT false,
  created_at         timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, unit_name)
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Enforce a single base unit per product
CREATE UNIQUE INDEX product_units_one_base
  ON product_units (product_id)
  WHERE is_base = true;

CREATE INDEX idx_product_units_product
  ON product_units (product_id);

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE product_units ENABLE ROW LEVEL SECURITY;

CREATE POLICY "product_units_select" ON product_units
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "product_units_insert" ON product_units
  FOR INSERT TO authenticated WITH CHECK (is_owner());

CREATE POLICY "product_units_update" ON product_units
  FOR UPDATE TO authenticated USING (is_owner()) WITH CHECK (is_owner());

CREATE POLICY "product_units_delete" ON product_units
  FOR DELETE TO authenticated USING (is_owner());
