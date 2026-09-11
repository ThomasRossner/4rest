-- Remove 'Stakeholder' from all zielgruppe arrays in tasks and rewards
-- The 'Stakeholder' role no longer exists

-- Step 1: Remove 'Stakeholder' from tasks.zielgruppe arrays
UPDATE tasks
SET zielgruppe = (
  SELECT array_agg(elem)
  FROM unnest(zielgruppe) AS elem
  WHERE elem != 'Stakeholder'::task_zielgruppe_enum
)
WHERE 'Stakeholder' = ANY(zielgruppe);

-- Step 2: Remove 'Stakeholder' from rewards.zielgruppe arrays
UPDATE rewards
SET zielgruppe = (
  SELECT array_agg(elem)
  FROM unnest(zielgruppe) AS elem
  WHERE elem != 'Stakeholder'::reward_zielgruppe_enum
)
WHERE 'Stakeholder' = ANY(zielgruppe);

-- Step 3: Delete task_parameters entry for 'Stakeholder'
DELETE FROM task_parameters
WHERE parameter_type = 'zielgruppe' AND value = 'Stakeholder';

-- Step 4: Delete reward_parameters entry for 'Stakeholder' if it exists
DELETE FROM reward_parameters
WHERE parameter_type = 'zielgruppe' AND value = 'Stakeholder';

-- Note: We keep 'Stakeholder' in the enum type for now to avoid breaking existing data
-- If you want to completely remove it from the enum, you would need to:
-- 1. Ensure no data uses it (done above)
-- 2. Drop and recreate the enum type (more complex, requires dropping columns first)
