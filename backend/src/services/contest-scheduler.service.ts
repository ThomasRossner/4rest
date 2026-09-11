/**
 * Contest Scheduler Service
 * 
 * Prüft regelmäßig abgelaufene Contests und:
 * - Vergibt automatisch Belohnungen an die Top 3
 * - Sendet Benachrichtigungen an alle Teilnehmer
 */

import { processExpiredContests, processStartedContests } from './contest.service.js';

let schedulerInterval: NodeJS.Timeout | null = null;

/**
 * Verarbeitet gestartete Contests einmalig
 */
export async function processStartedContestsOnce(): Promise<void> {
  try {
    console.log('[CONTEST SCHEDULER] Processing started contests...');
    const result = await processStartedContests();
    
    console.log('[CONTEST SCHEDULER] Started contests processing complete:', {
      processed: result.processed,
      notified: result.notified,
      errors: result.errors.length,
    });

    if (result.errors.length > 0) {
      console.error('[CONTEST SCHEDULER] Errors occurred:', result.errors);
    }
  } catch (error) {
    console.error('[CONTEST SCHEDULER] Fatal error processing started contests:', error);
  }
}

/**
 * Verarbeitet abgelaufene Contests einmalig
 */
export async function processExpiredContestsOnce(): Promise<void> {
  try {
    console.log('[CONTEST SCHEDULER] Processing expired contests...');
    const result = await processExpiredContests();
    
    console.log('[CONTEST SCHEDULER] Expired contests processing complete:', {
      processed: result.processed,
      awarded: result.awarded,
      notified: result.notified,
      errors: result.errors.length,
    });

    if (result.errors.length > 0) {
      console.error('[CONTEST SCHEDULER] Errors occurred:', result.errors);
    }
  } catch (error) {
    console.error('[CONTEST SCHEDULER] Fatal error processing expired contests:', error);
  }
}

/**
 * Startet den Contest-Scheduler
 * @param intervalMs Intervall in Millisekunden (Standard: 15 Minuten)
 * @returns Stop-Funktion
 */
export function startContestScheduler(intervalMs: number = 15 * 60 * 1000): () => void {
  if (schedulerInterval) {
    console.warn('[CONTEST SCHEDULER] Scheduler already running');
    return stopContestScheduler;
  }

  console.log(`[CONTEST SCHEDULER] Starting scheduler (interval: ${intervalMs / 1000}s)`);
  
  // Führe sofort eine Prüfung durch (sowohl gestartete als auch abgelaufene Contests)
  processStartedContestsOnce().catch((error) => {
    console.error('[CONTEST SCHEDULER] Error in initial started contests processing:', error);
  });
  processExpiredContestsOnce().catch((error) => {
    console.error('[CONTEST SCHEDULER] Error in initial expired contests processing:', error);
  });

  // Dann regelmäßig
  schedulerInterval = setInterval(() => {
    // Prüfe zuerst gestartete Contests, dann abgelaufene
    processStartedContestsOnce().catch((error) => {
      console.error('[CONTEST SCHEDULER] Error in scheduled started contests processing:', error);
    });
    processExpiredContestsOnce().catch((error) => {
      console.error('[CONTEST SCHEDULER] Error in scheduled expired contests processing:', error);
    });
  }, intervalMs);

  return stopContestScheduler;
}

/**
 * Stoppt den Contest-Scheduler
 */
export function stopContestScheduler(): void {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log('[CONTEST SCHEDULER] Scheduler stopped');
  }
}
