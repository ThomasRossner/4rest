-- Add weight column to parameter tables
-- Weight is used for calculations and sorting, separate from display_order
-- For tasks: difficulty, time_required
-- For rewards: kosten

-- Add weight column to task_parameters
ALTER TABLE task_parameters
  ADD COLUMN IF NOT EXISTS weight DECIMAL(10, 2) DEFAULT 0;

-- Add weight column to reward_parameters
ALTER TABLE reward_parameters
  ADD COLUMN IF NOT EXISTS weight DECIMAL(10, 2) DEFAULT 0;

-- Add comments
COMMENT ON COLUMN task_parameters.weight IS 'Weight for calculations and sorting (separate from display_order). Used for difficulty and time_required parameters.';
COMMENT ON COLUMN reward_parameters.weight IS 'Weight for calculations and sorting (separate from display_order). Used for kosten parameters.';

-- Set default weights for difficulty (1-5)
UPDATE task_parameters
SET weight = display_order
WHERE parameter_type = 'difficulty'
AND weight = 0;

-- Set default weights for time_required (1-5)
UPDATE task_parameters
SET weight = display_order
WHERE parameter_type = 'time_required'
AND weight = 0;

-- Set default weights for kosten (1-3)
UPDATE reward_parameters
SET weight = display_order
WHERE parameter_type = 'kosten'
AND weight = 0;

-- Create index for efficient queries by weight
CREATE INDEX IF NOT EXISTS idx_task_parameters_weight ON task_parameters(parameter_type, weight) 
WHERE parameter_type IN ('difficulty', 'time_required');

CREATE INDEX IF NOT EXISTS idx_reward_parameters_weight ON reward_parameters(parameter_type, weight) 
WHERE parameter_type = 'kosten';
