import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from 'react-query';
import App from './App';
import { Toaster } from './components/Toaster/Toaster';
import { registerServiceWorker, syncOfflineQRCodes } from './utils/serviceWorker';
import './index.css';
// Import i18n first to ensure translations are loaded before App renders
import i18n from './i18n';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Register service worker for offline functionality
registerServiceWorker();

// Sync offline QR codes when coming back online
window.addEventListener('online', () => {
  syncOfflineQRCodes();
});

// Wait for i18n to be initialized before rendering
const initApp = async () => {
  // Ensure i18n is initialized - wait for it to be ready
  if (!i18n.isInitialized) {
    await i18n.init();
  }
  
  // Wait a bit more to ensure translations are loaded
  await new Promise(resolve => {
    if (i18n.isInitialized && i18n.hasResourceBundle(i18n.language || 'en', 'translation')) {
      resolve(undefined);
    } else {
      // Wait for i18n to be ready
      const checkReady = () => {
        if (i18n.isInitialized && i18n.hasResourceBundle(i18n.language || 'en', 'translation')) {
          resolve(undefined);
        } else {
          setTimeout(checkReady, 10);
        }
      };
      checkReady();
    }
  });
  
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <App />
        {import.meta.env.VITE_UI_POLISH ? <Toaster /> : null}
      </QueryClientProvider>
    </React.StrictMode>
  );
};

initApp();
