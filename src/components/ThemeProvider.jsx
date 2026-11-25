import { useCallback, useEffect, useState } from 'react'
import { ThemeContext, VALID_THEMES, applyThemeToDom, getStoredTheme, resolveTheme, storeTheme } from '../app/themeContext.js'

export default function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getStoredTheme)
  const [systemPref, setSystemPref] = useState(() => resolveTheme('system'))
  const resolvedTheme = theme === 'system' ? systemPref : theme

  useEffect(() => {
    applyThemeToDom(resolvedTheme)
  }, [resolvedTheme])

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (e) => setSystemPref(e.matches ? 'dark' : 'light')
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const setTheme = useCallback((next) => {
    const clean = VALID_THEMES.includes(next) ? next : 'light'
    storeTheme(clean)
    setThemeState(clean)
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }, [resolvedTheme, setTheme])

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

