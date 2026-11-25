import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, NavLink, Navigate, Route, Routes, useLocation as useRouterLocation } from 'react-router'
import Icon, { Logo } from '../components/Icon.jsx'
import QueryState from '../components/QueryState.jsx'
import { useMe } from './data.js'
import { useAuth } from './auth.jsx'
import { LocationProvider, useLocation } from './location.jsx'
import { Onboarding, Permissions, profileComplete } from './Onboarding.jsx'
import { ErrorBox } from '../components/QueryState.jsx'
import { Home, Circle, Medical, Diet, Fit, Settings } from './Screens.jsx'
import { EmergencyHub, EmergencyDetail } from './Emergencies.jsx'
import Locator from './Locator.jsx'
import Verify from './Verify.jsx'
import Reports from './Reports.jsx'
import Agent from './Agent.jsx'
import Sos from './Sos.jsx'
import './app.css'

export const sections = [
  { id: 'home', path: '', label: 'Home', short: 'Home', icon: 'home' },
  { id: 'circle', path: 'circle', label: 'Emergency contacts', short: 'Contacts', icon: 'users', tone: 'green' },
  { id: 'medical', path: 'medical', label: 'Medical ID', short: 'Medical ID', icon: 'drop', tone: 'red' },
  { id: 'verify', path: 'verify', label: 'Verify medicine', short: 'Verify', icon: 'pill', tone: 'blue' },
  { id: 'locator', path: 'locator', label: 'Help Locator', short: 'Locator', icon: 'map', tone: 'blue' },
  { id: 'diet', path: 'diet', label: 'Diet', short: 'Diet', icon: 'apple', tone: 'amber' },
  { id: 'fit', path: 'fit', label: 'Fit Health', short: 'Fit', icon: 'activity', tone: 'purple' },
  { id: 'emergencies', path: 'emergencies', label: 'Common emergencies', short: 'Emergencies', icon: 'firstaid', tone: 'red' },
  { id: 'reports', path: 'reports', label: 'Health reports', short: 'Reports', icon: 'clipboard', tone: 'green' },
  { id: 'agent', path: 'agent', label: 'TendTalk agent', short: 'TendTalk', icon: 'chat' },
  { id: 'settings', path: 'settings', label: 'Settings', icon: 'settings' },
]
const byId = Object.fromEntries(sections.map((s) => [s.id, s]))
const to = (s) => `/app${s.path ? `/${s.path}` : ''}`

function LocationChip() {
  const { status, pos } = useLocation()
  if (status === 'live') return <span className="chip chip-green loc-chip"><Icon name="pin" size={14} /> Location on · ±{pos.accuracy} m</span>
  if (status === 'locating') return <span className="chip chip-amber loc-chip"><Icon name="pin" size={14} /> Finding you…</span>
  return <Link to="/app/settings" className="chip chip-grey loc-chip"><Icon name="pin" size={14} /> Location off</Link>
}

// Grouping for the mobile menu drawer (everything the bottom bar has no room for, plus the rest).
const MENU_GROUPS = [
  { title: 'Emergency', ids: ['home', 'emergencies', 'circle', 'medical', 'locator'] },
  { title: 'Everyday health', ids: ['verify', 'diet', 'fit'] },
  { title: 'AI', ids: ['agent', 'reports'] },
  { title: 'Account', ids: ['settings'] },
]

