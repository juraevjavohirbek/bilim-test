import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    fs: {
      // O‘qituvchi parollari va javoblar dev serverdan ham ochilmasin.
      deny: ['.env', '.env.*', '*.{crt,pem}', '**/.git/**', '**/server/**', '**/data/**'],
    },
    proxy: {
      '/api': { target: 'http://127.0.0.1:3001', changeOrigin: false },
    },
  },
  preview: {
    proxy: {
      '/api': { target: 'http://127.0.0.1:3001', changeOrigin: false },
    },
  },
})
