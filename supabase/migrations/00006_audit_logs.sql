-- Audit Logs
-- Lightweight user activity log for tracking key actions across entities.
--
-- Examples:
--   action: "CREATE_PRODUCT", entity: "products", entity_id: "<uuid>"
--   action: "VOID_SALE",      entity: "sales",    entity_id: "<uuid>"

-- ============================================================
-- TABLE
-- ============================================================

CREATE TABLE audit_logs (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  action     text        NOT NULL,
  entity     text        NOT NULL,
  entity_id  uuid,
  payload    jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX audit_logs_user_id_idx   ON audit_logs (user_id);
CREATE INDEX audit_logs_entity_idx    ON audit_logs (entity, entity_id);
CREATE INDEX audit_logs_created_at_idx ON audit_logs (created_at DESC);

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Authenticated users can insert their own logs
CREATE POLICY "audit_logs_insert" ON audit_logs
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Only owners can read audit logs
CREATE POLICY "audit_logs_select" ON audit_logs
  FOR SELECT TO authenticated USING (is_owner());

-- Logs are immutable: no UPDATE or DELETE allowed
