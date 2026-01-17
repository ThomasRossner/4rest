import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import fs from 'fs';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
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
        theme_color: '#2d5016',
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
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,glb}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\./i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 // 1 hour
              }
            }
          },
          {
            // Cache 3D models aggressively for fast repeat visits
            urlPattern: /\/models\/.*\.glb$/i,
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
    port: 3000,
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
      // For local development, use localhost
      // Only use external domain when VITE_HMR_HOST is explicitly set
      host: process.env.VITE_HMR_HOST || 'localhost',
      port: 3000,
      protocol: process.env.VITE_HMR_HOST ? 'wss' : 'ws', // Use ws for local, wss for external
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
        target: process.env.VITE_API_TARGET || 'http://localhost:5001',
        changeOrigin: true,
        secure: false, // Allow self-signed certificates
        ws: true
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
    include: ['leaflet', 'leaflet-control-geocoder', 'three'],
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
