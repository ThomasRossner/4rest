-- Remove event_group column from tasks and rewards tables
-- This field is no longer used in the application

-- Drop index if it exists
DROP INDEX IF EXISTS idx_tasks_event_group;

-- Remove event_group column from tasks table
ALTER TABLE tasks DROP COLUMN IF EXISTS event_group;

-- Remove event_group column from rewards table
ALTER TABLE rewards DROP COLUMN IF EXISTS event_group;

-- Remove comment if it exists (PostgreSQL doesn't support IF EXISTS for COMMENT)
DO $$ 
BEGIN
  -- Comments are automatically removed when column is dropped
  NULL;
END $$;
