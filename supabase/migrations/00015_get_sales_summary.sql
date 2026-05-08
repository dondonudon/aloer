-- Aggregates sales by local calendar day in the given timezone.
-- All grouping, summing, and date conversion happens in Postgres —
-- no row-by-row iteration in application code.
--
-- Parameters:
--   p_start_date  – inclusive lower bound (UTC timestamptz), or NULL for no lower limit
--   p_end_date    – inclusive upper bound (UTC timestamptz), or NULL for no upper limit
--   p_timezone    – IANA timezone name, e.g. 'Asia/Jakarta'. Defaults to 'UTC'.
--   p_payment_type – filter by payment_method, or NULL / '' for all
--
-- Returns one row per calendar day (in the requested timezone), newest first.

CREATE OR REPLACE FUNCTION get_sales_summary(
  p_start_date   timestamptz DEFAULT NULL,
  p_end_date     timestamptz DEFAULT NULL,
  p_timezone     text        DEFAULT 'UTC',
  p_payment_type text        DEFAULT NULL
)
RETURNS TABLE (
  sale_date         text,
  total_transactions bigint,
  total_revenue     numeric,
  total_cogs        numeric,
  gross_profit      numeric,
  total_discount    numeric,
  total_delivery_fee numeric
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    to_char(created_at AT TIME ZONE p_timezone, 'YYYY-MM-DD') AS sale_date,
    COUNT(*)                                                   AS total_transactions,
    COALESCE(SUM(total_amount), 0)                             AS total_revenue,
    COALESCE(SUM(total_cogs), 0)                               AS total_cogs,
    COALESCE(SUM(total_amount - total_cogs), 0)                AS gross_profit,
    COALESCE(SUM(
      COALESCE(discount_amount, 0) +
      COALESCE(campaign_savings, 0) +
      COALESCE(cart_campaign_discount, 0)
    ), 0)                                                      AS total_discount,
    COALESCE(SUM(COALESCE(delivery_fee, 0)), 0)                AS total_delivery_fee
  FROM sales
  WHERE status = 'completed'
    AND (p_start_date IS NULL OR created_at >= p_start_date)
    AND (p_end_date   IS NULL OR created_at <= p_end_date)
    AND (p_payment_type IS NULL OR p_payment_type = '' OR payment_method = p_payment_type)
  GROUP BY to_char(created_at AT TIME ZONE p_timezone, 'YYYY-MM-DD')
  ORDER BY sale_date DESC;
$$;
