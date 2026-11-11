/** Wie oft ein Tab dieselbe Server-Version neu laden darf, bevor er aufgibt. */
export const MAX_SERVER_VERSION_RELOADS = 2;

/** Mindestabstand zwischen zwei Reloads durch einen Service-Worker-Wechsel. */
export const CONTROLLER_CHANGE_DEBOUNCE_MS = 4000;

/**
 * Entscheidet, ob der laufende Build gegen eine neuere Server-Version neu geladen wird.
 * `storedAttempt` hat die Form `<serverBuildId>:<anzahl>`.
 */
export function nextServerReload(
  runningBuildId: string,
  serverBuildId: string,
  storedAttempt: string | null
): { reload: boolean; attempt: string | null } {
  if (!serverBuildId || !runningBuildId || serverBuildId === runningBuildId) {
    return { reload: false, attempt: null };
  }

  const prefix = `${serverBuildId}:`;
  let count = 0;
  if (storedAttempt?.startsWith(prefix)) {
    const parsed = Number(storedAttempt.slice(prefix.length));
    if (Number.isFinite(parsed) && parsed > 0) count = parsed;
  }

  if (count >= MAX_SERVER_VERSION_RELOADS) {
    return { reload: false, attempt: storedAttempt };
  }

  return { reload: true, attempt: `${serverBuildId}:${count + 1}` };
}

/** Verhindert nur direkt aufeinanderfolgende controllerchange-Reloads, nicht spätere Deploys. */
export function shouldReloadAfterControllerChange(
  now: number,
  lastReloadAt: number | null,
  debounceMs: number = CONTROLLER_CHANGE_DEBOUNCE_MS
): boolean {
  if (lastReloadAt == null || !Number.isFinite(lastReloadAt)) return true;
  return now - lastReloadAt >= debounceMs;
}
