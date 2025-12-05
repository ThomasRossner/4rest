// Service Worker registration for offline QR code functionality
export function registerServiceWorker() {
  // COMPLETELY DISABLED in development to prevent reload loops
  // Service Worker causes infinite reloads in development mode
  if (import.meta.env.DEV) {
    // Aggressively unregister any existing service workers
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister().then(() => {
            console.log('[ServiceWorker] Unregistered:', registration.scope);
          });
        });
      });
      // Also try to unregister by scope
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration) {
          registration.unregister().then(() => {
            console.log('[ServiceWorker] Unregistered by scope');
          });
        }
      });
    }
    return;
  }
  
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration.scope);
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    });
  }
}

// Offline QR code storage
export function storeQRCodeOffline(qrCode: string, taskId: string) {
  if ('indexedDB' in window) {
    // Store in IndexedDB for offline access
    const request = indexedDB.open('rootsOfImpactDB', 1);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('qrCodes')) {
        db.createObjectStore('qrCodes', { keyPath: 'taskId' });
      }
    };

    request.onsuccess = (event: any) => {
      const db = event.target.result;
      const transaction = db.transaction(['qrCodes'], 'readwrite');
      const store = transaction.objectStore('qrCodes');
      store.put({ taskId, qrCode, scannedAt: new Date().toISOString() });
    };
  } else {
    // Fallback to localStorage
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
        // Attempt to sync with backend
        await fetch('/api/tasks/sync-qr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entry),
        });
        
        // Remove from offline storage after successful sync
        const updated = storedQRCodes.filter((e: any) => e.taskId !== entry.taskId);
        localStorage.setItem('qrCodes', JSON.stringify(updated));
      } catch (error) {
        console.error('Failed to sync QR code:', error);
      }
    }
  } catch (error) {
    console.error('Error syncing offline QR codes:', error);
  }
}
