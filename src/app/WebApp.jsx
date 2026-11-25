import { useState } from 'react'
import Icon, { Logo } from '../components/Icon.jsx'
import { go } from '../router.js'
import { StoreProvider, useStore } from './store.jsx'
import { Onboarding, Permissions } from './Onboarding.jsx'
import { Home, Circle, Medical, Diet, Fit, Cpr, Settings } from './Screens.jsx'
import Locator from './Locator.jsx'
import Agent from './Agent.jsx'
import Sos from './Sos.jsx'
import './app.css'

export const sections = [
  { id: 'home', path: '/app', label: 'Home', icon: 'home' },
  { id: 'circle', path: '/app/circle', label: 'Emergency contacts', short: 'Contacts', icon: 'users', tone: 'green' },
  { id: 'medical', path: '/app/medical', label: 'Medical ID', short: 'Medical ID', icon: 'drop', tone: 'red' },
  { id: 'locator', path: '/app/locator', label: 'Help Locator', short: 'Locator', icon: 'map', tone: 'blue' },
  { id: 'diet', path: '/app/diet', label: 'Diet', short: 'Diet', icon: 'apple', tone: 'amber' },
  { id: 'fit', path: '/app/fit', label: 'Fit Health', short: 'Fit', icon: 'activity', tone: 'purple' },
  { id: 'cpr', path: '/app/cpr', label: 'CPR guide', short: 'CPR', icon: 'cpr', tone: 'red' },
  { id: 'agent', path: '/app/agent', label: 'TendTalk agent', short: 'TendTalk', icon: 'chat' },
  { id: 'settings', path: '/app/settings', label: 'Settings', icon: 'settings' },
]

function Shell({ route }) {
  const { state } = useStore()
  const [sosOpen, setSosOpen] = useState(false)
  const current = sections.find((s) => s.path === route) || sections[0]
  const screens = { home: Home, circle: Circle, medical: Medical, locator: Locator, diet: Diet, fit: Fit, cpr: Cpr, agent: Agent, settings: Settings }
  const Screen = screens[current.id]
  const startSos = () => setSosOpen(true)
  const first = state.profile.name.split(' ')[0] || 'there'

  return (
    <div className="shell">
      <aside className="rail">
        <a href="#/" className="rail-logo"><Logo size={30} /></a>
        <nav className="rail-nav">
          {sections.filter((s) => s.id !== 'settings').map((s) => (
            <a key={s.id} href={`#${s.path}`} className={`rail-item ${s.id === current.id ? 'is-active' : ''} ${s.id === 'agent' ? 'is-agent' : ''}`}>
              <Icon name={s.icon} size={20} />
              <span>{s.label}</span>
            </a>
          ))}
        </nav>
        <div className="rail-foot">
          <a href="#/app/settings" className={`rail-item ${current.id === 'settings' ? 'is-active' : ''}`}>
            <Icon name="settings" size={20} /><span>Settings</span>
          </a>
          <div className="rail-user">
            <span className="avatar">{first[0]?.toUpperCase()}</span>
            <div>
              <strong>{state.profile.name || 'Guest'}</strong>
              <small>Blood group {state.medical.bloodGroup || '–'}</small>
            </div>
          </div>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="topbar-left">
            <a href="#/" className="topbar-logo"><Logo size={28} /></a>
            <div className="topbar-title">
              <h1>{current.id === 'home' ? `Hello, ${first}` : current.label}</h1>
              {current.id === 'home' && <p>You're set up. Help is one press away.</p>}
            </div>
          </div>
          <div className="topbar-right">
            <span className="chip chip-green loc-chip"><Icon name="pin" size={14} /> Abeokuta, Ogun</span>
            <button className="sos-pill" onClick={startSos} aria-label="Start emergency SOS">
              <span className="sos-pill-dot" /> SOS
            </button>
          </div>
        </header>

        <main className="content">
          <Screen onSos={startSos} />
        </main>
      </div>

      <nav className="bottombar" aria-label="Main">
        {[sections[0], sections[3], sections[7], sections[2], sections[1]].map((s) => (
          <a key={s.id} href={`#${s.path}`} className={`bb-item ${s.id === current.id ? 'is-active' : ''} ${s.id === 'agent' ? 'bb-agent' : ''}`}>
            <span className="bb-ico"><Icon name={s.icon} size={s.id === 'agent' ? 26 : 22} /></span>
            <span>{s.id === 'home' ? 'Home' : s.short}</span>
          </a>
        ))}
      </nav>

      {sosOpen && <Sos onClose={() => setSosOpen(false)} />}
    </div>
  )
}

function Gate({ route }) {
  const { state } = useStore()
  if (!state.onboarded) return <Onboarding />
  if (!state.permissionsDone) return <Permissions />
  return <Shell route={route} />
}

export default function WebApp({ route }) {
  return (
    <StoreProvider>
      <Gate route={route} />
    </StoreProvider>
  )
}

export { go }
