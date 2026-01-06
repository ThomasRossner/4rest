import { getPool } from '../database/connection.js';
import { getUserByEmail, createUser, getUserById } from './user.service.js';
import { createTask, completeTask, getAllTasks } from './task.service.js';
import { getLocations } from './location.service.js';
import { addUserPoints, plantTree, addGrowthPointsToRandomTree } from './gamification.service.js';
import { redeemRewardService, verifyQrCodeService, listRewardsForAdmin } from './reward.service.js';
/**
 * Create multiple test tasks for a specific user
 */
export async function createBulkTasksForUser(userEmail, count = 20) {
    const db = getPool();
    // Get user
    const user = await getUserByEmail(userEmail);
    if (!user) {
        throw new Error(`User with email ${userEmail} not found`);
    }
    // Get a location (prefer "Online" location, otherwise first available)
    const locations = await getLocations(false);
    if (locations.length === 0) {
        throw new Error('No locations available. Please create a location first.');
    }
    const location = locations.find(l => l.name === 'Online') || locations[0];
    // Points options
    const pointsOptions = [15, 20, 25];
    const taskIds = [];
    // Create tasks in a transaction
    await db.query('BEGIN');
    try {
        for (let i = 0; i < count; i++) {
            const points = pointsOptions[Math.floor(Math.random() * pointsOptions.length)];
            const task = await createTask({
                title: `Debug Test Task ${i + 1}`,
                description: `Automatically generated test task for debugging purposes`,
                type: 'quiz',
                points,
                location_id: location.id,
                active: true,
                allowed_roles: [user.role],
                allowed_user_types: [user.user_type],
                allowed_hotel_ids: [],
                quiz_questions: JSON.stringify([
                    {
                        question: 'This is a test question?',
                        options: ['Option A', 'Option B', 'Option C'],
                        correctAnswer: 'Option A'
                    }
                ])
            });
            taskIds.push(task.id);
        }
        await db.query('COMMIT');
    }
    catch (error) {
        await db.query('ROLLBACK');
        throw error;
    }
    return { taskIds, created: taskIds.length };
}
/**
 * Complete multiple tasks for a specific user
 */
export async function completeBulkTasksForUser(userEmail, count = 20) {
    const db = getPool();
    const user = await getUserByEmail(userEmail);
    if (!user) {
        throw new Error(`User with email ${userEmail} not found`);
    }
    // Get uncompleted tasks for this user
    // First try with audience filters (normal behavior)
    let allTasks = await getAllTasks({ limit: count * 2 }, // Get more to ensure we have enough
    user.id, { includeAll: false, includeInactive: false });
    // Filter to only uncompleted tasks
    let uncompletedTasks = allTasks.filter((task) => !task.completed);
    // If no tasks found with audience filters, try without filters (for debug purposes)
    if (uncompletedTasks.length === 0) {
        allTasks = await getAllTasks({ limit: count * 2 }, user.id, { includeAll: true, includeInactive: false });
        uncompletedTasks = allTasks.filter((task) => !task.completed);
    }
    // If still no tasks, create tasks for this user (like createBulkTasksForUser does)
    if (uncompletedTasks.length === 0) {
        const locations = await getLocations(false);
        if (locations.length === 0) {
            throw new Error('No locations available. Please create a location first.');
        }
        const location = locations.find(l => l.name === 'Online') || locations[0];
        const pointsOptions = [15, 20, 25];
        // Create tasks in a transaction
        await db.query('BEGIN');
        try {
            for (let i = 0; i < count; i++) {
                const points = pointsOptions[Math.floor(Math.random() * pointsOptions.length)];
                const task = await createTask({
                    title: `Debug Test Task ${i + 1}`,
                    description: `Automatically generated test task for debugging purposes`,
                    type: 'quiz',
                    points,
                    location_id: location.id,
                    active: true,
                    allowed_roles: [user.role],
                    allowed_user_types: [user.user_type],
                    allowed_hotel_ids: [],
                    quiz_questions: JSON.stringify([
                        {
                            question: 'This is a test question?',
                            options: ['Option A', 'Option B', 'Option C'],
                            correctAnswer: 'Option A'
                        }
                    ])
                });
                uncompletedTasks.push({ id: task.id, completed: false });
            }
            await db.query('COMMIT');
        }
        catch (error) {
            await db.query('ROLLBACK');
            throw error;
        }
    }
    const tasksToComplete = uncompletedTasks.slice(0, count);
    const taskIds = [];
    let completed = 0;
    const errors = [];
    for (const task of tasksToComplete) {
        try {
            // For quiz tasks, provide dummy answers to pass validation
            let completionData = {};
            if (task.type === 'quiz' && task.quiz_questions) {
                const questions = typeof task.quiz_questions === 'string'
                    ? JSON.parse(task.quiz_questions)
                    : task.quiz_questions;
                completionData.quiz_answers = questions.map((q, idx) => ({
                    questionIndex: idx,
                    answer: q.correctAnswer || q.options?.[0] || 'Option A'
                }));
            }
            await completeTask(task.id, user.id, completionData);
            taskIds.push(task.id);
            completed++;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            errors.push(`Task ${task.id} (${task.title}): ${errorMessage}`);
            // Continue to next task
        }
    }
    if (errors.length > 0 && completed === 0) {
        // If all tasks failed, throw an error with details
        throw new Error(`Failed to complete any tasks. Errors: ${errors.join('; ')}`);
    }
    return { completed, taskIds, errors: errors.length > 0 ? errors : undefined };
}
/**
 * Delete user tasks and adjust points
 */
