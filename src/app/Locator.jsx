import { useState } from 'react'
import Icon from '../components/Icon.jsx'
import { useStore, facilities } from './store.jsx'
import { Modal } from './Screens.jsx'

// Illustrative map of central Abeokuta for the mockup. The build swaps this for Leaflet + OpenStreetMap tiles.
function MapCanvas({ places, selected, onSelect }) {
  return (
    <div className="map">
      <svg className="map-svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <rect width="100" height="100" fill="#eef3ef" />
        {/* blocks */}
        {[[6, 8, 18, 12], [30, 6, 22, 14], [58, 8, 14, 10], [76, 6, 18, 16], [8, 32, 14, 18], [50, 52, 18, 12], [72, 46, 20, 14], [10, 74, 22, 16], [40, 76, 16, 14], [64, 80, 14, 12]].map(([x, y, w, h], i) => (
          <rect key={i} x={x} y={y} width={w} height={h} rx="1.5" fill="#e2ebe5" />
        ))}
        {/* parks */}
        <rect x="36" y="26" width="12" height="12" rx="2" fill="#d4ecdc" />
        <rect x="84" y="28" width="12" height="10" rx="2" fill="#d4ecdc" />
        {/* river Ogun */}
        <path d="M-2 92 C 18 84, 22 70, 34 66 S 52 70, 58 60 S 76 40, 102 44" fill="none" stroke="#c7def0" strokeWidth="4.5" strokeLinecap="round" />
        {/* roads */}
        <g stroke="#fff" strokeLinecap="round" fill="none">
          <path d="M0 24 H100" strokeWidth="2.4" />
          <path d="M0 58 C 30 54, 60 64, 100 60" strokeWidth="2.4" />
          <path d="M24 0 V100" strokeWidth="2" />
          <path d="M54 0 C 52 30, 58 60, 52 100" strokeWidth="2.4" />
          <path d="M78 0 V100" strokeWidth="1.6" />
          <path d="M0 42 H50" strokeWidth="1.4" />
          <path d="M54 40 H100" strokeWidth="1.4" />
          <path d="M24 82 H100" strokeWidth="1.4" />
        </g>
        <g stroke="#f6d98a" strokeLinecap="round" fill="none">
          <path d="M0 24 H100" strokeWidth="0.7" />
          <path d="M54 0 C 52 30, 58 60, 52 100" strokeWidth="0.7" />
        </g>
        {/* route to selected */}
        {selected && (
          <path d={`M44 50 L 54 ${Math.min(50, selected.y)} L ${selected.x} ${selected.y}`} fill="none" stroke="var(--green-600)" strokeWidth="1.1" strokeDasharray="2 1.4" strokeLinecap="round" />
        )}
        <text x="30" y="70" fontSize="2.4" fill="#7aa3c4" fontStyle="italic">Ogun River</text>
        <text x="2" y="22.5" fontSize="2" fill="#8a9a90">Abeokuta–Ibadan Rd</text>
      </svg>

      {/* user */}
      <div className="map-me" style={{ left: '44%', top: '50%' }} title="You are here"><span /></div>

      {places.map((p) => (
        <button
          key={p.id}
          className={`map-pin ${p.emergency ? 'is-er' : ''} ${selected?.id === p.id ? 'is-sel' : ''}`}
          style={{ left: `${p.x}%`, top: `${p.y}%` }}
          onClick={() => onSelect(p)}
          aria-label={p.name}
        >
          <Icon name={p.custom ? 'star' : 'hospital'} size={16} />
          <span className="map-pin-label">{p.short}</span>
        </button>
      ))}

      <div className="map-legend">
        <span><i className="lg-er" /> 24h emergency</span>
        <span><i className="lg-hc" /> Health centre</span>
        <span><i className="lg-me" /> You</span>
      </div>
      <span className="map-credit">Illustrative map · © OpenStreetMap contributors in build</span>
    </div>
  )
}

