-- Additive, idempotent: a manual "invitation sent" marker set by organizers in the dashboard.
-- Nullable with no default, so existing rows stay NULL (= not sent) and no table rewrite happens.
ALTER TABLE wedding_invitations ADD COLUMN IF NOT EXISTS sent_at timestamptz;
