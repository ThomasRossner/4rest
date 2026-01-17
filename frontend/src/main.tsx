import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from 'react-query';
import App from './App';
import { Toaster } from './components/Toaster/Toaster';
import { registerServiceWorker, syncOfflineQRCodes } from './utils/serviceWorker';
import './index.css';
import './i18n';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const root = document.getElementById('root');
if (!root) {
  console.error('Root element not found!');
} else {
  try {
    ReactDOM.createRoot(root).render(
      <QueryClientProvider client={queryClient}>
        <App />
        {import.meta.env.VITE_UI_POLISH ? <Toaster /> : null}
      </QueryClientProvider>
    );
  } catch (error) {
    console.error('Error rendering app:', error);
    root.innerHTML = `<div style="padding: 20px; color: red;"><h1>Error loading app</h1><pre>${error}</pre></div>`;
  }
}

// Register PWA service worker (disabled automatically in development by the helper)
registerServiceWorker();

// Try to sync any offline QR codes when the app starts and whenever we come back online
syncOfflineQRCodes();
window.addEventListener('online', () => {
  syncOfflineQRCodes();
});
