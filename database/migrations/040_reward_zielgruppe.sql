-- Change rewards.allowed_role to zielgruppe (same as tasks)
-- This aligns rewards with tasks and uses the same enum values

-- Step 1: Create ENUM type for reward zielgruppe (if not exists, reuse task enum)
-- Note: We'll use the same enum type as tasks for consistency
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'reward_zielgruppe_enum') THEN
    CREATE TYPE reward_zielgruppe_enum AS ENUM (
      'Mitarbeitende',
      'Gäste',
      'Stakeholder'
    );
  END IF;
END $$;

-- Step 2: Add zielgruppe column
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS zielgruppe reward_zielgruppe_enum;

-- Step 3: Migrate data from allowed_role to zielgruppe
-- Map old allowed_role values to zielgruppe:
-- 'employee' -> 'Mitarbeitende'
-- 'guest' -> 'Gäste'
-- 'stakeholder' -> 'Stakeholder'
-- Other values or NULL -> NULL
UPDATE rewards
SET zielgruppe = CASE
  WHEN allowed_role = 'employee' THEN 'Mitarbeitende'::reward_zielgruppe_enum
  WHEN allowed_role = 'guest' THEN 'Gäste'::reward_zielgruppe_enum
  WHEN allowed_role = 'stakeholder' THEN 'Stakeholder'::reward_zielgruppe_enum
  ELSE NULL
END
WHERE allowed_role IS NOT NULL;

-- Step 4: Drop old allowed_role column
ALTER TABLE rewards DROP COLUMN IF EXISTS allowed_role;

-- Step 5: Add index for performance
CREATE INDEX IF NOT EXISTS idx_rewards_zielgruppe ON rewards(zielgruppe) WHERE zielgruppe IS NOT NULL;

-- Step 6: Update comment
COMMENT ON COLUMN rewards.zielgruppe IS 'Zielgruppe der Belohnung: Mitarbeitende, Gäste, Stakeholder. NULL bedeutet für alle zugänglich.';
