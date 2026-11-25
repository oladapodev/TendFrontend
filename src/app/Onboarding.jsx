import { useState } from 'react'
import { Link } from 'react-router'
import Icon, { Logo } from '../components/Icon.jsx'
import { useUpdateMe } from './data.js'
import { useLocation } from './location.jsx'

export const bmi = (p) => {
  const h = Number(p.heightCm) / 100
  const w = Number(p.weightKg)
  if (!h || !w) return null
  return (w / (h * h)).toFixed(1)
}

// Name, age and phone (from sign-in) are required; the rest can be skipped.
export const validName = (n) => (n || '').trim().length > 1
export const validAge = (a) => {
  const n = Number(a)
  return a !== '' && a != null && Number.isInteger(n) && n > 0 && n < 120
}
export const profileComplete = (me) => validName(me.profile?.name) && validAge(me.profile?.age) && !!me.phone

const steps = [
  { key: 'name', label: 'Your name', required: true, title: "What's your name?", hint: 'This is how TendAI and your emergency contacts will know you.' },
  { key: 'age', label: 'Age', required: true, title: 'How old are you?', hint: 'Age helps responders and the hospital prepare.' },
  { key: 'body', label: 'Height & weight', title: 'Your height and weight', hint: 'Used for Fit Health and to share with responders if you allow it.' },
  { key: 'sex', label: 'Sex', title: 'Sex (optional)', hint: 'Some care decisions depend on it. You can skip this.' },
]

function OnbLayout({ step, total, children, side }) {
  return (
    <div className="onb">
      <aside className="onb-side">
        <Link to="/"><Logo size={32} light /></Link>
        <div className="onb-side-body">{side}</div>
        <p className="onb-side-foot"><Icon name="lock" size={14} /> Your details stay on your profile. You choose what is shared during an SOS.</p>
      </aside>
      <section className="onb-main">
        {total ? (
          <div className="onb-progress" aria-label={`Step ${step + 1} of ${total}`}>
            {Array.from({ length: total }).map((_, i) => <span key={i} className={i <= step ? 'on' : ''} />)}
          </div>
        ) : null}
        <div className="onb-card">{children}</div>
      </section>
    </div>
  )
}

export function Onboarding({ me }) {
  const save = useUpdateMe()
  const [i, setI] = useState(0)
  const [p, setP] = useState(me.profile)
  const s = steps[i]
  const set = (k) => (e) => setP({ ...p, [k]: e.target.value })
  const valid = s.key === 'name' ? validName(p.name) : s.key === 'age' ? validAge(p.age) : true
  const [touched, setTouched] = useState(false)
  const next = () => {
    setTouched(false)
    if (i < steps.length - 1) return setI(i + 1)
    // Final check: jump back to the first required step that is missing.
    const missing = steps.findIndex((st) => (st.key === 'name' && !validName(p.name)) || (st.key === 'age' && !validAge(p.age)))
    if (missing >= 0) {
      setI(missing)
      setTouched(true)
      return
    }
    save.mutate({ profile: { ...p, name: p.name.trim(), age: String(Number(p.age)) }, onboarded: true })
  }
  const b = bmi(p)

  return (
    <OnbLayout
      step={i}
      total={steps.length}
      side={
        <>
          <h2>Let's get you ready.</h2>
          <p>A few basics so that, if you ever press SOS, the right people get the right information quickly.</p>
          <ol className="onb-list">
            {steps.map((st, n) => (
              <li key={st.key} className={n < i ? 'done' : n === i ? 'now' : ''}>
                <span>{n < i ? <Icon name="check" size={14} stroke={3} /> : n + 1}</span>
                {st.label}{st.required && <em className="req-tag">Required</em>}
              </li>
            ))}
          </ol>
        </>
      }
    >
      <span className="onb-step">Step {i + 1} of {steps.length}</span>
      <h1>{s.title}</h1>
      <p className="onb-hint">{s.hint}</p>

      <form
        className="onb-form"
        onSubmit={(e) => {
          e.preventDefault()
          if (valid) next()
        }}
      >
        {s.key === 'name' && (
          <label className="field">
            <span>Full name</span>
            <input className="input input-lg" autoFocus required aria-required="true" autoComplete="name" placeholder="e.g. Victor Adeyemi" value={p.name} onChange={set('name')} onBlur={() => setTouched(true)} />
          </label>
        )}
        {s.key === 'age' && (
          <label className="field">
            <span>Age in years</span>
            <input className="input input-lg" autoFocus required aria-required="true" type="number" inputMode="numeric" min="1" max="119" step="1" placeholder="e.g. 28" value={p.age} onChange={set('age')} onBlur={() => setTouched(true)} />
          </label>
        )}
        {s.required && touched && !valid && (
          <p className="form-error"><Icon name="alert" size={16} /> {s.key === 'name' ? 'Your name is required.' : 'Enter your age in whole years (1–119).'}</p>
        )}
        {s.key === 'body' && (
          <>
            <div className="grid-2">
              <label className="field">
                <span>Height (cm)</span>
                <input className="input input-lg" autoFocus type="number" min="50" max="250" placeholder="e.g. 172" value={p.heightCm} onChange={set('heightCm')} />
              </label>
              <label className="field">
                <span>Weight (kg)</span>
                <input className="input input-lg" type="number" min="2" max="400" placeholder="e.g. 70" value={p.weightKg} onChange={set('weightKg')} />
              </label>
            </div>
            {b && <p className="onb-bmi"><Icon name="scale" size={16} /> BMI <strong>{b}</strong> · shown in Fit Health</p>}
          </>
        )}
        {s.key === 'sex' && (
          <div className="choice-row choice-wrap">
            {['Female', 'Male', 'Prefer not to say'].map((o) => (
              <button type="button" key={o} className={`choice ${p.sex === o ? 'on' : ''}`} onClick={() => setP({ ...p, sex: o })}>
                {o}
              </button>
            ))}
          </div>
        )}

        {save.isError && <p className="form-error"><Icon name="alert" size={16} /> {save.error.message}</p>}

        <div className="onb-actions">
          {i > 0 ? (
            <button type="button" className="btn btn-ghost" onClick={() => setI(i - 1)}><Icon name="chevronLeft" size={18} /> Back</button>
          ) : <span />}
          <div className="onb-actions-right">
            {!s.required && <button type="button" className="link-btn" onClick={next}>Skip</button>}
            <button className="btn btn-primary" disabled={!valid || save.isPending}>
              {i === steps.length - 1 ? (save.isPending ? 'Saving…' : 'Finish') : 'Continue'} <Icon name="arrowRight" size={18} />
            </button>
          </div>
        </div>
      </form>
    </OnbLayout>
  )
}

