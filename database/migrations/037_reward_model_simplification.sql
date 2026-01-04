-- Simplify reward model:
-- 1. Remove allowed_hotel_ids
-- 2. Merge allowed_roles and allowed_user_types into single allowed_role field (string, not array)

-- Step 1: Add new allowed_role column (nullable for now)
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS allowed_role VARCHAR(50);

-- Step 2: Migrate data from allowed_roles and allowed_user_types to allowed_role
-- Priority: if allowed_roles has values, use first one; otherwise use first from allowed_user_types
-- Convert enum types to text for storage
UPDATE rewards
SET allowed_role = CASE
  WHEN allowed_roles IS NOT NULL AND array_length(allowed_roles, 1) > 0 THEN allowed_roles[1]::text
  WHEN allowed_user_types IS NOT NULL AND array_length(allowed_user_types, 1) > 0 THEN allowed_user_types[1]::text
  ELSE NULL
END;

-- Step 3: Remove old columns
ALTER TABLE rewards DROP COLUMN IF EXISTS allowed_hotel_ids;
ALTER TABLE rewards DROP COLUMN IF EXISTS allowed_roles;
ALTER TABLE rewards DROP COLUMN IF EXISTS allowed_user_types;

-- Step 4: Add comment
COMMENT ON COLUMN rewards.allowed_role IS 'Single role from combined roles/user_types list. NULL means accessible to all.';
