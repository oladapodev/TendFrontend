import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import Icon from '../components/Icon.jsx'
import QueryState, { Spinner } from '../components/QueryState.jsx'
import { useContacts, useSaveContact, useDeleteContact, usePlaces, useUpdateMe, useAnalyseDiet, useFacilities } from './data.js'
import { useLocation } from './location.jsx'
import { bmi } from './Onboarding.jsx'
import i18next from 'i18next'
import { Capacitor } from '@capacitor/core'
import { Health } from 'capacitor-health'

// Mock Firebase - replace with actual config when backend is ready
const firebase = {
  messaging: {
    isSupported: () => false,
    onMessage: () => {},
    requestPermission: () => Promise.resolve('denied')
  }
}

// Mock push notification permission request
export async function requestPushNotificationPermission() {
  return 'denied'
}
// Save FCM token to backend
export async function saveFcmToken(token) {
  try {
    await api.push.saveToken(token)
  } catch (error) {
    console.error('Error saving FCM token:', error)
  }
}

// On message received handler
export function onMessage(callback) {
  if (messaging) {
    messaging.onMessage((payload) => {
      callback(payload)
    })
  }
}

// On token refresh handler
export function onTokenRefresh(callback) {
  if (messaging) {
    messaging.onTokenRefresh((newToken) => {
      callback(newToken)
    })
  }
}

/* ---------- shared bits ---------- */

