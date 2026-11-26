import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // `npm run dev` proxies /api to the backend so the browser never needs CORS.
  const backend = env.BACKEND_URL || 'http://localhost:8000'
  return {
    plugins: [react()],
    resolve: {
      dedupe: ['react', 'react-dom'],
    },
    server: {
      proxy: {
        '/api': { target: backend, changeOrigin: true, rewrite: (p) => p.replace(/^\/api/, '') },
      },
    },
  }
})
