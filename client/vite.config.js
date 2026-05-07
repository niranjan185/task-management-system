import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://task-management-system-production-6619.up.railway.app',
        changeOrigin: true
      }
    }
  }
})
