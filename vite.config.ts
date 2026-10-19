import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': {
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