export default function Locator() {
  const { state, update } = useStore()
  const [filter, setFilter] = useState('all')
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(null)
  const [adding, setAdding] = useState(null)

  const custom = state.customPlaces.map((p, n) => ({ ...p, short: p.name, custom: true, x: 34 + n * 7, y: 30 + n * 5, distance: null, type: 'Added by you', services: [], open: '–', emergency: false }))
  const all = [...custom, ...facilities]
  const list = all
    .filter((p) => (filter === 'er' ? p.emergency : filter === 'hc' ? !p.emergency && !p.custom : filter === 'mine' ? p.custom : true))
    .filter((p) => p.name.toLowerCase().includes(q.toLowerCase()))

  const inSos = (p) => state.customPlaces.some((c) => c.name === p.name)
  const addToSos = (p) => {
    if (inSos(p)) return
    update((s) => ({ customPlaces: [...s.customPlaces, { id: `p${Date.now()}`, name: p.name, phone: p.phone, address: p.address }] }))
  }
  const saveNew = () => {
    if (adding.kind === 'person') {
      update((s) => ({ contacts: [...s.contacts, { id: `c${Date.now()}`, name: adding.name, phone: adding.phone, relationship: 'Trusted person', notify: ['call', 'sms'] }] }))
    } else {
      update((s) => ({ customPlaces: [...s.customPlaces, { id: `p${Date.now()}`, name: adding.name, phone: adding.phone, address: adding.address }] }))
    }
    setAdding(null)
  }

  return (
    <div className="locator">
      <div className="loc-panel">
        <div className="loc-search">
          <Icon name="search" size={18} />
          <input placeholder="Search hospitals and health centres" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="choice-row loc-filters">
          {[['all', 'All'], ['er', '24h emergency'], ['hc', 'Health centres'], ['mine', 'Mine']].map(([k, l]) => (
            <button key={k} className={`choice choice-sm ${filter === k ? 'on' : ''}`} onClick={() => setFilter(k)}>{l}</button>
          ))}
        </div>

        <div className="loc-list">
          {list.map((p) => (
            <button key={p.id} className={`loc-item ${sel?.id === p.id ? 'is-sel' : ''}`} onClick={() => setSel(p)}>
              <span className={`tile-ico ${p.custom ? 'tone-amber' : p.emergency ? 'tone-red' : 'tone-blue'}`}><Icon name={p.custom ? 'star' : 'hospital'} size={20} /></span>
              <span className="loc-item-body">
                <strong>{p.name}</strong>
                <small>{p.type}{p.distance ? ` · ${p.distance} km` : ''}</small>
                <span className="loc-tags">
                  {p.emergency && <span className="chip chip-red">24h emergency</span>}
                  {!p.custom && <span className="chip chip-grey"><Icon name="clock" size={12} /> {p.open}</span>}
                  {inSos(p) && !p.custom && <span className="chip chip-green"><Icon name="check" size={12} stroke={3} /> In SOS list</span>}
                </span>
              </span>
              <Icon name="chevronRight" size={18} />
            </button>
          ))}
          {list.length === 0 && <p className="muted" style={{ padding: 16 }}>Nothing matches. Try another filter.</p>}
        </div>

        <div className="loc-add">
          <button className="btn btn-ghost btn-sm" onClick={() => setAdding({ kind: 'hospital', name: '', phone: '', address: '' })}><Icon name="hospital" size={16} /> Add a hospital</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setAdding({ kind: 'person', name: '', phone: '', address: '' })}><Icon name="user" size={16} /> Add a trusted person</button>
        </div>
      </div>

      <div className="loc-map-wrap">
        <MapCanvas places={list} selected={sel} onSelect={setSel} />

        {sel && (
          <div className="loc-sheet">
            <button className="icon-btn loc-sheet-x" onClick={() => setSel(null)} aria-label="Close details"><Icon name="x" size={18} /></button>
            <div className="loc-sheet-head">
              <span className={`tile-ico ${sel.custom ? 'tone-amber' : sel.emergency ? 'tone-red' : 'tone-blue'}`}><Icon name={sel.custom ? 'star' : 'hospital'} size={24} /></span>
              <div>
                <h3>{sel.name}</h3>
                <small>{sel.type}{sel.distance ? ` · ${sel.distance} km · about ${sel.eta} min by car` : ''}</small>
              </div>
            </div>
            <div className="loc-sheet-actions">
              <a className="btn btn-primary" href={`tel:${sel.phone.replace(/\s/g, '')}`}><Icon name="phone" size={18} /> Call</a>
              <a className="btn btn-ghost" target="_blank" rel="noreferrer" href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${sel.name}, Abeokuta`)}`}><Icon name="navigation" size={18} /> Directions</a>
              {!sel.custom && (
                <button className="btn btn-ghost" onClick={() => addToSos(sel)} disabled={inSos(sel)}>
                  {inSos(sel) ? <><Icon name="check" size={18} /> In SOS list</> : <><Icon name="star" size={18} /> Add to SOS list</>}
                </button>
              )}
            </div>
            <dl className="loc-info">
              <div><dt><Icon name="phone" size={14} /> Phone</dt><dd>{sel.phone} <span className="demo-tag">Demo</span></dd></div>
              {sel.address && <div><dt><Icon name="pin" size={14} /> Address</dt><dd>{sel.address}</dd></div>}
              {!sel.custom && <div><dt><Icon name="clock" size={14} /> Hours</dt><dd>{sel.open}</dd></div>}
              {sel.services?.length > 0 && <div><dt><Icon name="hospital" size={14} /> Services</dt><dd className="loc-services">{sel.services.map((s) => <span className="chip chip-grey" key={s}>{s}</span>)}</dd></div>}
            </dl>
            <p className="note"><Icon name="info" size={14} /> A listing is not live capacity. Call ahead when you can.</p>
          </div>
        )}
      </div>

      {adding && (
        <Modal
          title={adding.kind === 'person' ? 'Add a trusted person' : 'Add your own hospital'}
          onClose={() => setAdding(null)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setAdding(null)}>Cancel</button>
              <button className="btn btn-primary" disabled={!adding.name.trim() || adding.phone.replace(/\D/g, '').length < 7} onClick={saveNew}>Save</button>
            </>
          }
        >
          <div className="choice-row" style={{ marginBottom: 16 }}>
            <button className={`choice choice-sm ${adding.kind === 'hospital' ? 'on' : ''}`} onClick={() => setAdding({ ...adding, kind: 'hospital' })}><Icon name="hospital" size={14} /> Hospital or clinic</button>
            <button className={`choice choice-sm ${adding.kind === 'person' ? 'on' : ''}`} onClick={() => setAdding({ ...adding, kind: 'person' })}><Icon name="user" size={14} /> Trusted person</button>
          </div>
          <div className="form">
            <label className="field"><span>Name</span><input className="input" autoFocus value={adding.name} onChange={(e) => setAdding({ ...adding, name: e.target.value })} placeholder={adding.kind === 'person' ? 'e.g. Dr. Funke Ade' : 'e.g. Family Care Clinic'} /></label>
            <label className="field"><span>Phone number</span><input className="input" type="tel" value={adding.phone} onChange={(e) => setAdding({ ...adding, phone: e.target.value })} placeholder="+234 …" /></label>
            {adding.kind === 'hospital' && (
              <label className="field"><span>Address (optional)</span><input className="input" value={adding.address} onChange={(e) => setAdding({ ...adding, address: e.target.value })} placeholder="Street, area" /></label>
            )}
          </div>
          <p className="note" style={{ marginTop: 16 }}><Icon name="info" size={14} /> {adding.kind === 'person' ? 'They will be added to your emergency contacts and called during an SOS.' : 'Your own hospitals are called first during an SOS.'}</p>
        </Modal>
      )}
    </div>
  )
}
