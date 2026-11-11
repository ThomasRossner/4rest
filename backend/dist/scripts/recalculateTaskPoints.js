import 'dotenv/config';
import { getPool } from '../database/connection.js';
import { getTaskParameters } from '../services/parameter.service.js';
import { getPointsCalculationFactor } from '../services/system-config.service.js';
/**
 * Recalculate points for all existing tasks based on difficulty and time_required
 */
async function recalculateTaskPoints() {
    const db = getPool();
    try {
        console.log('[RecalculateTaskPoints] Starting recalculation...');
        // Get all tasks with difficulty and time_required
        const tasksResult = await db.query(`SELECT id, title, difficulty, time_required, points
       FROM tasks
       WHERE difficulty IS NOT NULL 
       AND time_required IS NOT NULL
       ORDER BY created_at`);
        const tasks = tasksResult.rows;
        console.log(`[RecalculateTaskPoints] Found ${tasks.length} tasks to recalculate`);
        if (tasks.length === 0) {
            console.log('[RecalculateTaskPoints] No tasks to recalculate');
            return;
        }
        // Get parameter weights
        const difficultyParams = await getTaskParameters('difficulty');
        const timeRequiredParams = await getTaskParameters('time_required');
        const factor = await getPointsCalculationFactor();
        console.log(`[RecalculateTaskPoints] Using factor: ${factor}`);
        let updated = 0;
        let skipped = 0;
        let errors = 0;
        for (const task of tasks) {
            try {
                const difficultyParam = difficultyParams.find(p => p.value === task.difficulty);
                const timeRequiredParam = timeRequiredParams.find(p => p.value === task.time_required);
                if (!difficultyParam || !timeRequiredParam) {
                    console.warn(`[RecalculateTaskPoints] Skipping task ${task.id} (${task.title}): parameter not found`);
                    skipped++;
                    continue;
                }
                // Convert weights to numbers (they come from DB as strings for DECIMAL type)
                const difficultyWeight = Number(difficultyParam.weight ?? difficultyParam.display_order ?? 1);
                const timeRequiredWeight = Number(timeRequiredParam.weight ?? timeRequiredParam.display_order ?? 1);
                // Calculate: (difficulty_weight * time_required_weight) * factor
                const calculatedPoints = Math.round((difficultyWeight * timeRequiredWeight) * factor);
                const newPoints = Math.max(1, calculatedPoints);
                // Only update if points changed
                if (task.points !== newPoints) {
                    await db.query('UPDATE tasks SET points = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [newPoints, task.id]);
                    console.log(`[RecalculateTaskPoints] Updated task "${task.title}" (${task.id}): ${task.points} → ${newPoints} ` +
                        `(difficulty: ${task.difficulty} [${difficultyWeight}], time: ${task.time_required} [${timeRequiredWeight}])`);
                    updated++;
                }
                else {
                    skipped++;
                }
            }
            catch (error) {
                console.error(`[RecalculateTaskPoints] Error processing task ${task.id}:`, error.message);
                errors++;
            }
        }
        console.log(`[RecalculateTaskPoints] Completed: ${updated} updated, ${skipped} skipped, ${errors} errors`);
    }
    catch (error) {
        console.error('[RecalculateTaskPoints] Fatal error:', error);
        throw error;
    }
}
// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    recalculateTaskPoints()
        .then(() => {
        console.log('[RecalculateTaskPoints] Done');
        process.exit(0);
    })
        .catch((error) => {
        console.error('[RecalculateTaskPoints] Failed:', error);
        process.exit(1);
    });
}
export { recalculateTaskPoints };
//# sourceMappingURL=recalculateTaskPoints.js.map