-- Allow passwordless accounts (accounts with email but no password and no OAuth)
-- Update the check_auth_method constraint to allow passwordless authentication

DO $$
BEGIN
  -- Drop the existing constraint
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'check_auth_method'
      AND conrelid = 'users'::regclass
  ) THEN
    ALTER TABLE users DROP CONSTRAINT check_auth_method;
  END IF;

  -- Add updated constraint that allows passwordless accounts
  ALTER TABLE users
    ADD CONSTRAINT check_auth_method
    CHECK (
      (password_hash IS NOT NULL) OR
      (oauth_provider IS NOT NULL AND oauth_id IS NOT NULL) OR
      (email IS NOT NULL AND password_hash IS NULL AND (oauth_provider IS NULL OR oauth_id IS NULL))
    );
END $$;

