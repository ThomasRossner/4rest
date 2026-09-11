-- Restore moegliche_punkte field to rewards table
-- This field is used to store points that are awarded to the user when redeeming a reward

-- Add column back
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS moegliche_punkte INTEGER;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_rewards_moegliche_punkte ON rewards(moegliche_punkte) WHERE moegliche_punkte IS NOT NULL;

-- Add comment
COMMENT ON COLUMN rewards.moegliche_punkte IS 'Punkte, die dem Benutzer beim Einlösen der Belohnung gutgeschrieben werden.';
