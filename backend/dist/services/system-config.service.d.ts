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
export declare function getSystemConfig(key: string): Promise<string | null>;
/**
 * Get a system configuration value as a number
 */
export declare function getSystemConfigNumber(key: string, defaultValue?: number): Promise<number>;
/**
 * Set a system configuration value
 */
export declare function setSystemConfig(key: string, value: string, description?: string): Promise<SystemConfig>;
/**
 * Get all system configurations
 */
export declare function getAllSystemConfigs(): Promise<SystemConfig[]>;
/**
 * Get the points calculation factor
 */
export declare function getPointsCalculationFactor(): Promise<number>;
/**
 * Get the reward cost calculation factor
 */
export declare function getRewardCostCalculationFactor(): Promise<number>;
//# sourceMappingURL=system-config.service.d.ts.map