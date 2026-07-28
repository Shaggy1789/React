import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5133,
    proxy: {
      '/products': { target: 'http://localhost:6060', changeOrigin: true },
      '/basket': { target: 'http://localhost:6060', changeOrigin: true },
    },
  },
})