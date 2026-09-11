-- Link recurring reward instances to their template reward
-- so recurrence checks can consider all generated instances.

ALTER TABLE rewards
  ADD COLUMN IF NOT EXISTS generated_from_reward_id UUID REFERENCES rewards(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_rewards_generated_from_reward_id
  ON rewards(generated_from_reward_id);

COMMENT ON COLUMN rewards.generated_from_reward_id IS
  'If set, this reward was auto-generated from a recurring template reward (rewards.id).';

