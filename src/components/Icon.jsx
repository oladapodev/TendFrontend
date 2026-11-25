// Small inline icon set (24px grid, 2px stroke) so the mockup has no icon dependency.
const paths = {
  heart: <path d="M12 20s-7-4.4-9.2-9A5 5 0 0 1 12 5.6 5 5 0 0 1 21.2 11C19 15.6 12 20 12 20Z" />,
  pulse: <path d="M3 12h4l2-5 4 10 2-5h6" />,
  users: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
      <path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.2A6.5 6.5 0 0 1 21.5 20" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
  drop: <path d="M12 3s6 6.4 6 11a6 6 0 0 1-12 0c0-4.6 6-11 6-11Z" />,
  clipboard: (
    <>
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 4V3h6v1M9 10h6M9 14h6M9 18h3" />
    </>
  ),
  apple: (
    <>
      <path d="M12 7c-2-1.6-6-1.4-7 2.4-.9 3.4 1.2 9.6 4 10.4 1.2.4 2-.4 3-.4s1.8.8 3 .4c2.8-.8 4.9-7 4-10.4C18 5.6 14 5.4 12 7Z" />
      <path d="M12 7c0-2 1-3.5 3-4" />
    </>
  ),
  activity: (
    <>
      <circle cx="13.5" cy="4.5" r="1.8" />
      <path d="M9 21l2.5-6.5L14 17v4M7 11l3-3 3.5 1.5L16 13h3M11.5 14.5 10 9" />
    </>
  ),
  map: (
    <>
      <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z" />
      <path d="M9 4v14M15 6v14" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21Z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </>
  ),
  hospital: (
    <>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M12 7v6M9 10h6M10 21v-4h4v4" />
    </>
  ),
  phone: <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />,
  message: <path d="M4 5h16v11H9l-5 4V5Z" />,
  chat: (
    <>
      <path d="M4 5h16v11H9l-5 4V5Z" />
      <path d="M8 10h.01M12 10h.01M16 10h.01" />
    </>
  ),
  sparkle: <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3ZM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16Z" />,
  home: (
    <>
      <path d="M3 11 12 4l9 7" />
      <path d="M5 10v10h14V10" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  check: <path d="m5 12 4.5 4.5L19 7" />,
  x: <path d="M6 6l12 12M18 6 6 18" />,
  chevronRight: <path d="m9 6 6 6-6 6" />,
  chevronLeft: <path d="m15 6-6 6 6 6" />,
  arrowRight: <path d="M5 12h14M13 6l6 6-6 6" />,
  navigation: <path d="M3 11 21 3l-8 18-2-8-8-2Z" />,
  shield: (
    <>
      <path d="M12 3 5 6v5c0 4.5 3 8.3 7 10 4-1.7 7-5.5 7-10V6l-7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  bell: (
    <>
      <path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4l2-2Z" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  flame: <path d="M12 21a6 6 0 0 0 6-6c0-4-3-6-4-10-2 2-3 4-3 6-1-1-1.5-2-1.5-3C7 10 6 12.5 6 15a6 6 0 0 0 6 6Z" />,
  footprints: (
    <>
      <path d="M7 15c-1.5 0-3-1.5-3-4.5S5 4 7 4s3 2.5 3 5-1.5 6-3 6ZM5 18.5a2 2 0 1 0 4 0v-1H5v1Z" />
      <path d="M17 11c1.5 0 3-1.5 3-4.5S19 2 17 2s-3 2.5-3 4.5 1.5 4.5 3 4.5ZM15 14.5a2 2 0 1 0 4 0v-1h-4v1Z" />
    </>
  ),
  moon: <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />,
  scale: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="3" />
      <path d="M8 9a4 4 0 0 1 8 0M12 9l1.5-2" />
    </>
  ),
  send: <path d="M4 12 20 4l-6 16-2.5-6.5L4 12Z" />,
  mic: (
    <>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
    </>
  ),
  alert: (
    <>
      <path d="M12 3 2 20h20L12 3Z" />
      <path d="M12 10v4M12 17h.01" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </>
  ),
  edit: <path d="M4 20h4L19 9l-4-4L4 16v4ZM13.5 6.5l4 4" />,
  trash: <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </>
  ),
  star: <path d="m12 3 2.7 5.6 6.1.8-4.5 4.2 1.1 6-5.4-3-5.4 3 1.1-6L3.2 9.4l6.1-.8L12 3Z" />,
  lock: (
    <>
      <rect x="5" y="10" width="14" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  logout: <path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10" />,
  water: (
    <>
      <path d="M6 3h12l-1.5 17a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1L6 3Z" />
      <path d="M6.6 9h10.8" />
    </>
  ),
  cpr: (
    <>
      <circle cx="12" cy="5" r="2" />
      <path d="M7 21l2-7h6l2 7M9 14 7 9l5 2 5-2-2 5" />
    </>
  ),
  firstaid: (
    <>
      <rect x="3" y="6" width="18" height="14" rx="2.5" />
      <path d="M9 6V4h6v2M12 10v6M9 13h6" />
    </>
  ),
  pill: (
    <>
      <rect x="3" y="8.5" width="18" height="7" rx="3.5" transform="rotate(-45 12 12)" />
      <path d="m9.5 9.5 5 5" />
    </>
  ),
  scan: (
    <>
      <path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3" />
      <path d="M8 12h8" />
    </>
  ),
  leaf: <path d="M11 20A7 7 0 0 1 4 13C4 7 11 3 20 3c0 9-4 16-11 16ZM4 20l7-7" />,
  fish: <path d="M6.5 12c.94-3.46 4.94-6 8.5-6 3.56 0 6.06 2.54 7 6-.94 3.46-3.44 6-7 6s-7.56-2.54-8.5-6ZM2 16l4.5-4L2 8v8ZM18 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />,
  bowl: <path d="M4 11h16a1 1 0 0 1 1 1c0 5-4 9-9 9s-9-4-9-9a1 1 0 0 1 1-1ZM7 8l2-4M12 8l1-4M17 8l-1-4" />,
  utensils: (
    <>
      <path d="M18 2v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V2M15 11v11M5 2v4a3 3 0 0 0 3 3 3 3 0 0 0 3-3V2M8 9v13" />
    </>
  ),
  external: <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />,
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.5 3.5 6 3.5 9s-1 6.5-3.5 9c-2.5-2.5-3.5-6-3.5-9s1-6.5 3.5-9Z" />
    </>
  ),
  camera: (
    <>
      <path d="M4 8a2 2 0 0 1 2-2h2.5l1.5-2h4l1.5 2H18a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8Z" />
      <circle cx="12" cy="13" r="3.5" />
    </>
  ),
  upload: <path d="M12 16V4M7 9l5-5 5 5M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />,
  download: <path d="M12 4v12M7 11l5 5 5-5M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />,
  eye: (
    <>
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
      <circle cx="12" cy="12" r="2.8" />
    </>
  ),
  eyeOff: (
    <>
      <path d="M3 3l18 18M10.6 10.6a2.8 2.8 0 0 0 3.8 3.8M9.9 5.2A10.7 10.7 0 0 1 12 5c6.5 0 10 7 10 7a17.7 17.7 0 0 1-3.3 4.3M6.6 6.6C4 8.3 2 12 2 12s3.5 7 10 7c1.6 0 3-.4 4.3-1" />
    </>
  ),
  key: (
    <>
      <circle cx="7.5" cy="15.5" r="4.5" />
      <path d="m10.8 12.2 8.2-8.2M16 7l3 3M18.5 4.5l2 2" />
    </>
  ),
  sliders: (
    <>
      <path d="M4 6h16M4 12h16M4 18h16" />
      <circle cx="9" cy="6" r="2" fill="var(--surface, #fff)" />
      <circle cx="15" cy="12" r="2" fill="var(--surface, #fff)" />
      <circle cx="10" cy="18" r="2" fill="var(--surface, #fff)" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 11a8 8 0 0 0-14.5-4.5L3 9M3 4v5h5M4 13a8 8 0 0 0 14.5 4.5L21 15M21 20v-5h-5" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </>
  ),
  laptop: (
    <>
      <rect x="4" y="5" width="16" height="11" rx="2" />
      <path d="M2 19h20" />
    </>
  ),
  checkCircle: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12.2 2.4 2.4 4.6-4.8" />
    </>
  ),
  volume: (
    <>
      <path d="M11 5 6 9H3v6h3l5 4V5Z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  monitor: (
    <>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8M12 16v4" />
    </>
  ),
}

