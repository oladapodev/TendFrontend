import { createHttpApi } from './http.js'

// Always use the same-origin backend. Production must never silently fall back to demo data.
export const api = createHttpApi(import.meta.env.VITE_API_URL || '/api')
export const isDemo = false
export { ApiError } from './http.js'
