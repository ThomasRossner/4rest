ALTER TABLE locations
  ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT TRUE;

UPDATE locations
SET active = TRUE
WHERE active IS NULL;

CREATE INDEX IF NOT EXISTS idx_locations_active ON locations(active);

