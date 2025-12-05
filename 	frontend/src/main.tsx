import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from 'react-query';
import App from './App';
import { Toaster } from './components/Toaster/Toaster';
// import { registerServiceWorker, syncOfflineQRCodes } from './utils/serviceWorker';
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

// Service Worker COMPLETELY DISABLED in development to prevent reload loops
// Service Worker causes infinite reloads in development mode
// Unregister any existing service workers immediately
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => {
      registration.unregister().then(() => {
        console.log('[ServiceWorker] Unregistered:', registration.scope);
      });
    });
  });
  navigator.serviceWorker.getRegistration().then((registration) => {
    if (registration) {
      registration.unregister().then(() => {
        console.log('[ServiceWorker] Unregistered by scope');
      });
    }
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <App />
    {import.meta.env.VITE_UI_POLISH ? <Toaster /> : null}
  </QueryClientProvider>
);
