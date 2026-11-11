/**
 * Create multiple test tasks for a specific user
 */
export declare function createBulkTasksForUser(userEmail: string, count?: number): Promise<{
    taskIds: string[];
    created: number;
}>;
/**
 * Complete multiple tasks for a specific user
 */
export declare function completeBulkTasksForUser(userEmail: string, count?: number): Promise<{
    completed: number;
    taskIds: string[];
}>;
/**
 * Delete user tasks and adjust points
 */
export declare function deleteUserTasksAndAdjustPoints(userEmail: string, taskCount: number, pointsToRemove: number): Promise<{
    deletedTasks: number;
    pointsRemoved: number;
}>;
/**
 * Create a survey task with random participant responses
 */
export declare function createSurveyWithParticipants(surveyData: any, participantCount: number): Promise<{
    taskId: string;
    participantsCreated: number;
    responsesCreated: number;
}>;
/**
 * Simulate time-based activity by creating task completions with custom dates
 */
export declare function simulateTimeBasedActivity(userEmail: string, taskCount: number, startDate: Date, endDate: Date, distribution?: 'uniform' | 'random'): Promise<{
    completed: number;
    taskIds: string[];
    dateRange: {
        start: string;
        end: string;
    };
}>;
/**
 * Simulate reward redemption for a user
 */
export declare function simulateRewardRedemption(userEmail: string, rewardId?: string, autoVerify?: boolean): Promise<{
    redemption: any;
    pointsBefore: number;
    pointsAfter: number;
}>;
/**
 * Reset user data (tasks, trees, points, redemptions)
 */
export declare function resetUserData(userEmail: string, resetOptions: {
    tasks?: boolean;
    trees?: boolean;
    points?: boolean;
    redemptions?: boolean;
}): Promise<{
    tasksDeleted: number;
    treesDeleted: number;
    pointsReset: boolean;
    redemptionsDeleted: number;
}>;
/**
 * Generate statistics data over a time period
 */
export declare function generateStatisticsData(startDate: Date, endDate: Date, targetUserCount: number, tasksPerUserMin: number, tasksPerUserMax: number, co2PerTaskMin: number, co2PerTaskMax: number): Promise<{
    usersCreated: number;
    tasksCreated: number;
    completionsCreated: number;
    treesPlanted: number;
    totalPointsAwarded: number;
    totalCo2Saved: number;
}>;
/**
 * Simulate forest visits for the past N days
 * Each visit adds 1 growth point to all user's trees
 */
export declare function simulateForestVisits(userEmail: string, days: number): Promise<{
    visitsCreated: number;
    treesUpdated: number;
    daysSimulated: number;
}>;
/**
 * Recalculate tree sizes based on current growth points and stage
 * This fixes trees that may have incorrect sizes due to bugs or manual database changes
 */
export declare function recalculateTreeSizes(userEmail: string): Promise<{
    treesUpdated: number;
}>;
//# sourceMappingURL=debug.service.d.ts.map