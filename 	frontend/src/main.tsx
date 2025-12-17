import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from 'react-query';
import { useGLTF } from '@react-three/drei';
import App from './App';
import { Toaster } from './components/Toaster/Toaster';
import { registerServiceWorker, syncOfflineQRCodes } from './utils/serviceWorker';
import './index.css';
import './i18n';

// Preload 3D tree models early for better performance.
// These will be cached and ready when ForestPage loads.
useGLTF.preload('/models/twigLeafTree.glb');
useGLTF.preload('/models/tree.glb');
useGLTF.preload('/models/leaves.glb');

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
