-- Migration: Web Push subscriptions for PWA notifications.
-- One row per (user, device). The endpoint is unique per browser/device, so
-- we key uniqueness on it. p256dh + auth are the per-subscription keys
-- needed to encrypt push payloads.

CREATE TABLE push_subscriptions (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint     text        NOT NULL UNIQUE,
  p256dh       text        NOT NULL,
  auth         text        NOT NULL,
  user_agent   text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_push_subscriptions_user ON push_subscriptions (user_id);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can read/insert/delete their own subscriptions.
-- Sending pushes uses the service role (bypasses RLS).
CREATE POLICY "Users manage their own push subscriptions" ON push_subscriptions
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
