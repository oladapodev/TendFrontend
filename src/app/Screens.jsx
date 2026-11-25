import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import Icon from '../components/Icon.jsx'
import QueryState, { Spinner } from '../components/QueryState.jsx'
import { useContacts, useSaveContact, useDeleteContact, usePlaces, useUpdateMe, useAnalyseDiet, useFacilities } from './data.js'
import { useLocation } from './location.jsx'
import { useAuth } from './auth.jsx'
import { bmi } from './Onboarding.jsx'

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
  const m = me.medical
  const nearest = facilities.data?.[0]
  const nContacts = contacts.data?.length
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
    ['Profile', !!me.profile.name],
    ['Location on', loc.status === 'live'],
    ['2+ contacts', (nContacts || 0) >= 2],
    ['Medical ID', !!m.bloodGroup],
    ['Trusted hospital', (places.data?.length || 0) > 0],
  ]
  const done = checks.filter((c) => c[1]).length

  return (
    <div className="home">
      <section className="sos-hero">
        <div className="sos-hero-copy">
          <span className="chip chip-red"><Icon name="shield" size={14} /> TendSOS</span>
          <h2>Need urgent help?</h2>
          <p>Press the button to start the workflow. You'll have <strong>{me.settings.sosDelay} seconds</strong> to cancel before we contact your hospital, your circle and opted-in helpers.</p>
          <div className="sos-hero-actions">
            <a className="btn btn-ghost btn-sm" href="tel:112"><Icon name="phone" size={16} /> Call 112 directly</a>
            <Link className="link-btn" to="/app/settings">Change countdown</Link>
          </div>
        </div>
        <button className="sos-big" onClick={onSos} aria-label="Start emergency SOS">
          <span className="sos-big-ring" />
          <span className="sos-big-core">
            <strong>SOS</strong>
            <small>Press for help</small>
          </span>
        </button>
      </section>

      <div className="home-grid">
        <section>
          <h3 className="h-label">Your tools</h3>
          <div className="tiles">
            {tiles.map((t) => (
              <Link key={t.id} to={`/app/${t.id}`} className="tile">
                <span className={`tile-ico tone-${t.tone}`}><Icon name={t.icon} size={28} stroke={1.8} /></span>
                <strong>{t.label}</strong>
                <small>{t.meta}</small>
              </Link>
            ))}
          </div>
        </section>

        <aside className="home-side">
          <div className="card">
            <div className="ready-head">
              <h3>Emergency readiness</h3>
              <span className="ready-score">{done}/{checks.length}</span>
            </div>
            <div className="bar"><span style={{ width: `${(done / checks.length) * 100}%` }} /></div>
            <ul className="ready-list">
              {checks.map(([l, ok]) => (
                <li key={l} className={ok ? 'ok' : ''}>
                  <span>{ok ? <Icon name="check" size={14} stroke={3} /> : null}</span>{l}
                </li>
              ))}
            </ul>
          </div>
          <div className="card card-green">
            <Icon name="sparkle" size={20} />
            <p><strong>Tip:</strong> add a hospital you trust in Help Locator. It will be called first during an SOS.</p>
            <Link className="btn btn-white btn-sm" to="/app/locator">Open Help Locator</Link>
          </div>
        </aside>
      </div>
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
          <p className="note"><Icon name="lock" size={16} /> Saved automatically. Choose which fields are shared in <Link className="link-btn" to="/app/settings">Settings</Link>.</p>
        </aside>
      </div>
    </div>
  )
}

/* ---------- Diet ---------- */

const mealChips = ['Eba', 'Amala', 'Pounded yam', 'Rice', 'Jollof rice', 'Beans', 'Bread', 'Tea', 'Akara', 'Moi moi', 'Plantain', 'Yam', 'Egusi soup', 'Okra soup', 'Fish', 'Chicken', 'Indomie', 'Garri', 'Pap (ogi)', 'Suya', 'Soft drink']
const emptyMeals = { breakfast: '', lunch: '', dinner: '', snacks: '' }

