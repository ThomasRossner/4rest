// Service Worker registration for offline QR code functionality

const LEGACY_CACHE_PREFIXES = ['roots-of-impact', 'runtime-cache', 'api-cache', 'workbox-precache'];

// Version-basiertes Cache-Busting: Build-Token der zuletzt geladenen App.
const APP_VERSION_KEY = '4rest-app-version';
// Loop-Schutz: pro Tab-Session nur ein versions-bedingter Reload.
const VERSION_RELOAD_GUARD = '4rest-version-reloaded';

/** Lösche ausschließlich Cache Storage (NICHT localStorage/Auth, NICHT IndexedDB). */
async function clearAllCacheStorage(): Promise<void> {
  if (!('caches' in window)) return;
  const names = await caches.keys();
  await Promise.all(names.map((name) => caches.delete(name)));
}

/**
 * Stellt nach einem Server-/Frontend-Update sicher, dass die neueste Version aktiv ist.
 *
 * Strategie (bewusst version-basiert statt "bei jedem Start"):
 * - Vergleicht den ins Bundle eingebetteten Build-Token (__BUILD_ID__) mit dem zuletzt
 *   gespeicherten Wert.
 * - Nur bei Abweichung werden alle Caches gelöscht und ein einmaliger Reload ausgelöst.
 *   So gibt es keine Reload-Loops und keine Performance-/Offline-Einbußen bei jedem Load.
 * - Auth/localStorage bleiben erhalten (User bleibt eingeloggt).
 *
 * Loop-Schutz: sessionStorage-Guard + neue Version wird erst NACH dem Cache-Clear gespeichert.
 *
 * @returns true, wenn ein Reload ausgelöst wurde (Aufrufer sollte dann abbrechen).
 */
export async function enforceFreshVersion(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const current = typeof __BUILD_ID__ !== 'undefined' ? __BUILD_ID__ : '';
  if (!current) return false;

  let stored: string | null = null;
  try {
    stored = localStorage.getItem(APP_VERSION_KEY);
  } catch {
    return false;
  }

  // In der Entwicklung kein aggressives Clearing (SW/HMR sind ohnehin deaktiviert),
  // nur die Version merken.
  if (import.meta.env.DEV) {
    try {
      localStorage.setItem(APP_VERSION_KEY, current);
    } catch {
      // ignore
    }
    return false;
  }

  // Erster Start auf diesem Gerät: nichts zu löschen, nur Version merken.
  if (!stored) {
    try {
      localStorage.setItem(APP_VERSION_KEY, current);
    } catch {
      // ignore
    }
    return false;
  }

  if (stored === current) {
    sessionStorage.removeItem(VERSION_RELOAD_GUARD);
    return false;
  }

  // Version hat sich geändert. Loop-Schutz: pro Session nur einmal reloaden.
  if (sessionStorage.getItem(VERSION_RELOAD_GUARD) === current) {
    try {
      localStorage.setItem(APP_VERSION_KEY, current);
    } catch {
      // ignore
    }
    return false;
  }

  sessionStorage.setItem(VERSION_RELOAD_GUARD, current);

  await clearAllCacheStorage();

  // Neuen SW so schnell wie möglich aktivieren.
  if ('serviceWorker' in navigator) {
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

  // Version erst NACH dem Cache-Clear speichern (falls vorher ein Fehler auftritt,
  // wird beim nächsten Start erneut gelöscht statt eine veraltete Version zu "bestätigen").
  try {
    localStorage.setItem(APP_VERSION_KEY, current);
  } catch {
    // ignore
  }

  window.location.reload();
  return true;
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
  sessionStorage.removeItem('4rest-sw-reloaded');
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

      navigator.serviceWorker.addEventListener('controllerchange', () => {
        // Erst-Install: kein Reload nötig (nur ein neuer SW übernimmt -> Update).
        if (!hadController) return;
        if (sessionStorage.getItem('4rest-sw-reloaded')) return;
        sessionStorage.setItem('4rest-sw-reloaded', '1');
        window.location.reload();
      });
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
