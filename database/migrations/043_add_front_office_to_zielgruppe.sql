-- Add 'Front Office' to task_zielgruppe_enum and reward_zielgruppe_enum
-- This aligns the enum values with the frontend which uses 'Front Office' instead of 'Mitarbeitende'

-- Step 1: Add 'Front Office' to task_zielgruppe_enum
DO $$
BEGIN
  -- Check if 'Front Office' already exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'Front Office' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'task_zielgruppe_enum')
  ) THEN
    ALTER TYPE task_zielgruppe_enum ADD VALUE 'Front Office';
  END IF;
END $$;

-- Step 2: Add 'Front Office' to reward_zielgruppe_enum
DO $$
BEGIN
  -- Check if 'Front Office' already exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'Front Office' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'reward_zielgruppe_enum')
  ) THEN
    ALTER TYPE reward_zielgruppe_enum ADD VALUE 'Front Office';
  END IF;
END $$;

-- Step 3: Optionally migrate existing 'Mitarbeitende' to 'Front Office' if needed
-- (Uncomment if you want to migrate existing data)
-- UPDATE tasks
-- SET zielgruppe = array_replace(zielgruppe, 'Mitarbeitende'::task_zielgruppe_enum, 'Front Office'::task_zielgruppe_enum)
-- WHERE 'Mitarbeitende' = ANY(zielgruppe);

-- UPDATE rewards
-- SET zielgruppe = array_replace(zielgruppe, 'Mitarbeitende'::reward_zielgruppe_enum, 'Front Office'::reward_zielgruppe_enum)
-- WHERE 'Mitarbeitende' = ANY(zielgruppe);

-- Update comments
COMMENT ON TYPE task_zielgruppe_enum IS 'Zielgruppe der Aufgabe: Mitarbeitende, Gäste, Stakeholder, Front Office';
COMMENT ON TYPE reward_zielgruppe_enum IS 'Zielgruppe der Belohnung: Mitarbeitende, Gäste, Stakeholder, Front Office';
