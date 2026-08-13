import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(() => {
  return {
    plugins: [react()],
    server: {
      port: 5133,
      proxy: {
        '/products': { target: process.env.VITE_CATALOG_API || 'http://localhost:6000', changeOrigin: true },
        '/basket': { target: process.env.VITE_BASKET_API || 'http://localhost:6001', changeOrigin: true },
        '/api': { target: process.env.VITE_ORDERS_API || 'http://localhost:6002', changeOrigin: true },
      },
    },
  }
})