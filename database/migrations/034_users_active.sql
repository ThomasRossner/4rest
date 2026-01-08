-- Add active field to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT TRUE;

-- Add deleted_at field for soft delete
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL;

-- Create index for active users queries
CREATE INDEX IF NOT EXISTS idx_users_active ON users(active) WHERE active = TRUE;

-- Create index for non-deleted users queries
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at) WHERE deleted_at IS NULL;

