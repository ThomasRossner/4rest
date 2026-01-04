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

ReactDOM.createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <App />
    {import.meta.env.VITE_UI_POLISH ? <Toaster /> : null}
  </QueryClientProvider>
);

// Register PWA service worker (disabled automatically in development by the helper)
registerServiceWorker();

// Try to sync any offline QR codes when the app starts and whenever we come back online
syncOfflineQRCodes();
window.addEventListener('online', () => {
  syncOfflineQRCodes();
});
