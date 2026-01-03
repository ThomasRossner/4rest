import { getPool } from '../database/connection.js';

export interface SystemConfig {
  id: string;
  config_key: string;
  config_value: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Get a system configuration value by key
 */
export async function getSystemConfig(key: string): Promise<string | null> {
  const db = getPool();
  const result = await db.query(
    'SELECT config_value FROM system_config WHERE config_key = $1',
    [key]
  );
  return result.rows[0]?.config_value ?? null;
}

/**
 * Get a system configuration value as a number
 */
export async function getSystemConfigNumber(key: string, defaultValue: number = 0): Promise<number> {
  const value = await getSystemConfig(key);
  if (!value) return defaultValue;
  const num = Number.parseFloat(value);
  return Number.isNaN(num) ? defaultValue : num;
}

/**
 * Set a system configuration value
 */
export async function setSystemConfig(key: string, value: string, description?: string): Promise<SystemConfig> {
  const db = getPool();
  const result = await db.query(
    `INSERT INTO system_config (config_key, config_value, description, updated_at)
     VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
     ON CONFLICT (config_key) 
     DO UPDATE SET config_value = EXCLUDED.config_value, 
                   description = COALESCE(EXCLUDED.description, system_config.description),
                   updated_at = CURRENT_TIMESTAMP
     RETURNING *`,
    [key, value, description ?? null]
  );
  return result.rows[0];
}

/**
 * Get all system configurations
 */
export async function getAllSystemConfigs(): Promise<SystemConfig[]> {
  const db = getPool();
  const result = await db.query('SELECT * FROM system_config ORDER BY config_key');
  return result.rows;
}

/**
 * Get the points calculation factor
 */
export async function getPointsCalculationFactor(): Promise<number> {
  return await getSystemConfigNumber('points_calculation_factor', 1.0);
}

/**
 * Get the reward cost calculation factor
 */
export async function getRewardCostCalculationFactor(): Promise<number> {
  return await getSystemConfigNumber('reward_cost_calculation_factor', 1.0);
}
