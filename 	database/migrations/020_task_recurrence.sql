-- Add recurrence field to tasks table
-- Recurrence types: 'once' (default), 'daily', 'weekly', 'monthly'

DO $$
BEGIN
  CREATE TYPE task_recurrence_enum AS ENUM ('once', 'daily', 'weekly', 'monthly');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS recurrence task_recurrence_enum DEFAULT 'once';

-- Add last_generated_at timestamp to track when recurring tasks were last generated
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS last_generated_at TIMESTAMP;

-- Create index for efficient queries of recurring tasks
CREATE INDEX IF NOT EXISTS idx_tasks_recurrence ON tasks(recurrence) WHERE recurrence != 'once';

COMMENT ON COLUMN tasks.recurrence IS 'How often the task should be automatically regenerated: once (default), daily, weekly, monthly';
COMMENT ON COLUMN tasks.last_generated_at IS 'Timestamp when this recurring task was last automatically generated';

