import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router'
import Icon from '../components/Icon.jsx'
import { SectionHead } from './Screens.jsx'
import { EMERGENCIES, byId } from './emergencies.js'
import CprGuide from './Cpr.jsx'

function CallBanner({ onSos }) {
  return (
    <div className="em-banner" role="note">
      <Icon name="alert" size={22} />
      <p><strong>Life-threatening?</strong> Press SOS or call 112 first, then follow the steps.</p>
      <div className="em-banner-actions">
        <a className="btn btn-white btn-sm" href="tel:112"><Icon name="phone" size={16} /> Call 112</a>
        {onSos && <button className="btn btn-sm em-banner-sos" onClick={onSos}>SOS</button>}
      </div>
    </div>
  )
}

export function EmergencyHub({ onSos }) {
  const [q, setQ] = useState('')
  const list = EMERGENCIES.filter((e) => `${e.name} ${e.summary}`.toLowerCase().includes(q.toLowerCase()))
  return (
    <div className="page">
      <SectionHead icon="firstaid" tone="red" title="Common emergencies" text="Step-by-step first aid for the emergencies people face most, with what to do for adults, children and babies." />
      <CallBanner onSos={onSos} />

      <div className="loc-search em-search">
        <Icon name="search" size={18} />
        <input aria-label="Search emergencies" placeholder="Search, e.g. burns, choking, snake bite" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="em-grid">
        {list.map((e) => (
          <Link key={e.id} to={`/app/emergencies/${e.id}`} className="em-card">
            <span className="em-card-img">{e.cover && <img src={e.cover} alt="" loading="lazy" />}</span>
            <span className="em-card-body">
              <strong>{e.name}</strong>
              <small>{e.summary}</small>
            </span>
            <Icon name="chevronRight" size={18} />
          </Link>
        ))}
        {list.length === 0 && <p className="muted">No match. Try another word, or call 112 if you are unsure.</p>}
      </div>
      <p className="note"><Icon name="info" size={16} /> First-aid guidance only, not a substitute for emergency services or training. Content and illustrations are awaiting clinical review.</p>
    </div>
  )
}

function AgeCard({ label, data }) {
  if (!data) return null
  return (
    <article className={`card em-age ${data.img ? '' : 'no-img'}`}>
      {data.img && <img src={data.img} alt={data.alt} loading="lazy" />}
      <div>
        <h3>{label}</h3>
        <ul>
          {data.text.map((t) => <li key={t}>{t}</li>)}
        </ul>
      </div>
    </article>
  )
}

export function EmergencyDetail({ onSos }) {
  const { id } = useParams()
  const e = byId[id]
  if (!e) return <Navigate to="/app/emergencies" replace />
  const i = EMERGENCIES.indexOf(e)
  const next = EMERGENCIES[(i + 1) % EMERGENCIES.length]

  return (
    <div className="page">
      <Link to="/app/emergencies" className="link-btn em-back"><Icon name="chevronLeft" size={16} /> All emergencies</Link>
      <div className="em-head">
        <h2>{e.name}</h2>
        <p>{e.summary}</p>
      </div>

      <section className="em-call">
        <div className="em-call-title"><Icon name="phone" size={18} /> Call 112 if</div>
        <ul>{e.callIf.map((c) => <li key={c}>{c}</li>)}</ul>
        <div className="em-call-actions">
          <a className="btn btn-danger btn-sm" href="tel:112"><Icon name="phone" size={16} /> Call 112</a>
          {onSos && <button className="btn btn-ghost btn-sm" onClick={onSos}>Start SOS</button>}
        </div>
      </section>

      {e.special === 'cpr' ? (
        <CprGuide />
      ) : (
        <>
          <h3 className="h-label">What to do</h3>
          <ol className="cpr-steps em-steps">
            {e.steps.map((s, n) => (
              <li key={s.title} className={`card cpr-step ${s.img ? '' : 'no-img'}`}>
                {s.img && (
                  <div className="cpr-step-media"><img src={s.img} alt={s.alt} loading="lazy" /></div>
                )}
                <div className="cpr-step-body">
                  <span className="cpr-n">{n + 1}</span>
                  <strong>{s.title}</strong>
                  <p>{s.text}</p>
                </div>
              </li>
            ))}
          </ol>

          {e.donts?.length > 0 && (
            <section className="em-donts">
              <h3><Icon name="x" size={18} stroke={3} /> Do not</h3>
              <ul>{e.donts.map((d) => <li key={d}>{d}</li>)}</ul>
            </section>
          )}

          {(e.child || e.baby) && (
            <>
              <h3 className="h-label" style={{ marginTop: 28 }}>Children and babies</h3>
              <div className="em-ages">
                <AgeCard label="Children (1 year to puberty)" data={e.child} />
                <AgeCard label="Babies (under 1 year)" data={e.baby} />
              </div>
            </>
          )}
        </>
      )}

      <div className="em-foot">
        <p className="note"><Icon name="info" size={16} /> First-aid guidance only. Content and illustrations are awaiting clinical review.</p>
        <Link to={`/app/emergencies/${next.id}`} className="btn btn-ghost btn-sm">Next: {next.name} <Icon name="chevronRight" size={16} /></Link>
      </div>
    </div>
  )
}
