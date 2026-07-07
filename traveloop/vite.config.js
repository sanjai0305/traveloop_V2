import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),

    {
      name: 'serve-legal-site',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url.startsWith('/legal-site/')) {
            const cleanUrl = req.url.split('?')[0].split('#')[0];
            const filePath = path.resolve(__dirname, '..', cleanUrl.startsWith('/') ? cleanUrl.slice(1) : cleanUrl);
            if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
              res.setHeader('Content-Type', 'text/html');
              res.end(fs.readFileSync(filePath));
              return;
            }
          }
          next();
        });
      }
    },

    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',

      manifest: {
        name: 'Traveloop',
        short_name: 'Traveloop',
        description: 'Travel Booking Platform',
        theme_color: '#0f172a',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',

        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },

      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true
      }
    })
  ],

  build: {
    chunkSizeWarningLimit: 800,

    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (
              id.includes('jspdf') ||
              id.includes('html2canvas') ||
              id.includes('purify')
            ) {
              return 'pdf-generator'
            }

            if (id.includes('lucide-react')) {
              return 'icons'
            }

            if (id.includes('framer-motion')) {
              return 'animations'
            }

            if (
              id.includes('react') ||
              id.includes('react-dom') ||
              id.includes('react-router-dom')
            ) {
              return 'react-core'
            }

            return 'vendor'
          }
        }
      }
    }
  },

  resolve: {
    alias: {
      '@shared-ui': path.resolve(__dirname, '../shared-ui/src'),
      'react': path.resolve(__dirname, './node_modules/react'),
      'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
      'lucide-react': path.resolve(__dirname, './node_modules/lucide-react'),
    }
  },
  server: {
    port: 3000,
    fs: {
      allow: ['.', '..']
    }
  }
})