export default function Icon({ name, size = 20, stroke = 2, className, style, fill = 'none' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  )
}

export function Logo({ size = 32, light = false, compact = false }) {
  if (compact) {
    return (
      <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
        <rect width="40" height="40" rx="12" fill={light ? '#fff' : '#008751'} />
        <path d="M20 30s-9-5.6-11.6-11.4A6.3 6.3 0 0 1 20 13.1a6.3 6.3 0 0 1 11.6 5.5C29 24.4 20 30 20 30Z" fill={light ? '#008751' : '#fff'} />
        <path d="M14 20h3.2l1.6-3.4 2.6 6.6 1.6-3.2H26" fill="none" stroke={light ? '#fff' : '#008751'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
  return (
    <span className="logo" style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
        <rect width="40" height="40" rx="12" fill={light ? '#fff' : '#008751'} />
        <path
          d="M20 30s-9-5.6-11.6-11.4A6.3 6.3 0 0 1 20 13.1a6.3 6.3 0 0 1 11.6 5.5C29 24.4 20 30 20 30Z"
          fill={light ? '#008751' : '#fff'}
        />
        <path d="M14 20h3.2l1.6-3.4 2.6 6.6 1.6-3.2H26" fill="none" stroke={light ? '#fff' : '#008751'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span style={{ fontWeight: 800, fontSize: size * 0.62, letterSpacing: '-0.02em', color: light ? '#fff' : 'var(--ink-900)' }}>
        Tend<span style={{ color: light ? '#d9f0e3' : 'var(--green-text)' }}>AI</span>
      </span>
    </span>
  )
}
