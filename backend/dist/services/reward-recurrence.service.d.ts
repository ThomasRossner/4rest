/**
 * Früher: periodischer Job, der neue `rewards`-Zeilen erzeugte (führte zu Duplikaten).
 * Wiederholung läuft jetzt pro Nutzer über `reward-user-cooldown.service.ts`
 * (Sperrfrist ab verified_at in reward_redemptions).
 */
export declare function processRecurringRewards(): Promise<{
    processed: number;
    generated: number;
    skipped: number;
    errors: string[];
}>;
/** @deprecated Nicht mehr verwenden – kein Zeilen-Generator mehr. */
export declare function startRecurringRewardsScheduler(_intervalMs?: number): () => void;
//# sourceMappingURL=reward-recurrence.service.d.ts.map