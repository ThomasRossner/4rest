-- Bilingual content: rewards (title, description)
-- See docs/bilingual-schema-and-api-proposal.md

ALTER TABLE rewards ADD COLUMN IF NOT EXISTS title_i18n JSONB DEFAULT '{}';
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS description_i18n JSONB DEFAULT '{}';

UPDATE rewards
SET
  title_i18n = jsonb_build_object('de', COALESCE(title, ''), 'en', COALESCE(title, '')),
  description_i18n = jsonb_build_object('de', COALESCE(description, ''), 'en', COALESCE(description, ''))
WHERE title_i18n = '{}' OR title_i18n IS NULL;

COMMENT ON COLUMN rewards.title_i18n IS 'Title per language: { "de": "...", "en": "..." }';
COMMENT ON COLUMN rewards.description_i18n IS 'Description per language: { "de": "...", "en": "..." }';
