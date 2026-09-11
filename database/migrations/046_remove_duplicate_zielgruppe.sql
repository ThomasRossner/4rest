-- Remove duplicate values from zielgruppe arrays in tasks and rewards
-- This ensures each zielgruppe value appears only once per task/reward

-- Step 1: Remove duplicates from tasks.zielgruppe arrays
UPDATE tasks
SET zielgruppe = (
  SELECT array_agg(DISTINCT elem ORDER BY elem)
  FROM unnest(zielgruppe) AS elem
)
WHERE array_length(zielgruppe, 1) > array_length(array(SELECT DISTINCT unnest(zielgruppe)), 1);

-- Step 2: Remove duplicates from rewards.zielgruppe arrays
UPDATE rewards
SET zielgruppe = (
  SELECT array_agg(DISTINCT elem ORDER BY elem)
  FROM unnest(zielgruppe) AS elem
)
WHERE array_length(zielgruppe, 1) > array_length(array(SELECT DISTINCT unnest(zielgruppe)), 1);

-- Alternative approach: Update all rows to ensure no duplicates (safer)
-- This will update all rows, but only change those with duplicates
UPDATE tasks
SET zielgruppe = (
  SELECT array_agg(DISTINCT elem ORDER BY elem)
  FROM unnest(zielgruppe) AS elem
)
WHERE EXISTS (
  SELECT 1
  FROM unnest(zielgruppe) AS elem
  GROUP BY elem
  HAVING COUNT(*) > 1
);

UPDATE rewards
SET zielgruppe = (
  SELECT array_agg(DISTINCT elem ORDER BY elem)
  FROM unnest(zielgruppe) AS elem
)
WHERE EXISTS (
  SELECT 1
  FROM unnest(zielgruppe) AS elem
  GROUP BY elem
  HAVING COUNT(*) > 1
);
