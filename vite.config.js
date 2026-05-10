import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  server: {
    proxy: {
      '/api/whoop-token': {
        target: 'https://api.prod.whoop.com',
        changeOrigin: true,
        rewrite: () => '/oauth/oauth2/token',
      },
      '/api/whoop-api': {
        target: 'https://api.prod.whoop.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/whoop-api/, '/developer/v1'),
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      devOptions: { enabled: false },
      registerType: 'autoUpdate',
      manifest: {
        name: 'Personal Dashboard',
        short_name: 'Dashboard',
        description: 'Personal productivity dashboard',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/firestore\.googleapis\.com\//,
            handler: 'NetworkFirst',
          },
        ],
      },
    }),
  ],
})
