-- Change zielgruppe from single ENUM to ENUM array for tasks and rewards
-- This allows multiple target groups to be selected

-- Step 1: Convert tasks.zielgruppe from single ENUM to ENUM array
-- First, create a temporary column with array type
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS zielgruppe_array task_zielgruppe_enum[];

-- Migrate existing data: convert single value to array
UPDATE tasks
SET zielgruppe_array = CASE
  WHEN zielgruppe IS NOT NULL THEN ARRAY[zielgruppe]
  ELSE NULL
END;

-- Drop old column and index
DROP INDEX IF EXISTS idx_tasks_zielgruppe;
ALTER TABLE tasks DROP COLUMN IF EXISTS zielgruppe;

-- Rename new column to original name
ALTER TABLE tasks RENAME COLUMN zielgruppe_array TO zielgruppe;

-- Recreate index for array column (using GIN index for array operations)
CREATE INDEX IF NOT EXISTS idx_tasks_zielgruppe ON tasks USING GIN(zielgruppe) WHERE zielgruppe IS NOT NULL;

-- Update comment
COMMENT ON COLUMN tasks.zielgruppe IS 'Zielgruppe der Aufgabe als Array: Mitarbeitende, Gäste, Stakeholder. NULL oder leeres Array bedeutet für alle zugänglich.';

-- Step 2: Convert rewards.zielgruppe from single ENUM to ENUM array
-- First, create a temporary column with array type
ALTER TABLE rewards
  ADD COLUMN IF NOT EXISTS zielgruppe_array reward_zielgruppe_enum[];

-- Migrate existing data: convert single value to array
UPDATE rewards
SET zielgruppe_array = CASE
  WHEN zielgruppe IS NOT NULL THEN ARRAY[zielgruppe]
  ELSE NULL
END;

-- Drop old column and index
DROP INDEX IF EXISTS idx_rewards_zielgruppe;
ALTER TABLE rewards DROP COLUMN IF EXISTS zielgruppe;

-- Rename new column to original name
ALTER TABLE rewards RENAME COLUMN zielgruppe_array TO zielgruppe;

-- Recreate index for array column (using GIN index for array operations)
CREATE INDEX IF NOT EXISTS idx_rewards_zielgruppe ON rewards USING GIN(zielgruppe) WHERE zielgruppe IS NOT NULL;

-- Update comment
COMMENT ON COLUMN rewards.zielgruppe IS 'Zielgruppe der Belohnung als Array: Mitarbeitende, Gäste, Stakeholder. NULL oder leeres Array bedeutet für alle zugänglich.';
