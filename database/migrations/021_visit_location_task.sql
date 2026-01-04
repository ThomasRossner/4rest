-- Add target location coordinates for visit_location task type
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS target_latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS target_longitude DECIMAL(11, 8);

-- Add index for location-based queries
CREATE INDEX IF NOT EXISTS idx_tasks_target_location ON tasks(target_latitude, target_longitude) 
WHERE target_latitude IS NOT NULL AND target_longitude IS NOT NULL;

