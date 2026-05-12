-- Migration: In-app notification inbox.
-- Mirrors every push notification sent via sendPushToUser so users can review
-- their notification history inside the app, even after dismissing device alerts.

CREATE TABLE notifications (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title      text        NOT NULL,
  body       text,
  url        text,
  tag        text,
  is_read    boolean     NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Most queries fetch recent notifications for a specific user.
CREATE INDEX idx_notifications_user_created ON notifications (user_id, created_at DESC);

-- Deduplicate tagged notifications (e.g. daily credit-due reminders for the same record).
-- PostgreSQL treats NULLs as distinct in unique constraints, so rows with tag = NULL
-- are always permitted to coexist — only non-NULL tags are deduplicated.
ALTER TABLE notifications
  ADD CONSTRAINT notifications_user_tag_unique UNIQUE (user_id, tag);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can read their own notifications and mark them as read.
-- INSERT/UPDATE from the cron job uses the service role and bypasses RLS.
CREATE POLICY "Users manage their own notifications" ON notifications
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
