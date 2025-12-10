-- Add recurrence field to rewards table
-- Recurrence types: 'once' (default), 'daily', 'weekly', 'monthly'

DO $$
BEGIN
  CREATE TYPE reward_recurrence_enum AS ENUM ('once', 'daily', 'weekly', 'monthly');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE rewards
  ADD COLUMN IF NOT EXISTS recurrence reward_recurrence_enum DEFAULT 'once';

-- Add last_generated_at timestamp to track when recurring rewards were last generated
ALTER TABLE rewards
  ADD COLUMN IF NOT EXISTS last_generated_at TIMESTAMP;

-- Create index for efficient queries of recurring rewards
CREATE INDEX IF NOT EXISTS idx_rewards_recurrence ON rewards(recurrence) WHERE recurrence != 'once';

COMMENT ON COLUMN rewards.recurrence IS 'How often the reward should be automatically regenerated: once (default), daily, weekly, monthly';
COMMENT ON COLUMN rewards.last_generated_at IS 'Timestamp when this recurring reward was last automatically generated';

