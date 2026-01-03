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
        name: 'Roots of Impact',
        short_name: 'Roots',
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
      // Enable HTTPS for camera access from external devices
      const certPath = path.resolve(__dirname, '.certificates/cert.pem');
      const keyPath = path.resolve(__dirname, '.certificates/key.pem');
      if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
        return {
          cert: fs.readFileSync(certPath),
          key: fs.readFileSync(keyPath),
        };
      }
      return false; // Fallback to HTTP if certificates don't exist
    })(),
    hmr: {
      overlay: false, // Disable overlay to prevent EPIPE errors
      port: 3000,
      clientPort: 3000, // Ensure HMR uses the same port
      protocol: 'wss', // Use secure WebSocket for HMR when HTTPS is enabled
    },
    watch: {
      // Enable polling for better file watching on WSL/Windows
      usePolling: true,
      interval: 1000,
    },
    proxy: {
      '/api': {
        target: 'http://backend:5001',
        changeOrigin: true,
        secure: false, // Allow self-signed certificates
      }
    },
    // Allow serving certificate file for installation on mobile devices
    fs: {
      allow: ['..']
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
    include: ['leaflet', 'leaflet-control-geocoder'],
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
    dedupe: ['leaflet']
  }
});
