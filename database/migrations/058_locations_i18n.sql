-- Bilingual content: locations (name, description, address, category_description)
-- See docs/bilingual-schema-and-api-proposal.md

ALTER TABLE locations ADD COLUMN IF NOT EXISTS name_i18n JSONB DEFAULT '{}';
ALTER TABLE locations ADD COLUMN IF NOT EXISTS description_i18n JSONB DEFAULT '{}';
ALTER TABLE locations ADD COLUMN IF NOT EXISTS address_i18n JSONB DEFAULT '{}';
ALTER TABLE locations ADD COLUMN IF NOT EXISTS category_description_i18n JSONB DEFAULT '{}';

UPDATE locations
SET
  name_i18n = jsonb_build_object('de', COALESCE(name, ''), 'en', COALESCE(name, '')),
  description_i18n = jsonb_build_object('de', COALESCE(description, ''), 'en', COALESCE(description, '')),
  address_i18n = CASE
    WHEN address IS NOT NULL AND address != '' THEN jsonb_build_object('de', address, 'en', address)
    ELSE '{}'
  END,
  category_description_i18n = CASE
    WHEN category_description IS NOT NULL AND category_description != '' THEN jsonb_build_object('de', category_description, 'en', category_description)
    ELSE '{}'
  END
WHERE name_i18n = '{}' OR name_i18n IS NULL;

-- Keep legacy name in sync for UNIQUE / display fallback
UPDATE locations
SET name = COALESCE(name_i18n->>'de', name_i18n->>'en', name)
WHERE name_i18n != '{}' AND name_i18n IS NOT NULL;

COMMENT ON COLUMN locations.name_i18n IS 'Name per language: { "de": "...", "en": "..." }';
COMMENT ON COLUMN locations.description_i18n IS 'Description per language (legacy column remains).';
COMMENT ON COLUMN locations.address_i18n IS 'Address per language: { "de": "...", "en": "..." }';
COMMENT ON COLUMN locations.category_description_i18n IS 'Category description per language: { "de": "...", "en": "..." }';
