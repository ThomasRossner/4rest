-- Create parameter tables for dynamic dropdown values
-- Tasks: type, category, difficulty, time_required, location_tool
-- Rewards: reward_art, kategorie, kosten

-- Task parameters table
CREATE TABLE IF NOT EXISTS task_parameters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parameter_type VARCHAR(50) NOT NULL, -- 'type', 'category', 'difficulty', 'time_required', 'location_tool'
  value VARCHAR(255) NOT NULL,
  display_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(parameter_type, value)
);

-- Reward parameters table
CREATE TABLE IF NOT EXISTS reward_parameters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parameter_type VARCHAR(50) NOT NULL, -- 'reward_art', 'kategorie', 'kosten'
  value VARCHAR(255) NOT NULL,
  display_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(parameter_type, value)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_task_parameters_type ON task_parameters(parameter_type);
CREATE INDEX IF NOT EXISTS idx_task_parameters_active ON task_parameters(active) WHERE active = TRUE;
CREATE INDEX IF NOT EXISTS idx_reward_parameters_type ON reward_parameters(parameter_type);
CREATE INDEX IF NOT EXISTS idx_reward_parameters_active ON reward_parameters(active) WHERE active = TRUE;

-- Add comments
COMMENT ON TABLE task_parameters IS 'Dynamic parameter values for task dropdowns';
COMMENT ON TABLE reward_parameters IS 'Dynamic parameter values for reward dropdowns';
COMMENT ON COLUMN task_parameters.parameter_type IS 'Type of parameter: type, category, difficulty, time_required, location_tool';
COMMENT ON COLUMN reward_parameters.parameter_type IS 'Type of parameter: reward_art, kategorie, kosten';

-- Insert default values for tasks
INSERT INTO task_parameters (parameter_type, value, display_order) VALUES
  ('type', 'video', 1),
  ('type', 'quiz', 2),
  ('type', 'article_quiz', 3),
  ('type', 'survey', 4),
  ('type', 'qr', 5),
  ('type', 'photo', 6),
  ('type', 'visit_location', 7),
  ('category', 'Kommunikation & Netzwerke', 1),
  ('category', 'Mensch & soziales Umfeld', 2),
  ('category', 'Natur & Umweltschutz', 3),
  ('category', 'Ressourcenverbrauch & Materialeinsatz', 4),
  ('difficulty', 'sehr einfach', 1),
  ('difficulty', 'einfach', 2),
  ('difficulty', 'mittel', 3),
  ('difficulty', 'schwer', 4),
  ('difficulty', 'sehr schwer', 5),
  ('time_required', '1-3 Min', 1),
  ('time_required', '3-10 Min', 2),
  ('time_required', '10-30 Min', 3),
  ('time_required', '30-60 Min', 4),
  ('time_required', '60+ Min', 5),
  ('location_tool', 'Umgebung', 1),
  ('location_tool', 'Hotel', 2),
  ('location_tool', 'egal', 3),
  ('location_tool', 'Smartphone/PC', 4)
ON CONFLICT (parameter_type, value) DO NOTHING;

-- Insert default values for rewards
INSERT INTO reward_parameters (parameter_type, value, display_order) VALUES
  ('reward_art', 'Rabatt', 1),
  ('reward_art', 'Erlebnis', 2),
  ('reward_art', 'Add-on', 3),
  ('reward_art', 'physisches Geschenk', 4),
  ('kategorie', 'Hotel', 1),
  ('kategorie', 'nicht Hotel', 2),
  ('kategorie', 'Online', 3),
  ('kosten', 'niedrig', 1),
  ('kosten', 'mittel', 2),
  ('kosten', 'hoch', 3)
ON CONFLICT (parameter_type, value) DO NOTHING;

