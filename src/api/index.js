import { createHttpApi } from './http.js'

// Every screen talks to the TendAI backend (FastAPI + Postgres + Qdrant + NAFDAC service).
// Default `/api` works behind the Caddy web container and the Vite dev proxy (vite.config.js).
const url = import.meta.env.VITE_API_URL || '/api'

export const api = createHttpApi(url)
export { ApiError } from './http.js'
