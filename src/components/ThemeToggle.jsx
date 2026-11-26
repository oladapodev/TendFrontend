import Icon from './Icon.jsx'
import { useTheme } from '../app/themeContext.js'

export default function ThemeToggle({ className = '', onToggle, compact = false }) {
  const ctx = useTheme()
  if (!ctx) return null
  const { resolvedTheme, toggleTheme } = ctx
  const isDark = resolvedTheme === 'dark'
  const label = isDark ? 'Switch to light mode' : 'Switch to dark mode'

  const handleClick = () => {
    const next = isDark ? 'light' : 'dark'
    toggleTheme()
    onToggle?.(next)
  }

  if (compact) {
    return (
      <button type="button" className={`icon-btn theme-btn ${className}`.trim()} onClick={handleClick} aria-label={label} title={label}>
        <Icon name={isDark ? 'sun' : 'moon'} size={18} />
      </button>
    )
  }

  return (
    <button type="button" className={`theme-pill ${className}`.trim()} onClick={handleClick} aria-label={label} title={label}>
      <Icon name={isDark ? 'sun' : 'moon'} size={16} />
      <span>{isDark ? 'Light' : 'Dark'}</span>
    </button>
  )
}

