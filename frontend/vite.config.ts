import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import fs from 'fs';
import path from 'path';

// Build-Version-Token: package version + Build-Zeitpunkt. Wird als __BUILD_ID__ ins
// Bundle eingebettet und beim App-Start gegen die zuletzt geladene Version verglichen
// (version-basiertes Cache-Busting nach Server-Updates).
const pkgVersion = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, 'package.json'), 'utf-8')
).version as string;
const buildId = `${pkgVersion}-${Date.now()}`;

export default defineConfig({
  define: {
    __BUILD_ID__: JSON.stringify(buildId),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Custom registration in utils/serviceWorker.ts — avoid double registerSW.js + main.tsx
      injectRegister: false,
      includeAssets: ['favicon.ico', 'robots.txt'],
      // Disable PWA in development to prevent service worker caching issues
      devOptions: {
        enabled: false,
        type: 'module',
      },
      manifest: {
        name: '4rest',
        short_name: '4rest',
        description: 'Sustainability gamification platform',
        theme_color: '#0d9488',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        // Bewusst OHNE 'html': die App-Shell (index.html) wird nicht mehr precached,
        // sondern network-first geladen (siehe NavigationRoute unten). Verhindert, dass
        // sich ein Client nach Server-Updates an eine alte index.html klammert.
        globPatterns: ['**/*.{js,css,ico,png,svg,woff2,glb}'],
        // Keine CacheFirst-Navigation aus dem Precache mehr — wir routen Navigationen selbst.
        navigateFallback: null,
        cleanupOutdatedCaches: true,
        // Neuer SW übernimmt sofort die Kontrolle -> löst controllerchange-Reload aus.
        clientsClaim: true,
        skipWaiting: true,
        runtimeCaching: [
          {
            // Same-origin API (luise.bio/api/...) — never cache auth-sensitive responses
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkOnly',
          },
          {
            // App-Shell / Navigationen: immer zuerst Netzwerk (frische index.html mit
            // aktuellen JS-Hashes). Cache dient nur als Offline-Fallback.
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'app-shell',
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 10,
              },
            },
          },
          {
            // Cache 3D models aggressively for fast repeat visits
            urlPattern: /\/(?:old-)?models\/.*\.glb$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'tree-models-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          }
        ]
      }
    })
  ],
  server: {
    // Frontend läuft auf Port 3002 (3000/3001 können bei anderen Apps belegt sein)
    port: 3002,
    host: '0.0.0.0', // Allow external access
    https: (() => {
      // Only enable HTTPS if explicitly requested (e.g., for external device camera access)
      // In production, HTTPS is handled by Caddy reverse proxy
      if (process.env.VITE_ENABLE_HTTPS === 'true') {
        const certPath = path.resolve(__dirname, '.certificates/cert.pem');
        const keyPath = path.resolve(__dirname, '.certificates/key.pem');
        if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
          return {
            cert: fs.readFileSync(certPath),
            key: fs.readFileSync(keyPath),
          };
        }
      }
      return false; // Default to HTTP for local development
    })(),
    hmr: {
      overlay: false, // Disable overlay to prevent EPIPE errors
      // Kein fixes port: HMR nutzt denselben Port wie der Dev-Server (sonst Reload-Loop wenn 3001 belegt)
      host: process.env.VITE_HMR_HOST || 'localhost',
      protocol: process.env.VITE_HMR_HOST ? 'wss' : 'ws',
    },
    watch: {
      // Disable polling on macOS/Linux for better performance
      usePolling: false,
      // Ignore backend and other non-frontend directories
      ignored: [
        '**/backend/**',
        '**/node_modules/**',
        '**/.git/**',
        '**/dist/**',
        '**/database/**',
        '**/scripts/**',
        '**/docs/**',
        '**/e2e/**',
        '**/*.timestamp*.mjs',
        '**/vite.config.ts.timestamp*',
        '**/.vite/**',
        '**/.cursor/**',
        '**/test-results/**',
        '**/*.log',
        '**/*.tmp',
        '**/.DS_Store',
        '**/Thumbs.db',
      ],
    },
    proxy: {
      '/api': {
        // WICHTIG: Backend läuft auf Port 5002 (Port 5000 ist bei Apple belegt)
        target: process.env.VITE_API_TARGET || 'http://localhost:5002',
        changeOrigin: true,
        secure: false, // Allow self-signed certificates
        ws: true
      },
      // Statische Uploads (Aufgaben-Medien, Onboarding-Hintergründe) liegen auf dem Backend
      '/uploads': {
        target: process.env.VITE_API_TARGET || 'http://localhost:5002',
        changeOrigin: true,
        secure: false
      }
    },
    // Allow serving certificate file for installation on mobile devices
    // But restrict to frontend directory to avoid watching backend files
    fs: {
      // Only allow access to files within the frontend directory
      // This prevents Vite from watching the entire project root
      strict: true,
      allow: [path.resolve(__dirname)]
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    commonjsOptions: {
      include: [/leaflet/, /node_modules/]
    }
  },
  optimizeDeps: {
    // lucide-react explizit voroptimieren — verhindert sporadische 504/Timeouts beim ersten
    // Request im Dev-Server (sonst weiße Seite, bis der Dep-Cache neu gebaut ist).
    include: ['leaflet', 'leaflet-control-geocoder', 'three', 'lucide-react'],
    esbuildOptions: {
      // Increase memory limit for esbuild
      target: 'es2020',
    },
  },
  esbuild: {
    // Configure esbuild to be more robust
    target: 'es2020',
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
  },
  resolve: {
    dedupe: ['leaflet', 'three']
  }
});
