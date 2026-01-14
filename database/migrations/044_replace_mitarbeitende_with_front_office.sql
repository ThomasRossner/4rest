-- Replace all occurrences of 'Mitarbeitende' with 'Front Office' in zielgruppe arrays
-- This aligns the data with the new naming convention

-- Step 1: Update tasks.zielgruppe
-- Replace 'Mitarbeitende' with 'Front Office' in all task zielgruppe arrays
UPDATE tasks
SET zielgruppe = (
  SELECT array_agg(
    CASE 
      WHEN elem = 'Mitarbeitende'::task_zielgruppe_enum THEN 'Front Office'::task_zielgruppe_enum
      ELSE elem
    END
  )
  FROM unnest(zielgruppe) AS elem
)
WHERE 'Mitarbeitende' = ANY(zielgruppe);

-- Step 2: Update rewards.zielgruppe
-- Replace 'Mitarbeitende' with 'Front Office' in all reward zielgruppe arrays
UPDATE rewards
SET zielgruppe = (
  SELECT array_agg(
    CASE 
      WHEN elem = 'Mitarbeitende'::reward_zielgruppe_enum THEN 'Front Office'::reward_zielgruppe_enum
      ELSE elem
    END
  )
  FROM unnest(zielgruppe) AS elem
)
WHERE 'Mitarbeitende' = ANY(zielgruppe);

-- Step 3: Update task_parameters if they reference 'Mitarbeitende'
UPDATE task_parameters
SET value = 'Front Office'
WHERE parameter_type = 'zielgruppe' AND value = 'Mitarbeitende';

-- Step 4: Update reward_parameters if they reference 'Mitarbeitende'
UPDATE reward_parameters
SET value = 'Front Office'
WHERE parameter_type = 'zielgruppe' AND value = 'Mitarbeitende';
