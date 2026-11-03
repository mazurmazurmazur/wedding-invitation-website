-- Additive, idempotent: adds each invitation's default guest-facing language.
-- Existing rows get 'pl' (a constant default, so no table rewrite); nothing else is modified.
ALTER TABLE wedding_invitations ADD COLUMN IF NOT EXISTS default_language text NOT NULL DEFAULT 'pl';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'wedding_invitations_default_language_check') THEN
    ALTER TABLE wedding_invitations ADD CONSTRAINT wedding_invitations_default_language_check CHECK (default_language IN ('pl', 'en'));
  END IF;
END $$;
