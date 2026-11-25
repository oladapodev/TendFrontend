import { useEffect, useState } from 'react'
import Icon from '../components/Icon.jsx'
import { useStore, facilities } from './store.jsx'

// Simulated incident timeline. In the build this comes from GET /incidents/:id/stream.
function useIncident(active, targets) {
  const [rows, setRows] = useState(() => targets.map((t) => ({ ...t, status: 'queued' })))
  useEffect(() => {
    if (!active) return
    const plan = [
      [400, 0, 'calling'], [900, 1, 'calling'], [1200, 2, 'sms'],
      [2600, 1, 'answered'], [3400, 3, 'demo'], [4200, 0, 'calling2'],
      [6200, 0, 'confirmed'], [5200, 2, 'delivered'],
    ]
    const timers = plan.map(([ms, i, s]) => setTimeout(() => setRows((r) => r.map((x, n) => (n === i ? { ...x, status: s } : x))), ms))
    return () => timers.forEach(clearTimeout)
  }, [active])
  return rows
}

const statusMap = {
  queued: ['Waiting', 'grey'],
  calling: ['Calling now', 'amber'],
  calling2: ['Speaking with staff', 'amber'],
  confirmed: ['Staff confirmed they can help', 'green'],
  answered: ['Answered · aware', 'green'],
  sms: ['Sending text', 'amber'],
  delivered: ['Text delivered', 'blue'],
  demo: ['Demo alert only', 'grey'],
}

export default function Sos({ onClose }) {
  const { state } = useStore()
  const total = state.sosDelay
  const [left, setLeft] = useState(total)
  const [phase, setPhase] = useState('countdown')
  const [elapsed, setElapsed] = useState(0)

  const hospital = state.customPlaces[0] ? { name: state.customPlaces[0].name, sub: 'Your trusted hospital' } : { name: facilities[0].short, sub: 'Nearest 24h emergency · 1.8 km' }
  const targets = [
    { icon: 'hospital', ...hospital },
    ...state.contacts.slice(0, 2).map((c) => ({ icon: 'user', name: c.name, sub: c.relationship })),
    { icon: 'users', name: 'Nearby helpers', sub: '3 opted-in people within 1 km' },
  ].slice(0, 4)
  const rows = useIncident(phase === 'live', targets)

  useEffect(() => {
    if (phase !== 'countdown') return
    if (left <= 0) { setPhase('live'); return }
    const t = setTimeout(() => setLeft((l) => l - 1), 1000)
    return () => clearTimeout(t)
  }, [left, phase])

  useEffect(() => {
    if (phase !== 'live') return
    const t = setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => clearInterval(t)
  }, [phase])

  useEffect(() => {
    const k = (e) => e.key === 'Escape' && phase === 'countdown' && onClose()
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [phase, onClose])

  const r = 120
  const c = 2 * Math.PI * r
  const m = state.medical

  if (phase === 'countdown') {
    return (
      <div className="sos-overlay sos-count" role="alertdialog" aria-label="SOS countdown">
        <p className="sos-count-top"><Icon name="alert" size={18} /> Emergency SOS</p>
        <div className="sos-dial">
          <svg viewBox="0 0 280 280" width="280" height="280">
            <circle cx="140" cy="140" r={r} fill="none" stroke="rgba(255,255,255,.18)" strokeWidth="14" />
            <circle cx="140" cy="140" r={r} fill="none" stroke="#fff" strokeWidth="14" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - left / total)} transform="rotate(-90 140 140)" style={{ transition: 'stroke-dashoffset 1s linear' }} />
          </svg>
          <div className="sos-dial-num"><b key={left}>{left}</b><small>seconds</small></div>
        </div>
        <h2>Starting the call for help</h2>
        <p>We'll contact {hospital.name}, your circle and nearby helpers, and share your location and medical ID.</p>
        <div className="sos-count-actions">
          <button className="btn btn-white sos-cancel" onClick={onClose}><Icon name="x" size={20} /> Cancel</button>
          <button className="btn sos-now" onClick={() => setLeft(0)}>Send now</button>
        </div>
      </div>
    )
  }

  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0')
  const ss = String(elapsed % 60).padStart(2, '0')

  return (
    <div className="sos-overlay sos-live" role="dialog" aria-label="Help is on the way">
      <div className="sos-live-inner">
        <header className="sos-live-head">
          <span className="chip chip-red"><span className="dot dot-red" /> Incident live · {mm}:{ss}</span>
          <span className="demo-tag">Demo incident</span>
        </header>

        <div className="sos-hero-msg">
          <div className="sos-check"><Icon name="shield" size={40} stroke={1.8} /></div>
          <h1>Help is on the way</h1>
          <p>Stay where you are if it's safe. Keep your phone close. We'll show every update below.</p>
        </div>

        <div className="sos-live-grid">
          <section className="card">
            <div className="card-head"><h3>Who we're reaching</h3><small className="muted">Updated live</small></div>
            <div className="status-rows">
              {rows.map((x) => {
                const [label, tone] = statusMap[x.status]
                return (
                  <div className="status-row" key={x.name}>
                    <span className={`hv-av tone-${tone === 'grey' ? 'grey' : tone}`}><Icon name={x.icon} size={18} /></span>
                    <div className="hv-who"><strong>{x.name}</strong><small>{x.sub}</small></div>
                    <span className={`chip chip-${tone}`}>{(x.status === 'calling' || x.status === 'sms' || x.status === 'calling2') && <span className="spin" />}{label}</span>
                  </div>
                )
              })}
            </div>
            <p className="note"><Icon name="info" size={14} /> Calling is not the same as answered. We'll show failures and retry.</p>
          </section>

          <section className="card sos-med">
            <div className="card-head"><h3>Shared with responders</h3><Icon name="lock" size={16} /></div>
            <div className="sos-med-top">
              <div><small>Name</small><b>{state.profile.name || '–'}</b></div>
              <div><small>Blood</small><b className="red">{m.bloodGroup || '–'}</b></div>
              <div><small>Genotype</small><b>{m.genotype || '–'}</b></div>
            </div>
            <p className="sos-med-line"><strong>Allergies:</strong> {m.allergies.join(', ') || 'None'}</p>
            <p className="sos-med-line"><strong>Conditions:</strong> {m.conditions.join(', ') || 'None'}</p>
            <p className="sos-med-line"><Icon name="pin" size={14} /> Location shared · Abeokuta, Ogun</p>
          </section>
        </div>

        <div className="sos-live-actions">
          <a className="btn btn-danger" href="tel:112"><Icon name="phone" size={18} /> Call 112 directly</a>
          <a className="btn btn-ghost" href="#/app/cpr" onClick={onClose}><Icon name="cpr" size={18} /> Open CPR guide</a>
          <button className="btn btn-ghost" onClick={onClose}><Icon name="check" size={18} /> I'm safe, end incident</button>
        </div>
      </div>
    </div>
  )
}
