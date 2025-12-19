-- Add prerequisite fields to tasks table
-- Type 1: prerequisite_task_id - specific task that must be completed
-- Type 2: prerequisite_task_count + prerequisite_task_ids - minimum number of tasks from a set that must be completed

-- Add prerequisite_task_id (Type 1: specific task)
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS prerequisite_task_id UUID;

-- Add prerequisite_task_count (Type 2: minimum count)
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS prerequisite_task_count INTEGER;

-- Add prerequisite_task_ids (Type 2: array of task IDs)
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS prerequisite_task_ids UUID[];

-- Add foreign key constraint for prerequisite_task_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'fk_tasks_prerequisite_task_id'
  ) THEN
    ALTER TABLE tasks
      ADD CONSTRAINT fk_tasks_prerequisite_task_id 
      FOREIGN KEY (prerequisite_task_id) 
      REFERENCES tasks(id) 
      ON DELETE SET NULL;
  END IF;
END $$;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_tasks_prerequisite_task_id ON tasks(prerequisite_task_id) WHERE prerequisite_task_id IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN tasks.prerequisite_task_id IS 'Specific task that must be completed before this task becomes available (Type 1 prerequisite)';
COMMENT ON COLUMN tasks.prerequisite_task_count IS 'Minimum number of tasks from prerequisite_task_ids that must be completed (Type 2 prerequisite)';
COMMENT ON COLUMN tasks.prerequisite_task_ids IS 'Array of task IDs from which prerequisite_task_count must be completed (Type 2 prerequisite)';

