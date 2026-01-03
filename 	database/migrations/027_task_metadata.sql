-- Add metadata fields to tasks table
-- Category, difficulty, time_required, location_tool, event_group

-- Create ENUM types for the new fields
DO $$
BEGIN
  -- Task category enum
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_category_enum') THEN
    CREATE TYPE task_category_enum AS ENUM (
      'Kommunikation & Netzwerke',
      'Mensch & soziales Umfeld',
      'Natur & Umweltschutz',
      'Ressourcenverbrauch & Materialeinsatz'
    );
  END IF;

  -- Task difficulty enum
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_difficulty_enum') THEN
    CREATE TYPE task_difficulty_enum AS ENUM (
      'sehr einfach',
      'einfach',
      'mittel',
      'schwer',
      'sehr schwer'
    );
  END IF;

  -- Task time required enum
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_time_required_enum') THEN
    CREATE TYPE task_time_required_enum AS ENUM (
      '1-3 Min',
      '3-10 Min',
      '10-30 Min',
      '30-60 Min',
      '60+ Min'
    );
  END IF;

  -- Task location/tool enum
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_location_tool_enum') THEN
    CREATE TYPE task_location_tool_enum AS ENUM (
      'Umgebung',
      'Hotel',
      'egal',
      'Smartphone/PC'
    );
  END IF;
END $$;

-- Add new columns to tasks table
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS category task_category_enum,
  ADD COLUMN IF NOT EXISTS difficulty task_difficulty_enum,
  ADD COLUMN IF NOT EXISTS time_required task_time_required_enum,
  ADD COLUMN IF NOT EXISTS location_tool task_location_tool_enum,
  ADD COLUMN IF NOT EXISTS event_group VARCHAR(255);

-- Add comments for documentation
COMMENT ON COLUMN tasks.category IS 'Task category: Kommunikation & Netzwerke, Mensch & soziales Umfeld, Natur & Umweltschutz, Ressourcenverbrauch & Materialeinsatz';
COMMENT ON COLUMN tasks.difficulty IS 'Task difficulty level: sehr einfach, einfach, mittel, schwer, sehr schwer';
COMMENT ON COLUMN tasks.time_required IS 'Estimated time required: 1-3 Min, 3-10 Min, 10-30 Min, 30-60 Min, 60+ Min';
COMMENT ON COLUMN tasks.location_tool IS 'Required location or tool: Umgebung, Hotel, egal, Smartphone/PC';
COMMENT ON COLUMN tasks.event_group IS 'Optional event or group assignment (can be NULL)';

-- Create indexes for filtering
CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category) WHERE category IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_difficulty ON tasks(difficulty) WHERE difficulty IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_time_required ON tasks(time_required) WHERE time_required IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_location_tool ON tasks(location_tool) WHERE location_tool IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_event_group ON tasks(event_group) WHERE event_group IS NOT NULL;

