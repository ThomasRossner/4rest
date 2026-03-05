-- Add preferred_language for UI language (de/en)
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(5) DEFAULT 'de';

UPDATE users SET preferred_language = 'de' WHERE preferred_language IS NULL;

COMMENT ON COLUMN users.preferred_language IS 'User UI language: de, en';