function MenuDrawer({ me, onClose, signOut }) {
  const panel = useRef(null)
  useEffect(() => {
    const opener = document.activeElement
    panel.current?.querySelector('a, button')?.focus()
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Tab' && panel.current) {
        const f = panel.current.querySelectorAll('a, button')
        const firstEl = f[0]
        const lastEl = f[f.length - 1]
        if (e.shiftKey && document.activeElement === firstEl) { e.preventDefault(); lastEl.focus() }
        else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); firstEl.focus() }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      opener?.focus?.()
    }
  }, [onClose])

  return (
    <div className="drawer-back" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <aside ref={panel} className="drawer" role="dialog" aria-modal="true" aria-label="Menu">
        <div className="drawer-head">
          <Logo size={28} />
          <button className="icon-btn" onClick={onClose} aria-label="Close menu"><Icon name="x" size={22} /></button>
        </div>
        <nav className="drawer-nav">
          {MENU_GROUPS.map((g) => (
            <div key={g.title} className="drawer-group">
              <small>{g.title}</small>
              {g.ids.map((id) => {
                const s = byId[id]
                return (
                  <NavLink key={id} to={to(s)} end={id === 'home'} onClick={onClose} className={({ isActive }) => `drawer-item ${isActive ? 'is-active' : ''}`}>
                    <span className={`drawer-ico ${s.tone ? `tone-${s.tone}` : 'tone-grey'}`}><Icon name={s.icon} size={18} /></span>
                    <span>{s.label}</span>
                    <Icon name="chevronRight" size={16} />
                  </NavLink>
                )
              })}
            </div>
          ))}
        </nav>
        <div className="drawer-foot">
          <span className="avatar">{(me.profile.name || 'Y')[0].toUpperCase()}</span>
          <div>
            <strong>{me.profile.name || 'You'}</strong>
            <small>{me.phone}</small>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => { onClose(); signOut() }}><Icon name="logout" size={16} /> Sign out</button>
        </div>
      </aside>
    </div>
  )
}

