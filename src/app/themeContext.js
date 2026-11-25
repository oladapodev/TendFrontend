import { createContext, useContext } from 'react'

export const THEME_KEY = 'tendai-theme'
export const VALID_THEMES = ['light', 'dark', 'system']

export function getStoredTheme() {
  try {
    const val = localStorage.getItem(THEME_KEY)
    return VALID_THEMES.includes(val) ? val : 'light'
  } catch {
    return 'light'
  }
}

export function storeTheme(theme) {
  try {
    localStorage.setItem(THEME_KEY, theme)
  } catch {
    /* storage blocked */
  }
}

export function resolveTheme(theme) {
  if (theme === 'system') {
    return typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return theme === 'dark' ? 'dark' : 'light'
}

export function applyThemeToDom(resolved) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.dataset.theme = resolved
  root.style.colorScheme = resolved
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', resolved === 'dark' ? '#0b1410' : '#008751')
}

export const ThemeContext = createContext(null)

export function useTheme() {
  return useContext(ThemeContext)
}

