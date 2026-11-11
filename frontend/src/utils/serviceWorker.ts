import {
  MAX_SERVER_VERSION_RELOADS,
  nextServerReload,
  shouldReloadAfterControllerChange,
} from './clientVersion';

// Service Worker: Update nach Deploy, ohne die Anmeldung in localStorage zu löschen.

const LEGACY_CACHE_PREFIXES = ['roots-of-impact', 'runtime-cache', 'api-cache', 'workbox-precache'];

// Version-basiertes Cache-Busting: Build-Token der zuletzt geladenen App.
const APP_VERSION_KEY = '4rest-app-version';
// Loop-Schutz: pro Tab-Session nur ein versions-bedingter Reload des schon geladenen Bundles.
const VERSION_RELOAD_GUARD = '4rest-version-reloaded';
// Zählt Reloads gegen eine konkrete Server-Version (`<buildId>:<n>`).
const SERVER_RELOAD_KEY = '4rest-server-reload';
// Zeitpunkt des letzten Reloads wegen Service-Worker-Wechsel.
const SW_RELOAD_AT_KEY = '4rest-sw-reload-at';
// Ein Reload nach einem fehlenden Chunk, bis die Version wieder zusammenpasst.
const PRELOAD_RELOAD_KEY = '4rest-preload-reload';
// Gesetzt, nachdem Caches schon geleert wurden — vermeidet einen zweiten Reload im neuen Bundle.
const CACHES_CLEARED_KEY = '4rest-caches-cleared';
const FRESH_CHECK_THROTTLE_MS = 15_000;
const FRESH_CHECK_INTERVAL_MS = 30_000;

let freshCheckInFlight: Promise<boolean> | null = null;
let lastFreshCheckAt = 0;
let reloadScheduled = false;
let staleRecoveryInstalled = false;
let controllerChangeBound = false;

/** Lösche ausschließlich Cache Storage (NICHT localStorage/Auth, NICHT IndexedDB). */
async function clearAllCacheStorage(): Promise<void> {
  if (!('caches' in window)) return;
  const names = await caches.keys();
  await Promise.all(names.map((name) => caches.delete(name)));
}

function runningBuildId(): string {
  return typeof __BUILD_ID__ !== 'undefined' ? __BUILD_ID__ : '';
}

function readSession(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeSession(key: string, value: string): void {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    // private mode / quota
  }
}

function removeSession(key: string): void {
  try {
    sessionStorage.removeItem(key);
  } catch {
    // ignore
  }
}

function rememberRunningVersion(buildId: string): void {
  try {
    localStorage.setItem(APP_VERSION_KEY, buildId);
  } catch {
    // ignore
  }
}

async function nudgeServiceWorker(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(
      registrations.map(async (registration) => {
        registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
        await registration.update().catch(() => undefined);
      })
    );
  } catch {
    // ignore
  }
}

/** Cache leeren und die Seite neu laden. Auth in localStorage bleibt erhalten. */
async function prepareAndReload(): Promise<void> {
  if (reloadScheduled) return;
  reloadScheduled = true;
  await clearAllCacheStorage();
  writeSession(CACHES_CLEARED_KEY, '1');
  await nudgeServiceWorker();
  window.location.reload();
}

