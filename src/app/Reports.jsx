import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router'
import Icon from '../components/Icon.jsx'
import { Spinner, ErrorBox } from '../components/QueryState.jsx'
import { isDemo } from '../api/index.js'
import { SectionHead, Modal } from './Screens.jsx'
import { useReports, useReportInsights, useExtractReport, useSaveReport, useDeleteReport, useLoadSampleReports } from './data.js'

// Health reports (AI): upload lab reports over time, check the extracted values, compare, chart and explain changes.

const fmtDate = (d) => new Date(`${d}T00:00:00`).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
const fmtShort = (d) => new Date(`${d}T00:00:00`).toLocaleDateString('en-NG', { month: 'short', year: '2-digit' })
const range = (r) => (r.refLow != null && r.refHigh != null ? `${r.refLow}–${r.refHigh}` : r.refHigh != null ? `below ${r.refHigh}` : r.refLow != null ? `above ${r.refLow}` : '–')

export function statusOf(r) {
  if (r.refLow != null && r.value < r.refLow) return 'low'
  if (r.refHigh != null && r.value > r.refHigh) return 'high'
  return 'normal'
}

function StatusBadge({ status }) {
  if (status === 'high') return <span className="chip chip-red"><Icon name="arrowRight" size={12} style={{ transform: 'rotate(-90deg)' }} /> High</span>
  if (status === 'low') return <span className="chip chip-amber"><Icon name="arrowRight" size={12} style={{ transform: 'rotate(90deg)' }} /> Low</span>
  return <span className="chip chip-green"><Icon name="check" size={12} stroke={3} /> Normal</span>
}

function Change({ now, before }) {
  if (before == null) return <span className="muted">–</span>
  const pct = before ? ((now - before) / before) * 100 : 0
  if (Math.abs(pct) < 1) return <span className="rp-change">No change</span>
  return (
    <span className="rp-change">
      <Icon name="arrowRight" size={13} style={{ transform: `rotate(${pct > 0 ? -90 : 90}deg)` }} />
      {pct > 0 ? '+' : '−'}{Math.abs(Math.round(pct))}%
    </span>
  )
}

/* ---------- trend chart: one series, reference band, hover tooltip ---------- */

function TrendChart({ series, test }) {
  const [hover, setHover] = useState(null)
  const W = 640
  const H = 260
  const M = { t: 20, r: 24, b: 34, l: 48 }
  const vals = series.map((p) => p.value)
  const lo = Math.min(...vals, test.refLow ?? Infinity)
  const hi = Math.max(...vals, test.refHigh ?? -Infinity)
  const pad = (hi - lo) * 0.18 || 1
  const y0 = Math.max(0, lo - pad)
  const y1 = hi + pad
  const x = (i) => (series.length === 1 ? (M.l + W - M.r) / 2 : M.l + (i * (W - M.l - M.r)) / (series.length - 1))
  const y = (v) => M.t + ((y1 - v) * (H - M.t - M.b)) / (y1 - y0)
  const ticks = Array.from({ length: 4 }, (_, i) => y0 + ((y1 - y0) * i) / 3)
  const bandTop = y(test.refHigh ?? y1)
  const bandBottom = y(test.refLow ?? y0)
  const path = series.map((p, i) => `${i ? 'L' : 'M'}${x(i)},${y(p.value)}`).join(' ')
  const last = series.at(-1)

  return (
    <div className="rp-chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${test.test} over time`}>
        <rect x={M.l} y={bandTop} width={W - M.l - M.r} height={Math.max(0, bandBottom - bandTop)} className="rp-band" />
        <text x={W - M.r - 6} y={bandTop + 14} textAnchor="end" className="rp-band-label">Normal range</text>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={M.l} x2={W - M.r} y1={y(t)} y2={y(t)} className="rp-grid" />
            <text x={M.l - 8} y={y(t) + 4} textAnchor="end" className="rp-axis">{Number(t.toFixed(t < 10 ? 1 : 0))}</text>
          </g>
        ))}
        {series.map((p, i) => (
          <text key={p.date} x={x(i)} y={H - 10} textAnchor="middle" className="rp-axis">{fmtShort(p.date)}</text>
        ))}
        <path d={path} className="rp-line" />
        {series.map((p, i) => (
          <circle key={p.date} cx={x(i)} cy={y(p.value)} r={hover === i ? 6.5 : 5} className={`rp-dot is-${statusOf({ ...test, value: p.value })}`} />
        ))}
        <text x={x(series.length - 1) + (series.length > 1 ? 4 : 0)} y={y(last.value) - 12} textAnchor={series.length > 1 ? 'end' : 'middle'} className="rp-direct">{last.value} {test.unit}</text>
        {series.map((p, i) => (
          <rect
            key={`hit-${p.date}`}
            x={x(i) - 22}
            y={M.t}
            width={44}
            height={H - M.t - M.b}
            fill="transparent"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            onFocus={() => setHover(i)}
            onBlur={() => setHover(null)}
            tabIndex={0}
            aria-label={`${fmtDate(p.date)}: ${p.value} ${test.unit}`}
          />
        ))}
        {hover != null && <line x1={x(hover)} x2={x(hover)} y1={M.t} y2={H - M.b} className="rp-cross" />}
      </svg>
      {hover != null && (
        <div className="rp-tip" style={{ left: `${(x(hover) / W) * 100}%`, top: `${(y(series[hover].value) / H) * 100}%` }}>
          <small>{fmtDate(series[hover].date)}</small>
          <strong>{series[hover].value} {test.unit}</strong>
          <StatusBadge status={statusOf({ ...test, value: series[hover].value })} />
        </div>
      )}
    </div>
  )
}

