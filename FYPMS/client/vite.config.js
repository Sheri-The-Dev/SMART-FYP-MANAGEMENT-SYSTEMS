import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'https://smart-fyp-management-systems.onrender.com',
        changeOrigin: true,
      },
      // ADD THIS - Proxy for static file uploads
      '/uploads': {
        target: 'https://smart-fyp-management-systems.onrender.com',
        changeOrigin: true,
      }
    }
  }
})