export function Modal({ title, onClose, children, footer, wide }) {
  const ref = useRef(null)
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    const prev = document.activeElement
    const onKey = (e) => {
      if (e.key === 'Escape') onCloseRef.current?.()
      if (e.key === 'Tab' && ref.current) {
        const f = ref.current.querySelectorAll('button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])')
        if (!f.length) return
        const first = f[0]
        const last = f[f.length - 1]
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      prev?.focus?.()
    }
  }, [])
  return (
    <div className="modal-back" onMouseDown={(e) => e.target === e.currentTarget && onCloseRef.current?.()}>
      <div ref={ref} className={`modal ${wide ? 'modal-wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <header className="modal-head">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={() => onCloseRef.current?.()} aria-label="Close"><Icon name="x" size={20} /></button>
        </header>
        <div className="modal-body">{children}</div>
        {footer && <footer className="modal-foot">{footer}</footer>}
      </div>
    </div>
  )
}

function TagInput({ value, onChange, placeholder, suggestions = [], label }) {
  const [t, setT] = useState('')
  const add = (v) => {
    const s = v.trim()
    if (s && !value.includes(s)) onChange([...value, s])
    setT('')
  }
  return (
    <div className="tags">
      <div className="tags-box">
        {value.map((v) => (
          <span className="tag" key={v}>
            {v}
            <button type="button" onClick={() => onChange(value.filter((x) => x !== v))} aria-label={`Remove ${v}`}><Icon name="x" size={12} stroke={3} /></button>
          </span>
        ))}
        <input
          aria-label={label}
          value={t}
          placeholder={value.length ? 'Add another…' : placeholder}
          onChange={(e) => setT(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(t) }
            if (e.key === 'Backspace' && !t && value.length) onChange(value.slice(0, -1))
          }}
          onBlur={() => t && add(t)}
        />
      </div>
      {suggestions.length > 0 && (
        <div className="tags-sugg">
          {suggestions.filter((s) => !value.includes(s)).map((s) => (
            <button type="button" key={s} onClick={() => add(s)}><Icon name="plus" size={12} stroke={3} /> {s}</button>
          ))}
        </div>
      )}
    </div>
  )
}

export function SectionHead({ icon, tone, title, text, action }) {
  return (
    <div className="sec-head">
      <span className={`sec-ico tone-${tone}`}><Icon name={icon} size={24} /></span>
      <div className="sec-head-text">
        <h2>{title}</h2>
        <p>{text}</p>
      </div>
      {action}
    </div>
  )
}

function SaveState({ mutation }) {
  if (mutation.isPending) return <span className="save-state">Saving…</span>
  if (mutation.isError) return <span className="save-state is-err"><Icon name="alert" size={14} /> Not saved: {mutation.error.message}</span>
  if (mutation.isSuccess) return <span className="save-state is-ok"><Icon name="check" size={14} stroke={3} /> Saved</span>
  return null
}

/* ---------- Home ---------- */

export function Home({ me, onSos }) {
  const contacts = useContacts()
  const places = usePlaces()
  const loc = useLocation()
  const facilities = useFacilities(loc.center)
  const updateMe = useUpdateMe()
  const m = me.medical
  const nearest = facilities.data?.[0]
  const nContacts = contacts.data?.length
  const delay = me.settings?.sosDelay || 5

  const tiles = [
    { id: 'circle', icon: 'users', tone: 'green', label: 'Emergency contacts', meta: nContacts == null ? '…' : nContacts ? `${nContacts} in your circle` : 'Add your first contact' },
    { id: 'medical', icon: 'drop', tone: 'red', label: 'Medical ID', meta: m.bloodGroup ? `${m.bloodGroup} · Genotype ${m.genotype || '–'}` : 'Add blood group' },
    { id: 'locator', icon: 'map', tone: 'blue', label: 'Help Locator', meta: nearest ? `Nearest care ${nearest.distanceKm} km` : 'Find care near you' },
    { id: 'verify', icon: 'pill', tone: 'blue', label: 'Verify medicine', meta: 'Check a NAFDAC number' },
    { id: 'diet', icon: 'apple', tone: 'amber', label: 'Diet', meta: me.dietResult ? 'Plan ready' : "Log today's meals" },
    { id: 'fit', icon: 'activity', tone: 'purple', label: 'Fit Health', meta: `${me.fit.steps.toLocaleString()} steps today` },
    { id: 'emergencies', icon: 'firstaid', tone: 'red', label: 'Common emergencies', meta: 'CPR, choking, burns and more' },
    { id: 'agent', icon: 'chat', tone: 'green', label: 'Talk to TendTalk', meta: 'Ask a health question' },
  ]
  const checks = [
    { label: 'Name & profile', ok: !!me.profile.name, link: '/app/settings' },
    { label: 'Device location', ok: loc.status === 'live', link: '/app/settings' },
    { label: '2+ emergency contacts', ok: (nContacts || 0) >= 2, link: '/app/circle' },
    { label: 'Medical ID (Blood group)', ok: !!m.bloodGroup, link: '/app/medical' },
    { label: 'Trusted hospital', ok: (places.data?.length || 0) > 0, link: '/app/locator' },
  ]
  const done = checks.filter((c) => c.ok).length
  const nextStep = checks.find((c) => !c.ok)

  const quickAddWater = (e) => {
    e.preventDefault()
    e.stopPropagation()
    const current = me.fit?.waterCups || 0
    updateMe.mutate({ fit: { ...me.fit, waterCups: current + 1 } })
  }

  return (
    <div className="home">
      {/* 1. TOP READINESS & QUICK SAFETY STATUS */}
      <section className="safety-strip card" aria-label="Safety status">
        <div className="safety-strip-left">
          <span className={`safety-badge ${done === checks.length ? 'is-complete' : 'is-pending'}`}>
            <Icon name={done === checks.length ? 'check' : 'shield'} size={18} stroke={done === checks.length ? 3 : 2} />
            <span>{done === checks.length ? 'Fully Protected' : `${done} of ${checks.length} safety steps ready`}</span>
          </span>
          {nextStep ? (
            <Link to={nextStep.link} className="safety-next-link">
              <span>Next recommended step:</span>
              <strong>{nextStep.label} <Icon name="arrowRight" size={14} /></strong>
            </Link>
          ) : (
            <span className="safety-all-good">All emergency protections active</span>
          )}
        </div>
        <div className="safety-quick-chips">
          <Link to="/app/locator" className="chip chip-grey" title="Your current location">
            <Icon name="pin" size={13} /> {loc.status === 'live' ? 'Live GPS' : 'Central Abeokuta'}
          </Link>
          <Link to="/app/circle" className="chip chip-green" title="Emergency contacts">
            <Icon name="users" size={13} /> {nContacts ? `${nContacts} Contact${nContacts === 1 ? '' : 's'}` : 'Add contacts'}
          </Link>
          <Link to="/app/medical" className="chip chip-red" title="Medical ID">
            <Icon name="drop" size={13} /> {m.bloodGroup ? `${m.bloodGroup} · ${m.genotype || 'AA'}` : 'Medical ID'}
          </Link>
        </div>
      </section>

      {/* 2. THE EMERGENCY SOS HERO CARD */}
      <section className="sos-hero" aria-label="Emergency help button">
        <div className="sos-hero-copy">
          <div className="sos-hero-eyebrow">
            <span className="chip chip-red"><Icon name="shield" size={14} /> Emergency Helpline</span>
            <span className="sos-live-pill"><span className="pulse-dot" /> 24/7 Response Active</span>
          </div>
          <h2>In an emergency? Press SOS.</h2>
          <p className="sos-hero-desc">
            One touch immediately starts the emergency response: contacting your nearest hospital, notifying your family with your live location, and alerting local helpers.
          </p>
          <div className="sos-hero-timer-note">
            <Icon name="info" size={15} />
            <span>Accidental touch? You have <strong>{delay} seconds</strong> to cancel before alerts go out.</span>
          </div>
          <div className="sos-hero-actions">
            <a className="btn btn-call-emergency" href="tel:112">
              <Icon name="phone" size={18} />
              <span>Call 112 directly</span>
            </a>
            <Link className="btn btn-ghost btn-sm" to="/app/settings?tab=safety">
              <Icon name="clock" size={16} /> Change cancel timer ({delay}s)
            </Link>
          </div>
        </div>

        <div className="sos-btn-container">
          <button className="sos-big" onClick={onSos} aria-label="Start emergency SOS">
            <span className="sos-big-ring" />
            <span className="sos-big-ring ring-secondary" />
            <span className="sos-big-core">
              <strong>SOS</strong>
              <small>Press for help</small>
            </span>
          </button>
        </div>
      </section>

      {/* 3. URGENT CARE & PRIMARY LIFELINE CARDS */}
      <section className="home-section" aria-label="Emergency care tools">
        <div className="section-title-row">
          <div>
            <h3 className="section-title">Emergency Care &amp; Lifelines</h3>
            <p className="section-subtitle">Core services ready when you or someone around you needs immediate assistance.</p>
          </div>
        </div>

        <div className="primary-cards-grid">
          {/* Card 1: Nearest Hospital */}
          <Link to="/app/locator" className="service-card tone-blue">
            <div className="service-card-top">
              <span className="service-icon"><Icon name="hospital" size={26} /></span>
              <span className="service-chip chip chip-blue">24h Emergency</span>
            </div>
            <div className="service-card-content">
              <h4>Nearest Hospital</h4>
              <strong className="service-main-text">{nearest?.short || nearest?.name || 'Federal Medical Centre'}</strong>
              <p className="service-desc">
                {nearest ? `${nearest.distanceKm} km away · ${nearest.open || '24 hours open'}` : 'Idi-Aba, Abeokuta · 1.8 km away'}
              </p>
            </div>
            <div className="service-card-footer">
              <span>View map &amp; phone numbers</span>
              <Icon name="arrowRight" size={16} />
            </div>
          </Link>

          {/* Card 2: Emergency Contacts */}
          <Link to="/app/circle" className="service-card tone-green">
            <div className="service-card-top">
              <span className="service-icon"><Icon name="users" size={26} /></span>
              <span className="service-chip chip chip-green">TendCircle</span>
            </div>
            <div className="service-card-content">
              <h4>Emergency Contacts</h4>
              <strong className="service-main-text">
                {nContacts ? `${nContacts} people in your circle` : 'No contacts added yet'}
              </strong>
              <p className="service-desc">
                {nContacts ? 'Called and sent SMS with your live location during an SOS.' : 'Add trusted family, friends or your doctor to be notified.'}
              </p>
            </div>
            <div className="service-card-footer">
              <span>{nContacts ? 'Manage your circle' : '+ Add someone you trust'}</span>
              <Icon name="arrowRight" size={16} />
            </div>
          </Link>

          {/* Card 3: Medical ID */}
          <Link to="/app/medical" className="service-card tone-red">
            <div className="service-card-top">
              <span className="service-icon"><Icon name="drop" size={26} /></span>
              <span className="service-chip chip chip-red">Responder ID</span>
            </div>
            <div className="service-card-content">
              <h4>Medical Information</h4>
              <strong className="service-main-text">
                {m.bloodGroup ? `Blood ${m.bloodGroup} · Genotype ${m.genotype || '–'}` : 'Blood group not set'}
              </strong>
              <p className="service-desc">
                {m.allergies?.length ? `Allergies: ${m.allergies.slice(0, 2).join(', ')}${m.allergies.length > 2 ? '…' : ''}` : 'Shown to paramedics and emergency doctors on arrival.'}
              </p>
            </div>
            <div className="service-card-footer">
              <span>View or update Medical ID</span>
              <Icon name="arrowRight" size={16} />
            </div>
          </Link>

          {/* Card 4: CPR Guide */}
          <Link to="/app/cpr" className="service-card tone-amber">
            <div className="service-card-top">
              <span className="service-icon"><Icon name="cpr" size={26} stroke={1.8} /></span>
              <span className="service-chip chip chip-amber">First Aid</span>
            </div>
            <div className="service-card-content">
              <h4>CPR Life-Saver Guide</h4>
              <strong className="service-main-text">Hands-Only CPR</strong>
              <p className="service-desc">
                Step-by-step adult chest compressions at 100–120 bpm until help arrives.
              </p>
            </div>
            <div className="service-card-footer">
              <span>Open CPR guide &amp; rhythm</span>
              <Icon name="arrowRight" size={16} />
            </div>
          </Link>
        </div>
      </section>

      {/* 4. EVERYDAY HEALTH & COMPANION SECTION */}
      <section className="home-section" aria-label="Everyday health companion">
        <div className="section-title-row">
          <div>
            <h3 className="section-title">Everyday Health &amp; Prevention</h3>
            <p className="section-subtitle">Simple, easy-to-use tools to stay healthy, eat well, and prepare for medical visits.</p>
          </div>
        </div>

        <div className="companion-grid">
          {/* TendTalk AI Assistant Prompt Card */}
          <article className="ai-companion-card">
            <div className="ai-companion-header">
              <span className="ai-badge-icon"><Icon name="sparkle" size={22} /></span>
              <div>
                <h4>TendTalk Health Assistant</h4>
                <p>Have a question or symptom? Ask in simple words, just like speaking to a clinic nurse.</p>
              </div>
            </div>
            <div className="ai-quick-prompts">
              <span className="prompt-label">Common questions:</span>
              <div className="prompt-chips">
                <Link to="/app/agent" className="prompt-pill">
                  <Icon name="chat" size={14} /> What should I do if someone faints?
                </Link>
                <Link to="/app/agent" className="prompt-pill">
                  <Icon name="chat" size={14} /> Explain sickle cell genotype in simple words
                </Link>
                <Link to="/app/agent" className="prompt-pill">
                  <Icon name="chat" size={14} /> Foods that help lower blood pressure
                </Link>
              </div>
            </div>
            <div className="ai-companion-foot">
              <Link to="/app/agent" className="btn btn-primary btn-sm">
                <span>Start conversation</span>
                <Icon name="arrowRight" size={16} />
              </Link>
              <small className="ai-disclaimer">AI provides guidance, not diagnosis.</small>
            </div>
          </article>

          {/* Diet & Nutrition Card */}
          <article className="companion-tile">
            <div className="companion-tile-head">
              <span className="tile-ico tone-amber"><Icon name="apple" size={24} /></span>
              <span className="chip chip-amber">Nigerian Diet</span>
            </div>
            <h4>Daily Meal Guidance</h4>
            <p className="companion-tile-desc">
              {me.dietResult
                ? 'Your meal plan is active: balanced starch with leafy greens (ugwu, ewedu) and protein.'
                : 'Log common Nigerian meals (eba, rice, beans, yam) to get personalized portion & fruit advice.'}
            </p>
            <Link to="/app/diet" className="companion-tile-btn">
              <span>{me.dietResult ? 'View diet plan' : 'Log today’s meals'}</span>
              <Icon name="arrowRight" size={16} />
            </Link>
          </article>

          {/* Fit & Hydration Card */}
          <article className="companion-tile">
            <div className="companion-tile-head">
              <span className="tile-ico tone-purple"><Icon name="activity" size={24} /></span>
              <span className="chip chip-purple">Daily Activity</span>
            </div>
            <h4>Movement &amp; Hydration</h4>
            <div className="fit-mini-stats">
              <div className="fit-stat-row">
                <span><Icon name="footprints" size={15} /> Steps today</span>
                <strong>{me.fit.steps.toLocaleString()} / {me.fit.stepGoal.toLocaleString()}</strong>
              </div>
              <div className="fit-bar-small">
                <span style={{ width: `${Math.min(100, Math.round((me.fit.steps / me.fit.stepGoal) * 100))}%` }} />
              </div>
              <div className="water-quick-row">
                <div>
                  <small><Icon name="water" size={14} /> Water intake</small>
                  <strong>{me.fit.waterCups || 0} / {me.fit.waterGoal || 8} cups</strong>
                </div>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm quick-water-btn"
                  onClick={quickAddWater}
                  title="Log 1 cup of water"
                  aria-label="Add 1 cup of water"
                >
                  <Icon name="plus" size={14} stroke={3} /> +1 Cup
                </button>
              </div>
            </div>
            <Link to="/app/fit" className="companion-tile-btn" style={{ marginTop: 12 }}>
              <span>Open Fit Health</span>
              <Icon name="arrowRight" size={16} />
            </Link>
          </article>
        </div>

        {/* AI: health report comparison */}
        <Link to="/app/reports" className="ai-report-card">
          <span className="ai-badge-icon"><Icon name="clipboard" size={22} /></span>
          <div className="ai-report-text">
            <span className="chip chip-green"><Icon name="sparkle" size={12} /> AI · Health reports</span>
            <h4>Compare your lab results over time</h4>
            <p>Upload a lab report and TendAI reads the values, compares them with your past results, flags anything out of range and suggests questions for your doctor.</p>
          </div>
          <span className="btn btn-primary btn-sm">Open reports <Icon name="arrowRight" size={16} /></span>
        </Link>
      </section>
    </div>
  )
}

/* ---------- Emergency contacts ---------- */

const relationships = ['Parent', 'Sibling', 'Spouse / Partner', 'Child', 'Friend', 'Neighbour', 'Colleague', 'Doctor', 'Trusted person', 'Other']
const validPhone = (p) => p.replace(/\D/g, '').length >= 10

export function Circle() {
  const contacts = useContacts()
  const places = usePlaces()
  const saveC = useSaveContact()
  const delC = useDeleteContact()
  const empty = { name: '', phone: '', relationship: 'Sibling', notify: ['call', 'sms'] }
  const [edit, setEdit] = useState(null)
  const close = () => { setEdit(null); saveC.reset() }
  const save = () => saveC.mutate({ ...edit, name: edit.name.trim(), phone: edit.phone.trim() }, { onSuccess: close })
  const toggle = (k) => setEdit({ ...edit, notify: edit.notify.includes(k) ? edit.notify.filter((x) => x !== k) : [...edit.notify, k] })

  return (
    <div className="page">
      <SectionHead
        icon="users" tone="green" title="Emergency contacts"
        text="The people TendSOS calls and texts when you press SOS. You decide how each one is reached."
        action={<button className="btn btn-primary" onClick={() => setEdit(empty)}><Icon name="plus" size={18} /> Add contact</button>}
      />

      <QueryState query={contacts} loadingLabel="Loading contacts…">
        {(list) => (
          <div className="contact-grid">
            {list.map((c, n) => (
              <article className="contact" key={c.id}>
                <span className="contact-order">{n + 1}</span>
                <span className="avatar avatar-lg">{c.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}</span>
                <div className="contact-body">
                  <strong>{c.name}</strong>
                  <span className="chip chip-green">{c.relationship}</span>
                  <small><Icon name="phone" size={13} /> {c.phone}</small>
                  <div className="contact-via">
                    {c.notify?.includes('call') && <span className="chip chip-grey"><Icon name="phone" size={12} /> Call</span>}
                    {c.notify?.includes('sms') && <span className="chip chip-grey"><Icon name="message" size={12} /> SMS</span>}
                    {c.notify?.includes('whatsapp') && <span className="chip chip-grey"><Icon name="chat" size={12} /> WhatsApp</span>}
                  </div>
                </div>
                <div className="contact-actions">
                  <button className="icon-btn" onClick={() => setEdit(c)} aria-label={`Edit ${c.name}`}><Icon name="edit" size={18} /></button>
                  <button className="icon-btn" onClick={() => window.confirm(`Remove ${c.name} from your emergency contacts?`) && delC.mutate(c.id)} aria-label={`Remove ${c.name}`}><Icon name="trash" size={18} /></button>
                </div>
              </article>
            ))}
            <button className="contact contact-add" onClick={() => setEdit(empty)}>
              <span className="tile-ico tone-green"><Icon name="plus" size={24} /></span>
              <strong>{list.length ? 'Add someone you trust' : 'Add your first emergency contact'}</strong>
              <small>Family, friends, or your doctor</small>
            </button>
          </div>
        )}
      </QueryState>
      {delC.isError && <p className="form-error"><Icon name="alert" size={16} /> Couldn't remove: {delC.error.message}</p>}

      {places.data?.length > 0 && (
        <>
          <h3 className="h-label">Your trusted hospitals</h3>
          <div className="contact-grid">
            {places.data.map((p) => (
              <article className="contact" key={p.id}>
                <span className="tile-ico tone-blue"><Icon name="hospital" size={22} /></span>
                <div className="contact-body">
                  <strong>{p.name}</strong>
                  <small><Icon name="phone" size={13} /> {p.phone}</small>
                  {p.address && <small>{p.address}</small>}
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      <p className="note"><Icon name="info" size={16} /> Contacts are reached in this order. Each person only receives what you allow in Settings.</p>

      {edit && (
        <Modal
          title={edit.id ? 'Edit contact' : 'Add emergency contact'}
          onClose={close}
          footer={
            <>
              <button className="btn btn-ghost" onClick={close}>Cancel</button>
              <button className="btn btn-primary" disabled={!edit.name.trim() || !validPhone(edit.phone) || !edit.notify.length || saveC.isPending} onClick={save}>
                {saveC.isPending ? 'Saving…' : 'Save contact'}
              </button>
            </>
          }
        >
          <div className="form">
            <label className="field"><span>Full name</span>
              <input className="input" autoFocus value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} placeholder="e.g. Adaeze Okafor" />
            </label>
            <label className="field"><span>Phone number</span>
              <input className="input" type="tel" value={edit.phone} onChange={(e) => setEdit({ ...edit, phone: e.target.value })} placeholder="+234 803 123 4567" />
            </label>
            <div className="field"><span>Relationship</span>
              <div className="choice-row choice-wrap">
                {relationships.map((r) => (
                  <button key={r} type="button" className={`choice choice-sm ${edit.relationship === r ? 'on' : ''}`} onClick={() => setEdit({ ...edit, relationship: r })}>{r}</button>
                ))}
              </div>
            </div>
            <div className="field"><span>How should we reach them?</span>
              <div className="choice-row choice-wrap">
                {[['call', 'Phone call', 'phone'], ['sms', 'SMS', 'message'], ['whatsapp', 'WhatsApp', 'chat']].map(([k, l, i]) => (
                  <button key={k} type="button" className={`choice choice-sm ${edit.notify.includes(k) ? 'on' : ''}`} onClick={() => toggle(k)}><Icon name={i} size={14} /> {l}</button>
                ))}
              </div>
            </div>
            {saveC.isError && <p className="form-error"><Icon name="alert" size={16} /> {saveC.error.message}</p>}
          </div>
        </Modal>
      )}
    </div>
  )
}

/* ---------- Medical ID ---------- */

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const genotypes = ['AA', 'AS', 'AC', 'SS', 'SC']

export function Medical({ me }) {
  const save = useUpdateMe()
  const [m, setM] = useState(me.medical)
  const timer = useRef(null)
  // Debounced autosave: chips save at once, typing waits 800 ms.
  const set = (k, v, delay = 0) => {
    const next = { ...m, [k]: v }
    setM(next)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => save.mutate({ medical: next }), delay)
  }
  useEffect(() => () => clearTimeout(timer.current), [])
  const p = me.profile

  return (
    <div className="page">
      <SectionHead icon="drop" tone="red" title="Medical ID" text="Emergency information for responders and the hospital. It is shared only during an SOS, and only the fields you allow." action={<SaveState mutation={save} />} />

      <div className="med-layout">
        <div className="card form">
          <div className="field"><span>Blood group</span>
            <div className="choice-row choice-wrap">
              {bloodGroups.map((g) => (
                <button key={g} className={`choice choice-sq ${m.bloodGroup === g ? 'on on-red' : ''}`} aria-pressed={m.bloodGroup === g} onClick={() => set('bloodGroup', g)}>{g}</button>
              ))}
            </div>
          </div>
          <div className="field"><span>Genotype</span>
            <div className="choice-row choice-wrap">
              {genotypes.map((g) => (
                <button key={g} className={`choice choice-sq ${m.genotype === g ? 'on' : ''}`} aria-pressed={m.genotype === g} onClick={() => set('genotype', g)}>{g}</button>
              ))}
            </div>
          </div>
          <div className="field"><span>Allergies</span>
            <TagInput label="Allergies" value={m.allergies} onChange={(v) => set('allergies', v)} placeholder="Type and press Enter" suggestions={['Penicillin', 'Sulfa drugs', 'Peanuts', 'Shellfish', 'Latex']} />
          </div>
          <div className="field"><span>Known infections</span>
            <TagInput label="Known infections" value={m.infections} onChange={(v) => set('infections', v)} placeholder="e.g. Hepatitis B" suggestions={['Hepatitis B', 'Hepatitis C', 'HIV', 'Tuberculosis']} />
          </div>
          <div className="field"><span>Medical conditions</span>
            <TagInput label="Medical conditions" value={m.conditions} onChange={(v) => set('conditions', v)} placeholder="e.g. Asthma" suggestions={['Asthma', 'Diabetes', 'Hypertension', 'Sickle cell', 'Epilepsy']} />
          </div>
          <div className="field"><span>Current medications</span>
            <TagInput label="Current medications" value={m.medications} onChange={(v) => set('medications', v)} placeholder="e.g. Metformin 500mg" />
          </div>
          <label className="field"><span>Notes for responders</span>
            <textarea className="input" value={m.notes} onChange={(e) => set('notes', e.target.value, 800)} placeholder="Anything a first responder should know" />
          </label>
        </div>

        <aside className="med-card-wrap">
          <div className="med-card">
            <div className="med-card-head">
              <span><Icon name="heart" size={18} fill="currentColor" stroke={0} /> Medical ID</span>
              <span className="demo-tag" style={{ background: 'rgba(255,255,255,.2)', color: '#fff' }}>Shared in SOS</span>
            </div>
            <strong className="med-name">{p.name || 'Your name'}</strong>
            <small>{[p.age && `${p.age} yrs`, p.sex, p.heightCm && `${p.heightCm} cm`, p.weightKg && `${p.weightKg} kg`].filter(Boolean).join(' · ')}</small>
            <div className="med-big">
              <div><small>Blood group</small><b>{m.bloodGroup || '–'}</b></div>
              <div><small>Genotype</small><b>{m.genotype || '–'}</b></div>
            </div>
            <dl>
              <dt>Allergies</dt><dd>{m.allergies.join(', ') || 'None recorded'}</dd>
              <dt>Infections</dt><dd>{m.infections.join(', ') || 'None recorded'}</dd>
              <dt>Conditions</dt><dd>{m.conditions.join(', ') || 'None recorded'}</dd>
              <dt>Medication</dt><dd>{m.medications.join(', ') || 'None recorded'}</dd>
            </dl>
          </div>
          <p className="note"><Icon name="lock" size={16} /> Saved automatically. Choose which fields are shared in <Link className="link-btn" to="/app/settings?tab=safety">Settings</Link>.</p>
        </aside>
      </div>
    </div>
  )
}

/* ---------- Diet ---------- */

const foodCategories = [
  {
    name: 'Swallows & Grains',
    chips: ['Eba', 'Amala', 'Pounded yam', 'Jollof rice', 'White rice', 'Beans', 'Bread & tea', 'Yam', 'Garri', 'Indomie'],
  },
  {
    name: 'Proteins',
    chips: ['Fish (mackerel/tilapia)', 'Chicken', 'Boiled egg', 'Moi moi', 'Akara', 'Beef / Suya'],
  },
  {
    name: 'Soups & Leafy Greens',
    chips: ['Ugwu soup', 'Ewedu', 'Okra soup', 'Egusi', 'Spinach (efo riro)', 'Vegetables'],
  },
  {
    name: 'Fruits & Hydration',
    chips: ['Orange', 'Banana', 'Pawpaw', 'Watermelon', 'Tiger nuts', 'Groundnuts', 'Water (2 cups)', 'Zobo (unsweetened)'],
  },
]

const emptyMeals = { breakfast: '', lunch: '', dinner: '', snacks: '' }

const mealMeta = {
  breakfast: { label: 'Breakfast', time: '7:00 – 9:00 AM', icon: 'sparkle', tone: 'amber', placeholder: 'e.g. Bread, egg and tea, or Akara and pap' },
  lunch: { label: 'Lunch', time: '12:30 – 2:30 PM', icon: 'apple', tone: 'green', placeholder: 'e.g. Jollof rice with grilled fish and salad' },
  dinner: { label: 'Dinner', time: '6:30 – 8:00 PM', icon: 'moon', tone: 'purple', placeholder: 'e.g. Small portion of eba with ugwu soup and fish' },
  snacks: { label: 'Snacks & Drinks', time: 'Mid-morning & Afternoon', icon: 'water', tone: 'blue', placeholder: 'e.g. Groundnuts, banana, sliced pawpaw, 2 cups of water' },
}

export function Diet({ me }) {
  const analyse = useAnalyseDiet()
  const [open, setOpen] = useState(false)
  const [meals, setMeals] = useState(me.meals || emptyMeals)
  const [focus, setFocus] = useState('breakfast')
  const r = me.dietResult

  const addChip = (k, chipText) => {
    setMeals((prev) => {
      const existing = (prev[k] || '').trim()
      const clean = chipText.replace(/\s*\(.*?\)/, '') // clean e.g. "Fish (mackerel)" -> "Fish"
      if (!existing) return { ...prev, [k]: clean }
      if (existing.toLowerCase().includes(clean.toLowerCase())) return prev
      return { ...prev, [k]: `${existing}, ${clean}` }
    })
  }

  const openForMeal = (mealKey) => {
    setFocus(mealKey)
    setOpen(true)
  }

  const submit = () => analyse.mutate(meals, { onSuccess: () => setOpen(false) })
  const hasLoggedAny = Object.values(me.meals || {}).some((v) => (v || '').trim())

  return (
    <div className="page diet-page">
      {/* 1. Header with clear purpose and actions */}
      <SectionHead
        icon="apple"
        tone="amber"
        title="Diet & Nutrition"
        text="Personalized guidance for Nigerian meals. Learn to balance traditional swallows, boost leafy greens (ugwu, ewedu), and protect your health."
        action={
          <button className="btn btn-primary" onClick={() => setOpen(true)}>
            <Icon name="plus" size={18} /> {hasLoggedAny ? 'Update meals' : 'Log daily meals'}
          </button>
        }
      />

      {/* 2. Educational Hero: The Balanced Nigerian Plate Infographic */}
      <section className="diet-plate-hero card" aria-label="The balanced Nigerian plate">
        <div className="plate-hero-copy">
          <div className="hero-eyebrow">
            <Icon name="sparkle" size={14} /> The 50 / 25 / 25 Nigerian Plate Rule
          </div>
          <h2>How to balance traditional meals</h2>
          <p className="hero-lead">
            You do not need foreign diets to live long and stay healthy. Traditional Nigerian staples are natural powerhouses when portioned with balance:
          </p>

          <div className="plate-breakdown">
            <div className="plate-part part-veg">
              <span className="plate-pct">50%</span>
              <div className="plate-part-info">
                <div className="plate-part-title-row">
                  <strong>Leafy Soups &amp; Vegetables</strong>
                  <span className="plate-tag tag-green">Abundant</span>
                </div>
                <small>Ugwu, ewedu, okra, efo riro, garden eggs, spinach</small>
              </div>
            </div>

            <div className="plate-part part-protein">
              <span className="plate-pct">25%</span>
              <div className="plate-part-info">
                <div className="plate-part-title-row">
                  <strong>Quality Proteins</strong>
                  <span className="plate-tag tag-amber">Essential</span>
                </div>
                <small>Fresh/smoked fish, boiled eggs, beans, moi moi, chicken</small>
              </div>
            </div>

            <div className="plate-part part-carb">
              <span className="plate-pct">25%</span>
              <div className="plate-part-info">
                <div className="plate-part-title-row">
                  <strong>Swallow &amp; Whole Carbs</strong>
                  <span className="plate-tag tag-orange">Controlled</span>
                </div>
                <small>Amala (yam flour), eba, pounded yam, brown/ofada rice</small>
              </div>
            </div>
          </div>
        </div>

        <div className="plate-visual-col">
          <div className="plate-ceramic-wrapper">
            <div className="plate-visual">
              <div className="plate-segment seg-veg" title="50% Leafy Greens & Soups">
                <span className="segment-icon"><Icon name="leaf" size={18} /></span>
                <span className="segment-pct">50%</span>
                <span className="segment-name">Greens &amp; Soups</span>
              </div>
              <div className="plate-right-half">
                <div className="plate-segment seg-protein" title="25% Quality Protein">
                  <span className="segment-icon"><Icon name="fish" size={15} /></span>
                  <span className="segment-pct">25%</span>
                  <span className="segment-name">Protein</span>
                </div>
                <div className="plate-segment seg-carb" title="25% Swallow / Starch">
                  <span className="segment-icon"><Icon name="bowl" size={15} /></span>
                  <span className="segment-pct">25%</span>
                  <span className="segment-name">Swallows</span>
                </div>
              </div>
              <div className="plate-center" title="Balanced Nigerian Plate">
                <span className="plate-center-icon"><Icon name="utensils" size={18} /></span>
              </div>
            </div>
            <div className="plate-floating-badge badge-top-left">
              <Icon name="leaf" size={13} />
              <span>High Fiber</span>
            </div>
            <div className="plate-floating-badge badge-top-right">
              <Icon name="activity" size={13} />
              <span>Lean Protein</span>
            </div>
            <div className="plate-floating-badge badge-bottom">
              <Icon name="pulse" size={13} />
              <span>Steady Blood Sugar</span>
            </div>
          </div>
          <p className="plate-caption">Ideal Lunch &amp; Dinner Proportion Guide</p>
        </div>
      </section>

      {/* 3. Daily Meal Grid (Shows what was logged or gives 1-tap open) */}
      <section className="diet-meals-section" aria-label="Today's logged meals">
        <div className="section-title-row">
          <div>
            <h3 className="section-title">Today's Meals</h3>
            <p className="section-subtitle">Tap any meal card to add foods or update what you ate.</p>
          </div>
        </div>

        <div className="diet-meals-grid">
          {Object.entries(mealMeta).map(([k, meta]) => {
            const loggedText = (me.meals && me.meals[k]) || ''
            return (
              <div key={k} className={`diet-meal-card ${loggedText ? 'is-logged' : 'is-empty'}`} onClick={() => openForMeal(k)}>
                <div className="diet-meal-head">
                  <span className={`tile-ico tone-${meta.tone}`}><Icon name={meta.icon} size={22} /></span>
                  <div>
                    <strong>{meta.label}</strong>
                    <small>{meta.time}</small>
                  </div>
                  <span className="meal-card-action-badge">
                    {loggedText ? <Icon name="check" size={14} stroke={3} /> : <Icon name="plus" size={14} stroke={3} />}
                  </span>
                </div>
                <div className="diet-meal-body">
                  {loggedText ? (
                    <div className="logged-meal-content">
                      <div className="logged-chips-wrap">
                        {loggedText.split(/,|\n/).map((s) => s.trim()).filter(Boolean).map((food, i) => (
                          <span key={i} className="logged-chip">
                            <span className="chip-bullet" />
                            {food}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="empty-meal-hint-box">
                      <span className="empty-hint-icon"><Icon name="plus" size={16} /></span>
                      <p className="empty-meal-hint">Nothing logged yet. Tap to record this meal.</p>
                    </div>
                  )}
                </div>
                <div className="diet-meal-foot">
                  <span className="meal-foot-action">{loggedText ? 'Edit meal' : '+ Log this meal'}</span>
                  <span className="meal-foot-arrow"><Icon name="chevronRight" size={15} /></span>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* 4. Recommendations & Eating Schedule */}
      {r ? (
        <div className="diet-results-layout">
          <section className="diet-recs-column">
            <h3 className="h-label"><Icon name="sparkle" size={16} /> Personalized Recommendations</h3>
            <div className="rec-list">
              {r.recommendations?.map((x) => (
                <article className="rec card" key={x.title}>
                  <span className={`tile-ico tone-${x.tone || 'green'}`}><Icon name={x.icon || 'sparkle'} size={24} /></span>
                  <div className="rec-body">
                    <div className="rec-head">
                      <strong>{x.title}</strong>
                      {x.tag && <span className="chip chip-grey">{x.tag}</span>}
                    </div>
                    <p>{x.text}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <aside className="diet-sidebar-column">
            <div className="card diet-schedule-card">
              <div className="schedule-head">
                <Icon name="clock" size={20} />
                <h3>Recommended Daily Timing</h3>
              </div>
              <p className="schedule-sub">Eating at steady times prevents acid reflux and stabilizes blood sugar.</p>
              <ol className="timeline">
                {r.schedule?.map((s) => (
                  <li key={s.time + s.label}>
                    <span className="tl-time">{s.time}</span>
                    <div className="tl-body">
                      <strong>{s.label}</strong>
                      <small>{s.detail}</small>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </aside>
        </div>
      ) : null}

      {/* 5. TendDiet Wisdom (Full-Width Section) */}
      <section className="diet-wisdom-section" aria-label="TendDiet Wisdom">
        <div className="diet-wisdom-card">
          <div className="wisdom-card-header">
            <span className="wisdom-badge">
              <Icon name="sparkle" size={14} /> TendDiet Wisdom
            </span>
            <span className="wisdom-tag">Nigerian Culinary Health</span>
          </div>
          <h4 className="wisdom-title">Ancient Wisdom, Modern Science</h4>
          <p className="wisdom-lead">
            Healthy living in Nigeria doesn't mean abandoning our cultural foods. These simple kitchen habits protect your heart and blood pressure:
          </p>

          <div className="wisdom-items-grid">
            <div className="wisdom-item">
              <div className="wisdom-item-head">
                <span className="wisdom-item-badge tone-emerald">Heart &amp; BP</span>
                <strong>Cut seasoning cubes in half</strong>
              </div>
              <p>
                Flavor soups with <em>iru</em> (locust beans), ground crayfish, fresh garlic, ginger, and scotch bonnet peppers. You get authentic umami taste with over 50% less sodium.
              </p>
            </div>

            <div className="wisdom-item">
              <div className="wisdom-item-head">
                <span className="wisdom-item-badge tone-blue">Portion Control</span>
                <strong>The pre-meal water ritual</strong>
              </div>
              <p>
                Drink a large glass of clean water 15 minutes before swallow meals. It activates digestive juices, curbs overeating, and stops post-meal lethargy.
              </p>
            </div>

            <div className="wisdom-item">
              <div className="wisdom-item-head">
                <span className="wisdom-item-badge tone-amber">Glucose Balance</span>
                <strong>The 2-to-1 soup-to-swallow ratio</strong>
              </div>
              <p>
                Serve double the bowl volume of leafy vegetable soup relative to your swallow ball. Leafy fiber slows glucose absorption and keeps blood sugar steady.
              </p>
            </div>
          </div>
        </div>
      </section>

      <p className="note" style={{ marginTop: 28 }}>
        <Icon name="info" size={16} /> {r?.note || 'AI can explain and organise. It is not a clinical diagnosis.'} Always consult a certified dietitian or medical practitioner for clinical diabetes, renal, or ulcer diets.
      </p>

      {/* 5. The Meal Logging Modal */}
      {open && (
        <Modal
          wide
          title="What do your daily meals contain?"
          onClose={() => setOpen(false)}
          footer={
            <>
              {analyse.isError && (
                <span className="save-state is-err" style={{ marginRight: 'auto' }}>
                  <Icon name="alert" size={14} /> {analyse.error.message}
                </span>
              )}
              <button className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={submit}
                disabled={analyse.isPending || !Object.values(meals).some((v) => (v || '').trim())}
              >
                {analyse.isPending ? 'Analysing your diet…' : <>Generate recommendations <Icon name="sparkle" size={16} /></>}
              </button>
            </>
          }
        >
          <div className="meal-modal-inner">
            {/* Meal Selector Tabs */}
            <div className="meal-tabs-row" role="tablist" aria-label="Select meal to edit">
              {['breakfast', 'lunch', 'dinner', 'snacks'].map((k) => (
                <button
                  type="button"
                  key={k}
                  className={`meal-tab ${focus === k ? 'is-active' : ''}`}
                  onClick={() => setFocus(k)}
                >
                  <Icon name={mealMeta[k].icon} size={16} />
                  <span>{mealMeta[k].label}</span>
                  {meals[k]?.trim() ? <span className="tab-dot" /> : null}
                </button>
              ))}
            </div>

            {/* Active Meal Textarea */}
            <div className="active-meal-field">
              <label className="field">
                <span className="active-field-label">
                  What did you eat for <strong>{mealMeta[focus].label}</strong>?
                </span>
                <textarea
                  className="input meal-active-textarea"
                  rows={3}
                  value={meals[focus] || ''}
                  onChange={(e) => setMeals({ ...meals, [focus]: e.target.value })}
                  placeholder={mealMeta[focus].placeholder}
                />
              </label>
            </div>

            {/* Categorized Food Chips */}
            <div className="categorized-chips-box">
              <p className="chips-box-title">
                Tap to quickly add to <strong>{mealMeta[focus].label}</strong>:
              </p>
              <div className="chips-categories">
                {foodCategories.map((cat) => (
                  <div key={cat.name} className="chip-category-group">
                    <span className="category-group-name">{cat.name}</span>
                    <div className="choice-row choice-wrap">
                      {cat.chips.map((c) => (
                        <button
                          key={c}
                          type="button"
                          className="choice choice-sm chip-item"
                          onClick={() => addChip(focus, c)}
                        >
                          <Icon name="plus" size={12} stroke={3} /> {c}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

/* ---------- Fit Health ---------- */

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

// Translation keys for Fit Health section
const fitTranslations = {
  en: {
    title: 'Fit Health',
    steps: 'Steps',
    calories: 'Calories',
    water: 'Water',
    sleep: 'Sleep',
    weeklySteps: 'Steps This Week',
    goal: 'Goal',
    today: 'Today',
    mon: 'Mon',
    tue: 'Tue',
    wed: 'Wed',
    thu: 'Thu',
    fri: 'Fri',
    sat: 'Sat',
    body: 'Body',
    height: 'Height',
    weight: 'Weight',
    bmi: 'BMI',
    smallGoals: 'Small Goals',
    authorizeHealth: 'Connect your health device',
    walkAfterLunch: 'Walk 10 minutes after lunch',
    waterGoal: '8 cups of water',
    bedtime: 'In bed by 11pm'
  },
  yo: {
    title: 'Fit Health',
    steps: 'Ìpinnu',
    calories: 'Irun',
    water: 'Omi',
    sleep: 'Ẹ̀rín',
    weeklySteps: 'Ìpinnu Iweeka',
    goal: 'Ìṣe-epọ̀',
    today: 'Ajọsì',
    mon: 'Ajánlọun',
    tue: 'Ọjọ́ Ìsẹ́gun',
    wed: 'Ọjọ́ Owọ́',
    thu: 'Ọjọ́ Thu',
    fri: 'Ọjọ́ Ẹ̀bí',
    sat: 'Ọjọ́ Ìtàn',
    body: 'Ibadan',
    height: 'Orílẹ̀-Ẹ̀rín',
    weight: 'Orọ',
    bmi: 'BMI',
    smallGoals: 'Iṣepọ̀ Lẹ̀gba',
    authorizeHealth: 'Ọ̀pọ̀ àpẹ̀ Ọ́rọ̀ra',
    walkAfterLunch: 'Fọrẹ 10 órò̀run pẹ̀lú àdọ́la',
    waterGoal: '8 omi erin',
    bedtime: 'Ọjọ́ 11 ṣọ́kẹ́rẹ́'
  },
  ha: {
    title: 'Fit Health',
    steps: 'Lissafa',
    calories: 'Kalori',
    water: 'Shiri',
    sleep: 'Shafa',
    weeklySteps: 'Lissafa Iweek',
    goal: 'Karfafa',
    today: 'Jiki',
    mon: 'Lahadi',
    tue: 'Jima',
    wed: 'Jumat',
    thu: 'Alhamisi',
    fri: 'Jimah',
    sat: 'Asabar',
    body: 'Jarida',
    height: 'Urufu',
    weight: 'Bobi',
    bmi: 'BMI',
    smallGoals: 'Matsalar',
    walkAfterLunch: 'Fara 10 minute after lunch',
    waterGoal: '8 Shiri',
    bedtime: 'Lahadi 11 ṣakara'
  },
  ig: {
    title: 'Fit Health',
    steps: 'Akaeze',
    calories: 'Ihe na nkali',
    water: 'Mmiri',
    sleep: 'Ihe riri',
    weeklySteps: 'Akaeze Iweek',
    goal: 'Iheto',
    today: 'Afo',
    mon: 'Mọnde',
    tue: 'Afor',
    wed: 'Afen',
    thu: 'Ahụkọ',
    fri: 'Afikwata',
    sat: 'Afor',
    body: 'Ala',
    height: 'Ọ̀zì ike',
    weight: 'Akpụnkpụ',
    bmi: 'BMI',
    smallGoals: 'Ihe ibelege',
    authorizeHealth: 'Connect your health device',
    walkAfterLunch: 'Nwere 10 ụzụ after lunch',
    waterGoal: '8 mmiri erin',
    bedtime: 'Afo 11 ụsụakwa'
  }
}

async function authorizeHealth() {
  const available = await Health.isHealthAvailable()
  if (!available?.available) return false
  const perms = { permissions: ['READ_STEPS', 'READ_ACTIVE_CALORIES'] }
  const checked = await Health.checkHealthPermissions(perms)
  const allGranted = (res) =>
    Array.isArray(res?.permissions) &&
    res.permissions.length > 0 &&
    res.permissions.every((p) => Object.values(p).every(Boolean))
  if (allGranted(checked)) return true
  return allGranted(await Health.requestHealthPermissions(perms))
}

// Read the last 7 days of daily buckets for one health data type.
async function getDailyBuckets(dataType) {
  const endDate = new Date()
  const startDate = new Date(endDate.getTime() - 6 * 24 * 60 * 60 * 1000)
  startDate.setHours(0, 0, 0, 0)
  const result = await Health.queryAggregated({
    dataType,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    bucket: 'day'
  })
  const buckets = Array(7).fill(0)
  for (const sample of result?.aggregatedData || []) {
    const idx = Math.floor((new Date(sample.startDate).getTime() - startDate.getTime()) / 86400000)
    if (idx >= 0 && idx < 7) buckets[idx] += sample.value || 0
  }
  return buckets
}

// Translate day names based on current language
function getDayNames(language) {
  const daysEn = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Today']
  switch (language) {
    case 'yo': return ['Ajánlọun', 'Ọjọ́ Ìsẹ́gun', 'Ọjọ́ Owọ́', 'Ọjọ́ Thu', 'Ọjọ́ Ẹ̀bí', 'Ọjọ́ Ìtàn', 'Ajọsì']
    case 'ha': return ['Lahadi', 'Jima', 'Jumat', 'Alhamisi', 'Jimah', 'Asabar', 'Jiki']
    case 'ig': return ['Mọnde', 'Afor', 'Afen', 'Ahụkọ', 'Afikwata', 'Afor', 'Afo']
    default: return daysEn
  }
}

// Fallback sample week so the page always renders before a device/backend is connected
const SAMPLE_WEEK = {
  steps: [5200, 7400, 8100, 4300, 9200, 6800, 6240],
  calories: [1600, 1900, 2050, 1400, 2200, 1750, 1840],
  water: [4, 6, 7, 3, 8, 6, 5],
  sleep: [7, 6.5, 8, 5.5, 7.5, 6, 6.5]
}

const latest = (arr) => Number(arr[arr.length - 1]) || 0

export function Fit({ me }) {
  const save = useUpdateMe()
  const f = me.fit || {}
  const b = bmi(me.profile)
  const [language] = useState(() => localStorage.getItem('language') || 'en')
  const t = (key) => fitTranslations[language]?.[key] ?? fitTranslations.en[key] ?? key
  const dayNames = getDayNames(language)
  const [series, setSeries] = useState(SAMPLE_WEEK)
  const [source, setSource] = useState('sample')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        if (!(await authorizeHealth())) return
        const [steps, calories] = await Promise.all([
          getDailyBuckets('steps'),
          getDailyBuckets('active-calories')
        ])
        if (cancelled) return
        if (steps.some(Boolean) || calories.some(Boolean)) {
          setSeries((prev) => ({
            ...prev,
            steps: steps.some(Boolean) ? steps : prev.steps,
            calories: calories.some(Boolean) ? calories : prev.calories
          }))
          setSource('device')
        }
      } catch {
        // Health Connect / HealthKit unavailable (web preview or permission denied) - keep sample data
      }
    })()
    return () => { cancelled = true }
  }, [])

  const stepGoal = f.stepGoal || 8000
  const calorieGoal = f.calorieGoal || 2200
  const waterGoal = f.waterGoal || 8
  const todayWater = latest(series.water)
  const setWater = (value) => {
    const next = Math.max(0, value)
    setSeries((prev) => ({ ...prev, water: [...prev.water.slice(0, 6), next] }))
    save.mutate({ fit: { waterCups: next } })
  }
  const bmiLabel = b ? (b < 18.5 ? ['Underweight', 'amber'] : b < 25 ? ['Healthy range', 'green'] : b < 30 ? ['Overweight', 'amber'] : ['Obese range', 'red']) : null
  const chartData = (values) => values.map((value, i) => ({ name: dayNames[i], value: Math.round(value) }))

  return (
    <div className="page">
      <SectionHead
        icon="activity"
        tone="purple"
        title={t('title')}
        text="Your physical health at a glance. Small goals you choose."
        action={<span className="demo-tag">{source === 'device' ? 'Health device' : t('smallGoals')}</span>}
      />

      <div className="fit-stats">
        <div className="card fit-card">
          <div>
            <small>{t('steps')}</small>
            <strong>{latest(series.steps).toLocaleString()}</strong>
            <span>of {stepGoal.toLocaleString()}</span>
          </div>
        </div>
        <div className="card fit-card">
          <div>
            <small>{t('calories')}</small>
            <strong>{latest(series.calories).toLocaleString()} kcal</strong>
            <span>of {calorieGoal.toLocaleString()} target</span>
          </div>
        </div>
        <div className="card fit-card">
          <div>
            <small>{t('water')}</small>
            <strong>{todayWater}/{waterGoal}</strong>
            <div className="mini-actions">
              <button className="icon-btn icon-btn-sm" onClick={() => setWater(todayWater - 1)} aria-label="Remove a cup">–</button>
              <button className="icon-btn icon-btn-sm on" onClick={() => setWater(todayWater + 1)} aria-label="Add a cup"><Icon name="plus" size={14} stroke={3} /></button>
            </div>
          </div>
        </div>
        <div className="card fit-card">
          <div>
            <small>{t('sleep')}</small>
            <strong>{latest(series.sleep)}h</strong>
            <span>Goal 7–9 hours</span>
          </div>
        </div>
      </div>

      <div className="fit-layout">
        <div className="fit-charts">
          <div className="card">
            <div className="card-head"><h3>{t('weeklySteps')}</h3><span className="chip chip-green">Goal {stepGoal.toLocaleString()}</span></div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData(series.steps)} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip />
                <Line type="monotone" dataKey="value" name={t('steps')} stroke="#1fa46a" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="card">
            <div className="card-head"><h3>{t('calories')}</h3><span className="chip chip-amber">Goal {calorieGoal.toLocaleString()} kcal</span></div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData(series.calories)} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip />
                <Line type="monotone" dataKey="value" name={t('calories')} stroke="#e9a23b" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card">
          <h3>{t('body')}</h3>
          <div className="body-stats">
            <div><small>{t('height')}</small><b>{me.profile.heightCm || '–'} <em>cm</em></b></div>
            <div><small>{t('weight')}</small><b>{me.profile.weightKg || '–'} <em>kg</em></b></div>
            <div><small>{t('bmi')}</small><b>{b || '–'}</b></div>
          </div>
          {bmiLabel && <span className={`chip chip-${bmiLabel[1]}`}>{bmiLabel[0]}</span>}
          <h3 style={{ marginTop: 22 }}>Small goals</h3>
          <ul className="goal-list">
            <li><Icon name="check" size={16} stroke={3} /> {t('walkAfterLunch')}</li>
            <li><Icon name="check" size={16} stroke={3} /> {t('waterGoal')}</li>
            <li className="todo"><span /> {t('bedtime')}</li>
          </ul>
          <p className="muted" style={{ marginTop: 16, fontSize: 12 }}>
            {source === 'device'
              ? 'Showing the last 7 days from Google Health Connect / Apple Health.'
              : 'Sample data. Connect Health Connect or Apple Health on your device to see your own numbers.'}
          </p>
        </div>
      </div>
    </div>
  )
}

export { Spinner }
