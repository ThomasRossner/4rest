-- Bilingual content: tasks (title, description, article_content)
-- See docs/bilingual-schema-and-api-proposal.md

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS title_i18n JSONB DEFAULT '{}';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS description_i18n JSONB DEFAULT '{}';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS article_content_i18n JSONB DEFAULT '{}';

UPDATE tasks
SET
  title_i18n = jsonb_build_object('de', COALESCE(title, ''), 'en', COALESCE(title, '')),
  description_i18n = jsonb_build_object('de', COALESCE(description, ''), 'en', COALESCE(description, '')),
  article_content_i18n = CASE
    WHEN article_content IS NOT NULL AND article_content != '' THEN jsonb_build_object('de', article_content, 'en', article_content)
    ELSE '{}'
  END
WHERE title_i18n = '{}' OR title_i18n IS NULL;

COMMENT ON COLUMN tasks.title_i18n IS 'Title per language: { "de": "...", "en": "..." }';
COMMENT ON COLUMN tasks.description_i18n IS 'Description per language: { "de": "...", "en": "..." }';
COMMENT ON COLUMN tasks.article_content_i18n IS 'Article content (article_quiz) per language: { "de": "...", "en": "..." }';