export function Diet({ me }) {
  const analyse = useAnalyseDiet()
  const [open, setOpen] = useState(false)
  const [meals, setMeals] = useState(me.meals || emptyMeals)
  const [focus, setFocus] = useState('breakfast')
  const r = me.dietResult
  const addChip = (k, c) => setMeals({ ...meals, [k]: meals[k] ? `${meals[k]}, ${c.toLowerCase()}` : c })
  const submit = () => analyse.mutate(meals, { onSuccess: () => setOpen(false) })

  return (
    <div className="page">
      <SectionHead
        icon="apple" tone="amber" title="Diet"
        text="Tell TendAI what your meals usually contain. It suggests fruit, foods and how often to eat."
        action={<button className="btn btn-primary" onClick={() => setOpen(true)}><Icon name="plus" size={18} /> {r ? 'Update my meals' : "Log today's meals"}</button>}
      />

      {!r ? (
        <div className="empty">
          <span className="tile-ico tone-amber"><Icon name="apple" size={32} /></span>
          <h3>No meals logged yet</h3>
          <p>It takes under a minute. Type what you ate, or tap common Nigerian meals.</p>
          <button className="btn btn-primary" onClick={() => setOpen(true)}>Start</button>
        </div>
      ) : (
        <div className="diet-layout">
          <section>
            <h3 className="h-label"><Icon name="sparkle" size={16} /> AI recommendations</h3>
            <div className="rec-list">
              {r.recommendations.map((x) => (
                <article className="rec" key={x.title}>
                  <span className={`tile-ico tone-${x.tone || 'green'}`}><Icon name={x.icon || 'sparkle'} size={22} /></span>
                  <div>
                    <div className="rec-head"><strong>{x.title}</strong>{x.tag && <span className="chip chip-grey">{x.tag}</span>}</div>
                    <p>{x.text}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>
          <aside className="card">
            <h3>How often to eat</h3>
            <ol className="timeline">
              {r.schedule.map((s) => (
                <li key={s.time + s.label}><span className="tl-time">{s.time}</span><div><strong>{s.label}</strong><small>{s.detail}</small></div></li>
              ))}
            </ol>
            {me.meals && (
              <>
                <h3 style={{ marginTop: 20 }}>What you told us</h3>
                <dl className="meals-dl">
                  {Object.entries(me.meals).filter(([, v]) => v).map(([k, v]) => (<div key={k}><dt>{k}</dt><dd>{v}</dd></div>))}
                </dl>
              </>
            )}
          </aside>
        </div>
      )}

      <p className="note"><Icon name="info" size={16} /> {r?.note || 'AI can explain and organise. It is not a diagnosis.'} Talk to a doctor or dietitian about medical diets.</p>

      {open && (
        <Modal
          wide
          title="What do your daily meals contain?"
          onClose={() => setOpen(false)}
          footer={
            <>
              {analyse.isError && <span className="save-state is-err" style={{ marginRight: 'auto' }}><Icon name="alert" size={14} /> {analyse.error.message}</span>}
              <button className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={submit} disabled={analyse.isPending || !Object.values(meals).some((v) => v.trim())}>
                {analyse.isPending ? 'Analysing…' : <>Get recommendations <Icon name="sparkle" size={16} /></>}
              </button>
            </>
          }
        >
          <div className="meal-grid">
            {['breakfast', 'lunch', 'dinner', 'snacks'].map((k) => (
              <label className="field" key={k}>
                <span style={{ textTransform: 'capitalize' }}>{k}</span>
                <textarea className="input" rows={2} value={meals[k]} onFocus={() => setFocus(k)} onChange={(e) => setMeals({ ...meals, [k]: e.target.value })} placeholder={k === 'breakfast' ? 'e.g. bread and tea' : k === 'lunch' ? 'e.g. jollof rice and chicken' : k === 'dinner' ? 'e.g. eba and egusi soup' : 'e.g. biscuits, soft drink'} />
              </label>
            ))}
          </div>
          <div className="field" style={{ marginTop: 16 }}>
            <span>Quick add to <em style={{ textTransform: 'capitalize', color: 'var(--green-700)' }}>{focus}</em></span>
            <div className="choice-row choice-wrap">
              {mealChips.map((c) => <button key={c} type="button" className="choice choice-sm" onClick={() => addChip(focus, c)}>{c}</button>)}
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

/* ---------- Fit Health ---------- */

function Ring({ value, max, color, children }) {
  const r = 42
  const c = 2 * Math.PI * r
  const pct = Math.min(value / max, 1)
  return (
    <div className="ring">
      <svg viewBox="0 0 100 100" width="112" height="112">
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--line)" strokeWidth="9" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="9" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} transform="rotate(-90 50 50)" style={{ transition: 'stroke-dashoffset .6s' }} />
      </svg>
      <div className="ring-in">{children}</div>
    </div>
  )
}

export function Fit({ me }) {
  const save = useUpdateMe()
  const f = me.fit
  const b = bmi(me.profile)
  const week = [5200, 7400, 8100, 4300, 9200, 6800, f.steps]
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Today']
  const maxW = Math.max(...week, f.stepGoal)
  const setFit = (k, v) => save.mutate({ fit: { [k]: v } })
  const bmiLabel = b ? (b < 18.5 ? ['Underweight', 'amber'] : b < 25 ? ['Healthy range', 'green'] : b < 30 ? ['Overweight', 'amber'] : ['Obese range', 'red']) : null

  return (
    <div className="page">
      <SectionHead icon="activity" tone="purple" title="Fit Health" text="Your physical health at a glance. Small goals you choose. This is not live monitoring." action={<span className="demo-tag">Sample data</span>} />

      <div className="fit-stats">
        <div className="card fit-card">
          <Ring value={f.steps} max={f.stepGoal} color="var(--green-600)">
            <Icon name="footprints" size={20} /><b>{Math.round((f.steps / f.stepGoal) * 100)}%</b>
          </Ring>
          <div><small>Steps</small><strong>{f.steps.toLocaleString()}</strong><span>of {f.stepGoal.toLocaleString()}</span></div>
        </div>
        <div className="card fit-card">
          <Ring value={f.calories} max={f.calorieGoal} color="var(--amber-500)">
            <Icon name="flame" size={20} /><b>{Math.round((f.calories / f.calorieGoal) * 100)}%</b>
          </Ring>
          <div><small>Calories</small><strong>{f.calories.toLocaleString()} kcal</strong><span>of {f.calorieGoal.toLocaleString()} target</span></div>
        </div>
        <div className="card fit-card">
          <Ring value={f.waterCups} max={f.waterGoal} color="var(--blue-600)">
            <Icon name="water" size={20} /><b>{f.waterCups}/{f.waterGoal}</b>
          </Ring>
          <div>
            <small>Water</small><strong>{f.waterCups} cups</strong>
            <div className="mini-actions">
              <button className="icon-btn icon-btn-sm" onClick={() => setFit('waterCups', Math.max(0, f.waterCups - 1))} aria-label="Remove a cup">–</button>
              <button className="icon-btn icon-btn-sm on" onClick={() => setFit('waterCups', f.waterCups + 1)} aria-label="Add a cup"><Icon name="plus" size={14} stroke={3} /></button>
            </div>
          </div>
        </div>
        <div className="card fit-card">
          <Ring value={f.sleepHrs} max={8} color="var(--purple-600)">
            <Icon name="moon" size={20} /><b>{f.sleepHrs}h</b>
          </Ring>
          <div><small>Sleep</small><strong>{f.sleepHrs} hours</strong><span>Goal 7–9 hours</span></div>
        </div>
      </div>

      <div className="fit-layout">
        <div className="card">
          <div className="card-head"><h3>Steps this week</h3><span className="chip chip-green">Goal {f.stepGoal.toLocaleString()}</span></div>
          <div className="bars">
            {week.map((w, n) => (
              <div className="bar-col" key={days[n]}>
                <span className="bar-val">{(w / 1000).toFixed(1)}k</span>
                <div className="bar-track">
                  <span className={`bar-fill ${w >= f.stepGoal ? 'hit' : ''} ${n === 6 ? 'today' : ''}`} style={{ height: `${(w / maxW) * 100}%` }} />
                </div>
                <small>{days[n]}</small>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <h3>Body</h3>
          <div className="body-stats">
            <div><small>Height</small><b>{me.profile.heightCm || '–'} <em>cm</em></b></div>
            <div><small>Weight</small><b>{me.profile.weightKg || '–'} <em>kg</em></b></div>
            <div><small>BMI</small><b>{b || '–'}</b></div>
          </div>
          {bmiLabel && <span className={`chip chip-${bmiLabel[1]}`}>{bmiLabel[0]}</span>}
          <h3 style={{ marginTop: 22 }}>Small goals</h3>
          <ul className="goal-list">
            <li><Icon name="check" size={16} stroke={3} /> Walk 10 minutes after lunch</li>
            <li><Icon name="check" size={16} stroke={3} /> 8 cups of water</li>
            <li className="todo"><span /> In bed by 11pm</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

/* ---------- Settings ---------- */

const shareFields = [
  ['location', 'Live location'],
  ['nameAge', 'Name and age'],
  ['bloodGenotype', 'Blood group and genotype'],
  ['allergies', 'Allergies'],
  ['infections', 'Known infections'],
  ['conditionsMeds', 'Conditions and medication'],
]

export function Settings({ me }) {
  const save = useUpdateMe()
  const { signOut } = useAuth()
  const loc = useLocation()
  const [custom, setCustom] = useState(String(me.settings.sosDelay))
  const s = me.settings
  const setDelay = (n) => save.mutate({ settings: { sosDelay: Math.min(30, Math.max(3, n)) } })

  return (
    <div className="page">
      <SectionHead icon="settings" tone="grey" title="Settings" text="SOS countdown, what gets shared, and your account." action={<SaveState mutation={save} />} />
      <div className="settings-grid">
        <div className="card">
          <h3>SOS countdown</h3>
          <p className="muted">Time you have to cancel after pressing SOS.</p>
          <div className="choice-row" style={{ marginTop: 14 }}>
            {[3, 5, 10].map((n) => (
              <button key={n} className={`choice ${s.sosDelay === n ? 'on' : ''}`} aria-pressed={s.sosDelay === n} onClick={() => { setDelay(n); setCustom(String(n)) }}>{n} sec</button>
            ))}
          </div>
          <label className="field" style={{ marginTop: 14 }}>
            <span>Custom (3–30 seconds)</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <input className="input" type="number" min="3" max="30" value={custom} onChange={(e) => setCustom(e.target.value)} />
              <button className="btn btn-ghost" onClick={() => setDelay(Number(custom) || 5)}>Save</button>
            </div>
          </label>
        </div>
        <div className="card">
          <h3>Shared during SOS</h3>
          <p className="muted">Only these fields go to the hospital and your contacts.</p>
          <ul className="toggle-list">
            {shareFields.map(([k, l]) => (
              <li key={k}>
                <span>{l}</span>
                <label className="switch">
                  <input type="checkbox" aria-label={l} checked={!!s.share[k]} onChange={(e) => save.mutate({ settings: { share: { [k]: e.target.checked } } })} />
                  <span />
                </label>
              </li>
            ))}
          </ul>
        </div>
        <div className="card">
          <h3>Location</h3>
          <p className="muted">
            {loc.status === 'live' ? `On · accurate to about ${loc.pos.accuracy} m.` : loc.status === 'denied' ? "Blocked in your browser. Allow location for this site in your browser's settings." : 'Off. Turn it on so SOS can share where you are.'}
          </p>
          {loc.status !== 'live' && loc.status !== 'denied' && <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={loc.start}><Icon name="pin" size={18} /> Turn on location</button>}
        </div>
        <div className="card">
          <h3>Account</h3>
          <p className="muted">Signed in as {me.phone}.</p>
          <button className="btn btn-ghost" style={{ marginTop: 14 }} onClick={signOut}><Icon name="logout" size={18} /> Sign out</button>
        </div>
      </div>
    </div>
  )
}

export { Spinner }
