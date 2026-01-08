-- Add metadata field to reward_redemptions table for storing team points information
ALTER TABLE reward_redemptions
  ADD COLUMN IF NOT EXISTS metadata JSONB;

COMMENT ON COLUMN reward_redemptions.metadata IS 'Metadata for redemption (e.g., useTeamPoints, teamId)';