/* ---------- upload + review ---------- */

function ReviewModal({ draft, onClose }) {
  const save = useSaveReport()
  const [date, setDate] = useState(draft.date)
  const [lab, setLab] = useState(draft.lab || '')
  const [rows, setRows] = useState(draft.results)
  const setVal = (i, v) => setRows(rows.map((r, n) => (n === i ? { ...r, value: v } : r)))
  const valid = date && rows.every((r) => r.value !== '' && !Number.isNaN(Number(r.value)))

  return (
    <Modal
      wide
      title="Check the values we read"
      onClose={onClose}
      footer={
        <>
          {save.isError && <span className="save-state is-err" style={{ marginRight: 'auto' }}><Icon name="alert" size={14} /> {save.error.message}</span>}
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={!valid || save.isPending} onClick={() => save.mutate({ date, lab: lab.trim(), fileName: draft.fileName, results: rows.map((r) => ({ ...r, value: Number(r.value) })) }, { onSuccess: onClose })}>
            {save.isPending ? 'Saving…' : <><Icon name="check" size={16} stroke={3} /> These match my report</>}
          </button>
        </>
      }
    >
      <p className="rp-review-note">
        <Icon name="info" size={16} />
        <span>Compare each value with your paper or PDF report and correct anything that is wrong. Reading machines can make mistakes.{draft.demo && <strong> Demo mode: these are sample values, not read from {draft.fileName}.</strong>}</span>
      </p>
      <div className="grid-2" style={{ marginBottom: 16 }}>
        <label className="field"><span>Date of the test</span><input className="input" type="date" value={date} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setDate(e.target.value)} /></label>
        <label className="field"><span>Laboratory (optional)</span><input className="input" value={lab} onChange={(e) => setLab(e.target.value)} placeholder="e.g. FMC Abeokuta lab" /></label>
      </div>
      <div className="rp-table-wrap">
        <table className="rp-table">
          <thead><tr><th>Test</th><th>Value</th><th>Unit</th><th>Normal range</th><th>Status</th></tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.key}>
                <td>{r.test}</td>
                <td><input className="input rp-val-input" inputMode="decimal" aria-label={`${r.test} value`} value={r.value} onChange={(e) => setVal(i, e.target.value)} /></td>
                <td className="muted">{r.unit}</td>
                <td className="muted">{range(r)}</td>
                <td>{r.value !== '' && !Number.isNaN(Number(r.value)) && <StatusBadge status={statusOf({ ...r, value: Number(r.value) })} />}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Modal>
  )
}

