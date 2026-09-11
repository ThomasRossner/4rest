-- Bilingual content: teams (name)
-- See docs/concept-bilingual-user-content.md

ALTER TABLE teams ADD COLUMN IF NOT EXISTS name_i18n JSONB DEFAULT '{}';

UPDATE teams
SET
  name_i18n = jsonb_build_object('de', COALESCE(name, ''), 'en', COALESCE(name, ''))
WHERE name_i18n = '{}' OR name_i18n IS NULL;

UPDATE teams
SET name = COALESCE(name_i18n->>'de', name_i18n->>'en', name)
WHERE name_i18n != '{}' AND name_i18n IS NOT NULL;

COMMENT ON COLUMN teams.name_i18n IS 'Team name per language: { "de": "...", "en": "..." }';
