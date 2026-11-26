import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// Gateway (reverse proxy) terminates auth and injects headers.
// All API calls go through it with credentials: include (HttpOnly cookie).
const GATEWAY_TARGET = process.env.GATEWAY_URL ?? 'http://localhost:8000'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    // Proxy /api to the Gateway during local dev so the HttpOnly
    // FitnessApp-Auth cookie stays same-origin.
    proxy: {
      '/api': {
        target: GATEWAY_TARGET,
        changeOrigin: true,
      },
    },
  },
})
