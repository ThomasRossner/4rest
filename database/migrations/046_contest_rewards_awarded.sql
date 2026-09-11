-- Add rewards_awarded flag to contests table
ALTER TABLE contests
  ADD COLUMN IF NOT EXISTS rewards_awarded BOOLEAN DEFAULT FALSE NOT NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_contests_rewards_awarded ON contests(rewards_awarded);

