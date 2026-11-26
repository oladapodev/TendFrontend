import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // `npm run dev` proxies /api to the backend so the browser never needs CORS.
  // Default to the deployed backend server if no local BACKEND_URL is provided.
  const backend = env.BACKEND_URL || 'http://102-209-47-220.sslip.io'
  const isDirectFastAPI = backend.includes('localhost:') || backend.includes('127.0.0.1:')
  return {
    plugins: [react()],
    resolve: {
      dedupe: ['react', 'react-dom'],
    },
    server: {
      proxy: {
        '/api': {
          target: backend,
          changeOrigin: true,
          ...(isDirectFastAPI ? { rewrite: (p) => p.replace(/^\/api/, '') } : {}),
        },
      },
    },
  }
})
