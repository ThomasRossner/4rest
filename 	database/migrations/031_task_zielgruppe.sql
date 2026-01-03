-- Add zielgruppe field to tasks table
-- Zielgruppe: Mitarbeitende, Gäste, Stakeholder

-- Create ENUM type for zielgruppe
CREATE TYPE task_zielgruppe_enum AS ENUM (
  'Mitarbeitende',
  'Gäste',
  'Stakeholder'
);

-- Add new column to the tasks table
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS zielgruppe task_zielgruppe_enum;

-- Add comment for documentation
COMMENT ON COLUMN tasks.zielgruppe IS 'Zielgruppe der Aufgabe: Mitarbeitende, Gäste, Stakeholder';

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_tasks_zielgruppe ON tasks(zielgruppe) WHERE zielgruppe IS NOT NULL;

