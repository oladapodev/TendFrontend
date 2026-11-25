import { createHttpApi } from './http.js'
import { createMockApi } from './mock.js'

// VITE_API_URL set → talk to the FastAPI backend. Not set → built-in demo backend in the browser.
const url = import.meta.env.VITE_API_URL

export const api = url ? createHttpApi(url) : createMockApi()
export const isDemo = api.mode === 'demo'
export { ApiError } from './http.js'
