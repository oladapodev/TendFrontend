import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import Icon from '../components/Icon.jsx'
import { api, isDemo } from '../api/index.js'
import { useLocation } from './location.jsx'

// Status labels. "Calling" is never shown as "answered"; failures are shown, not hidden (slide 06).
const STATUS = {
  queued: ['Waiting', 'grey'],
  calling: ['Calling now', 'amber', true],
  speaking: ['Speaking with staff', 'amber', true],
  confirmed: ['Staff confirmed they can help', 'green'],
  answered: ['Answered · aware', 'green'],
  no_answer: ['No answer · retrying', 'red'],
  retrying: ['Retrying', 'amber', true],
  failed: ['Could not reach', 'red'],
  sms_sending: ['Sending text', 'amber', true],
  sms_delivered: ['Text delivered', 'blue'],
  sms_failed: ['Text failed', 'red'],
  skipped: ['Not contacted', 'grey'],
  demo_only: ['Demo alert only', 'grey'],
}
const KIND_ICON = { hospital: 'hospital', contact: 'user', helpers: 'users' }
const HELP_CONFIRMED = ['confirmed', 'answered']

function sharedFields(share) {
  return Object.entries(share || {}).filter(([, v]) => v).map(([k]) => k)
}

function playBeep() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = 880
    gain.gain.value = 0.06
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.09)
    setTimeout(() => ctx.close().catch(() => {}), 200)
  } catch {
    /* ignore audio restrictions */
  }
}

