import { useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, Marker, Circle as LCircle, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import Icon from '../components/Icon.jsx'
import { Spinner, ErrorBox } from '../components/QueryState.jsx'
import { useFacilities, usePlaces, useAddPlace, useSaveContact } from './data.js'
import { useLocation } from './location.jsx'
import { Modal } from './Screens.jsx'

const pinIcon = (f, selected) =>
  L.divIcon({
    className: '',
    html: `<div class="lf-pin ${f.emergency ? 'is-er' : ''} ${f.custom ? 'is-mine' : ''} ${selected ? 'is-sel' : ''}"><span></span><b>${(f.short || f.name).replace(/</g, '&lt;')}</b></div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  })
const meIcon = L.divIcon({ className: '', html: '<div class="lf-me"></div>', iconSize: [22, 22], iconAnchor: [11, 11] })

function FlyTo({ target, zoom }) {
  const map = useMap()
  useEffect(() => {
    if (target) map.flyTo([target.lat, target.lng], zoom ?? map.getZoom(), { duration: 0.6 })
  }, [target?.lat, target?.lng])
  return null
}

function FitOnce({ points }) {
  const map = useMap()
  const [done, setDone] = useState(false)
  useEffect(() => {
    if (done || points.length < 2) return
    map.fitBounds(L.latLngBounds(points.map((p) => [p.lat, p.lng])), { padding: [48, 48], maxZoom: 15 })
    setDone(true)
  }, [points, done, map])
  return null
}

const directionsUrl = (f, from) =>
  `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${from ? `${from.lat}%2C${from.lng}` : ''}%3B${f.lat}%2C${f.lng}`

export default function Locator() {
  const loc = useLocation()
  const facilities = useFacilities(loc.center)
  const places = usePlaces()
  const addPlace = useAddPlace()
  const saveContact = useSaveContact()
  const [filter, setFilter] = useState('all')
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(null)
  const [adding, setAdding] = useState(null)

  const all = useMemo(() => {
    const mine = (places.data || []).map((p) => ({ ...p, custom: true, short: p.name, type: 'Added by you', services: [], emergency: false }))
    return [...mine, ...(facilities.data || [])]
  }, [places.data, facilities.data])

  const list = all
    .filter((p) => (filter === 'er' ? p.emergency : filter === 'hc' ? !p.emergency && !p.custom : filter === 'mine' ? p.custom : true))
    .filter((p) => p.name.toLowerCase().includes(q.toLowerCase()))
  const onMap = list.filter((p) => p.lat != null && p.lng != null)

  const inSos = (f) => (places.data || []).some((p) => p.name === f.name)
  const addToSos = (f) => addPlace.mutate({ name: f.name, phone: f.phone, address: f.address, lat: f.lat, lng: f.lng, facilityId: f.id })

  const saveNew = () => {
    const done = () => setAdding(null)
    if (adding.kind === 'person') {
      saveContact.mutate({ name: adding.name.trim(), phone: adding.phone.trim(), relationship: 'Trusted person', notify: ['call', 'sms'] }, { onSuccess: done })
    } else {
      const here = adding.useHere && loc.pos ? { lat: loc.pos.lat, lng: loc.pos.lng } : {}
      addPlace.mutate({ name: adding.name.trim(), phone: adding.phone.trim(), address: adding.address.trim(), ...here }, { onSuccess: done })
    }
  }
  const addErr = adding?.kind === 'person' ? saveContact.error : addPlace.error

  return (
    <div className="locator">
      <div className="loc-panel">
        <div className="loc-search">
          <Icon name="search" size={18} />
          <input aria-label="Search places" placeholder="Search hospitals and health centres" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="choice-row loc-filters">
          {[['all', 'All'], ['er', '24h emergency'], ['hc', 'Health centres'], ['mine', 'Mine']].map(([k, l]) => (
            <button key={k} className={`choice choice-sm ${filter === k ? 'on' : ''}`} aria-pressed={filter === k} onClick={() => setFilter(k)}>{l}</button>
          ))}
        </div>
        {loc.approximate && (
          <p className="loc-warn"><Icon name="pin" size={14} /> {loc.status === 'denied' ? 'Location is blocked, so' : 'Location is off, so'} distances are from central Abeokuta. {loc.status !== 'denied' && <button className="link-btn" onClick={loc.start}>Use my location</button>}</p>
        )}

        <div className="loc-list">
          {facilities.isPending && <Spinner label="Finding care near you…" />}
          {facilities.isError && <ErrorBox error={facilities.error} onRetry={() => facilities.refetch()} title="Couldn't load nearby care" />}
          {!facilities.isPending && list.map((p) => (
            <button key={p.id} className={`loc-item ${sel?.id === p.id ? 'is-sel' : ''}`} onClick={() => setSel(p)}>
              <span className={`tile-ico ${p.custom ? 'tone-amber' : p.emergency ? 'tone-red' : 'tone-blue'}`}><Icon name={p.custom ? 'star' : 'hospital'} size={20} /></span>
              <span className="loc-item-body">
                <strong>{p.name}</strong>
                <small>{p.type}{p.distanceKm != null ? ` · ${p.distanceKm} km` : ''}</small>
                <span className="loc-tags">
                  {p.emergency && <span className="chip chip-red">24h emergency</span>}
                  {p.open && <span className="chip chip-grey"><Icon name="clock" size={12} /> {p.open}</span>}
                  {!p.custom && inSos(p) && <span className="chip chip-green"><Icon name="check" size={12} stroke={3} /> In SOS list</span>}
                </span>
              </span>
              <Icon name="chevronRight" size={18} />
            </button>
          ))}
          {!facilities.isPending && !facilities.isError && list.length === 0 && <p className="muted" style={{ padding: 16 }}>Nothing matches. Try another filter.</p>}
        </div>

        <div className="loc-add">
          <button className="btn btn-ghost btn-sm" onClick={() => setAdding({ kind: 'hospital', name: '', phone: '', address: '', useHere: false })}><Icon name="hospital" size={16} /> Add a hospital</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setAdding({ kind: 'person', name: '', phone: '', address: '' })}><Icon name="user" size={16} /> Add a trusted person</button>
        </div>
      </div>

      <div className="loc-map-wrap">
        <MapContainer center={[loc.center.lat, loc.center.lng]} zoom={14} className="lf-map" scrollWheelZoom zoomControl>
          <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, facilities &copy; GRID3 (CC BY 4.0)' url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" maxZoom={19} />
          {loc.pos && (
            <>
              <LCircle center={[loc.pos.lat, loc.pos.lng]} radius={loc.pos.accuracy} pathOptions={{ color: '#2563a8', weight: 1, fillOpacity: 0.08 }} />
              <Marker position={[loc.pos.lat, loc.pos.lng]} icon={meIcon} title="You are here" />
            </>
          )}
          {onMap.map((f) => (
            <Marker key={f.id} position={[f.lat, f.lng]} icon={pinIcon(f, sel?.id === f.id)} eventHandlers={{ click: () => setSel(f) }} title={f.name} />
          ))}
          <FitOnce points={[...(loc.pos ? [loc.pos] : []), ...onMap.slice(0, 5)]} />
          <FlyTo target={sel?.lat != null ? sel : null} />
        </MapContainer>

        <div className="map-legend">
          <span><i className="lg-er" /> 24h emergency</span>
          <span><i className="lg-hc" /> Health centre</span>
          <span><i className="lg-me" /> You</span>
        </div>

        {sel && (
          <div className="loc-sheet">
            <button className="icon-btn loc-sheet-x" onClick={() => setSel(null)} aria-label="Close details"><Icon name="x" size={18} /></button>
            <div className="loc-sheet-head">
              <span className={`tile-ico ${sel.custom ? 'tone-amber' : sel.emergency ? 'tone-red' : 'tone-blue'}`}><Icon name={sel.custom ? 'star' : 'hospital'} size={24} /></span>
              <div>
                <h3>{sel.name}</h3>
                <small>{sel.type}{sel.distanceKm != null ? ` · ${sel.distanceKm} km straight-line` : ''}</small>
              </div>
            </div>
            <div className="loc-sheet-actions">
              {sel.phone && <a className="btn btn-primary" href={`tel:${sel.phone.replace(/[^\d+]/g, '')}`}><Icon name="phone" size={18} /> Call</a>}
              {sel.lat != null && <a className="btn btn-ghost" target="_blank" rel="noreferrer" href={directionsUrl(sel, loc.pos)}><Icon name="navigation" size={18} /> Directions</a>}
              {!sel.custom && (
                <button className="btn btn-ghost" onClick={() => addToSos(sel)} disabled={inSos(sel) || addPlace.isPending}>
                  {inSos(sel) ? <><Icon name="check" size={18} /> In SOS list</> : <><Icon name="star" size={18} /> {addPlace.isPending ? 'Adding…' : 'Add to SOS list'}</>}
                </button>
              )}
            </div>
            <dl className="loc-info">
              {sel.phone && <div><dt><Icon name="phone" size={14} /> Phone</dt><dd>{sel.phone} {sel.verified === false && <span className="demo-tag">Unverified</span>}</dd></div>}
              {sel.address && <div><dt><Icon name="pin" size={14} /> Address</dt><dd>{sel.address}</dd></div>}
              {sel.open && <div><dt><Icon name="clock" size={14} /> Hours</dt><dd>{sel.open}</dd></div>}
              {sel.status && sel.status !== 'Unknown' && <div><dt><Icon name="info" size={14} /> Status</dt><dd>{sel.status}</dd></div>}
              {(sel.level || sel.ownership) && <div><dt><Icon name="hospital" size={14} /> Level</dt><dd style={{ textTransform: 'capitalize' }}>{[sel.level, sel.ownership].filter(Boolean).join(' · ')}</dd></div>}
              {sel.services?.length > 0 && <div><dt><Icon name="hospital" size={14} /> Services</dt><dd className="loc-services">{sel.services.map((s) => <span className="chip chip-grey" key={s}>{s}</span>)}</dd></div>}
            </dl>
            <p className="note"><Icon name="info" size={14} /> A listing is not live capacity. Call ahead when you can.{sel.source && <> Source: {sel.source.replaceAll('|', ', ').replace('osm_legacy', 'OSM').replace('osm', 'OpenStreetMap').replace('grid3', 'GRID3').replace('hdx', 'HDX')}.</>}</p>
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
              <button className="btn btn-primary" disabled={!adding.name.trim() || adding.phone.replace(/\D/g, '').length < 10 || addPlace.isPending || saveContact.isPending} onClick={saveNew}>
                {addPlace.isPending || saveContact.isPending ? 'Saving…' : 'Save'}
              </button>
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
              <>
                <label className="field"><span>Address (optional)</span><input className="input" value={adding.address} onChange={(e) => setAdding({ ...adding, address: e.target.value })} placeholder="Street, area" /></label>
                {loc.pos && (
                  <label className="check-row"><input type="checkbox" checked={adding.useHere} onChange={(e) => setAdding({ ...adding, useHere: e.target.checked })} /> I'm at this place now. Save my current location for it.</label>
                )}
              </>
            )}
            {addErr && <p className="form-error"><Icon name="alert" size={16} /> {addErr.message}</p>}
          </div>
          <p className="note" style={{ marginTop: 16 }}><Icon name="info" size={14} /> {adding.kind === 'person' ? 'They will be added to your emergency contacts and reached during an SOS.' : 'Your own hospitals are called first during an SOS.'}</p>
        </Modal>
      )}
    </div>
  )
}
