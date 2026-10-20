import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': {
        target: 'http://100.127.79.49:8088',
        changeOrigin: true,
      },
      '/obras': {
        target: 'http://100.127.79.49:8088',
        changeOrigin: true,
      },
      '/actuator': {
        target: 'http://100.127.79.49:8088',
        changeOrigin: true,
      }
    }
  }
})