export async function deleteUserTasksAndAdjustPoints(userEmail, taskCount, pointsToRemove) {
    const db = getPool();
    const user = await getUserByEmail(userEmail);
    if (!user) {
        throw new Error(`User with email ${userEmail} not found`);
    }
    await db.query('BEGIN');
    try {
        // Delete oldest user_tasks entries (only completed tasks)
        const deleteResult = await db.query(`DELETE FROM user_tasks 
       WHERE user_id = $1 
       AND id IN (
         SELECT id FROM user_tasks 
         WHERE user_id = $1 
         AND completed_at IS NOT NULL
         ORDER BY completed_at ASC 
         LIMIT $2
       )
       RETURNING id`, [user.id, taskCount]);
        const deletedTasks = deleteResult.rows.length;
        // Adjust user points (subtract, but don't go below 0)
        const newPoints = Math.max(0, user.points - pointsToRemove);
        await db.query('UPDATE users SET points = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [newPoints, user.id]);
        await db.query('COMMIT');
        return {
            deletedTasks,
            pointsRemoved: user.points - newPoints
        };
    }
    catch (error) {
        await db.query('ROLLBACK');
        throw error;
    }
}
/**
 * Create a survey task with random participant responses
 */
export async function createSurveyWithParticipants(surveyData, participantCount) {
    const db = getPool();
    // Get or create location
    const locations = await getLocations(false);
    if (locations.length === 0) {
        throw new Error('No locations available. Please create a location first.');
    }
    const location = locations.find(l => l.name === 'Online') || locations[0];
    // Create the survey task
    const surveyTask = await createTask({
        ...surveyData,
        type: 'survey',
        location_id: location.id,
        active: true
    });
    // Parse survey questions
    const questions = typeof surveyData.survey_questions === 'string'
        ? JSON.parse(surveyData.survey_questions)
        : surveyData.survey_questions || [];
    if (questions.length === 0) {
        throw new Error('Survey must have at least one question');
    }
    await db.query('BEGIN');
    try {
        let participantsCreated = 0;
        let responsesCreated = 0;
        // Create temporary users and responses
        for (let i = 0; i < participantCount; i++) {
            const email = `debug_survey_user_${i + 1}@test.local`;
            // Check if user already exists
            let user = await getUserByEmail(email);
            if (!user) {
                // Create temporary user
                user = await createUser({
                    email,
                    name: `Debug Survey User ${i + 1}`,
                    role: 'stakeholder',
                    user_type: 'explorer',
                    points: 0,
                    password_hash: null // No password for debug users
                });
                participantsCreated++;
            }
            // Generate random responses for each question
            const responses = [];
            for (const question of questions) {
                let answer;
                if (question.type === 'single_choice' && question.options) {
                    answer = question.options[Math.floor(Math.random() * question.options.length)];
                }
                else if (question.type === 'multiple_choice' && question.options) {
                    // Select 1-3 random options
                    const numSelections = Math.floor(Math.random() * 3) + 1;
                    const shuffled = [...question.options].sort(() => Math.random() - 0.5);
                    answer = shuffled.slice(0, numSelections);
                }
                else if (question.type === 'rating') {
                    const min = question.minRating || 1;
                    const max = question.maxRating || 5;
                    answer = Math.floor(Math.random() * (max - min + 1)) + min;
                }
                else if (question.type === 'text') {
                    const textOptions = [
                        'This is a test response',
                        'Random feedback text',
                        'Sample answer for debugging',
                        'Test response data',
                        'Debug survey response'
                    ];
                    answer = textOptions[Math.floor(Math.random() * textOptions.length)];
                }
                if (answer !== undefined) {
                    responses.push({
                        questionId: question.id,
                        answer
                    });
                }
            }
            // Create user_tasks entry with survey responses
            await db.query(`INSERT INTO user_tasks (user_id, task_id, completed_at, points_earned, survey_responses)
         VALUES ($1, $2, CURRENT_TIMESTAMP - (random() * INTERVAL '30 days'), $3, $4)`, [
                user.id,
                surveyTask.id,
                surveyTask.points || 0,
                JSON.stringify(responses)
            ]);
            // Award points and plant tree (same as normal completion)
            await addUserPoints(user.id, surveyTask.points || 0);
            const newTreeId = await plantTree(user.id, surveyTask.id);
            await addGrowthPointsToRandomTree(user.id, surveyTask.points || 0, newTreeId);
            responsesCreated++;
        }
        await db.query('COMMIT');
        return {
            taskId: surveyTask.id,
            participantsCreated,
            responsesCreated
        };
    }
    catch (error) {
        await db.query('ROLLBACK');
        throw error;
    }
}
/**
 * Simulate time-based activity by creating task completions with custom dates
 */
export async function simulateTimeBasedActivity(userEmail, taskCount, startDate, endDate, distribution = 'uniform') {
    const db = getPool();
    const user = await getUserByEmail(userEmail);
    if (!user) {
        throw new Error(`User with email ${userEmail} not found`);
    }
    // Validate date range
    if (startDate >= endDate) {
        throw new Error('Start date must be before end date');
    }
    // Prevent dates too far in the future (e.g., more than 1 year)
    const maxFutureDate = new Date();
    maxFutureDate.setFullYear(maxFutureDate.getFullYear() + 1);
    if (endDate > maxFutureDate) {
        throw new Error('End date cannot be more than 1 year in the future');
    }
    // Get uncompleted tasks for this user
    const allTasks = await getAllTasks({ limit: taskCount * 2 }, user.id, { includeAll: false, includeInactive: false });
    const uncompletedTasks = allTasks.filter((task) => !task.completed);
    if (uncompletedTasks.length === 0) {
        throw new Error(`No uncompleted tasks found for user ${userEmail}`);
    }
    const tasksToComplete = uncompletedTasks.slice(0, taskCount);
    const taskIds = [];
    const timeRange = endDate.getTime() - startDate.getTime();
    await db.query('BEGIN');
    try {
        for (let i = 0; i < tasksToComplete.length; i++) {
            const task = tasksToComplete[i];
            // Calculate completion date based on distribution
            let completionDate;
            if (distribution === 'uniform') {
                // Uniformly distribute across the date range
                // Handle single task case: place at start date
                const progress = tasksToComplete.length === 1
                    ? 0
                    : i / (tasksToComplete.length - 1);
                completionDate = new Date(startDate.getTime() + progress * timeRange);
            }
            else {
                // Random distribution
                const randomProgress = Math.random();
                completionDate = new Date(startDate.getTime() + randomProgress * timeRange);
            }
            // Check if task already completed
            const existing = await db.query('SELECT * FROM user_tasks WHERE user_id = $1 AND task_id = $2', [user.id, task.id]);
            if (existing.rows.length > 0) {
                continue; // Skip already completed tasks
            }
            // Insert completion with custom completed_at timestamp
            await db.query(`INSERT INTO user_tasks (user_id, task_id, completed_at, points_earned)
         VALUES ($1, $2, $3, $4)`, [user.id, task.id, completionDate.toISOString(), task.points || 0]);
            // Award points and plant tree
            await addUserPoints(user.id, task.points || 0);
            const newTreeId = await plantTree(user.id, task.id);
            await addGrowthPointsToRandomTree(user.id, task.points || 0, newTreeId);
            taskIds.push(task.id);
        }
        await db.query('COMMIT');
        return {
            completed: taskIds.length,
            taskIds,
            dateRange: {
                start: startDate.toISOString(),
                end: endDate.toISOString()
            }
        };
    }
    catch (error) {
        await db.query('ROLLBACK');
        throw error;
    }
}
/**
 * Simulate reward redemption for a user
 */
export async function simulateRewardRedemption(userEmail, rewardId, autoVerify = false) {
    const user = await getUserByEmail(userEmail);
    if (!user) {
        throw new Error(`User with email ${userEmail} not found`);
    }
    let selectedRewardId = rewardId || '';
    // If no reward specified, get first available reward
    if (!selectedRewardId) {
        const rewards = await listRewardsForAdmin(true); // Include inactive
        if (rewards.length === 0) {
            throw new Error('No rewards available');
        }
        selectedRewardId = rewards[0].id;
    }
    // Check if user has enough points, if not, add enough points
    const rewardResult = await getPool().query('SELECT * FROM rewards WHERE id = $1', [selectedRewardId]);
    const reward = rewardResult.rows[0];
    if (!reward) {
        throw new Error('Reward not found');
    }
    const pointsBefore = user.points;
    // Add points if needed
    if (user.points < reward.points_cost) {
        const pointsNeeded = reward.points_cost - user.points;
        await addUserPoints(user.id, pointsNeeded);
    }
    // Redeem the reward
    const redemptionResult = await redeemRewardService(selectedRewardId, user.id);
    // Auto-verify if requested
    if (autoVerify && redemptionResult.redemption?.qrToken) {
        // Get admin user for verification (use first admin found)
        const adminResult = await getPool().query("SELECT id FROM users WHERE role = 'administrator' LIMIT 1");
        const adminId = adminResult.rows[0]?.id;
        if (adminId) {
            await verifyQrCodeService(redemptionResult.redemption.qrToken, adminId);
        }
    }
    // Get updated user points
    const updatedUser = await getUserById(user.id);
    const pointsAfter = updatedUser?.points || pointsBefore;
    return {
        redemption: redemptionResult.redemption,
        pointsBefore,
        pointsAfter
    };
}
/**
 * Reset user data (tasks, trees, points, redemptions)
 */
export async function resetUserData(userEmail, resetOptions) {
    const db = getPool();
    const user = await getUserByEmail(userEmail);
    if (!user) {
        throw new Error(`User with email ${userEmail} not found`);
    }
    // If all options are false, reset everything
    const resetAll = !resetOptions.tasks && !resetOptions.trees &&
        !resetOptions.points && !resetOptions.redemptions;
    await db.query('BEGIN');
    try {
        let tasksDeleted = 0;
        let treesDeleted = 0;
        let redemptionsDeleted = 0;
        let pointsReset = false;
        // Delete tasks
        if (resetAll || resetOptions.tasks) {
            const tasksResult = await db.query('DELETE FROM user_tasks WHERE user_id = $1 RETURNING id', [user.id]);
            tasksDeleted = tasksResult.rows.length;
        }
        // Delete trees
        if (resetAll || resetOptions.trees) {
            const treesResult = await db.query('DELETE FROM forest_trees WHERE user_id = $1 RETURNING id', [user.id]);
            treesDeleted = treesResult.rows.length;
        }
        // Delete redemptions
        if (resetAll || resetOptions.redemptions) {
            const redemptionsResult = await db.query('DELETE FROM reward_redemptions WHERE user_id = $1 RETURNING id', [user.id]);
            redemptionsDeleted = redemptionsResult.rows.length;
        }
        // Reset points
        if (resetAll || resetOptions.points) {
            await db.query('UPDATE users SET points = 0, updated_at = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);
            pointsReset = true;
        }
        await db.query('COMMIT');
        return {
            tasksDeleted,
            treesDeleted,
            pointsReset,
            redemptionsDeleted
        };
    }
    catch (error) {
        await db.query('ROLLBACK');
        throw error;
    }
}
/**
 * Generate statistics data over a time period
 */
export async function generateStatisticsData(startDate, endDate, targetUserCount, tasksPerUserMin, tasksPerUserMax, co2PerTaskMin, co2PerTaskMax) {
    const db = getPool();
    // Validate date range
    if (startDate >= endDate) {
        throw new Error('Start date must be before end date');
    }
    // Prevent dates too far in the future (e.g., more than 1 year)
    const maxFutureDate = new Date();
    maxFutureDate.setFullYear(maxFutureDate.getFullYear() + 1);
    if (endDate > maxFutureDate) {
        throw new Error('End date cannot be more than 1 year in the future');
    }
    const locations = await getLocations(false);
    if (locations.length === 0) {
        throw new Error('No locations available. Please create a location first.');
    }
    const location = locations.find(l => l.name === 'Online') || locations[0];
    const timeRange = endDate.getTime() - startDate.getTime();
    const pointsOptions = [15, 20, 25];
    let usersCreated = 0;
    let tasksCreated = 0;
    let completionsCreated = 0;
    let treesPlanted = 0;
    let totalPointsAwarded = 0;
    let totalCo2Saved = 0;
    await db.query('BEGIN');
    try {
        // Create or get users
        const users = [];
        for (let i = 0; i < targetUserCount; i++) {
            const email = `debug_stats_user_${i + 1}@test.local`;
            let user = await getUserByEmail(email);
            if (!user) {
                user = await createUser({
                    email,
                    name: `Debug Stats User ${i + 1}`,
                    role: 'stakeholder',
                    user_type: 'explorer',
                    points: 0,
                    password_hash: null
                });
                usersCreated++;
            }
            users.push(user);
        }
        // Create tasks with CO2 savings
        const tasks = [];
        const taskCount = Math.max(targetUserCount, 50); // Ensure enough tasks
        for (let i = 0; i < taskCount; i++) {
            const points = pointsOptions[Math.floor(Math.random() * pointsOptions.length)];
            const co2Savings = co2PerTaskMin + Math.random() * (co2PerTaskMax - co2PerTaskMin);
            const task = await createTask({
                title: `Debug Stats Task ${i + 1}`,
                description: `Automatically generated task for statistics demonstration`,
                type: 'quiz',
                points,
                co2_savings_kg: co2Savings,
                location_id: location.id,
                active: true,
                allowed_roles: ['stakeholder'],
                allowed_user_types: ['explorer'],
                allowed_hotel_ids: [],
                quiz_questions: JSON.stringify([
                    {
                        question: 'This is a test question?',
                        options: ['Option A', 'Option B', 'Option C'],
                        correctAnswer: 'Option A'
                    }
                ])
            });
            tasks.push(task);
            tasksCreated++;
        }
        // Create task completions distributed across time period
        // Use realistic distribution (more activity on some days)
        for (const user of users) {
            const tasksForUser = Math.floor(Math.random() * (tasksPerUserMax - tasksPerUserMin + 1)) + tasksPerUserMin;
            // Create a shuffled copy to avoid mutating the original array
            const shuffledTasks = [...tasks].sort(() => Math.random() - 0.5);
            const selectedTasks = shuffledTasks.slice(0, tasksForUser);
            for (const task of selectedTasks) {
                // Create completion date with realistic distribution
                // More completions towards the middle/end of the period
                const randomProgress = Math.random();
                // Bias towards later dates (exponential distribution)
                const biasedProgress = Math.pow(randomProgress, 0.7);
                const completionDate = new Date(startDate.getTime() + biasedProgress * timeRange);
                // Check if already completed
                const existing = await db.query('SELECT * FROM user_tasks WHERE user_id = $1 AND task_id = $2', [user.id, task.id]);
                if (existing.rows.length > 0) {
                    continue;
                }
                // Insert completion
                await db.query(`INSERT INTO user_tasks (user_id, task_id, completed_at, points_earned)
           VALUES ($1, $2, $3, $4)`, [user.id, task.id, completionDate.toISOString(), task.points || 0]);
                // Award points and plant tree
                await addUserPoints(user.id, task.points || 0);
                const newTreeId = await plantTree(user.id, task.id);
                await addGrowthPointsToRandomTree(user.id, task.points || 0, newTreeId);
                completionsCreated++;
                treesPlanted++;
                totalPointsAwarded += task.points || 0;
                totalCo2Saved += task.co2_savings_kg || 0;
            }
        }
        await db.query('COMMIT');
        return {
            usersCreated,
            tasksCreated,
            completionsCreated,
            treesPlanted,
            totalPointsAwarded,
            totalCo2Saved
        };
    }
    catch (error) {
        await db.query('ROLLBACK');
        throw error;
    }
}
/**
 * Calculate tree stage based on growth points
 * Sapling: 1-20, Young: 21-50, Mature: 51-100
 */
function calculateStage(growthPoints) {
    if (growthPoints >= 51)
        return 'mature';
    if (growthPoints >= 21)
        return 'young';
    return 'sapling';
}
/**
 * Generate random size for a given stage
 * Sapling: 0.02-0.05, Young: 0.10-0.15, Mature: 0.20-0.30
 */
function generateSizeForStage(stage) {
    switch (stage) {
        case 'sapling':
            return 0.02 + Math.random() * (0.05 - 0.02); // 0.02 to 0.05
        case 'young':
            return 0.10 + Math.random() * (0.15 - 0.10); // 0.10 to 0.15
        case 'mature':
            return 0.20 + Math.random() * (0.30 - 0.20); // 0.20 to 0.30
        default:
            return 0.035;
    }
}
/**
 * Simulate forest visits for the past N days
 * Each visit adds 1 growth point to all user's trees
 */
export async function simulateForestVisits(userEmail, days) {
    const db = getPool();
    // Get user
    const user = await getUserByEmail(userEmail);
    if (!user) {
        throw new Error(`User with email ${userEmail} not found`);
    }
    // Validate days
    if (days < 1 || days > 365) {
        throw new Error('Number of days must be between 1 and 365');
    }
    // Check if user has trees
    const treesResult = await db.query(`SELECT id, growth_points, stage, size FROM forest_trees WHERE user_id = $1`, [user.id]);
    if (treesResult.rows.length === 0) {
        throw new Error('User has no trees to grow');
    }
    let visitsCreated = 0;
    let treesUpdated = 0;
    await db.query('BEGIN');
    try {
        // Simulate visits for the past N days (starting from yesterday, going backwards)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        for (let i = 1; i <= days; i++) {
            const visitDate = new Date(today);
            visitDate.setDate(visitDate.getDate() - i);
            const visitDateStr = visitDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
            // Check if visit already exists
            const existingVisit = await db.query(`SELECT id FROM daily_forest_visits 
         WHERE user_id = $1 AND visit_date = $2`, [user.id, visitDateStr]);
            // Only process if visit doesn't already exist
            if (existingVisit.rows.length === 0) {
                // Insert visit record
                await db.query(`INSERT INTO daily_forest_visits (user_id, visit_date) 
           VALUES ($1, $2)`, [user.id, visitDateStr]);
                visitsCreated++;
                // Re-fetch trees from database to get current growth points (they may have been updated in previous iterations)
                const currentTreesResult = await db.query(`SELECT id, growth_points, stage, size FROM forest_trees WHERE user_id = $1`, [user.id]);
                // Update each tree with 1 growth point
                for (const tree of currentTreesResult.rows) {
                    const newGrowthPoints = parseInt(tree.growth_points) + 1;
                    const newStage = calculateStage(newGrowthPoints);
                    const currentStage = tree.stage;
                    // If stage changed, generate new random size
                    let newSize = parseFloat(tree.size);
                    if (newStage !== currentStage) {
                        newSize = generateSizeForStage(newStage);
                    }
                    await db.query(`UPDATE forest_trees 
             SET growth_points = $1, stage = $2, size = $3 
             WHERE id = $4`, [newGrowthPoints, newStage, newSize, tree.id]);
                    treesUpdated++;
                }
            }
        }
        await db.query('COMMIT');
        return {
            visitsCreated,
            treesUpdated, // Total tree updates across all visits
            daysSimulated: days,
        };
    }
    catch (error) {
        await db.query('ROLLBACK');
        throw error;
    }
}
/**
 * Recalculate tree sizes based on current growth points and stage
 * This fixes trees that may have incorrect sizes due to bugs or manual database changes
 */
export async function recalculateTreeSizes(userEmail) {
    const db = getPool();
    // Get user
    const user = await getUserByEmail(userEmail);
    if (!user) {
        throw new Error(`User with email ${userEmail} not found`);
    }
    // Get all trees for this user
    const treesResult = await db.query(`SELECT id, growth_points, stage FROM forest_trees WHERE user_id = $1`, [user.id]);
    if (treesResult.rows.length === 0) {
        throw new Error('User has no trees');
    }
    let treesUpdated = 0;
    await db.query('BEGIN');
    try {
        for (const tree of treesResult.rows) {
            const growthPoints = parseInt(tree.growth_points);
            const expectedStage = calculateStage(growthPoints);
            const currentStage = tree.stage;
            // Recalculate size based on expected stage
            const expectedSize = generateSizeForStage(expectedStage);
            // Always update to ensure size matches stage
            await db.query(`UPDATE forest_trees 
         SET stage = $1, size = $2 
         WHERE id = $3`, [expectedStage, expectedSize, tree.id]);
            treesUpdated++;
        }
        await db.query('COMMIT');
        return { treesUpdated };
    }
    catch (error) {
        await db.query('ROLLBACK');
        throw error;
    }
}
//# sourceMappingURL=debug.service.js.map