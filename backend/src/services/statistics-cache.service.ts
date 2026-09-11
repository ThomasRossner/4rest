import { getPool } from '../database/connection.js';
import { Statistics } from './statistics.service.js';

/**
 * Cache statistics in database for fast retrieval
 */
export async function updateStatisticsCache(statistics: Statistics): Promise<void> {
  const db = getPool();

  // Update or insert each metric
  const metrics = [
    { name: 'total_co2_saved', value: statistics.totalCo2Saved },
    { name: 'total_trees', value: statistics.totalTrees },
    { name: 'active_users', value: statistics.activeUsers },
    { name: 'tasks_completed', value: statistics.tasksCompleted },
    { name: 'avg_points_per_user', value: statistics.averagePointsPerUser },
    { name: 'co2_saved_per_task', value: statistics.co2SavedPerTask },
  ];

  for (const metric of metrics) {
    await db.query(
      `INSERT INTO statistics (metric_name, metric_value, last_updated)
       VALUES ($1, $2, CURRENT_TIMESTAMP)
       ON CONFLICT (metric_name)
       DO UPDATE SET metric_value = $2, last_updated = CURRENT_TIMESTAMP`,
      [metric.name, metric.value]
    );
  }
}

/**
 * Get cached statistics (faster than recalculating)
 */
export async function getCachedStatistics(): Promise<Partial<Statistics>> {
  const db = getPool();
  const result = await db.query('SELECT * FROM statistics');

  const cached: any = {};
  result.rows.forEach((row) => {
    cached[row.metric_name] = parseFloat(row.metric_value || '0');
  });

  return {
    totalCo2Saved: cached.total_co2_saved || 0,
    totalTrees: cached.total_trees || 0,
    activeUsers: cached.active_users || 0,
    tasksCompleted: cached.tasks_completed || 0,
    averagePointsPerUser: cached.avg_points_per_user || 0,
    co2SavedPerTask: cached.co2_saved_per_task || 0,
  };
}