function Shell({ me }) {
  const { signOut } = useAuth()
  const [sosOpen, setSosOpen] = useState(false)
  // Sidebar collapse is a per-browser preference.
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('tendai-rail-collapsed') === '1'
    } catch {
      return false
    }
  })
  const toggleRail = () =>
    setCollapsed((c) => {
      try {
        localStorage.setItem('tendai-rail-collapsed', c ? '0' : '1')
      } catch {
        /* storage blocked */
      }
      return !c
    })
  const { pathname } = useRouterLocation()
  const seg = pathname.replace(/^\/app\/?/, '').split('/')[0]
  const current = sections.find((s) => s.path === seg) || byId.home
  const first = me.profile.name.split(' ')[0] || 'there'
  const hr = new Date().getHours()
  const greeting = hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening'
  const startSos = () => setSosOpen(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const closeMenu = useCallback(() => setMenuOpen(false), [])
  useEffect(() => setMenuOpen(false), [pathname])

  return (
    <div className={`shell ${collapsed ? 'rail-collapsed' : ''}`}>
      <aside className="rail" aria-label="Sidebar">
        <div className="rail-head">
          <Link to="/" className="rail-logo" aria-label="TendAI home">{collapsed ? <Logo size={30} compact /> : <Logo size={30} />}</Link>
          <button className="icon-btn rail-toggle" onClick={toggleRail} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} aria-expanded={!collapsed} title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
            <Icon name={collapsed ? 'chevronRight' : 'chevronLeft'} size={18} />
          </button>
        </div>
        <nav className="rail-nav">
          {sections.filter((s) => s.id !== 'settings').map((s) => (
            <NavLink key={s.id} to={to(s)} end={s.id === 'home'} title={collapsed ? s.label : undefined} aria-label={collapsed ? s.label : undefined} className={({ isActive }) => `rail-item ${isActive ? 'is-active' : ''} ${s.id === 'agent' ? 'is-agent' : ''}`}>
              <Icon name={s.icon} size={20} />
              <span>{s.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="rail-foot">
          <NavLink to="/app/settings" title={collapsed ? 'Settings' : undefined} aria-label={collapsed ? 'Settings' : undefined} className={({ isActive }) => `rail-item ${isActive ? 'is-active' : ''}`}>
            <Icon name="settings" size={20} /><span>Settings</span>
          </NavLink>
          <div className="rail-user" title={collapsed ? `${me.profile.name} · ${me.phone}` : undefined}>
            <span className="avatar">{first[0]?.toUpperCase()}</span>
            <div>
              <strong>{me.profile.name || 'You'}</strong>
              <small>{me.phone}</small>
            </div>
            <button className="icon-btn" onClick={signOut} aria-label="Sign out" title="Sign out"><Icon name="logout" size={18} /></button>
          </div>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="topbar-left">
            <button className="icon-btn topbar-menu" onClick={() => setMenuOpen(true)} aria-label="Open menu" aria-expanded={menuOpen} aria-haspopup="dialog">
              <Icon name="menu" size={22} />
            </button>
            <Link to="/" className="topbar-logo"><Logo size={28} /></Link>
            <div className="topbar-title">
              <h1>{current.id === 'home' ? `${greeting}, ${first}` : current.label}</h1>
              {current.id === 'home' && <p>Your 24/7 safety net &amp; health companion.</p>}
            </div>
          </div>
          <div className="topbar-right">
            <LocationChip />
            <button className="sos-pill" onClick={startSos} aria-label="Start emergency SOS">
              <span className="sos-pill-dot" /> SOS
            </button>
          </div>
        </header>

        <main className="content">
          <Routes>
            <Route index element={<Home me={me} onSos={startSos} />} />
            <Route path="circle" element={<Circle />} />
            <Route path="medical" element={<Medical me={me} />} />
            <Route path="verify" element={<Verify />} />
            <Route path="reports" element={<Reports />} />
            <Route path="locator" element={<Locator />} />
            <Route path="diet" element={<Diet me={me} />} />
            <Route path="fit" element={<Fit me={me} />} />
            <Route path="emergencies" element={<EmergencyHub onSos={startSos} />} />
            <Route path="emergencies/:id" element={<EmergencyDetail onSos={startSos} />} />
            <Route path="cpr" element={<Navigate to="/app/emergencies/cpr" replace />} />
            <Route path="agent" element={<Agent me={me} />} />
            <Route path="settings" element={<Settings me={me} />} />
            <Route path="*" element={<Navigate to="/app" replace />} />
          </Routes>
        </main>
      </div>

      <nav className="bottombar" aria-label="Main">
        {/* Bottom bar has room for 5; everything else (Fit, Diet, Reports, …) is in the hamburger menu. */}
        {[byId.home, byId.locator, byId.agent, byId.medical, byId.circle].map((s) => (
          <NavLink key={s.id} to={to(s)} end={s.id === 'home'} className={({ isActive }) => `bb-item ${isActive ? 'is-active' : ''} ${s.id === 'agent' ? 'bb-agent' : ''}`}>
            <span className="bb-ico"><Icon name={s.icon} size={s.id === 'agent' ? 26 : 22} /></span>
            <span>{s.short}</span>
          </NavLink>
        ))}
      </nav>

      {menuOpen && <MenuDrawer me={me} onClose={closeMenu} signOut={signOut} />}
      {sosOpen && <Sos me={me} onClose={() => setSosOpen(false)} />}
    </div>
  )
}

function Gate() {
  const me = useMe()
  const { signOut } = useAuth()
  return (
    <div className="gate">
      <QueryState query={me} loadingLabel="Loading your profile…" errorTitle="Couldn't load your profile">
        {(data) => {
          // Phone comes from sign-in; without it the account can't be used for SOS call-backs.
          if (!data.phone) {
            return (
              <div className="gate-msg">
                <ErrorBox title="Your phone number is missing" error={{ message: 'Please sign in again with your phone number.' }} />
                <button className="btn btn-primary" onClick={signOut}>Sign in again</button>
              </div>
            )
          }
          // Name and age are required: anyone missing them goes back through onboarding.
          if (!data.onboarded || !profileComplete(data)) return <Onboarding me={data} />
          if (!data.permissionsDone) return <Permissions />
          return <Shell me={data} />
        }}
      </QueryState>
    </div>
  )
}

export default function WebApp() {
  return (
    <LocationProvider>
      <Gate />
    </LocationProvider>
  )
}
