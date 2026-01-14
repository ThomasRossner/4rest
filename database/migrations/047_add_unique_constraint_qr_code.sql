-- Add UNIQUE constraint on qr_code to prevent duplicate QR code tasks
-- This ensures that each QR code can only be used once across all tasks

-- First, remove any duplicate QR codes (keep the oldest one based on created_at)
DELETE FROM tasks t1
WHERE t1.qr_code IS NOT NULL
  AND t1.id NOT IN (
    SELECT id
    FROM (
      SELECT id, ROW_NUMBER() OVER (PARTITION BY qr_code ORDER BY created_at ASC) as rn
      FROM tasks
      WHERE qr_code IS NOT NULL
    ) ranked
    WHERE rn = 1
  );

-- Add UNIQUE constraint on qr_code (only for non-null values)
CREATE UNIQUE INDEX IF NOT EXISTS idx_tasks_qr_code_unique 
ON tasks(qr_code) 
WHERE qr_code IS NOT NULL;

COMMENT ON INDEX idx_tasks_qr_code_unique IS 'Ensures that each QR code can only be used once across all tasks';
