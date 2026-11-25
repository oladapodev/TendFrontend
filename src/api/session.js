// Session token storage. Moving to an httpOnly cookie set by the backend is safer once the API supports it.
const KEY = 'tendai-session'
const listeners = new Set()

export function getToken() {
  try {
    return localStorage.getItem(KEY)
  } catch {
    return null
  }
}

export function setToken(token) {
  try {
    localStorage.setItem(KEY, token)
  } catch {
    /* storage blocked */
  }
  listeners.forEach((l) => l(token))
}

export function clearToken() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* storage blocked */
  }
  listeners.forEach((l) => l(null))
}

export function onTokenChange(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
