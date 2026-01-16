import { getPool } from '../database/connection.js';
import { updateStatisticsCache } from './statistics-cache.service.js';
/**
 * Get comprehensive statistics
 */
export async function getStatisticsService() {
    const db = getPool();
    // Get total CO₂ saved
    const co2Result = await db.query(`SELECT COALESCE(SUM(t.co2_savings_kg), 0) as total_co2,
            COALESCE(AVG(t.co2_savings_kg), 0) as avg_co2_per_task
     FROM user_tasks ut
     JOIN tasks t ON ut.task_id = t.id`);
    // Get total trees
    const treesResult = await db.query('SELECT COUNT(*) as total_trees FROM forest_trees');
    // Get active users (users who completed at least one task in last 30 days)
    const usersResult = await db.query(`SELECT COUNT(DISTINCT user_id) as active_users
     FROM user_tasks
     WHERE completed_at >= NOW() - INTERVAL '30 days'`);
    // Get total tasks completed
    const tasksResult = await db.query('SELECT COUNT(*) as tasks_completed FROM user_tasks');
    // Get average points per user
    const avgPointsResult = await db.query(`SELECT COALESCE(AVG(points), 0) as avg_points
     FROM users
     WHERE points > 0`);
    // Get daily statistics for last 30 days
    const dailyStatsResult = await db.query(`SELECT 
       DATE(ut.completed_at) as date,
       COUNT(*) as tasks_completed,
       SUM(t.co2_savings_kg) as co2_saved,
       COUNT(DISTINCT ut.user_id) as active_users
     FROM user_tasks ut
     JOIN tasks t ON ut.task_id = t.id
     WHERE ut.completed_at >= NOW() - INTERVAL '30 days'
     GROUP BY DATE(ut.completed_at)
     ORDER BY date DESC`);
    // Get team progress (top teams/users)
    const teamProgressResult = await db.query(`SELECT 
       u.id,
       u.name,
       u.role,
       COUNT(DISTINCT ut.task_id) as tasks_completed,
       SUM(ut.points_earned) as total_points,
       SUM(t.co2_savings_kg) as co2_saved
     FROM users u
     LEFT JOIN user_tasks ut ON u.id = ut.user_id
     LEFT JOIN tasks t ON ut.task_id = t.id
     WHERE u.role = 'front_office'
     GROUP BY u.id, u.name, u.role
     ORDER BY total_points DESC
     LIMIT 10`);
    const statistics = {
        totalCo2Saved: parseFloat(co2Result.rows[0]?.total_co2 || '0'),
        totalTrees: parseInt(treesResult.rows[0]?.total_trees || '0'),
        activeUsers: parseInt(usersResult.rows[0]?.active_users || '0'),
        tasksCompleted: parseInt(tasksResult.rows[0]?.tasks_completed || '0'),
        averagePointsPerUser: parseFloat(avgPointsResult.rows[0]?.avg_points || '0'),
        co2SavedPerTask: parseFloat(co2Result.rows[0]?.avg_co2_per_task || '0'),
        teamProgress: teamProgressResult.rows,
        dailyStats: dailyStatsResult.rows.map((row) => ({
            date: row.date,
            tasksCompleted: parseInt(row.tasks_completed || '0'),
            co2Saved: parseFloat(row.co2_saved || '0'),
            activeUsers: parseInt(row.active_users || '0'),
        })),
    };
    // Update cache for performance
    await updateStatisticsCache(statistics);
    return statistics;
}
/**
 * Calculate CO₂ savings for a specific task
 */
export async function calculateCO2Savings(taskId) {
    const db = getPool();
    const result = await db.query(`SELECT 
       COUNT(*) as completions,
       SUM(t.co2_savings_kg) as total_co2
     FROM user_tasks ut
     JOIN tasks t ON ut.task_id = t.id
     WHERE ut.task_id = $1`, [taskId]);
    return parseFloat(result.rows[0]?.total_co2 || '0');
}
/**
 * Get user-specific statistics
 */
export async function getUserStatistics(userId) {
    const db = getPool();
    const result = await db.query(`SELECT 
       COUNT(DISTINCT ut.task_id) as tasks_completed,
       SUM(ut.points_earned) as total_points,
       SUM(t.co2_savings_kg) as co2_saved,
       COUNT(DISTINCT ft.id) as trees_planted,
       MIN(ut.completed_at) as first_task_date,
       MAX(ut.completed_at) as last_task_date
     FROM users u
     LEFT JOIN user_tasks ut ON u.id = ut.user_id
     LEFT JOIN tasks t ON ut.task_id = t.id
     LEFT JOIN forest_trees ft ON u.id = ft.user_id
     WHERE u.id = $1
     GROUP BY u.id`, [userId]);
    return result.rows[0] || {
        tasks_completed: 0,
        total_points: 0,
        co2_saved: 0,
        trees_planted: 0,
    };
}
/**
 * Get statistics by time period
 */
export async function getStatisticsByPeriod(startDate, endDate) {
    const db = getPool();
    const co2Result = await db.query(`SELECT COALESCE(SUM(t.co2_savings_kg), 0) as total_co2
     FROM user_tasks ut
     JOIN tasks t ON ut.task_id = t.id
     WHERE ut.completed_at BETWEEN $1 AND $2`, [startDate, endDate]);
    const tasksResult = await db.query(`SELECT COUNT(*) as tasks_completed
     FROM user_tasks
     WHERE completed_at BETWEEN $1 AND $2`, [startDate, endDate]);
    return {
        totalCo2Saved: parseFloat(co2Result.rows[0]?.total_co2 || '0'),
        tasksCompleted: parseInt(tasksResult.rows[0]?.tasks_completed || '0'),
        totalTrees: 0,
        activeUsers: 0,
        averagePointsPerUser: 0,
        co2SavedPerTask: 0,
    };
}
//# sourceMappingURL=statistics.service.js.map