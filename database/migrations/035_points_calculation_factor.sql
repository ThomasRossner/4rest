-- Add system configuration table for points calculation factor
-- This factor is used to calculate task points: (difficulty_weight * time_required_weight) / factor

CREATE TABLE IF NOT EXISTS system_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key VARCHAR(100) UNIQUE NOT NULL,
  config_value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default points calculation factor (default: 1.0)
INSERT INTO system_config (config_key, config_value, description)
VALUES ('points_calculation_factor', '1.0', 'Factor for calculating task points: (difficulty_weight * time_required_weight) * factor')
ON CONFLICT (config_key) DO NOTHING;

-- Add index
CREATE INDEX IF NOT EXISTS idx_system_config_key ON system_config(config_key);

-- Add comment
COMMENT ON TABLE system_config IS 'System-wide configuration values';
COMMENT ON COLUMN system_config.config_key IS 'Unique configuration key';
COMMENT ON COLUMN system_config.config_value IS 'Configuration value as text';
COMMENT ON COLUMN system_config.description IS 'Human-readable description of this configuration';
