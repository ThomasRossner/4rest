-- SIHOT integration support
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS sihot_guest_id VARCHAR(255) UNIQUE,
  ADD COLUMN IF NOT EXISTS sihot_guest_data JSONB;

CREATE INDEX IF NOT EXISTS idx_users_sihot_guest_id ON users(sihot_guest_id);