const perms = [
  { key: 'location', icon: 'pin', title: 'Location', required: true, why: 'Needed for SOS. We share it with the hospital and your contacts only when you press SOS, and use it to find care near you.' },
  { key: 'notifications', icon: 'bell', title: 'Notifications', why: 'So we can show live incident updates and remind you about your care plan.' },
]

export function Permissions() {
  const save = useUpdateMe()
  const loc = useLocation()
  const [notif, setNotif] = useState(() => ('Notification' in window ? (Notification.permission === 'default' ? 'pending' : Notification.permission === 'granted' ? 'granted' : 'denied') : 'denied'))
  const [locAsked, setLocAsked] = useState(false)

  const locState = loc.status === 'live' ? 'granted' : loc.status === 'denied' || loc.status === 'unavailable' ? 'denied' : locAsked ? 'asking' : 'pending'
  const state = { location: locState, notifications: notif }

  const allow = (k) => {
    if (k === 'location') {
      setLocAsked(true)
      loc.start()
    } else if ('Notification' in window) {
      Promise.resolve(Notification.requestPermission())
        .then((r) => setNotif(r === 'granted' ? 'granted' : 'denied'))
        .catch(() => setNotif('denied'))
    }
  }

  return (
    <OnbLayout
      side={
        <>
          <h2>Permissions, explained first.</h2>
          <p>We ask for each permission only after telling you why. You can change these in your browser settings at any time.</p>
          <div className="onb-shield"><Icon name="shield" size={40} stroke={1.6} /></div>
        </>
      }
    >
      <span className="onb-step">Almost done</span>
      <h1>Allow TendAI to help you</h1>
      <p className="onb-hint">Location is the one that matters most in an emergency.</p>

      <div className="perm-list">
        {perms.map((p) => {
          const st = state[p.key]
          return (
            <div className={`perm ${st}`} key={p.key}>
              <span className="perm-ico"><Icon name={p.icon} size={22} /></span>
              <div className="perm-body">
                <div className="perm-head">
                  <strong>{p.title}</strong>
                  {p.required && <span className="chip chip-red">Needed for SOS</span>}
                </div>
                <p>{p.why}</p>
              </div>
              <div className="perm-act">
                {st === 'granted' && <span className="chip chip-green"><Icon name="check" size={14} stroke={3} /> Allowed</span>}
                {st === 'denied' && <span className="chip chip-grey">Blocked</span>}
                {st === 'asking' && <span className="chip chip-amber">Waiting for browser…</span>}
                {st === 'pending' && <button className="btn btn-primary btn-sm" onClick={() => allow(p.key)}>Allow</button>}
              </div>
            </div>
          )
        })}
      </div>

      {locState === 'denied' && (
        <p className="perm-warn"><Icon name="alert" size={16} /> Location is blocked. SOS will still work without it, but the hospital won't know where you are. You can turn it on in your browser's site settings, and you can always call 112 directly.</p>
      )}
      {save.isError && <p className="form-error"><Icon name="alert" size={16} /> {save.error.message}</p>}

      <div className="onb-actions">
        <span />
        <button className="btn btn-primary" disabled={save.isPending} onClick={() => save.mutate({ permissionsDone: true })}>
          {save.isPending ? 'Saving…' : 'Go to my dashboard'} <Icon name="arrowRight" size={18} />
        </button>
      </div>
    </OnbLayout>
  )
}
