import { useState } from 'react'
import { Link, NavLink, Navigate, Route, Routes, useLocation as useRouterLocation } from 'react-router'
import Icon, { Logo } from '../components/Icon.jsx'
import QueryState from '../components/QueryState.jsx'
import { isDemo } from '../api/index.js'
import { useMe } from './data.js'
import { useAuth } from './auth.jsx'
import { LocationProvider, useLocation } from './location.jsx'
import { Onboarding, Permissions, profileComplete } from './Onboarding.jsx'
import { ErrorBox } from '../components/QueryState.jsx'
import { Home, Circle, Medical, Diet, Fit, Cpr, Settings } from './Screens.jsx'
import Locator from './Locator.jsx'
import Agent from './Agent.jsx'
import Sos from './Sos.jsx'
import './app.css'

export const sections = [
  { id: 'home', path: '', label: 'Home', short: 'Home', icon: 'home' },
  { id: 'circle', path: 'circle', label: 'Emergency contacts', short: 'Contacts', icon: 'users', tone: 'green' },
  { id: 'medical', path: 'medical', label: 'Medical ID', short: 'Medical ID', icon: 'drop', tone: 'red' },
  { id: 'locator', path: 'locator', label: 'Help Locator', short: 'Locator', icon: 'map', tone: 'blue' },
  { id: 'diet', path: 'diet', label: 'Diet', short: 'Diet', icon: 'apple', tone: 'amber' },
  { id: 'fit', path: 'fit', label: 'Fit Health', short: 'Fit', icon: 'activity', tone: 'purple' },
  { id: 'cpr', path: 'cpr', label: 'CPR guide', short: 'CPR', icon: 'cpr', tone: 'red' },
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

function Shell({ me }) {
  const { signOut } = useAuth()
  const [sosOpen, setSosOpen] = useState(false)
  const { pathname } = useRouterLocation()
  const seg = pathname.replace(/^\/app\/?/, '').split('/')[0]
  const current = sections.find((s) => s.path === seg) || byId.home
  const first = me.profile.name.split(' ')[0] || 'there'
  const startSos = () => setSosOpen(true)

  return (
    <div className="shell">
      <aside className="rail">
        <Link to="/" className="rail-logo"><Logo size={30} /></Link>
        <nav className="rail-nav">
          {sections.filter((s) => s.id !== 'settings').map((s) => (
            <NavLink key={s.id} to={to(s)} end={s.id === 'home'} className={({ isActive }) => `rail-item ${isActive ? 'is-active' : ''} ${s.id === 'agent' ? 'is-agent' : ''}`}>
              <Icon name={s.icon} size={20} />
              <span>{s.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="rail-foot">
          <NavLink to="/app/settings" className={({ isActive }) => `rail-item ${isActive ? 'is-active' : ''}`}>
            <Icon name="settings" size={20} /><span>Settings</span>
          </NavLink>
          <div className="rail-user">
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
            <Link to="/" className="topbar-logo"><Logo size={28} /></Link>
            <div className="topbar-title">
              <h1>{current.id === 'home' ? `Hello, ${first}` : current.label}</h1>
              {current.id === 'home' && <p>Help is one press away.</p>}
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
            <Route path="locator" element={<Locator />} />
            <Route path="diet" element={<Diet me={me} />} />
            <Route path="fit" element={<Fit me={me} />} />
            <Route path="cpr" element={<Cpr />} />
            <Route path="agent" element={<Agent me={me} />} />
            <Route path="settings" element={<Settings me={me} />} />
            <Route path="*" element={<Navigate to="/app" replace />} />
          </Routes>
        </main>
      </div>

      <nav className="bottombar" aria-label="Main">
        {[byId.home, byId.locator, byId.agent, byId.medical, byId.circle].map((s) => (
          <NavLink key={s.id} to={to(s)} end={s.id === 'home'} className={({ isActive }) => `bb-item ${isActive ? 'is-active' : ''} ${s.id === 'agent' ? 'bb-agent' : ''}`}>
            <span className="bb-ico"><Icon name={s.icon} size={s.id === 'agent' ? 26 : 22} /></span>
            <span>{s.short}</span>
          </NavLink>
        ))}
      </nav>

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
