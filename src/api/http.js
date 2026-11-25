// Real backend adapter (FastAPI). Endpoints follow docs/IMPLEMENTATION_PLAN.md §6.
import { getToken, setToken, clearToken } from './session.js'

export class ApiError extends Error {
  constructor(message, status, body) {
    super(message)
    this.status = status
    this.body = body
  }
}

export function createHttpApi(baseUrl) {
  const base = baseUrl.replace(/\/$/, '')

  async function request(path, { method = 'GET', body, signal } = {}) {
    const headers = { Accept: 'application/json' }
    if (body !== undefined) headers['Content-Type'] = 'application/json'
    const token = getToken()
    if (token) headers.Authorization = `Bearer ${token}`
    let res
    try {
      res = await fetch(`${base}${path}`, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined, signal })
    } catch (e) {
      if (e.name === 'AbortError') throw e
      throw new ApiError('Network error. Check your connection.', 0)
    }
    if (res.status === 401) clearToken()
    if (!res.ok) {
      let data = null
      try { data = await res.json() } catch { /* not json */ }
      throw new ApiError(data?.detail || data?.message || `Request failed (${res.status})`, res.status, data)
    }
    if (res.status === 204) return null
    return res.json()
  }

  // Server-Sent Events over fetch, so the Authorization header can be sent (EventSource can't).
  function streamEvents(path, { method = 'GET', body, onEvent, onError, onDone }) {
    const ctrl = new AbortController()
    ;(async () => {
      try {
        const headers = { Accept: 'text/event-stream' }
        if (body !== undefined) headers['Content-Type'] = 'application/json'
        const token = getToken()
        if (token) headers.Authorization = `Bearer ${token}`
        const res = await fetch(`${base}${path}`, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined, signal: ctrl.signal })
        if (!res.ok || !res.body) throw new ApiError(`Stream failed (${res.status})`, res.status)
        const reader = res.body.pipeThrough(new TextDecoderStream()).getReader()
        let buf = ''
        for (;;) {
          const { value, done } = await reader.read()
          if (done) break
          buf += value
          let i
          while ((i = buf.indexOf('\n\n')) >= 0) {
            const chunk = buf.slice(0, i)
            buf = buf.slice(i + 2)
            const data = chunk.split('\n').filter((l) => l.startsWith('data:')).map((l) => l.slice(5).trimStart()).join('\n')
            if (!data) continue
            if (data === '[DONE]') { onDone?.(); return }
            try { onEvent(JSON.parse(data)) } catch { onEvent(data) }
          }
        }
        onDone?.()
      } catch (e) {
        if (e.name !== 'AbortError') onError?.(e)
      }
    })()
    return () => ctrl.abort()
  }

  return {
    auth: {
      // mode: 'signup' (number must be new) or 'signin' (number must exist). Server replies 409 / 404 otherwise.
      requestOtp: (phone, mode = 'signin') => request('/auth/otp', { method: 'POST', body: { phone, mode } }),
      verifyOtp: async (phone, code) => {
        const r = await request('/auth/verify', { method: 'POST', body: { phone, code } })
        setToken(r.token)
        return r
      },
      logout: () => request('/auth/logout', { method: 'POST' }).catch(() => null),
    },
    me: {
      get: () => request('/me'),
      patch: (patch) => request('/me', { method: 'PATCH', body: patch }),
    },
    contacts: {
      list: () => request('/contacts'),
      create: (c) => request('/contacts', { method: 'POST', body: c }),
      update: (id, c) => request(`/contacts/${id}`, { method: 'PUT', body: c }),
      remove: (id) => request(`/contacts/${id}`, { method: 'DELETE' }),
    },
    places: {
      list: () => request('/facilities/custom'),
      create: (p) => request('/facilities/custom', { method: 'POST', body: p }),
      remove: (id) => request(`/facilities/custom/${id}`, { method: 'DELETE' }),
    },
    facilities: {
      near: ({ lat, lng, radiusKm = 15 }) => request(`/facilities?lat=${lat}&lng=${lng}&radius=${radiusKm}`),
    },
    drugs: {
      search: (q, { limit = 20, signal } = {}) => request(`/greenbook/search?q=${encodeURIComponent(q)}&limit=${limit}`, { signal }),
      verify: (reg) => request(`/greenbook/verify/${encodeURIComponent(reg.trim())}`),
    },
    incidents: {
      create: (payload) => request('/incidents', { method: 'POST', body: payload }),
      stream: (id, handlers) => streamEvents(`/incidents/${id}/stream`, handlers),
      cancel: (id, reason) => request(`/incidents/${id}/cancel`, { method: 'POST', body: { reason } }),
    },
    diet: {
      analyse: (meals) => request('/diet/analyse', { method: 'POST', body: { meals } }),
    },
    reports: {
      list: () => request('/reports'),
      // Upload a photo/PDF; the server runs OCR and returns the values for the user to check before saving.
      extract: async (file) => {
        const form = new FormData()
        form.append('file', file)
        const headers = { Accept: 'application/json' }
        const token = getToken()
        if (token) headers.Authorization = `Bearer ${token}`
        const res = await fetch(`${base}/reports/extract`, { method: 'POST', headers, body: form })
        if (!res.ok) throw new ApiError(`Could not read the report (${res.status})`, res.status)
        return res.json()
      },
      create: (report) => request('/reports', { method: 'POST', body: report }),
      remove: (id) => request(`/reports/${id}`, { method: 'DELETE' }),
      insights: () => request('/reports/insights'),
    },
    medicines: {
      verify: (nafdacNo) => request(`/medicines/verify?nafdac=${encodeURIComponent(nafdacNo)}`),
    },
    agent: {
      chat: (messages, { lat, lng, ...handlers } = {}) => streamEvents('/agent/chat', { method: 'POST', body: { messages, lat, lng }, ...handlers }),
    },
  }
}
