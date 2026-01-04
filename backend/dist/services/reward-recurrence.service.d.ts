/**
 * Process recurring rewards - generates new reward instances based on recurrence settings
 * This should be called periodically (e.g., via scheduled task)
 *
 * Logic:
 * - Daily: Check if last_generated_at was yesterday or earlier, and all previous redemptions are finished
 * - Weekly: Check if last_generated_at was 7+ days ago, and all previous redemptions are finished
 * - Monthly: Check if last_generated_at was 30+ days ago, and all previous redemptions are finished
 */
export declare function processRecurringRewards(): Promise<{
    processed: number;
    generated: number;
    skipped: number;
    errors: string[];
}>;
/**
 * Start a scheduler that processes recurring rewards periodically
 * Call this once when the server starts
 */
export declare function startRecurringRewardsScheduler(intervalMs?: number): () => void;
//# sourceMappingURL=reward-recurrence.service.d.ts.map