import { useEffect, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import Icon from '../components/Icon.jsx'
import { api, isDemo } from '../api/index.js'
import { DEMO_NAFDAC_SAMPLES } from '../api/mock.js'
import { SectionHead } from './Screens.jsx'

// TendVerify: check a medicine's NAFDAC registration number.
// Registration is not pack authentication (slide 14), so the result says so plainly.

const RECENT_KEY = 'tendai-verify-recent'
// Typical formats: A4-1234, 04-1234, B4-1234, A11-0123, sometimes with a trailing letter (A4-1234L).
const NAFDAC_RE = /^[A-Z]?\d{1,2}-\d{3,6}[A-Z]?$/

export function normaliseNafdac(raw) {
  let s = raw.toUpperCase().replace(/^NAFDAC\s*(REG\.?\s*)?(NO\.?)?\s*:?\s*/, '').replace(/\s+/g, '')
  // Accept "A41234" → "A4-1234" and "041234" → "04-1234" when the dash is missing.
  // (Rarer prefixes like A11 need the dash, since "A111234" is ambiguous.)
  if (!s.includes('-')) {
    const m = s.match(/^([A-Z]\d|\d{2})(\d{3,6}[A-Z]?)$/)
    if (m) s = `${m[1]}-${m[2]}`
  }
  return s
}

const STATUS = {
  registered: { tone: 'green', icon: 'shield', title: 'Registered with NAFDAC', text: 'This number matches a registered product. Check that the details below match your pack exactly.' },
  expired: { tone: 'amber', icon: 'alert', title: 'Registration has expired', text: 'This product was registered, but the registration is no longer current. Ask your pharmacist before using it.' },
  suspended: { tone: 'red', icon: 'alert', title: 'Registration suspended or withdrawn', text: 'Do not use this product. Return it to where you bought it and report it to NAFDAC.' },
  not_found: { tone: 'red', icon: 'x', title: 'No match found', text: 'We could not find this number. Check you typed it correctly. If it is right, the product may be unregistered or fake. Do not use it until a pharmacist confirms.' },
}

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : '–')

function loadRecent() {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY)) || []
  } catch {
    return []
  }
}

