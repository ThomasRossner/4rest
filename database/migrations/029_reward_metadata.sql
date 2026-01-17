-- Add metadata fields to rewards table
-- Art (Type): Rabatt, Erlebnis, Add-on, physisches Geschenk
-- Kategorie: Hotel, nicht Hotel
-- Kosten: niedrig, mittel, hoch
-- mögliche Punkte: INTEGER (number)
-- Event/Gruppe: VARCHAR (optional text)

-- Create ENUM types for new metadata fields (only if they don't exist)
DO $$ BEGIN
  CREATE TYPE reward_art_enum AS ENUM (
    'Rabatt',
    'Erlebnis',
    'Add-on',
    'physisches Geschenk'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE reward_kategorie_enum AS ENUM (
    'Hotel',
    'nicht Hotel'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE reward_kosten_enum AS ENUM (
    'niedrig',
    'mittel',
    'hoch'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add new columns to the rewards table
ALTER TABLE rewards
  ADD COLUMN IF NOT EXISTS reward_art reward_art_enum,
  ADD COLUMN IF NOT EXISTS kategorie reward_kategorie_enum,
  ADD COLUMN IF NOT EXISTS kosten reward_kosten_enum,
  ADD COLUMN IF NOT EXISTS moegliche_punkte INTEGER,
  ADD COLUMN IF NOT EXISTS event_group VARCHAR(255);

-- Add comments for documentation
COMMENT ON COLUMN rewards.reward_art IS 'Art der Belohnung: Rabatt, Erlebnis, Add-on, physisches Geschenk';
COMMENT ON COLUMN rewards.kategorie IS 'Kategorie der Belohnung: Hotel oder nicht Hotel';
COMMENT ON COLUMN rewards.kosten IS 'Kostenkategorie: niedrig, mittel, hoch';
COMMENT ON COLUMN rewards.moegliche_punkte IS 'Mögliche Punkte für diese Belohnung (Zahl)';
COMMENT ON COLUMN rewards.event_group IS 'Optional: Event oder Gruppe zuordnen';

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_rewards_reward_art ON rewards(reward_art) WHERE reward_art IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_rewards_kategorie ON rewards(kategorie) WHERE kategorie IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_rewards_kosten ON rewards(kosten) WHERE kosten IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_rewards_moegliche_punkte ON rewards(moegliche_punkte) WHERE moegliche_punkte IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_rewards_event_group ON rewards(event_group) WHERE event_group IS NOT NULL;

