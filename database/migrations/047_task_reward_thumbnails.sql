-- Add thumbnail_url columns for tasks and rewards
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

ALTER TABLE rewards
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
