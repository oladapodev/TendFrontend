import { useEffect, useState } from 'react'
import Icon from '../components/Icon.jsx'
import { Spinner, ErrorBox } from '../components/QueryState.jsx'
import { useDrugSearch, useVerifyDrug } from './data.js'
import { SectionHead } from './Screens.jsx'

// NAFDAC Greenbook: check a registration number from a drug pack, or search registered products.
function useDebounced(value, ms = 300) {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return v
}

const VERDICT_TONE = (r) => (!r.registered ? 'red' : r.status === 'Active' && !r.expired ? 'green' : 'amber')

function Product({ p }) {
  const active = p.status === 'Active'
  return (
    <article className="card drug-card">
      <div className="drug-head">
        <div>
          <strong>{p.name}</strong>
          <small>{[p.strength, p.form, p.route].filter(Boolean).join(' · ')}</small>
        </div>
        <span className={`chip chip-${active ? 'green' : 'amber'}`}>{p.status || 'Unknown'}</span>
      </div>
      <dl className="drug-dl">
        <div><dt>NAFDAC no.</dt><dd><b>{p.nafdac}</b></dd></div>
        {p.ingredient && <div><dt>Ingredient</dt><dd>{p.ingredient}{p.synonym ? ` (${p.synonym})` : ''}</dd></div>}
        {p.applicant && <div><dt>Company</dt><dd>{p.applicant}</dd></div>}
        {p.category && <div><dt>Category</dt><dd>{p.category}</dd></div>}
        {p.pack_size && <div><dt>Pack</dt><dd>{p.pack_size}</dd></div>}
        {(p.approval_date || p.expiry_date) && <div><dt>Registration</dt><dd>{p.approval_date || '?'} to {p.expiry_date || '?'}</dd></div>}
      </dl>
      {p.smpc && <a className="link-btn" href={p.smpc} target="_blank" rel="noreferrer">Product leaflet (SmPC)</a>}
    </article>
  )
}

export default function Drugs() {
  const [reg, setReg] = useState('')
  const [q, setQ] = useState('')
  const term = useDebounced(q)
  const verify = useVerifyDrug()
  const search = useDrugSearch(term)
  const r = verify.data

  return (
    <div className="page">
      <SectionHead icon="shield" tone="green" title="Check a drug" text="Is this medicine registered with NAFDAC? Type the NAFDAC number printed on the pack, or search by name." />

      <div className="drug-layout">
        <section className="card">
          <h3>Verify a NAFDAC number</h3>
          <form className="drug-verify" onSubmit={(e) => { e.preventDefault(); if (reg.trim()) verify.mutate(reg) }}>
            <input className="input" aria-label="NAFDAC registration number" placeholder="e.g. A4-100160" value={reg} onChange={(e) => setReg(e.target.value)} />
            <button className="btn btn-primary" disabled={!reg.trim() || verify.isPending}>{verify.isPending ? 'Checking…' : 'Check'}</button>
          </form>
          {verify.isError && <p className="form-error"><Icon name="alert" size={16} /> {verify.error.message}</p>}
          {r && (
            <div className={`drug-verdict tone-${VERDICT_TONE(r)}`} role="status">
              <Icon name={r.registered ? (VERDICT_TONE(r) === 'green' ? 'check' : 'alert') : 'x'} size={22} stroke={2.5} />
              <div>
                <strong>{r.verdict}</strong>
                {r.data_updated && <small>NAFDAC Greenbook data from {r.data_updated.slice(0, 10)}</small>}
              </div>
            </div>
          )}
          {r?.products?.map((p) => <Product key={p.id} p={p} />)}
          <p className="note"><Icon name="info" size={14} /> A registered number can still be copied onto fake packs. Buy from a licensed pharmacy and check the pack, seal and expiry date.</p>
        </section>

        <section>
          <div className="loc-search">
            <Icon name="search" size={18} />
            <input aria-label="Search registered drugs" placeholder="Search by name, ingredient or company" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="drug-results">
            {term.trim().length < 2 && <p className="muted" style={{ padding: 16 }}>Type at least 2 letters, e.g. paracetamol or Emzor.</p>}
            {term.trim().length >= 2 && search.isPending && <Spinner label="Searching the Greenbook…" />}
            {search.isError && <ErrorBox error={search.error} onRetry={() => search.refetch()} title="Couldn't search" />}
            {term.trim().length >= 2 && search.data && (
              <>
                <p className="muted">{search.data.count} result{search.data.count === 1 ? '' : 's'}{search.data.fuzzy ? ' (closest spellings)' : ''}</p>
                {search.data.results.map((p) => <Product key={p.id} p={p} />)}
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
