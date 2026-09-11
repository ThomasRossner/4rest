-- Add article fields for article_quiz task type
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS article_url TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS article_content TEXT;

-- Add comment to document the new task type
COMMENT ON COLUMN tasks.article_url IS 'URL to external article for article_quiz tasks';
COMMENT ON COLUMN tasks.article_content IS 'Article content text for article_quiz tasks (alternative to article_url)';