async function fetchServerBuildId(): Promise<string | null> {
  try {
    const response = await fetch(`/version.json?t=${Date.now()}`, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { buildId?: unknown };
    return typeof data.buildId === 'string' && data.buildId ? data.buildId : null;
  } catch {
    return null;
  }
}

/**
 * Läuft das Bundle noch gegen einen älteren Deploy, wird einmal (höchstens zweimal)
 * neu geladen. Der Vergleich geht gegen /version.json, nicht gegen die eigene Build-ID.
 */
async function reloadIfServerIsNewer(current: string): Promise<boolean> {
  const serverBuildId = await fetchServerBuildId();
  if (!serverBuildId) return false;

  if (serverBuildId === current) {
    removeSession(SERVER_RELOAD_KEY);
    removeSession(PRELOAD_RELOAD_KEY);
    return false;
  }

  const decision = nextServerReload(current, serverBuildId, readSession(SERVER_RELOAD_KEY));
  if (decision.attempt) writeSession(SERVER_RELOAD_KEY, decision.attempt);
  if (!decision.reload) return false;

  const attempt = decision.attempt ? Number(decision.attempt.slice(decision.attempt.lastIndexOf(':') + 1)) : 1;
  // Zweiter Versuch: alten Service Worker abmelden, damit er die neue index.html
  // nicht wieder aus dem Cache ausliefert.
  if (attempt >= MAX_SERVER_VERSION_RELOADS) {
    if (reloadScheduled) return true;
    reloadScheduled = true;
    await purgeAllClientCaches();
    writeSession(CACHES_CLEARED_KEY, '1');
    window.location.reload();
    return true;
  }

  await prepareAndReload();
  return true;
}

/**
 * Neues Bundle ist schon da, localStorage kennt noch die vorige Version:
 * Caches einmal leeren. Die Server-Prüfung deckt den Fall "altes Bundle bleibt liegen" ab.
 */
async function reloadIfEmbeddedVersionChanged(current: string): Promise<boolean> {
  let stored: string | null = null;
  try {
    stored = localStorage.getItem(APP_VERSION_KEY);
  } catch {
    return false;
  }

  if (!stored) {
    rememberRunningVersion(current);
    return false;
  }

  if (stored === current) {
    removeSession(VERSION_RELOAD_GUARD);
    removeSession(CACHES_CLEARED_KEY);
    return false;
  }

  // Server-Check hat die Caches vor dem Reload schon geleert. Das neue Bundle
  // nur merken, nicht noch einmal neu laden.
  if (readSession(CACHES_CLEARED_KEY) === '1') {
    rememberRunningVersion(current);
    removeSession(CACHES_CLEARED_KEY);
    removeSession(VERSION_RELOAD_GUARD);
    return false;
  }

  if (readSession(VERSION_RELOAD_GUARD) === current) {
    rememberRunningVersion(current);
    return false;
  }

  writeSession(VERSION_RELOAD_GUARD, current);
  rememberRunningVersion(current);
  await prepareAndReload();
  return true;
}

async function runFreshClientCheck(): Promise<boolean> {
  const current = runningBuildId();
  if (!current) return false;

  if (await reloadIfServerIsNewer(current)) return true;
  return reloadIfEmbeddedVersionChanged(current);
}

/**
 * Stellt nach einem Server-/Frontend-Update sicher, dass die neueste Version aktiv ist.
 * Auth/localStorage bleiben erhalten.
 *
 * @returns true, wenn ein Reload ausgelöst wurde (Aufrufer sollte dann abbrechen).
 */
export async function ensureFreshClient(options?: { force?: boolean }): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const current = runningBuildId();
  if (import.meta.env.DEV) {
    if (current) rememberRunningVersion(current);
    return false;
  }

  if (freshCheckInFlight) return freshCheckInFlight;
  if (!options?.force && Date.now() - lastFreshCheckAt < FRESH_CHECK_THROTTLE_MS) return false;

  lastFreshCheckAt = Date.now();
  freshCheckInFlight = runFreshClientCheck().finally(() => {
    freshCheckInFlight = null;
  });
  return freshCheckInFlight;
}

/** @see ensureFreshClient */
export function enforceFreshVersion(): Promise<boolean> {
  return ensureFreshClient({ force: true });
}

/**
 * Offener PWA-Prozess: beim Zurückkehren und periodisch die Server-Version prüfen.
 * Ein harter Kill ist dann nicht mehr nötig, um nach dem Deploy die neue Shell zu laden.
 */
export function installStaleClientRecovery(): void {
  if (typeof window === 'undefined' || import.meta.env.DEV || staleRecoveryInstalled) return;
  staleRecoveryInstalled = true;

  const checkNow = () => {
    if (document.visibilityState === 'hidden') return;
    void ensureFreshClient({ force: true });
  };

  document.addEventListener('visibilitychange', checkNow);
  window.addEventListener('focus', checkNow);
  window.addEventListener('online', checkNow);
  window.setInterval(() => {
    if (document.visibilityState === 'hidden') return;
    void ensureFreshClient();
  }, FRESH_CHECK_INTERVAL_MS);

  window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault();
    if (readSession(PRELOAD_RELOAD_KEY) === '1') return;
    writeSession(PRELOAD_RELOAD_KEY, '1');
    void prepareAndReload();
  });
}

/** Remove stale SW caches from pre-workbox or misconfigured versions (client-specific fix). */
export async function purgeLegacyCaches(): Promise<void> {
  if (!('caches' in window)) return;
  const names = await caches.keys();
  await Promise.all(
    names
      .filter((name) => LEGACY_CACHE_PREFIXES.some((prefix) => name.includes(prefix)))
      .map((name) => caches.delete(name))
  );
}

