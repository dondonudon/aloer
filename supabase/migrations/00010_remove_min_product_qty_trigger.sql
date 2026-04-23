-- Migrate any existing min_product_qty campaigns to 'always' before
-- dropping the trigger type, so the constraint drop doesn't fail on live data.
UPDATE campaigns
SET trigger_type = 'always'
WHERE trigger_type = 'min_product_qty';

ALTER TABLE campaigns
  DROP CONSTRAINT campaigns_trigger_type_check,
  ADD CONSTRAINT campaigns_trigger_type_check
    CHECK (trigger_type IN ('always', 'min_cart_total'));
