import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from 'react-query';
import App from './App';
import { Toaster } from './components/Toaster/Toaster';
import { registerServiceWorker, syncOfflineQRCodes } from './utils/serviceWorker';
import './index.css';

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

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      {import.meta.env.VITE_UI_POLISH ? <Toaster /> : null}
    </QueryClientProvider>
  </React.StrictMode>
);
