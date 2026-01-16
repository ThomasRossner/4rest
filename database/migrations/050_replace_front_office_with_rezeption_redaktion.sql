-- Migration: Replace front_office with rezeption and redaktion roles
-- Date: 2026-01-16
-- This migration updates the user_role_enum to replace 'front_office' with 'rezeption' and 'redaktion'

DO $$
BEGIN
  -- Step 1: Update existing data - migrate old roles to new roles
  -- All existing front_office/employee users will become 'rezeption' by default
  -- stakeholder users will become 'guest'
  -- They can be manually reassigned to 'redaktion' later if needed
  ALTER TABLE users ALTER COLUMN role TYPE text;
  
  UPDATE users SET role = 'rezeption' WHERE role IN ('front_office', 'employee');
  UPDATE users SET role = 'guest' WHERE role = 'stakeholder';
  
  -- Step 2: Drop and recreate the enum with new roles
  DROP TYPE IF EXISTS user_role_enum CASCADE;
  
  -- Create new enum with rezeption and redaktion instead of front_office
  CREATE TYPE user_role_enum AS ENUM ('guest', 'rezeption', 'redaktion', 'administrator');
  
  -- Step 3: Change the column back to enum type
  ALTER TABLE users 
    ALTER COLUMN role TYPE user_role_enum USING role::user_role_enum,
    ALTER COLUMN role SET DEFAULT 'guest';
  
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error during enum migration: %', SQLERRM;
  RAISE;
END $$;
