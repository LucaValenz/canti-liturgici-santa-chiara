import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifestFilename: 'site.webmanifest',
      includeAssets: [
        'favicon.ico',
        'favicon-96x96.png',
        'apple-touch-icon.png',
        'web-app-manifest-192x192.png',
        'web-app-manifest-512x512.png',
      ],
      manifest: {
        name: 'Canti Liturgici — Parrocchia Santa Chiara',
        short_name: 'Canti SC',
        description: 'Archivio canti liturgici con testi, spartiti e canti per le celebrazioni della Parrocchia Santa Chiara.',
        lang: 'it',
        theme_color: '#f5f0e6',
        background_color: '#f5f0e6',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/canti-liturgici-santa-chiara/',
        start_url: '/canti-liturgici-santa-chiara/',
        icons: [
          {
            src: '/canti-liturgici-santa-chiara/favicon-96x96.png',
            sizes: '96x96',
            type: 'image/png',
          },
          {
            src: '/canti-liturgici-santa-chiara/web-app-manifest-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/canti-liturgici-santa-chiara/web-app-manifest-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: '/canti-liturgici-santa-chiara/web-app-manifest-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/canti-liturgici-santa-chiara/web-app-manifest-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
        runtimeCaching: [
          {
            // Cache per i dati CSV di Google Sheets (Canti e Scaletta)
            urlPattern: /^https:\/\/docs\.google\.com\/spreadsheets\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'sheets-csv-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 giorni di validità offline
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // Cache per i Google Fonts
            urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 anno
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],
  base: '/canti-liturgici-santa-chiara/',
})