function UploadCard({ compact }) {
  const extract = useExtractReport()
  const [draft, setDraft] = useState(null)
  const [drag, setDrag] = useState(false)
  const input = useRef(null)
  const pick = (file) => {
    if (!file) return
    if (!/^image\/|application\/pdf/.test(file.type)) return extract.reset()
    extract.mutate(file, { onSuccess: setDraft })
  }

  return (
    <>
      <div
        className={`rp-drop ${drag ? 'is-drag' : ''} ${compact ? 'is-compact' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files?.[0]) }}
      >
        {extract.isPending ? (
          <div className="rp-reading" role="status"><span className="qs-spin" /> Reading your report and pulling out the values…</div>
        ) : (
          <>
            <span className="tile-ico tone-green"><Icon name="clipboard" size={26} /></span>
            <div className="rp-drop-text">
              <strong>Upload a lab report</strong>
              <small>Photo or PDF of a blood test, sugar, cholesterol, kidney or liver result.</small>
            </div>
            <button className="btn btn-primary" onClick={() => input.current?.click()}><Icon name="plus" size={18} /> Choose file</button>
            <input ref={input} type="file" accept="image/*,application/pdf" capture="environment" hidden onChange={(e) => { pick(e.target.files?.[0]); e.target.value = '' }} />
          </>
        )}
      </div>
      {extract.isError && <p className="form-error"><Icon name="alert" size={16} /> {extract.error.message}</p>}
      {draft && <ReviewModal draft={draft} onClose={() => { setDraft(null); extract.reset() }} />}
    </>
  )
}

/* ---------- page ---------- */

export default function Reports() {
  const reports = useReports()
  const insights = useReportInsights(true)
  const del = useDeleteReport()
  const samples = useLoadSampleReports()
  const [selected, setSelected] = useState(null)

  const sorted = useMemo(() => [...(reports.data || [])].sort((a, b) => a.date.localeCompare(b.date)), [reports.data])
  const latest = sorted.at(-1)
  const prev = sorted.at(-2)
  const flagged = latest ? latest.results.filter((r) => statusOf(r) !== 'normal').length : 0
  const selKey = selected || insights.data?.items?.[0]?.key || latest?.results[0]?.key
  const selTest = latest?.results.find((r) => r.key === selKey)
  const series = sorted.map((rep) => ({ date: rep.date, value: rep.results.find((r) => r.key === selKey)?.value })).filter((p) => p.value != null)

  return (
    <div className="page">
      <SectionHead
        icon="sparkle" tone="green" title="Health reports"
        text="Upload your lab reports over time. TendAI reads the values, compares them with your past results, highlights anything out of range and explains what changed."
        action={<span className="chip chip-green"><Icon name="sparkle" size={13} /> AI feature</span>}
      />

      {reports.isPending && <Spinner label="Loading your reports…" />}
      {reports.isError && <ErrorBox error={reports.error} onRetry={() => reports.refetch()} title="Couldn't load your reports" />}

      {reports.data && sorted.length === 0 && (
        <>
          <UploadCard />
          <div className="rp-how">
            {[
              ['clipboard', 'Upload', 'Take a photo of your lab result or upload the PDF.'],
              ['check', 'Check', 'Confirm the values we read match your report.'],
              ['activity', 'Compare', 'See how each result changes from one test to the next.'],
              ['chat', 'Understand', 'Get a plain-English explanation and questions for your doctor.'],
            ].map(([ic, t, d], i) => (
              <div className="rp-how-step" key={t}>
                <span className="rp-how-n">{i + 1}</span>
                <Icon name={ic} size={20} />
                <strong>{t}</strong>
                <small>{d}</small>
              </div>
            ))}
          </div>
          {isDemo && (
            <p className="rp-sample">
              No reports to hand? <button className="link-btn" disabled={samples.isPending} onClick={() => samples.mutate()}>{samples.isPending ? 'Loading…' : 'Try it with 3 sample reports'}</button>
            </p>
          )}
        </>
      )}

      {latest && (
        <>
          <section className="rp-summary card">
            <div>
              <small className="muted">Latest report</small>
              <strong>{fmtDate(latest.date)}{latest.lab ? ` · ${latest.lab}` : ''}</strong>
            </div>
            <div>
              <small className="muted">Out of range</small>
              <strong className={flagged ? 'rp-flag' : 'rp-ok'}>{flagged ? `${flagged} value${flagged > 1 ? 's' : ''}` : 'None'}</strong>
            </div>
            <div>
              <small className="muted">Compared with</small>
              <strong>{prev ? fmtDate(prev.date) : 'Upload another report to compare'}</strong>
            </div>
            <UploadCard compact />
          </section>

          <div className="rp-layout">
            <div className="rp-main">
              {selTest && series.length > 0 && (
                <section className="card">
                  <div className="card-head">
                    <div>
                      <h3>{selTest.test}</h3>
                      <small className="muted">{selTest.unit} · normal range {range(selTest)}</small>
                    </div>
                    <StatusBadge status={statusOf(selTest)} />
                  </div>
                  {series.length > 1 ? <TrendChart series={series} test={selTest} /> : <p className="muted">Upload another report to see how this changes over time.</p>}
                </section>
              )}

              <section className="card">
                <div className="card-head"><h3>All results</h3><small className="muted">Select a test to chart it</small></div>
                <div className="rp-table-wrap">
                  <table className="rp-table rp-compare">
                    <thead>
                      <tr><th>Test</th>{prev && <th>{fmtShort(prev.date)}</th>}<th>{fmtShort(latest.date)}</th>{prev && <th>Change</th>}<th>Normal range</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                      {latest.results.map((r) => {
                        const before = prev?.results.find((x) => x.key === r.key)
                        return (
                          <tr key={r.key} className={r.key === selKey ? 'is-sel' : ''} onClick={() => setSelected(r.key)} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setSelected(r.key)}>
                            <td><strong>{r.test}</strong></td>
                            {prev && <td className="muted">{before ? `${before.value}` : '–'}</td>}
                            <td><strong>{r.value}</strong> <small className="muted">{r.unit}</small></td>
                            {prev && <td><Change now={r.value} before={before?.value} /></td>}
                            <td className="muted">{range(r)}</td>
                            <td><StatusBadge status={statusOf(r)} /></td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>

            <aside className="rp-side">
              <section className="card rp-insights">
                <div className="card-head"><h3><Icon name="sparkle" size={16} /> What changed and why it matters</h3></div>
                {insights.isPending && <Spinner label="TendAI is reviewing your results…" />}
                {insights.isError && <ErrorBox error={insights.error} onRetry={() => insights.refetch()} title="Couldn't explain these results" />}
                {insights.data && insights.data.items.length === 0 && <p className="muted">All your latest results are in range with no big changes. Keep up your usual checks.</p>}
                {insights.data?.items.map((it) => (
                  <article key={it.key} className={`rp-insight ${it.key === selKey ? 'is-sel' : ''}`}>
                    <button className="rp-insight-head" onClick={() => setSelected(it.key)}>
                      <StatusBadge status={it.status} />
                      <strong>{it.test}</strong>
                    </button>
                    <p className="rp-insight-sum">{it.summary}</p>
                    <p><strong>What this may mean: </strong>{it.meaning}</p>
                    <div className="rp-questions">
                      <small>Questions to ask your clinician</small>
                      <ul>{it.questions.map((q) => <li key={q}>{q}</li>)}</ul>
                    </div>
                  </article>
                ))}
                {insights.data?.items.length > 0 && (
                  <Link className="btn btn-ghost btn-sm btn-block" to="/app/agent"><Icon name="chat" size={16} /> Ask TendTalk about my results</Link>
                )}
              </section>

              <section className="card">
                <h3>Your reports</h3>
                <ul className="rp-history">
                  {[...sorted].reverse().map((rep) => {
                    const n = rep.results.filter((r) => statusOf(r) !== 'normal').length
                    return (
                      <li key={rep.id}>
                        <span className="tile-ico tone-green"><Icon name="clipboard" size={18} /></span>
                        <div>
                          <strong>{fmtDate(rep.date)}</strong>
                          <small>{rep.lab || rep.fileName}{rep.sample ? ' · sample' : ''} · {n ? `${n} out of range` : 'all in range'}</small>
                        </div>
                        <button className="icon-btn" aria-label={`Delete report from ${fmtDate(rep.date)}`} onClick={() => window.confirm(`Delete the report from ${fmtDate(rep.date)}? This cannot be undone.`) && del.mutate(rep.id)}><Icon name="trash" size={16} /></button>
                      </li>
                    )
                  })}
                </ul>
              </section>
            </aside>
          </div>
        </>
      )}

      <p className="note"><Icon name="info" size={16} /> AI can explain and organise your results. It does not diagnose. Always discuss your results with a qualified health professional.</p>
    </div>
  )
}
