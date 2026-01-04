export declare function addUserPoints(userId: string, points: number): Promise<void>;
export declare function plantTree(userId: string, taskId: string): Promise<string>;
/**
 * Add growth points to a random existing tree (not newly planted ones)
 * Used when user completes tasks - task points go to random tree growth
 */
export declare function addGrowthPointsToRandomTree(userId: string, points: number, excludeTreeId?: string): Promise<void>;
/**
 * Process daily forest visit - adds 1 growth point to all user's trees
 * Returns true if visit was successful (first visit today), false if already visited
 */
export declare function processDailyForestVisit(userId: string): Promise<boolean>;
/**
 * Check if user has visited forest today
 */
export declare function hasVisitedForestToday(userId: string): Promise<boolean>;
//# sourceMappingURL=gamification.service.d.ts.map