import 'dotenv/config';
import { getPool } from '../database/connection.js';
import { getRewardParameters } from '../services/parameter.service.js';
import { getRewardCostCalculationFactor } from '../services/system-config.service.js';
/**
 * Recalculate costs for all existing rewards based on kosten
 */
async function recalculateRewardCosts() {
    const db = getPool();
    try {
        console.log('[RecalculateRewardCosts] Starting recalculation...');
        // Get all rewards with kosten
        const rewardsResult = await db.query(`SELECT id, title, kosten, points_cost
       FROM rewards
       WHERE kosten IS NOT NULL
       ORDER BY created_at`);
        const rewards = rewardsResult.rows;
        console.log(`[RecalculateRewardCosts] Found ${rewards.length} rewards to recalculate`);
        if (rewards.length === 0) {
            console.log('[RecalculateRewardCosts] No rewards to recalculate');
            return;
        }
        // Get parameter weights
        const kostenParams = await getRewardParameters('kosten');
        const factor = await getRewardCostCalculationFactor();
        console.log(`[RecalculateRewardCosts] Using factor: ${factor}`);
        let updated = 0;
        let skipped = 0;
        let errors = 0;
        for (const reward of rewards) {
            try {
                const kostenParam = kostenParams.find(p => p.value === reward.kosten);
                if (!kostenParam) {
                    console.warn(`[RecalculateRewardCosts] Skipping reward ${reward.id} (${reward.title}): parameter not found`);
                    skipped++;
                    continue;
                }
                // Convert weight to number (it comes from DB as string for DECIMAL type)
                const kostenWeight = Number(kostenParam.weight ?? kostenParam.display_order ?? 1);
                // Calculate: kosten_weight * factor
                const calculatedCost = Math.round(kostenWeight * factor);
                const newCost = Math.max(1, calculatedCost);
                // Only update if cost changed
                if (reward.points_cost !== newCost) {
                    await db.query('UPDATE rewards SET points_cost = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [newCost, reward.id]);
                    console.log(`[RecalculateRewardCosts] Updated reward "${reward.title}" (${reward.id}): ${reward.points_cost} → ${newCost} ` +
                        `(kosten: ${reward.kosten} [${kostenWeight}])`);
                    updated++;
                }
                else {
                    skipped++;
                }
            }
            catch (error) {
                console.error(`[RecalculateRewardCosts] Error processing reward ${reward.id}:`, error.message);
                errors++;
            }
        }
        console.log(`[RecalculateRewardCosts] Completed: ${updated} updated, ${skipped} skipped, ${errors} errors`);
    }
    catch (error) {
        console.error('[RecalculateRewardCosts] Fatal error:', error);
        throw error;
    }
}
// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    recalculateRewardCosts()
        .then(() => {
        console.log('[RecalculateRewardCosts] Done');
        process.exit(0);
    })
        .catch((error) => {
        console.error('[RecalculateRewardCosts] Failed:', error);
        process.exit(1);
    });
}
export { recalculateRewardCosts };
//# sourceMappingURL=recalculateRewardCosts.js.map