export default function Sos({ me, onClose }) {
  const loc = useLocation()
  const nav = useNavigate()
  const total = me.settings.sosDelay
  const sosOpts = me.settings?.sosOptions || {}
  const [left, setLeft] = useState(total)
  const [phase, setPhase] = useState('countdown') // countdown |  | live | error | ended
  const [incident, setIncident] = useState(null)
  const [targets, setTargets] = useState([])
  const [error, setError] = useState(null)
  const [elapsed, setElapsed] = useState(0)
  const [sentLoc, setSentLoc] = useState(null)
  const [ending, setEnding] = useState(false)
  const unsub = useRef(null)
  const started = useRef(false)

  const send = useCallback(async () => {
    setPhase('sending')
    setError(null)
    try {
      const fix = await loc.getFix()
      setSentLoc(fix)
      const inc = await api.incidents.create({
        lat: fix?.lat ?? null,
        lng: fix?.lng ?? null,
        accuracy: fix?.accuracy ?? null,
        shareFields: sharedFields(me.settings.share),
        alertHelpers: sosOpts.alertHelpers !== false,
      })
      setIncident(inc)
      setTargets(inc.targets || [])
      setPhase('live')
      unsub.current = api.incidents.stream(inc.id, {
        onEvent: (e) => {
          if (e.type === 'target') setTargets((ts) => ts.map((t) => (t.id === e.targetId ? { ...t, status: e.status } : t)))
          if (e.type === 'targets') setTargets(e.targets)
          if (e.type === 'state' && e.state !== 'active') setPhase('ended')
        },
        onError: () => setError(new Error('Live updates stopped. Your incident is still open; call 112 if you need to.')),
      })
    } catch (e) {
      setError(e)
      setPhase('error')
    }
  }, [loc, me.settings.share, sosOpts.alertHelpers])

  // countdown
  useEffect(() => {
    if (phase !== 'countdown') return
    if (left <= 0) {
      if (!started.current) {
        started.current = true
        send()
      }
      return
    }
    if (sosOpts.soundAlert) playBeep()
    if (sosOpts.vibrateAlert) navigator.vibrate?.(110)
    const t = setTimeout(() => setLeft((l) => l - 1), 1000)
    return () => clearTimeout(t)
  }, [left, phase, send, sosOpts.soundAlert, sosOpts.vibrateAlert])

  // timer while live
  useEffect(() => {
    if (phase !== 'live') return
    const t = setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => clearInterval(t)
  }, [phase])

  useEffect(() => () => unsub.current?.(), [])

  useEffect(() => {
    const k = (e) => e.key === 'Escape' && phase === 'countdown' && onClose()
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [phase, onClose])

  const endIncident = async () => {
    setEnding(true)
    try {
      if (incident) await api.incidents.cancel(incident.id, 'safe')
      unsub.current?.()
      onClose()
    } catch (e) {
      setError(e)
    } finally {
      setEnding(false)
    }
  }

  const m = me.medical
  const share = me.settings.share
  const r = 120
  const c = 2 * Math.PI * r

  if (phase === 'countdown') {
    return (
      <div className="sos-overlay sos-count" role="alertdialog" aria-label="SOS countdown" aria-live="assertive">
        <p className="sos-count-top"><Icon name="alert" size={18} /> Emergency SOS</p>
        <div className="sos-dial">
          <svg viewBox="0 0 280 280" width="280" height="280">
            <circle cx="140" cy="140" r={r} fill="none" stroke="rgba(255,255,255,.18)" strokeWidth="14" />
            <circle cx="140" cy="140" r={r} fill="none" stroke="#fff" strokeWidth="14" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - left / total)} transform="rotate(-90 140 140)" style={{ transition: 'stroke-dashoffset 1s linear' }} />
          </svg>
          <div className="sos-dial-num"><b key={left}>{left}</b><small>seconds</small></div>
        </div>
        <h2>Starting the call for help</h2>
        <p>We'll contact your hospital, your circle and nearby helpers{share.location ? ', and share your location' : ''}.</p>
        <div className="sos-count-actions">
          <button className="btn btn-white sos-cancel" autoFocus onClick={onClose}><Icon name="x" size={20} /> Cancel</button>
          <button className="btn sos-now" onClick={() => setLeft(0)}>Send now</button>
        </div>
      </div>
    )
  }

  if (phase === 'sending') {
    return (
      <div className="sos-overlay sos-count" role="alertdialog" aria-label="Sending SOS" aria-live="assertive">
        <span className="qs-spin qs-spin-lg" />
        <h2>Sending your SOS…</h2>
        <p>{loc.status === 'live' || loc.status === 'locating' ? 'Getting your exact location' : 'Location is off, so we are sending without it'}.</p>
        <a className="btn btn-white" href="tel:112"><Icon name="phone" size={18} /> Call 112 directly</a>
      </div>
    )
  }

  if (phase === 'error') {
    return (
      <div className="sos-overlay sos-count" role="alertdialog" aria-label="SOS failed" aria-live="assertive">
        <Icon name="alert" size={56} />
        <h2>We couldn't start the SOS</h2>
        <p>{error?.message || 'Something went wrong.'} Call 112 now. It does not need TendAI.</p>
        <div className="sos-count-actions">
          <a className="btn btn-white sos-cancel" href="tel:112"><Icon name="phone" size={20} /> Call 112</a>
          <button className="btn sos-now" onClick={send}>Try again</button>
          <button className="btn sos-now" onClick={onClose}>Close</button>
        </div>
      </div>
    )
  }

  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0')
  const ss = String(elapsed % 60).padStart(2, '0')
  const helpConfirmed = targets.some((t) => HELP_CONFIRMED.includes(t.status))
  const ended = phase === 'ended'

  return (
    <div className="sos-overlay sos-live" role="dialog" aria-label="SOS incident">
      <div className="sos-live-inner">
        <header className="sos-live-head">
          {ended ? <span className="chip chip-grey">Incident ended</span> : <span className="chip chip-red"><span className="dot dot-red" /> Incident live · {mm}:{ss}</span>}
          {isDemo && <span className="demo-tag">Demo incident: nobody is being contacted</span>}
        </header>

        <div className="sos-hero-msg" aria-live="polite">
          <div className={`sos-check ${helpConfirmed ? '' : 'is-pending'}`}><Icon name={helpConfirmed ? 'shield' : 'phone'} size={40} stroke={1.8} /></div>
          <h1>{helpConfirmed ? 'Help is on the way' : 'Contacting help…'}</h1>
          <p>{helpConfirmed ? 'Someone has confirmed they know. Stay where you are if it is safe, and keep your phone close.' : "We're reaching your hospital and your people now. Every update shows below."}</p>
        </div>

        {error && <p className="form-error" style={{ justifyContent: 'center' }}><Icon name="alert" size={16} /> {error.message}</p>}

        <div className="sos-live-grid">
          <section className="card">
            <div className="card-head"><h3>Who we're reaching</h3><small className="muted">Updated live</small></div>
            <div className="status-rows">
              {targets.map((x) => {
                const [label, tone, busy] = STATUS[x.status] || [x.status, 'grey']
                return (
                  <div className="status-row" key={x.id}>
                    <span className={`hv-av tone-${tone}`}><Icon name={KIND_ICON[x.kind] || 'user'} size={18} /></span>
                    <div className="hv-who"><strong>{x.name}</strong><small>{x.detail}</small></div>
                    <span className={`chip chip-${tone}`}>{busy && <span className="spin" />}{label}</span>
                  </div>
                )
              })}
              {targets.length <= 2 && (
                <p className="muted">Tip: add more emergency contacts so more people can be reached.</p>
              )}
            </div>
            <p className="note"><Icon name="info" size={14} /> Calling is not the same as answered. We show failures and retry.</p>
          </section>

          <section className="card sos-med">
            <div className="card-head"><h3>Shared with responders</h3><Icon name="lock" size={16} /></div>
            <div className="sos-med-top">
              <div><small>Name</small><b>{share.nameAge ? me.profile.name || '–' : 'Not shared'}</b></div>
              <div><small>Blood</small><b className="red">{share.bloodGenotype ? m.bloodGroup || '–' : '—'}</b></div>
              <div><small>Genotype</small><b>{share.bloodGenotype ? m.genotype || '–' : '—'}</b></div>
            </div>
            {share.allergies && <p className="sos-med-line"><strong>Allergies:</strong> {m.allergies.join(', ') || 'None'}</p>}
            {share.conditionsMeds && <p className="sos-med-line"><strong>Conditions:</strong> {m.conditions.join(', ') || 'None'}</p>}
            <p className="sos-med-line">
              <Icon name="pin" size={14} />
              {!share.location ? 'Location not shared (turned off in Settings)' : sentLoc ? `Location shared · ${sentLoc.lat.toFixed(5)}, ${sentLoc.lng.toFixed(5)} (±${sentLoc.accuracy} m)` : 'Location unavailable: tell the hospital where you are'}
            </p>
          </section>
        </div>

        <div className="sos-live-actions">
          <a className="btn btn-danger" href="tel:112"><Icon name="phone" size={18} /> Call 112 directly</a>
          <button className="btn btn-ghost" onClick={() => { nav('/app/emergencies/cpr'); onClose() }}><Icon name="cpr" size={18} /> Open CPR guide</button>
          {ended ? (
            <button className="btn btn-ghost" onClick={onClose}><Icon name="x" size={18} /> Close</button>
          ) : (
            <button className="btn btn-ghost" disabled={ending} onClick={endIncident}><Icon name="check" size={18} /> {ending ? 'Ending…' : "I'm safe, end incident"}</button>
          )}
        </div>
      </div>
    </div>
  )
}
