export interface Statistics {
    totalCo2Saved: number;
    totalTrees: number;
    activeUsers: number;
    tasksCompleted: number;
    averagePointsPerUser: number;
    co2SavedPerTask: number;
    teamProgress?: any;
    dailyStats?: any[];
}
/**
 * Get comprehensive statistics
 */
export declare function getStatisticsService(): Promise<Statistics>;
/**
 * Calculate CO₂ savings for a specific task
 */
export declare function calculateCO2Savings(taskId: string): Promise<number>;
/**
 * Get user-specific statistics
 */
export declare function getUserStatistics(userId: string): Promise<any>;
/**
 * Get statistics by time period
 */
export declare function getStatisticsByPeriod(startDate: Date, endDate: Date): Promise<Statistics>;
//# sourceMappingURL=statistics.service.d.ts.map