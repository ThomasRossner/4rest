-- Add start_date to contests table
ALTER TABLE contests
  ADD COLUMN IF NOT EXISTS start_date TIMESTAMP;

-- Update existing contests: set start_date to created_at if not set
UPDATE contests
  SET start_date = created_at
  WHERE start_date IS NULL;

-- Make start_date NOT NULL after setting defaults
ALTER TABLE contests
  ALTER COLUMN start_date SET NOT NULL;

