-- Simplify task model:
-- 1. Remove allowed_hotel_ids
-- 2. Remove allowed_user_types
-- 3. Remove allowed_roles (merged into zielgruppe)

-- Step 1: Migrate data from allowed_roles to zielgruppe if zielgruppe is NULL
-- Map roles to zielgruppe values:
-- 'employee' -> 'Mitarbeitende'
-- 'guest' -> 'Gäste'
-- 'stakeholder' -> 'Stakeholder'
-- 'administrator' -> NULL (administrators see all tasks anyway)
-- Only update if the allowed_roles column exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'allowed_roles') THEN
    UPDATE tasks
    SET zielgruppe = CASE
      WHEN zielgruppe IS NULL AND allowed_roles IS NOT NULL AND array_length(allowed_roles, 1) > 0 THEN
        CASE
          WHEN 'employee' = ANY(allowed_roles) THEN 'Mitarbeitende'::task_zielgruppe_enum
          WHEN 'guest' = ANY(allowed_roles) THEN 'Gäste'::task_zielgruppe_enum
          WHEN 'stakeholder' = ANY(allowed_roles) THEN 'Stakeholder'::task_zielgruppe_enum
          ELSE NULL
        END
      ELSE zielgruppe
    END;
  END IF;
END $$;

-- Step 2: Remove old columns
ALTER TABLE tasks DROP COLUMN IF EXISTS allowed_hotel_ids;
ALTER TABLE tasks DROP COLUMN IF EXISTS allowed_user_types;
ALTER TABLE tasks DROP COLUMN IF EXISTS allowed_roles;

-- Step 3: Update comment
COMMENT ON COLUMN tasks.zielgruppe IS 'Zielgruppe der Aufgabe: Mitarbeitende, Gäste, Stakeholder. NULL bedeutet für alle zugänglich.';
