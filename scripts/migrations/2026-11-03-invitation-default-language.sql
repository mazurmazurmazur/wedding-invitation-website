-- Additive, idempotent: adds each invitation's default guest-facing language.
-- Existing rows get 'pl' (a constant default, so no table rewrite); nothing else is modified.
-- If the column already exists the whole statement, including the constraint, is skipped.
ALTER TABLE wedding_invitations ADD COLUMN IF NOT EXISTS default_language text NOT NULL DEFAULT 'pl'
  CONSTRAINT wedding_invitations_default_language_check CHECK (default_language IN ('pl', 'en'));
