-- Fix user_role_enum: Add 'front_office' and remove 'employee' and 'stakeholder'
-- This migration updates the enum type to match the code

DO $$
BEGIN
  -- Step 1: Add 'front_office' to the enum if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'front_office' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role_enum')
  ) THEN
    ALTER TYPE user_role_enum ADD VALUE 'front_office';
  END IF;
  
  -- Step 2: Update existing data - migrate 'employee' to 'front_office'
  -- First, we need to temporarily change the column to text
  ALTER TABLE users ALTER COLUMN role TYPE text;
  
  -- Update the values
  UPDATE users SET role = 'front_office' WHERE role = 'employee';
  UPDATE users SET role = 'guest' WHERE role = 'stakeholder';
  
  -- Step 3: Drop and recreate the enum without 'employee' and 'stakeholder'
  -- Drop the old enum (CASCADE will handle dependencies)
  DROP TYPE IF EXISTS user_role_enum CASCADE;
  
  -- Create new enum with correct values
  CREATE TYPE user_role_enum AS ENUM ('guest', 'front_office', 'administrator');
  
  -- Step 4: Change the column back to enum type
  ALTER TABLE users 
    ALTER COLUMN role TYPE user_role_enum USING role::user_role_enum,
    ALTER COLUMN role SET DEFAULT 'guest';
  
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error during enum migration: %', SQLERRM;
  RAISE;
END $$;
