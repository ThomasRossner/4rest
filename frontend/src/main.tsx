import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from 'react-query';
import App from './App';
import { Toaster } from './components/Toaster/Toaster';
import { ThemeProvider } from './theme/ThemeContext';
import {
  ensureFreshClient,
  installStaleClientRecovery,
  maybeClearClientCachesFromUrl,
  registerServiceWorker,
  syncOfflineQRCodes,
} from './utils/serviceWorker';
import './index.css';
import './i18n';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 8000),
    },
  },
});

/** Tasks + forest data: refetch when tab becomes visible or network returns. */
function setupGuestDataRefetchOnFocus(client: QueryClient) {
  const invalidateGuestQueries = () => {
    client.invalidateQueries(['tasks']);
    client.invalidateQueries({ queryKey: ['forest'] });
    client.invalidateQueries({ queryKey: ['userProgress'] });
  };

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      invalidateGuestQueries();
    }
  });

  window.addEventListener('online', invalidateGuestQueries);
}

setupGuestDataRefetchOnFocus(queryClient);

const root = document.getElementById('root');
if (!root) {
  console.error('Root element not found!');
} else {
  try {
    ReactDOM.createRoot(root).render(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <App />
          {import.meta.env.VITE_UI_POLISH ? <Toaster /> : null}
        </ThemeProvider>
      </QueryClientProvider>
    );
  } catch (error) {
    console.error('Error rendering app:', error);
    root.innerHTML = `<div style="padding: 20px; color: red;"><h1>Error loading app</h1><pre>${error}</pre></div>`;
  }
}

installStaleClientRecovery();

void (async () => {
  const cleared = await maybeClearClientCachesFromUrl();
  if (cleared) {
    window.location.reload();
    return;
  }

  // Neue Build-Version auf dem Server? -> Caches löschen + Reload (Auth bleibt erhalten).
  const reloading = await ensureFreshClient({ force: true });
  if (reloading) return;

  registerServiceWorker();
  syncOfflineQRCodes();
})();

window.addEventListener('online', () => {
  syncOfflineQRCodes();
});
