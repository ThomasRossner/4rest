-- Add tree growth system fields
-- Growth points track progress through stages: sapling (1-20), young (21-50), mature (51-100)
-- Size is randomized per stage and stored to maintain consistency

ALTER TABLE forest_trees 
  ADD COLUMN IF NOT EXISTS growth_points INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS stage VARCHAR(20) DEFAULT 'sapling',
  ADD COLUMN IF NOT EXISTS size DECIMAL(5, 3) DEFAULT 0.035;

-- Create index for efficient querying by stage
CREATE INDEX IF NOT EXISTS idx_forest_trees_stage ON forest_trees(stage);
CREATE INDEX IF NOT EXISTS idx_forest_trees_growth_points ON forest_trees(growth_points);

-- Update existing trees to have initial growth points (1 point = sapling stage)
UPDATE forest_trees SET growth_points = 1, stage = 'sapling', size = 0.035 WHERE growth_points IS NULL;

-- Create table to track daily forest visits (once per day per user)
CREATE TABLE IF NOT EXISTS daily_forest_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
    visited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, visit_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_forest_visits_user_date ON daily_forest_visits(user_id, visit_date);

