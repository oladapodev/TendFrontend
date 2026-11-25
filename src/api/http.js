// Real backend adapter (FastAPI). Endpoints follow docs/IMPLEMENTATION_PLAN.md §6.
import { getToken, clearToken } from './session.js'

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
    mode: 'live',
    auth: {
      requestOtp: (phone) => request('/auth/otp', { method: 'POST', body: { phone } }),
      verifyOtp: (phone, code) => request('/auth/verify', { method: 'POST', body: { phone, code } }),
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
    incidents: {
      create: (payload) => request('/incidents', { method: 'POST', body: payload }),
      stream: (id, handlers) => streamEvents(`/incidents/${id}/stream`, handlers),
      cancel: (id, reason) => request(`/incidents/${id}/cancel`, { method: 'POST', body: { reason } }),
    },
    diet: {
      analyse: (meals) => request('/diet/analyse', { method: 'POST', body: { meals } }),
    },
    agent: {
      chat: (messages, handlers) => streamEvents('/agent/chat', { method: 'POST', body: { messages }, ...handlers }),
    },
  }
}
