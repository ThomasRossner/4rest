import { createBulkTasksForUser, completeBulkTasksForUser, deleteUserTasksAndAdjustPoints, createSurveyWithParticipants, simulateTimeBasedActivity, simulateRewardRedemption, resetUserData, generateStatisticsData, simulateForestVisits, recalculateTreeSizes, } from '../services/debug.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { logger } from '../utils/logger.js';
export const createBulkTasks = asyncHandler(async (req, res) => {
    const { userEmail, count } = req.body;
    if (!userEmail || typeof userEmail !== 'string') {
        return res.status(400).json({ error: 'userEmail is required' });
    }
    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }
    const taskCount = count && typeof count === 'number' ? count : 20;
    const authReq = req;
    logger.info('DEBUG_CREATE_BULK_TASKS', `Creating ${taskCount} tasks for user ${userEmail}`, {
        userId: authReq.user?.id,
        userEmail: authReq.user?.email,
        details: { targetUserEmail: userEmail, taskCount },
    });
    const result = await createBulkTasksForUser(userEmail, taskCount);
    logger.info('DEBUG_CREATE_BULK_TASKS', `Successfully created ${result.created} tasks`, {
        userId: authReq.user?.id,
        userEmail: authReq.user?.email,
        details: { targetUserEmail: userEmail, created: result.created },
    });
    res.json({
        success: true,
        message: `Created ${result.created} tasks for user ${userEmail}`,
        taskIds: result.taskIds,
        created: result.created,
    });
});
export const completeBulkTasks = asyncHandler(async (req, res) => {
    const { userEmail, count } = req.body;
    if (!userEmail || typeof userEmail !== 'string') {
        return res.status(400).json({ error: 'userEmail is required' });
    }
    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }
    const taskCount = count && typeof count === 'number' ? count : 20;
    const authReq = req;
    logger.info('DEBUG_COMPLETE_BULK_TASKS', `Completing ${taskCount} tasks for user ${userEmail}`, {
        userId: authReq.user?.id,
        userEmail: authReq.user?.email,
        details: { targetUserEmail: userEmail, taskCount },
    });
    const result = await completeBulkTasksForUser(userEmail, taskCount);
    const resultAny = result;
    if (resultAny.errors && resultAny.errors.length > 0) {
        logger.warn('DEBUG_COMPLETE_BULK_TASKS', `Completed ${result.completed} tasks with ${resultAny.errors.length} errors`, {
            userId: authReq.user?.id,
            userEmail: authReq.user?.email,
            details: { targetUserEmail: userEmail, completed: result.completed, errors: resultAny.errors },
        });
    }
    else {
        logger.info('DEBUG_COMPLETE_BULK_TASKS', `Successfully completed ${result.completed} tasks`, {
            userId: authReq.user?.id,
            userEmail: authReq.user?.email,
            details: { targetUserEmail: userEmail, completed: result.completed },
        });
    }
    res.json({
        success: true,
        message: `Completed ${result.completed} tasks for user ${userEmail}${resultAny.errors && resultAny.errors.length > 0 ? ` (${resultAny.errors.length} errors occurred)` : ''}`,
        taskIds: result.taskIds,
        completed: result.completed,
        errors: resultAny.errors,
    });
});
export const deleteUserData = asyncHandler(async (req, res) => {
    const { userEmail, taskCount, pointsToRemove } = req.body;
    if (!userEmail || typeof userEmail !== 'string') {
        return res.status(400).json({ error: 'userEmail is required' });
    }
    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }
    if (typeof taskCount !== 'number' || taskCount < 0) {
        return res.status(400).json({ error: 'taskCount must be a non-negative number' });
    }
    if (typeof pointsToRemove !== 'number' || pointsToRemove < 0) {
        return res.status(400).json({ error: 'pointsToRemove must be a non-negative number' });
    }
    const authReq = req;
    logger.warn('DEBUG_DELETE_USER_DATA', `Deleting ${taskCount} tasks and ${pointsToRemove} points for user ${userEmail}`, {
        userId: authReq.user?.id,
        userEmail: authReq.user?.email,
        details: { targetUserEmail: userEmail, taskCount, pointsToRemove },
    });
    const result = await deleteUserTasksAndAdjustPoints(userEmail, taskCount, pointsToRemove);
    logger.warn('DEBUG_DELETE_USER_DATA', `Successfully deleted ${result.deletedTasks} tasks and ${result.pointsRemoved} points`, {
        userId: authReq.user?.id,
        userEmail: authReq.user?.email,
        details: { targetUserEmail: userEmail, deletedTasks: result.deletedTasks, pointsRemoved: result.pointsRemoved },
    });
    res.json({
        success: true,
        message: `Deleted ${result.deletedTasks} tasks and removed ${result.pointsRemoved} points for user ${userEmail}`,
        deletedTasks: result.deletedTasks,
        pointsRemoved: result.pointsRemoved,
    });
});
export const createSurveyWithRandomParticipants = asyncHandler(async (req, res) => {
    const { surveyData, participantCount } = req.body;
    if (!surveyData) {
        return res.status(400).json({ error: 'surveyData is required' });
    }
    if (typeof participantCount !== 'number' || participantCount < 1) {
        return res.status(400).json({ error: 'participantCount must be a positive number' });
    }
    const authReq = req;
    logger.info('DEBUG_CREATE_SURVEY', `Creating survey with ${participantCount} participants`, {
        userId: authReq.user?.id,
        userEmail: authReq.user?.email,
        details: { surveyTitle: surveyData.title, participantCount },
    });
    const result = await createSurveyWithParticipants(surveyData, participantCount);
    logger.info('DEBUG_CREATE_SURVEY', `Successfully created survey with ${result.responsesCreated} responses`, {
        userId: authReq.user?.id,
        userEmail: authReq.user?.email,
        details: { taskId: result.taskId, participantsCreated: result.participantsCreated, responsesCreated: result.responsesCreated },
    });
    res.json({
        success: true,
        message: `Created survey with ${result.responsesCreated} responses from ${result.participantsCreated} participants`,
        taskId: result.taskId,
        participantsCreated: result.participantsCreated,
        responsesCreated: result.responsesCreated,
    });
});
export const simulateTimeActivity = asyncHandler(async (req, res) => {
    const { userEmail, taskCount, startDate, endDate, distribution } = req.body;
    if (!userEmail || typeof userEmail !== 'string') {
        return res.status(400).json({ error: 'userEmail is required' });
    }
    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }
    if (typeof taskCount !== 'number' || taskCount < 1) {
        return res.status(400).json({ error: 'taskCount must be a positive number' });
    }
    if (!startDate || !endDate) {
        return res.status(400).json({ error: 'startDate and endDate are required' });
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    const dist = distribution === 'random' ? 'random' : 'uniform';
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ error: 'Invalid date format' });
    }
    const authReq = req;
    logger.info('DEBUG_SIMULATE_TIME_ACTIVITY', `Simulating ${taskCount} task completions for user ${userEmail}`, {
        userId: authReq.user?.id,
        userEmail: authReq.user?.email,
        details: { targetUserEmail: userEmail, taskCount, startDate: start.toISOString(), endDate: end.toISOString(), distribution: dist },
    });
    const result = await simulateTimeBasedActivity(userEmail, taskCount, start, end, dist);
    logger.info('DEBUG_SIMULATE_TIME_ACTIVITY', `Successfully simulated ${result.completed} task completions`, {
        userId: authReq.user?.id,
        userEmail: authReq.user?.email,
        details: { targetUserEmail: userEmail, completed: result.completed },
    });
    res.json({
        success: true,
        message: `Created ${result.completed} task completions for user ${userEmail} across the date range`,
        ...result,
    });
});
export const simulateRewardRedemptionController = asyncHandler(async (req, res) => {
    const { userEmail, rewardId, autoVerify } = req.body;
    if (!userEmail || typeof userEmail !== 'string') {
        return res.status(400).json({ error: 'userEmail is required' });
    }
    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }
    const authReq = req;
    logger.info('DEBUG_SIMULATE_REWARD_REDEMPTION', `Simulating reward redemption for user ${userEmail}`, {
        userId: authReq.user?.id,
        userEmail: authReq.user?.email,
        details: { targetUserEmail: userEmail, rewardId, autoVerify },
    });
    const result = await simulateRewardRedemption(userEmail, rewardId || undefined, autoVerify === true);
    logger.info('DEBUG_SIMULATE_REWARD_REDEMPTION', `Successfully simulated reward redemption`, {
        userId: authReq.user?.id,
        userEmail: authReq.user?.email,
        details: { targetUserEmail: userEmail, redemptionId: result.redemption?.id, pointsBefore: result.pointsBefore, pointsAfter: result.pointsAfter },
    });
    res.json({
        success: true,
        message: `Reward redemption ${autoVerify ? 'created and verified' : 'created'} for user ${userEmail}`,
        ...result,
    });
});
export const resetUserDataController = asyncHandler(async (req, res) => {
    const { userEmail, resetOptions } = req.body;
    if (!userEmail || typeof userEmail !== 'string') {
        return res.status(400).json({ error: 'userEmail is required' });
    }
    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }
    const options = resetOptions || {};
    const authReq = req;
    logger.error('DEBUG_RESET_USER_DATA', `RESETTING USER DATA for ${userEmail}`, {
        userId: authReq.user?.id,
        userEmail: authReq.user?.email,
        details: {
            targetUserEmail: userEmail,
            resetOptions: {
                tasks: options.tasks === true,
                trees: options.trees === true,
                points: options.points === true,
                redemptions: options.redemptions === true,
            },
        },
    });
    const result = await resetUserData(userEmail, {
        tasks: options.tasks === true,
        trees: options.trees === true,
        points: options.points === true,
        redemptions: options.redemptions === true,
    });
    logger.error('DEBUG_RESET_USER_DATA', `User data reset completed`, {
        userId: authReq.user?.id,
        userEmail: authReq.user?.email,
        details: {
            targetUserEmail: userEmail,
            tasksDeleted: result.tasksDeleted,
            treesDeleted: result.treesDeleted,
            pointsReset: result.pointsReset,
            redemptionsDeleted: result.redemptionsDeleted,
        },
    });
    res.json({
        success: true,
        message: `User data reset completed for ${userEmail}`,
        ...result,
    });
});
export const generateStatisticsDataController = asyncHandler(async (req, res) => {
    const { startDate, endDate, targetUserCount, tasksPerUserMin, tasksPerUserMax, co2PerTaskMin, co2PerTaskMax } = req.body;
    if (!startDate || !endDate) {
        return res.status(400).json({ error: 'startDate and endDate are required' });
    }
    if (typeof targetUserCount !== 'number' || targetUserCount < 1) {
        return res.status(400).json({ error: 'targetUserCount must be a positive number' });
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ error: 'Invalid date format' });
    }
    const tasksMin = typeof tasksPerUserMin === 'number' ? tasksPerUserMin : 5;
    const tasksMax = typeof tasksPerUserMax === 'number' ? tasksPerUserMax : 15;
    const co2Min = typeof co2PerTaskMin === 'number' ? co2PerTaskMin : 0.1;
    const co2Max = typeof co2PerTaskMax === 'number' ? co2PerTaskMax : 5.0;
    // Validate min <= max for ranges
    if (tasksMin > tasksMax) {
        return res.status(400).json({ error: 'tasksPerUserMin must be less than or equal to tasksPerUserMax' });
    }
    if (co2Min > co2Max) {
        return res.status(400).json({ error: 'co2PerTaskMin must be less than or equal to co2PerTaskMax' });
    }
    const authReq = req;
    logger.info('DEBUG_GENERATE_STATISTICS', `Generating statistics data`, {
        userId: authReq.user?.id,
        userEmail: authReq.user?.email,
        details: {
            startDate: start.toISOString(),
            endDate: end.toISOString(),
            targetUserCount,
            tasksPerUserMin: tasksMin,
            tasksPerUserMax: tasksMax,
            co2PerTaskMin: co2Min,
            co2PerTaskMax: co2Max,
        },
    });
    const result = await generateStatisticsData(start, end, targetUserCount, tasksMin, tasksMax, co2Min, co2Max);
    logger.info('DEBUG_GENERATE_STATISTICS', `Statistics data generated successfully`, {
        userId: authReq.user?.id,
        userEmail: authReq.user?.email,
        details: {
            usersCreated: result.usersCreated,
            tasksCreated: result.tasksCreated,
            completionsCreated: result.completionsCreated,
            treesPlanted: result.treesPlanted,
            totalPointsAwarded: result.totalPointsAwarded,
            totalCo2Saved: result.totalCo2Saved,
        },
    });
    res.json({
        success: true,
        message: `Generated statistics data: ${result.completionsCreated} completions, ${result.treesPlanted} trees, ${result.totalCo2Saved.toFixed(2)} kg CO2 saved`,
        ...result,
    });
});
export const getDebugLogs = asyncHandler(async (req, res) => {
    const { limit, level, operation } = req.query;
    let limitNum = 100;
    if (limit && typeof limit === 'string') {
        const parsed = parseInt(limit, 10);
        if (!isNaN(parsed) && parsed > 0) {
            limitNum = parsed;
        }
    }
    const levelFilter = level && typeof level === 'string' && ['info', 'warn', 'error'].includes(level)
        ? level
        : undefined;
    const operationFilter = operation && typeof operation === 'string' ? operation : undefined;
    const logs = logger.getLogs(limitNum, levelFilter, operationFilter);
    res.json({
        success: true,
        logs,
        count: logs.length,
    });
});
export const simulateForestVisitsController = asyncHandler(async (req, res) => {
    const { userEmail, days } = req.body;
    const authReq = req;
    if (!userEmail || typeof userEmail !== 'string') {
        return res.status(400).json({ error: 'userEmail is required' });
    }
    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }
    if (!days || typeof days !== 'number' || days < 1 || days > 365) {
        return res.status(400).json({ error: 'days must be a number between 1 and 365' });
    }
    logger.info('DEBUG_SIMULATE_FOREST_VISITS', `Simulating ${days} days of forest visits for user ${userEmail}`, {
        userId: authReq.user?.id,
        userEmail: authReq.user?.email,
        details: { targetUserEmail: userEmail, days },
    });
    const result = await simulateForestVisits(userEmail, days);
    logger.info('DEBUG_SIMULATE_FOREST_VISITS', `Successfully simulated ${result.visitsCreated} visits`, {
        userId: authReq.user?.id,
        userEmail: authReq.user?.email,
        details: {
            targetUserEmail: userEmail,
            visitsCreated: result.visitsCreated,
            treesUpdated: result.treesUpdated,
            daysSimulated: result.daysSimulated,
        },
    });
    res.json({
        success: true,
        message: `Successfully simulated ${result.visitsCreated} forest visits. ${result.treesUpdated} tree updates performed.`,
        ...result,
    });
});
export const recalculateTreeSizesController = asyncHandler(async (req, res) => {
    const { userEmail } = req.body;
    const authReq = req;
    if (!userEmail || typeof userEmail !== 'string') {
        return res.status(400).json({ error: 'userEmail is required' });
    }
    logger.info('DEBUG_RECALCULATE_TREE_SIZES', `Recalculating tree sizes for user ${userEmail}`, {
        userId: authReq.user?.id,
        userEmail: authReq.user?.email,
        details: { targetUserEmail: userEmail },
    });
    const result = await recalculateTreeSizes(userEmail);
    logger.info('DEBUG_RECALCULATE_TREE_SIZES', `Successfully recalculated ${result.treesUpdated} tree sizes`, {
        userId: authReq.user?.id,
        userEmail: authReq.user?.email,
        details: {
            targetUserEmail: userEmail,
            treesUpdated: result.treesUpdated,
        },
    });
    res.json({
        success: true,
        message: `Successfully recalculated sizes for ${result.treesUpdated} trees.`,
        ...result,
    });
});
export const clearDebugLogs = asyncHandler(async (req, res) => {
    const authReq = req;
    logger.warn('DEBUG_CLEAR_LOGS', 'Debug logs cleared', {
        userId: authReq.user?.id,
        userEmail: authReq.user?.email,
    });
    logger.clearLogs();
    res.json({
        success: true,
        message: 'Debug logs cleared',
    });
});
//# sourceMappingURL=debug.controller.js.map