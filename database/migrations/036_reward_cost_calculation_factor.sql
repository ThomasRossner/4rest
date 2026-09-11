-- Add reward cost calculation factor
-- This factor is used to calculate reward costs: kosten_weight * factor

INSERT INTO system_config (config_key, config_value, description)
VALUES ('reward_cost_calculation_factor', '1.0', 'Factor for calculating reward costs: kosten_weight * factor')
ON CONFLICT (config_key) DO NOTHING;
