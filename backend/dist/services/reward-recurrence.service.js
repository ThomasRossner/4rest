/**
 * Früher: periodischer Job, der neue `rewards`-Zeilen erzeugte (führte zu Duplikaten).
 * Wiederholung läuft jetzt pro Nutzer über `reward-user-cooldown.service.ts`
 * (Sperrfrist ab verified_at in reward_redemptions).
 */
export async function processRecurringRewards() {
    return { processed: 0, generated: 0, skipped: 0, errors: [] };
}
/** @deprecated Nicht mehr verwenden – kein Zeilen-Generator mehr. */
export function startRecurringRewardsScheduler(_intervalMs) {
    return () => { };
}
//# sourceMappingURL=reward-recurrence.service.js.map