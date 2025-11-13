-- Add passwordless login code fields to users table

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS login_code VARCHAR(10),
ADD COLUMN IF NOT EXISTS login_code_expires TIMESTAMP;

-- Create index for login code lookups
CREATE INDEX IF NOT EXISTS idx_users_login_code ON users(login_code) WHERE login_code IS NOT NULL;

