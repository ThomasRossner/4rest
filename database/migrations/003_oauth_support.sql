-- OAuth Support: Make password optional and add OAuth fields
ALTER TABLE users 
  ALTER COLUMN password_hash DROP NOT NULL,
  ALTER COLUMN email DROP NOT NULL;

-- Add OAuth provider fields
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS oauth_provider VARCHAR(50),      -- 'github', 'google', 'facebook', etc.
  ADD COLUMN IF NOT EXISTS oauth_id VARCHAR(255),           -- Provider's user ID
  ADD COLUMN IF NOT EXISTS oauth_email VARCHAR(255);        -- Email from OAuth provider

-- Create unique index for OAuth identifiers
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_oauth 
  ON users(oauth_provider, oauth_id) 
  WHERE oauth_provider IS NOT NULL AND oauth_id IS NOT NULL;

-- Add index for email lookup (now nullable)
CREATE INDEX IF NOT EXISTS idx_users_oauth_email ON users(oauth_email);

-- Add constraint: either password_hash or oauth_provider must be present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'check_auth_method'
      AND conrelid = 'users'::regclass
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT check_auth_method
      CHECK (
        (password_hash IS NOT NULL) OR
        (oauth_provider IS NOT NULL AND oauth_id IS NOT NULL)
      );
  END IF;
END $$;

