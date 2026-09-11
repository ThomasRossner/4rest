-- Remove kosten and moegliche_punkte fields from rewards table
-- These fields are no longer needed

-- Step 1: Remove indexes
DROP INDEX IF EXISTS idx_rewards_kosten;
DROP INDEX IF EXISTS idx_rewards_moegliche_punkte;

-- Step 2: Remove columns
ALTER TABLE rewards DROP COLUMN IF EXISTS kosten;
ALTER TABLE rewards DROP COLUMN IF EXISTS moegliche_punkte;
