import { getInitials, getPresetByAvatar } from '../app/avatars.js'

function PresetArt({ preset }) {
  const { fg, accent, kind } = preset
  if (kind === 'emblem-shield') {
    return (
      <svg viewBox="0 0 64 64" width="100%" height="100%" aria-hidden="true">
        <rect width="64" height="64" fill={preset.bg} />
        <path d="M32 13 17 19.5v11.5c0 10.4 6.5 18.8 15 22 8.5-3.2 15-11.6 15-22V19.5L32 13Z" fill={accent} opacity="0.25" />
        <path d="M32 16 20 21.2v9.8c0 8.5 5.2 15.6 12 18.4 6.8-2.8 12-9.9 12-18.4v-9.8L32 16Z" fill="none" stroke={fg} strokeWidth="2.8" strokeLinejoin="round" />
        <path d="m26.5 32 3.8 3.8 7.6-7.6" fill="none" stroke={fg} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
  if (kind === 'emblem-pulse') {
    return (
      <svg viewBox="0 0 64 64" width="100%" height="100%" aria-hidden="true">
        <rect width="64" height="64" fill={preset.bg} />
        <circle cx="32" cy="32" r="22" fill={accent} opacity="0.22" />
        <path d="M32 49s-14-8.8-18-17.5A9.5 9.5 0 0 1 32 22.8a9.5 9.5 0 0 1 18 8.7C46 40.2 32 49 32 49Z" fill={accent} />
        <path d="M21 32h5.2l2.6-5.5 4.2 11 2.8-5.5H43" fill="none" stroke={fg} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
  if (kind === 'portrait-med') {
    return (
      <svg viewBox="0 0 64 64" width="100%" height="100%" aria-hidden="true">
        <rect width="64" height="64" fill={preset.bg} />
        <circle cx="32" cy="24" r="10.5" fill={fg} />
        <path d="M13 58c1.5-10.5 9.2-16 19-16s17.5 5.5 19 16Z" fill={accent} />
        <path d="M24 43.5v5.5a8 8 0 0 0 16 0v-5.5" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="40" cy="49" r="2.6" fill="#fff" />
      </svg>
    )
  }
  if (kind === 'portrait-scarf') {
    return (
      <svg viewBox="0 0 64 64" width="100%" height="100%" aria-hidden="true">
        <rect width="64" height="64" fill={preset.bg} />
        <path d="M19 28c0-9.5 5.8-15.5 13-15.5S45 18.5 45 28v9H19v-9Z" fill={accent} />
        <circle cx="32" cy="26" r="8.5" fill="#F3D2B3" />
        <path d="M14 58c1.8-9.8 9-15.2 18-15.2S48.2 48.2 50 58Z" fill={fg} />
      </svg>
    )
  }
  if (kind === 'portrait-glasses') {
    return (
      <svg viewBox="0 0 64 64" width="100%" height="100%" aria-hidden="true">
        <rect width="64" height="64" fill={preset.bg} />
        <path d="M14 58c1.6-10 8.8-15.5 18-15.5S48.4 48 50 58Z" fill={fg} />
        <circle cx="32" cy="25" r="10.5" fill={accent} />
        <path d="M22 22c1.5-6 5.6-8.5 10-8.5s8.5 2.5 10 8.5c-2.6-2-5.4-2.8-10-2.8S24.6 20 22 22Z" fill="#E6ECEA" />
        <rect x="24" y="23.5" width="6.5" height="4.8" rx="2" fill="none" stroke="#fff" strokeWidth="1.8" />
        <rect x="33.5" y="23.5" width="6.5" height="4.8" rx="2" fill="none" stroke="#fff" strokeWidth="1.8" />
        <path d="M30.5 25.8h3" stroke="#fff" strokeWidth="1.6" />
      </svg>
    )
  }
  if (kind === 'portrait-natural') {
    return (
      <svg viewBox="0 0 64 64" width="100%" height="100%" aria-hidden="true">
        <rect width="64" height="64" fill={preset.bg} />
        <circle cx="32" cy="22" r="14" fill={fg} />
        <circle cx="20" cy="22" r="6" fill={fg} />
        <circle cx="44" cy="22" r="6" fill={fg} />
        <circle cx="32" cy="26.5" r="9.2" fill="#D5A17A" />
        <path d="M14 58c1.6-9.8 8.8-15 18-15s16.4 5.2 18 15Z" fill={accent} />
      </svg>
    )
  }
  if (kind === 'portrait-sport') {
    return (
      <svg viewBox="0 0 64 64" width="100%" height="100%" aria-hidden="true">
        <rect width="64" height="64" fill={preset.bg} />
        <circle cx="32" cy="25" r="10.2" fill={fg} />
        <path d="M21.5 20.5c2.2-5 6.4-7 10.5-7 4.4 0 8.6 2.2 10.5 7H21.5Z" fill={accent} />
        <path d="M13 58c1.8-10.2 9.4-15.6 19-15.6s17.2 5.4 19 15.6Z" fill={accent} />
        <path d="M27 42.5 32 49l5-6.5" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 64 64" width="100%" height="100%" aria-hidden="true">
      <rect width="64" height="64" fill={preset.bg} />
      <circle cx="32" cy="24.5" r="10" fill={fg} />
      <path d="M14 58c1.6-10 8.8-15.5 18-15.5S48.4 48 50 58Z" fill={accent} />
      <circle cx="44" cy="46" r="6.5" fill="#fff" opacity="0.24" />
    </svg>
  )
}

export default function Avatar({ profile, name, avatar, size = 'md', className = '' }) {
  const src = avatar ?? profile?.avatar ?? ''
  const displayName = name ?? profile?.name ?? ''
  const sizeClass = size === 'sm' ? 'avatar-sm' : size === 'lg' ? 'avatar-lg' : size === 'xl' ? 'avatar-xl' : ''
  const preset = getPresetByAvatar(src)

  if (src && (src.startsWith('data:image/') || src.startsWith('http://') || src.startsWith('https://') || src.startsWith('/'))) {
    return (
      <span className={`avatar ${sizeClass} is-media ${className}`.trim()}>
        <img src={src} alt={displayName ? `${displayName} profile picture` : 'Profile picture'} />
      </span>
    )
  }

  if (preset) {
    return (
      <span className={`avatar ${sizeClass} is-media ${className}`.trim()} title={preset.label}>
        <PresetArt preset={preset} />
      </span>
    )
  }

  return <span className={`avatar ${sizeClass} ${className}`.trim()}>{getInitials(displayName)}</span>
}

