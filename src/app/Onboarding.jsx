import { useState } from 'react'
import Icon, { Logo } from '../components/Icon.jsx'
import { useStore, bmi } from './store.jsx'

const steps = [
  { key: 'name', title: "What's your name?", hint: 'This is how TendAI and your emergency contacts will know you.' },
  { key: 'age', title: 'How old are you?', hint: 'Age helps responders and the hospital prepare.' },
  { key: 'body', title: 'Your height and weight', hint: 'Used for Fit Health and to share with responders if you allow it.' },
  { key: 'sex', title: 'Sex (optional)', hint: 'Some care decisions depend on it. You can skip this.' },
]

function OnbLayout({ step, total, children, side }) {
  return (
    <div className="onb">
      <aside className="onb-side">
        <a href="#/"><Logo size={32} light /></a>
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

export function Onboarding() {
  const { state, update } = useStore()
  const [i, setI] = useState(0)
  const [p, setP] = useState(state.profile)
  const s = steps[i]
  const set = (k) => (e) => setP({ ...p, [k]: e.target.value })
  const valid = s.key === 'name' ? p.name.trim().length > 1 : true
  const next = () => {
    if (i < steps.length - 1) setI(i + 1)
    else update({ profile: p, onboarded: true })
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
                {['Your name', 'Age', 'Height & weight', 'Sex'][n]}
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
            <input className="input input-lg" autoFocus placeholder="e.g. Victor Adeyemi" value={p.name} onChange={set('name')} />
          </label>
        )}
        {s.key === 'age' && (
          <label className="field">
            <span>Age in years</span>
            <input className="input input-lg" autoFocus type="number" min="0" max="120" placeholder="e.g. 28" value={p.age} onChange={set('age')} />
          </label>
        )}
        {s.key === 'body' && (
          <>
            <div className="grid-2">
              <label className="field">
                <span>Height (cm)</span>
                <input className="input input-lg" autoFocus type="number" placeholder="e.g. 172" value={p.heightCm} onChange={set('heightCm')} />
              </label>
              <label className="field">
                <span>Weight (kg)</span>
                <input className="input input-lg" type="number" placeholder="e.g. 70" value={p.weightKg} onChange={set('weightKg')} />
              </label>
            </div>
            {b && <p className="onb-bmi"><Icon name="scale" size={16} /> BMI <strong>{b}</strong> · shown in Fit Health</p>}
          </>
        )}
        {s.key === 'sex' && (
          <div className="choice-row">
            {['Female', 'Male', 'Prefer not to say'].map((o) => (
              <button type="button" key={o} className={`choice ${p.sex === o ? 'on' : ''}`} onClick={() => setP({ ...p, sex: o })}>
                {o}
              </button>
            ))}
          </div>
        )}

        <div className="onb-actions">
          {i > 0 ? (
            <button type="button" className="btn btn-ghost" onClick={() => setI(i - 1)}><Icon name="chevronLeft" size={18} /> Back</button>
          ) : <span />}
          <div className="onb-actions-right">
            {s.key !== 'name' && <button type="button" className="link-btn" onClick={next}>Skip</button>}
            <button className="btn btn-primary" disabled={!valid}>
              {i === steps.length - 1 ? 'Finish' : 'Continue'} <Icon name="arrowRight" size={18} />
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
  { key: 'contacts', icon: 'users', title: 'Contacts', why: 'Optional. Lets you pick emergency contacts from your phone book instead of typing them.' },
]

export function Permissions() {
  const { state, update } = useStore()
  const [busy, setBusy] = useState(null)
  const setPerm = (k, v) => update((s) => ({ permissions: { ...s.permissions, [k]: v } }))

  const allow = (k) => {
    if (k === 'location' && 'geolocation' in navigator) {
      setBusy(k)
      navigator.geolocation.getCurrentPosition(
        () => { setPerm(k, 'granted'); setBusy(null) },
        () => { setPerm(k, 'denied'); setBusy(null) },
        { timeout: 8000 },
      )
      return
    }
    if (k === 'notifications' && 'Notification' in window) {
      setBusy(k)
      Promise.resolve(Notification.requestPermission())
        .then((r) => setPerm(k, r === 'granted' ? 'granted' : 'denied'))
        .catch(() => setPerm(k, 'denied'))
        .finally(() => setBusy(null))
      return
    }
    setPerm(k, 'granted')
  }

  return (
    <OnbLayout
      side={
        <>
          <h2>Permissions, explained first.</h2>
          <p>We ask for each permission only when we have told you why. You can change these any time in Settings.</p>
          <div className="onb-shield"><Icon name="shield" size={40} stroke={1.6} /></div>
        </>
      }
    >
      <span className="onb-step">Almost done</span>
      <h1>Allow TendAI to help you</h1>
      <p className="onb-hint">Location is the one that matters most in an emergency.</p>

      <div className="perm-list">
        {perms.map((p) => {
          const st = state.permissions[p.key]
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
                {st === 'denied' && <span className="chip chip-grey">Not now</span>}
                {st === 'pending' && (
                  <>
                    <button className="btn btn-primary btn-sm" onClick={() => allow(p.key)} disabled={busy === p.key}>
                      {busy === p.key ? 'Asking…' : 'Allow'}
                    </button>
                    <button className="link-btn" onClick={() => setPerm(p.key, 'denied')}>Not now</button>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {state.permissions.location === 'denied' && (
        <p className="perm-warn"><Icon name="alert" size={16} /> Without location, SOS will ask again when you press it, and you can still call 112 directly.</p>
      )}

      <div className="onb-actions">
        <span />
        <button className="btn btn-primary" onClick={() => update({ permissionsDone: true })}>
          Go to my dashboard <Icon name="arrowRight" size={18} />
        </button>
      </div>
    </OnbLayout>
  )
}