export default function Verify() {
  const [input, setInput] = useState('')
  const [touched, setTouched] = useState(false)
  const [recent, setRecent] = useState(loadRecent)
  const verify = useMutation({
    mutationFn: (no) => api.medicines.verify(no),
    onSuccess: (r) => {
      setRecent((list) => [{ nafdacNo: r.nafdacNo, name: r.name || null, status: r.status, checkedAt: r.checkedAt }, ...list.filter((x) => x.nafdacNo !== r.nafdacNo)].slice(0, 6))
    },
  })
  useEffect(() => {
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(recent))
    } catch {
      /* storage blocked */
    }
  }, [recent])

  const no = normaliseNafdac(input)
  const valid = NAFDAC_RE.test(no)
  const run = (value) => {
    const n = normaliseNafdac(value ?? input)
    if (value) setInput(n)
    setTouched(true)
    if (NAFDAC_RE.test(n)) verify.mutate(n)
  }
  const r = verify.data
  const st = r && STATUS[r.status]

  return (
    <div className="page">
      <SectionHead icon="pill" tone="blue" title="Verify medicine" text="Check a medicine's NAFDAC registration number before you use it. You'll find the number printed on the pack, usually as “NAFDAC Reg. No.”" />

      <div className="verify-layout">
        <div className="verify-main">
          <form className="card verify-form" onSubmit={(e) => { e.preventDefault(); run() }}>
            <label className="field">
              <span>NAFDAC registration number</span>
              <div className="verify-input">
                <span className="verify-prefix">NAFDAC</span>
                <input
                  className="input input-lg"
                  autoFocus
                  autoCapitalize="characters"
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="e.g. A4-1234"
                  value={input}
                  onChange={(e) => { setInput(e.target.value); verify.reset() }}
                  onBlur={() => input && setTouched(true)}
                  aria-invalid={touched && !!input && !valid}
                />
                <button className="btn btn-primary verify-btn" disabled={!input.trim() || verify.isPending}>
                  {verify.isPending ? 'Checking…' : <><Icon name="search" size={18} /> Verify</>}
                </button>
              </div>
            </label>
            {touched && input && !valid && <p className="form-error"><Icon name="alert" size={16} /> That doesn't look like a NAFDAC number. It is usually 2 characters, a dash, then 4 digits, like A4-1234 or 04-1234.</p>}
            {isDemo && (
              <p className="verify-samples">
                <span className="demo-tag">Demo</span> Try:{' '}
                {DEMO_NAFDAC_SAMPLES.map((s) => (
                  <button type="button" key={s} className="link-btn" onClick={() => run(s)}>{s}</button>
                ))}
              </p>
            )}
          </form>

          {verify.isPending && (
            <div className="card verify-loading" role="status"><span className="qs-spin" /> Checking {no} against the registration database…</div>
          )}

          {verify.isError && (
            <div className="qs qs-error" role="alert">
              <Icon name="alert" size={22} />
              <div><strong>Couldn't check right now</strong><p>{verify.error.message} Try again, or check the NAFDAC Greenbook directly.</p></div>
              <button className="btn btn-ghost btn-sm" onClick={() => run()}>Try again</button>
            </div>
          )}

          {r && st && !verify.isPending && (
            <article className={`card verify-result tone-border-${st.tone}`} aria-live="polite">
              <div className="verify-result-head">
                <span className={`verify-badge tone-${st.tone}`}><Icon name={st.icon} size={26} stroke={2.2} /></span>
                <div>
                  <span className={`chip chip-${st.tone}`}>NAFDAC {r.nafdacNo}</span>
                  <h3>{st.title}</h3>
                  <p>{st.text}</p>
                </div>
              </div>

              {r.alert && <p className="verify-alert"><Icon name="alert" size={16} /> {r.alert}</p>}

              {r.status !== 'not_found' && (
                <dl className="verify-details">
                  <div><dt>Product</dt><dd>{r.name}</dd></div>
                  <div><dt>Active ingredients</dt><dd>{r.activeIngredients?.join(', ')}</dd></div>
                  <div><dt>Form</dt><dd>{r.form}</dd></div>
                  <div><dt>Category</dt><dd>{r.category}</dd></div>
                  <div><dt>Registration holder</dt><dd>{r.holder}</dd></div>
                  <div><dt>Manufacturer</dt><dd>{r.manufacturer}</dd></div>
                  <div><dt>Approved</dt><dd>{fmtDate(r.approvedOn)}</dd></div>
                  <div><dt>Registration valid until</dt><dd>{fmtDate(r.expiresOn)}</dd></div>
                </dl>
              )}

              <div className="verify-foot">
                <small>Checked {fmtDate(r.checkedAt)} · Source: {r.source || 'NAFDAC registration database'}</small>
                {r.status !== 'registered' && (
                  <a className="btn btn-ghost btn-sm" href="tel:112"><Icon name="phone" size={16} /> Feel unwell after taking it? Call 112</a>
                )}
              </div>
            </article>
          )}

          {r?.status === 'registered' && (
            <div className="card verify-caution">
              <Icon name="info" size={20} />
              <div>
                <strong>A registered number does not prove your pack is genuine.</strong>
                <p>Fake products sometimes copy real numbers. Also check that the name, strength and manufacturer match the pack, the seal is intact, the expiry date hasn't passed, and use the scratch-code (MAS) check if the pack has one.</p>
              </div>
            </div>
          )}
        </div>

        <aside className="verify-side">
          <div className="card">
            <h3>Recent checks</h3>
            {recent.length === 0 ? (
              <p className="muted" style={{ marginTop: 8 }}>Numbers you check will appear here.</p>
            ) : (
              <ul className="verify-recent">
                {recent.map((x) => {
                  const s = STATUS[x.status]
                  return (
                    <li key={x.nafdacNo}>
                      <button onClick={() => run(x.nafdacNo)}>
                        <span className={`dot-status tone-${s?.tone || 'grey'}`} />
                        <span className="verify-recent-body">
                          <strong>{x.nafdacNo}</strong>
                          <small>{x.name || s?.title}</small>
                        </span>
                        <Icon name="chevronRight" size={16} />
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
          <div className="card">
            <h3>Where to find the number</h3>
            <ul className="verify-tips">
              <li><Icon name="check" size={16} stroke={3} /> On the outer box or bottle label</li>
              <li><Icon name="check" size={16} stroke={3} /> Written as “NAFDAC Reg. No.” followed by the number</li>
              <li><Icon name="check" size={16} stroke={3} /> Sachets may only show it on the bigger pack</li>
            </ul>
          </div>
          <div className="card card-soft">
            <h3>Think a medicine is fake?</h3>
            <p className="muted" style={{ marginTop: 6 }}>Don't use it. Keep the pack and receipt, and report it to NAFDAC or your pharmacist.</p>
            <a className="btn btn-ghost btn-sm" style={{ marginTop: 12 }} href="https://greenbook.nafdac.gov.ng" target="_blank" rel="noreferrer">NAFDAC Greenbook <Icon name="external" size={14} /></a>
          </div>
        </aside>
      </div>

      <p className="note"><Icon name="info" size={16} /> TendVerify checks registration records. It does not test the medicine itself. Ask a pharmacist if you're unsure.</p>
    </div>
  )
}
