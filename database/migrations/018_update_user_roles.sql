-- Migration: Update user roles - rename 'employee' to 'front_office', remove 'stakeholder'
-- Date: 2026-01-14

-- Step 1: Update existing data
-- Migrate 'employee' to 'front_office'
UPDATE users SET role = 'front_office' WHERE role::text = 'employee';

-- Migrate 'stakeholder' to 'guest'
UPDATE users SET role = 'guest' WHERE role::text = 'stakeholder';

-- Update tasks.allowed_roles arrays
UPDATE tasks 
SET allowed_roles = array_replace(allowed_roles::text[], 'employee', 'front_office')::user_role_enum[]
WHERE 'employee' = ANY(allowed_roles::text[]);

UPDATE tasks 
SET allowed_roles = array_remove(allowed_roles::text[], 'stakeholder')::user_role_enum[]
WHERE 'stakeholder' = ANY(allowed_roles::text[]);

-- Update rewards.allowed_roles arrays
UPDATE rewards 
SET allowed_roles = array_replace(allowed_roles::text[], 'employee', 'front_office')::user_role_enum[]
WHERE 'employee' = ANY(allowed_roles::text[]);

UPDATE rewards 
SET allowed_roles = array_remove(allowed_roles::text[], 'stakeholder')::user_role_enum[]
WHERE 'stakeholder' = ANY(allowed_roles::text[]);

-- Update reward_templates.allowed_roles arrays (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reward_templates') THEN
    EXECUTE 'UPDATE reward_templates 
             SET allowed_roles = array_replace(allowed_roles::text[], ''employee'', ''front_office'')::user_role_enum[]
             WHERE ''employee'' = ANY(allowed_roles::text[])';
    
    EXECUTE 'UPDATE reward_templates 
             SET allowed_roles = array_remove(allowed_roles::text[], ''stakeholder'')::user_role_enum[]
             WHERE ''stakeholder'' = ANY(allowed_roles::text[])';
  END IF;
END $$;

-- Step 2: Update zielgruppe values in tasks
-- Replace 'Mitarbeitende' with 'Front Office'
UPDATE tasks 
SET zielgruppe = array_replace(zielgruppe, 'Mitarbeitende', 'Front Office')
WHERE 'Mitarbeitende' = ANY(zielgruppe);

-- Remove 'Stakeholder' from zielgruppe
UPDATE tasks 
SET zielgruppe = array_remove(zielgruppe, 'Stakeholder')
WHERE 'Stakeholder' = ANY(zielgruppe);

-- Step 3: Update zielgruppe values in rewards
UPDATE rewards 
SET zielgruppe = array_replace(zielgruppe, 'Mitarbeitende', 'Front Office')
WHERE 'Mitarbeitende' = ANY(zielgruppe);

UPDATE rewards 
SET zielgruppe = array_remove(zielgruppe, 'Stakeholder')
WHERE 'Stakeholder' = ANY(zielgruppe);

-- Step 4: Drop and recreate the enum type
-- First, we need to change the column type temporarily to text
DO $$
BEGIN
  -- Change columns to text temporarily
  ALTER TABLE users ALTER COLUMN role TYPE text;
  ALTER TABLE tasks ALTER COLUMN allowed_roles TYPE text[];
  ALTER TABLE rewards ALTER COLUMN allowed_roles TYPE text[];
  ALTER TABLE reward_templates ALTER COLUMN allowed_roles TYPE text[];
  
  -- Drop the old enum (only if it exists and has no dependencies)
  DROP TYPE IF EXISTS user_role_enum CASCADE;
  
  -- Create new enum without 'stakeholder' and with 'front_office' instead of 'employee'
  CREATE TYPE user_role_enum AS ENUM ('guest', 'front_office', 'administrator');
  
  -- Change columns back to enum type
  ALTER TABLE users 
    ALTER COLUMN role TYPE user_role_enum USING role::user_role_enum,
    ALTER COLUMN role SET DEFAULT 'guest';
  
  ALTER TABLE tasks 
    ALTER COLUMN allowed_roles TYPE user_role_enum[] USING allowed_roles::user_role_enum[],
    ALTER COLUMN allowed_roles SET DEFAULT ARRAY[]::user_role_enum[];
  
  ALTER TABLE rewards 
    ALTER COLUMN allowed_roles TYPE user_role_enum[] USING allowed_roles::user_role_enum[],
    ALTER COLUMN allowed_roles SET DEFAULT ARRAY[]::user_role_enum[];
  
  ALTER TABLE reward_templates 
    ALTER COLUMN allowed_roles TYPE user_role_enum[] USING allowed_roles::user_role_enum[],
    ALTER COLUMN allowed_roles SET DEFAULT ARRAY[]::user_role_enum[];
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error during enum migration: %', SQLERRM;
  RAISE;
END $$;
