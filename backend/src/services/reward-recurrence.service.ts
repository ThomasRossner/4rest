import { getPool } from '../database/connection.js';

/**
 * Process recurring rewards - generates new reward instances based on recurrence settings
 * This should be called periodically (e.g., via scheduled task)
 * 
 * Logic:
 * - Daily: Check if last_generated_at was yesterday or earlier, and all previous redemptions are finished
 * - Weekly: Check if last_generated_at was 7+ days ago, and all previous redemptions are finished
 * - Monthly: Check if last_generated_at was 30+ days ago, and all previous redemptions are finished
 */
export async function processRecurringRewards(): Promise<{
  processed: number;
  generated: number;
  skipped: number;
  errors: string[];
}> {
  const db = getPool();
  const errors: string[] = [];
  let generated = 0;
  let skipped = 0;

  try {
    // Get all active rewards with recurrence != 'once'
    const recurringRewardsResult = await db.query(
      `SELECT id, title, description, points_cost, reward_type, voucher_code, 
              external_api_id,
              location_id, recurrence, last_generated_at
       FROM rewards
       WHERE active = TRUE 
       AND recurrence != 'once'
       ORDER BY id`
    );

    const recurringRewards = recurringRewardsResult.rows;
    const processed = recurringRewards.length;

    for (const reward of recurringRewards) {
      try {
        const shouldGenerate = await shouldGenerateRecurringReward(
          reward.id,
          reward.recurrence,
          reward.last_generated_at
        );

        if (!shouldGenerate) {
          skipped++;
          continue;
        }

        // Check if there are any pending/unfinished redemptions for this reward template
        const hasPendingRedemptions = await hasUnfinishedRedemptions(reward.id);

        if (hasPendingRedemptions) {
          skipped++;
          continue; // Skip if previous reward hasn't been finished yet
        }

        // Generate new reward instance
        await generateRecurringRewardInstance(reward);
        generated++;

        // Update last_generated_at timestamp
        await db.query(
          `UPDATE rewards SET last_generated_at = CURRENT_TIMESTAMP WHERE id = $1`,
          [reward.id]
        );
      } catch (error: any) {
        errors.push(`Reward ${reward.id} (${reward.title}): ${error.message}`);
        console.error(`[RewardRecurrence] Error processing reward ${reward.id}:`, error);
      }
    }

    return {
      processed,
      generated,
      skipped,
      errors,
    };
  } catch (error: any) {
    console.error('[RewardRecurrence] Fatal error:', error);
    throw error;
  }
}

/**
 * Determine if a recurring reward should be generated based on recurrence type and last generation time
 */
async function shouldGenerateRecurringReward(
  rewardId: string,
  recurrence: string,
  lastGeneratedAt: Date | null
): Promise<boolean> {
  if (!lastGeneratedAt) {
    // Never generated before, generate now
    return true;
  }

  const now = new Date();
  const lastGen = new Date(lastGeneratedAt);
  const daysSinceLastGen = Math.floor((now.getTime() - lastGen.getTime()) / (1000 * 60 * 60 * 24));

  switch (recurrence) {
    case 'daily':
      // Generate if last generated was yesterday or earlier
      return daysSinceLastGen >= 1;

    case 'weekly':
      // Generate if last generated was 7+ days ago
      return daysSinceLastGen >= 7;

    case 'monthly':
      // Generate if last generated was 30+ days ago
      return daysSinceLastGen >= 30;

    default:
      return false;
  }
}

/**
 * Check if there are any unfinished redemptions for a reward
 * A redemption is considered unfinished if status is 'pending'
 */
async function hasUnfinishedRedemptions(rewardId: string): Promise<boolean> {
  const db = getPool();
  const result = await db.query(
    `SELECT COUNT(*) as count
     FROM reward_redemptions
     WHERE reward_id = $1
     AND status != 'finished'`,
    [rewardId]
  );

  return parseInt(result.rows[0]?.count || '0') > 0;
}

/**
 * Generate a new reward instance from a recurring reward template
 * This creates a new reward with the same properties but a new ID
 */
async function generateRecurringRewardInstance(template: any): Promise<void> {
  const db = getPool();

  // Create a new reward instance based on the template
  // Note: The new reward will have the same properties but be a separate instance
  // Users can redeem this new instance even if they've redeemed the previous one
  
  // Generated instances must have recurrence = 'once' so they are not picked up
  // as templates in the next run (which would cause exponential growth).
  await db.query(
    `INSERT INTO rewards (
       title,
       description,
       points_cost,
       reward_type,
       voucher_code,
       external_api_id,
       location_id,
       active,
       recurrence,
       last_generated_at
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'once', CURRENT_TIMESTAMP)
     RETURNING id`,
    [
      template.title,
      template.description ?? null,
      template.points_cost,
      template.reward_type,
      template.voucher_code ?? null,
      template.external_api_id ?? null,
      template.location_id,
      true, // Active
    ]
  );
}

/**
 * Start a scheduler that processes recurring rewards periodically
 * Call this once when the server starts
 */
export function startRecurringRewardsScheduler(intervalMs: number = 60 * 60 * 1000): () => void {
  let intervalId: NodeJS.Timeout | null = null;

  const processRewards = async () => {
    try {
      const result = await processRecurringRewards();
      console.log(
        `[RewardRecurrence] Processed ${result.processed} rewards: ${result.generated} generated, ${result.skipped} skipped`
      );
      if (result.errors.length > 0) {
        console.warn(`[RewardRecurrence] Errors:`, result.errors);
      }
    } catch (error) {
      console.error('[RewardRecurrence] Scheduler error:', error);
    }
  };

  // Run immediately on start
  processRewards();

  // Then run periodically
  intervalId = setInterval(processRewards, intervalMs);

  console.log(`[RewardRecurrence] Scheduler started (interval: ${intervalMs / 1000}s)`);

  // Return stop function
  return () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
      console.log('[RewardRecurrence] Scheduler stopped');
    }
  };
}

