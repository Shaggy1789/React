import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react()],
    server: {
      port: 5133,
      proxy: {
        '/products': { target: env.VITE_CATALOG_API || 'http://localhost:6000', changeOrigin: true },
        '/basket': { target: env.VITE_BASKET_API || 'http://localhost:6001', changeOrigin: true },
        '/api': { target: env.VITE_ORDERS_API || 'http://localhost:6002', changeOrigin: true },
      },
    },
  }
})