/** Full reset: all Cache Storage + unregister every SW (for ?clearCache=1). */
export async function purgeAllClientCaches(): Promise<void> {
  if ('caches' in window) {
    const names = await caches.keys();
    await Promise.all(names.map((name) => caches.delete(name)));
  }
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
  }
}

/**
 * ?clearCache=1 — one-shot client reset without clearing auth (user can log out manually).
 * Removes query param and reloads once caches are gone.
 */
export async function maybeClearClientCachesFromUrl(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  if (!params.has('clearCache')) return false;

  params.delete('clearCache');
  const nextSearch = params.toString();
  const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ''}${window.location.hash}`;
  window.history.replaceState({}, '', nextUrl);

  await purgeAllClientCaches();
  removeSession('4rest-sw-reloaded');
  removeSession(SERVER_RELOAD_KEY);
  removeSession(SW_RELOAD_AT_KEY);
  removeSession(PRELOAD_RELOAD_KEY);
  removeSession(VERSION_RELOAD_GUARD);
  removeSession(CACHES_CLEARED_KEY);
  return true;
}

export function registerServiceWorker() {
  // COMPLETELY DISABLED in development to prevent reload loops
  if (import.meta.env.DEV) {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister().catch(() => undefined);
        });
      });
    }
    return;
  }

  if (!('serviceWorker' in navigator)) return;

  // Beim Erst-Install (noch kein Controller) darf clients.claim() KEINEN Reload auslösen.
  const hadController = !!navigator.serviceWorker.controller;

  if (!controllerChangeBound) {
    controllerChangeBound = true;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!hadController) return;
      const now = Date.now();
      const lastRaw = readSession(SW_RELOAD_AT_KEY);
      const last = lastRaw == null ? null : Number(lastRaw);
      if (!shouldReloadAfterControllerChange(now, last)) return;
      writeSession(SW_RELOAD_AT_KEY, String(now));
      void prepareAndReload();
    });
  }

  const register = async () => {
    try {
      await purgeLegacyCaches();

      const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      console.log('[ServiceWorker] registered:', registration.scope);

      registration.addEventListener('updatefound', () => {
        const installing = registration.installing;
        if (!installing) return;
        installing.addEventListener('statechange', () => {
          if (installing.state === 'installed' && navigator.serviceWorker.controller) {
            installing.postMessage({ type: 'SKIP_WAITING' });
          }
        });
      });

      await registration.update().catch(() => undefined);
      await purgeLegacyCaches();
    } catch (error) {
      console.error('[ServiceWorker] registration failed:', error);
    }
  };

  if (document.readyState === 'complete') {
    void register();
  } else {
    window.addEventListener('load', () => void register(), { once: true });
  }
}

// Offline QR code storage
export function storeQRCodeOffline(qrCode: string, taskId: string) {
  if ('indexedDB' in window) {
    const request = indexedDB.open('rootsOfImpactDB', 1);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('qrCodes')) {
        db.createObjectStore('qrCodes', { keyPath: 'taskId' });
      }
    };

    request.onsuccess = (event: Event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const transaction = db.transaction(['qrCodes'], 'readwrite');
      const store = transaction.objectStore('qrCodes');
      store.put({ taskId, qrCode, scannedAt: new Date().toISOString() });
    };
  } else {
    const stored = JSON.parse(localStorage.getItem('qrCodes') || '[]');
    stored.push({ taskId, qrCode, scannedAt: new Date().toISOString() });
    localStorage.setItem('qrCodes', JSON.stringify(stored));
  }
}

// Sync offline QR codes when online
export async function syncOfflineQRCodes() {
  if (!navigator.onLine) return;

  try {
    const storedQRCodes = JSON.parse(localStorage.getItem('qrCodes') || '[]');

    for (const entry of storedQRCodes) {
      try {
        await fetch('/api/tasks/sync-qr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entry),
        });

        const updated = storedQRCodes.filter((e: { taskId: string }) => e.taskId !== entry.taskId);
        localStorage.setItem('qrCodes', JSON.stringify(updated));
      } catch (error) {
        console.error('Failed to sync QR code:', error);
      }
    }
  } catch (error) {
    console.error('Error syncing offline QR codes:', error);
  }
}
