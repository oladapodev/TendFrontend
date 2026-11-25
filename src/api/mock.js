// Demo backend that runs in the browser. Same shape as the real API (./http.js), so screens don't care which one they get.
// Everything here is simulated: no calls, texts or alerts are sent.
import { setToken, getToken } from './session.js'

const DB_KEY = 'tendai-demo-db-v2'
export const DEMO_OTP = '123456'
export const ABEOKUTA = { lat: 7.1557, lng: 3.3451 }

const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const uid = (p) => `${p}_${Math.random().toString(36).slice(2, 10)}`

// Facility coordinates are approximate and must be checked before real use (see GO_LIVE_CHECKLIST.md §4).
const FACILITIES = [
  { id: 'f_fmc', name: 'Federal Medical Centre Abeokuta', short: 'FMC Abeokuta', type: 'Federal teaching hospital', lat: 7.1405, lng: 3.3626, open: '24 hours', emergency: true, phone: '+234 800 000 1001', address: 'Idi-Aba, Abeokuta, Ogun State', services: ['Emergency', 'Surgery', 'Maternity', 'Paediatrics'] },
  { id: 'f_shh', name: 'Sacred Heart Hospital', short: 'Sacred Heart', type: 'Mission hospital', lat: 7.16, lng: 3.3275, open: '24 hours', emergency: true, phone: '+234 800 000 1002', address: 'Lantoro, Abeokuta, Ogun State', services: ['Emergency', 'General medicine', 'Laboratory'] },
  { id: 'f_aro', name: 'Federal Neuropsychiatric Hospital Aro', short: 'Neuropsychiatric Aro', type: 'Specialist hospital', lat: 7.1815, lng: 3.3445, open: '24 hours', emergency: false, phone: '+234 800 000 1003', address: 'Aro, Abeokuta, Ogun State', services: ['Mental health', 'Outpatient'] },
  { id: 'f_ite', name: 'Ita-Eko Primary Health Centre', short: 'Ita-Eko PHC', type: 'Primary health centre', lat: 7.158, lng: 3.349, open: '8am – 4pm', emergency: false, phone: '+234 800 000 1004', address: 'Ita-Eko, Abeokuta, Ogun State', services: ['Immunisation', 'Antenatal', 'First aid'] },
  { id: 'f_oki', name: 'Oke-Ilewo Health Centre', short: 'Oke-Ilewo HC', type: 'Health centre', lat: 7.145, lng: 3.348, open: '8am – 6pm', emergency: false, phone: '+234 800 000 1005', address: 'Oke-Ilewo, Abeokuta, Ogun State', services: ['General clinic', 'Pharmacy'] },
]

function newUser(phone) {
  return {
    me: {
      id: uid('u'),
      phone,
      onboarded: false,
      permissionsDone: false,
      profile: { name: '', age: '', heightCm: '', weightKg: '', sex: '' },
      medical: { bloodGroup: '', genotype: '', allergies: [], infections: [], conditions: [], medications: [], notes: '' },
      settings: {
        sosDelay: 5,
        share: { location: true, nameAge: true, bloodGenotype: true, allergies: true, infections: false, conditionsMeds: false },
      },
      fit: { steps: 6240, stepGoal: 8000, calories: 1840, calorieGoal: 2200, waterCups: 5, waterGoal: 8, sleepHrs: 6.5 },
      meals: null,
      dietResult: null,
    },
    contacts: [],
    places: [],
  }
}

function loadDb() {
  try {
    return JSON.parse(localStorage.getItem(DB_KEY)) || { users: {}, sessions: {} }
  } catch {
    return { users: {}, sessions: {} }
  }
}
let db = loadDb()
const save = () => {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db))
  } catch {
    /* in-memory only */
  }
}

class MockError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

function current() {
  const token = getToken()
  const phone = token && db.sessions[token]
  if (!phone || !db.users[phone]) throw new MockError('Please sign in again.', 401)
  return db.users[phone]
}

export function distanceKm(a, b) {
  const R = 6371
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

const deepMerge = (a, b) => {
  const out = { ...a }
  for (const k of Object.keys(b)) {
    out[k] = b[k] && typeof b[k] === 'object' && !Array.isArray(b[k]) && a[k] && typeof a[k] === 'object' ? deepMerge(a[k], b[k]) : b[k]
  }
  return out
}

/* ---- medicine verification (demo records, NOT real NAFDAC data) ---- */

// Fictional sample records so every result state can be demoed. The real backend checks NAFDAC's registration database.
const MEDICINES = {
  'A4-1001': { status: 'registered', name: 'Paracetamol 500 mg Tablets', activeIngredients: ['Paracetamol 500 mg'], form: 'Tablet', category: 'Analgesic / antipyretic', holder: 'Demo Pharma Nigeria Ltd', manufacturer: 'Demo Pharma Nigeria Ltd, Lagos', approvedOn: '2022-03-14', expiresOn: '2027-03-13' },
  'A4-1002': { status: 'registered', name: 'Artemether/Lumefantrine 20/120 mg Tablets', activeIngredients: ['Artemether 20 mg', 'Lumefantrine 120 mg'], form: 'Tablet', category: 'Antimalarial', holder: 'Sample Health Products Ltd', manufacturer: 'Sample Health Products Ltd, Ogun', approvedOn: '2021-08-02', expiresOn: '2026-08-01' },
  'B4-2001': { status: 'registered', name: 'Oral Rehydration Salts', activeIngredients: ['Sodium chloride', 'Glucose', 'Potassium chloride', 'Trisodium citrate'], form: 'Powder for oral solution', category: 'Electrolyte replacement', holder: 'Example Medics Ltd', manufacturer: 'Example Medics Ltd, Kano', approvedOn: '2023-01-20', expiresOn: '2028-01-19' },
  '04-3001': { status: 'expired', name: 'Amoxicillin 500 mg Capsules', activeIngredients: ['Amoxicillin 500 mg'], form: 'Capsule', category: 'Antibiotic', holder: 'Old Stock Pharma Ltd', manufacturer: 'Old Stock Pharma Ltd, Abuja', approvedOn: '2015-05-10', expiresOn: '2020-05-09' },
  'A4-9999': { status: 'suspended', name: 'Cough Syrup 100 ml', activeIngredients: ['Dextromethorphan 15 mg/5 ml'], form: 'Syrup', category: 'Cough suppressant', holder: 'Recalled Products Ltd', manufacturer: 'Recalled Products Ltd', approvedOn: '2019-11-01', expiresOn: '2024-10-31', alert: 'Registration suspended after a safety alert. Do not use; return it to the pharmacy.' },
}
export const DEMO_NAFDAC_SAMPLES = ['A4-1001', '04-3001', 'A4-9999', 'A4-0000']

/* ---- diet + agent demo logic ---- */

function analyseMeals(meals) {
  const all = Object.values(meals).join(' ').toLowerCase()
  const has = (...w) => w.some((x) => all.includes(x))
  const recs = []
  if (!has('orange', 'banana', 'pawpaw', 'mango', 'apple', 'watermelon', 'pineapple', 'guava', 'fruit'))
    recs.push({ icon: 'apple', tone: 'amber', title: 'Add fruit daily', text: 'Try 2 servings a day: an orange or a slice of pawpaw in the morning, and a banana or guava in the afternoon.', tag: 'Vitamin C · fibre' })
  if (has('eba', 'amala', 'pounded yam', 'garri', 'rice', 'indomie', 'bread', 'yam'))
    recs.push({ icon: 'scale', tone: 'purple', title: 'Balance the starch', text: 'Your meals are high in swallow, rice or bread. Keep that to about a quarter of the plate and fill half with vegetables (ugwu, ewedu, spinach).', tag: 'Portion' })
  if (!has('beans', 'fish', 'chicken', 'egg', 'meat', 'moi moi', 'akara'))
    recs.push({ icon: 'activity', tone: 'green', title: 'More protein', text: 'Add beans, moi moi, eggs or fish to at least two meals a day.', tag: 'Protein' })
  if (has('soft drink', 'coke', 'malt', 'sugar', 'juice'))
    recs.push({ icon: 'water', tone: 'blue', title: 'Swap sugary drinks', text: 'Replace soft drinks with water or zobo without added sugar. Aim for 8 cups of water a day.', tag: 'Hydration' })
  recs.push({ icon: 'sparkle', tone: 'green', title: 'Helpful extras', text: 'Groundnuts or tiger nuts as a snack, and leafy greens for iron. Ask a pharmacist before starting any supplement.', tag: 'Snacks' })
  return {
    recommendations: recs,
    schedule: [
      { time: '7:00 – 8:00', label: 'Breakfast', detail: 'Protein + fruit (e.g. moi moi, pap, orange)' },
      { time: '10:30', label: 'Snack', detail: 'Fruit or a handful of groundnuts' },
      { time: '13:00 – 14:00', label: 'Lunch', detail: 'Half vegetables, quarter protein, quarter starch' },
      { time: '16:30', label: 'Snack', detail: 'Banana, cucumber or tiger nuts' },
      { time: '19:00', label: 'Dinner', detail: 'Lighter meal at least 2 hours before bed' },
    ],
    note: 'AI can explain and organise. It is not a diagnosis.',
  }
}

function agentReply(text, me) {
  const t = text.toLowerCase()
  if (t.includes('faint'))
    return "If someone faints: lay them flat and raise their legs about 30 cm. Loosen tight clothing and check that they are breathing. If they don't wake within a minute, or they aren't breathing normally, press SOS or call 112 and start CPR. The CPR guide is in your tools."
  if (t.includes('genotype'))
    return `Your genotype is ${me.medical.genotype || 'not recorded yet'}. Genotype describes the type of haemoglobin in your blood. AA is the usual type. AS means you carry the sickle-cell trait but usually have no symptoms. SS means sickle-cell disease. A doctor or genetic counsellor can explain what it means for you.`
  if (t.includes('blood pressure') || t.includes('eat'))
    return 'Foods that can help: more vegetables (ugwu, spinach, garden egg), fruit such as bananas and oranges, beans and fish, and less salt, seasoning cubes and fried food. Check your readings regularly and follow the plan your doctor gave you.'
  if (t.includes('doctor') || t.includes('question'))
    return 'Good questions to bring:\n1. What is my diagnosis, in simple words?\n2. What are my treatment options and their side effects?\n3. What should I watch out for at home?\n4. When should I come back, or go to emergency?'
  return 'I can explain health information, help you prepare for a visit, and point you to the right tool in TendAI. For anything urgent, press the red SOS button or call 112.'
}

/* ---- incident simulation ---- */

const incidents = new Map()

function simulateIncident(inc, emit) {
  const t = inc.targets
  const steps = []
  const hosp = t.find((x) => x.kind === 'hospital')
  const people = t.filter((x) => x.kind === 'contact')
  const helpers = t.find((x) => x.kind === 'helpers')
  if (hosp) steps.push([500, hosp, 'calling'], [3500, hosp, 'speaking'], [7000, hosp, 'confirmed'])
  people.forEach((p, i) => {
    if (p.channels.includes('call')) steps.push([900 + i * 400, p, 'calling'], [3000 + i * 1800, p, i === 0 ? 'answered' : 'no_answer'])
    if (p.channels.includes('sms')) steps.push([1300 + i * 400, p, 'sms_sending'], [4800 + i * 600, p, 'sms_delivered'])
    if (!p.channels.includes('call') && !p.channels.includes('sms')) steps.push([1300, p, 'skipped'])
  })
  if (helpers) steps.push([2400, helpers, 'demo_only'])
  return steps.map(([ms, target, status]) =>
    setTimeout(() => {
      if (inc.state !== 'active') return
      target.status = status
      emit({ type: 'target', targetId: target.id, status, at: new Date().toISOString() })
    }, ms),
  )
}

export function createMockApi() {
  return {
    mode: 'demo',
    auth: {
      async requestOtp(phone) {
        await wait(500)
        if (phone.replace(/\D/g, '').length < 10) throw new MockError('Enter a valid Nigerian phone number.', 422)
        return { sent: true, demoCode: DEMO_OTP }
      },
      async verifyOtp(phone, code) {
        await wait(600)
        if (code !== DEMO_OTP) throw new MockError('That code is not right. In demo mode the code is 123456.', 400)
        const key = phone.replace(/\D/g, '')
        if (!db.users[key]) db.users[key] = newUser(phone)
        const token = uid('t')
        db.sessions[token] = key
        save()
        setToken(token)
        return { token, me: db.users[key].me }
      },
      async logout() {
        const token = getToken()
        if (token) delete db.sessions[token]
        save()
        return null
      },
    },
    me: {
      async get() {
        await wait(150)
        return current().me
      },
      async patch(patch) {
        await wait(200)
        const u = current()
        u.me = deepMerge(u.me, patch)
        save()
        return u.me
      },
    },
    contacts: {
      async list() {
        await wait(150)
        return current().contacts
      },
      async create(c) {
        await wait(250)
        const u = current()
        const item = { ...c, id: uid('c') }
        u.contacts.push(item)
        save()
        return item
      },
      async update(id, c) {
        await wait(250)
        const u = current()
        u.contacts = u.contacts.map((x) => (x.id === id ? { ...c, id } : x))
        save()
        return { ...c, id }
      },
      async remove(id) {
        await wait(200)
        const u = current()
        u.contacts = u.contacts.filter((x) => x.id !== id)
        save()
        return null
      },
    },
    places: {
      async list() {
        await wait(150)
        return current().places
      },
      async create(p) {
        await wait(250)
        const u = current()
        const item = { ...p, id: uid('p') }
        u.places.push(item)
        save()
        return item
      },
      async remove(id) {
        await wait(200)
        const u = current()
        u.places = u.places.filter((x) => x.id !== id)
        save()
        return null
      },
    },
    facilities: {
      async near({ lat, lng }) {
        await wait(350)
        return FACILITIES.map((f) => ({ ...f, distanceKm: +distanceKm({ lat, lng }, f).toFixed(1), verified: false }))
          .sort((a, b) => a.distanceKm - b.distanceKm)
      },
    },
    incidents: {
      async create({ lat, lng, accuracy, shareFields }) {
        await wait(700)
        const u = current()
        const from = lat != null ? { lat, lng } : ABEOKUTA
        const nearest = FACILITIES.filter((f) => f.emergency).map((f) => ({ ...f, d: distanceKm(from, f) })).sort((a, b) => a.d - b.d)[0]
        const own = u.places[0]
        const targets = [
          own
            ? { id: own.id, kind: 'hospital', name: own.name, detail: 'Your trusted hospital', status: 'queued', channels: ['call'] }
            : { id: nearest.id, kind: 'hospital', name: nearest.short, detail: `Nearest 24h emergency · ${nearest.d.toFixed(1)} km`, status: 'queued', channels: ['call'] },
          ...u.contacts.slice(0, 3).map((c) => ({ id: c.id, kind: 'contact', name: c.name, detail: c.relationship, status: 'queued', channels: c.notify || ['call', 'sms'] })),
          { id: 'helpers', kind: 'helpers', name: 'Nearby helpers', detail: 'Opted-in people nearby', status: 'queued', channels: [] },
        ]
        const inc = { id: uid('inc'), state: 'active', createdAt: new Date().toISOString(), location: { lat, lng, accuracy }, shareFields, targets, listeners: new Set(), timers: [] }
        inc.timers = simulateIncident(inc, (e) => inc.listeners.forEach((l) => l(e)))
        incidents.set(inc.id, inc)
        return { id: inc.id, state: inc.state, createdAt: inc.createdAt, targets: inc.targets.map(({ id, kind, name, detail, status, channels }) => ({ id, kind, name, detail, status, channels })) }
      },
      stream(id, { onEvent, onError }) {
        const inc = incidents.get(id)
        if (!inc) {
          setTimeout(() => onError?.(new MockError('Incident not found', 404)), 0)
          return () => {}
        }
        inc.listeners.add(onEvent)
        return () => inc.listeners.delete(onEvent)
      },
      async cancel(id, reason) {
        await wait(300)
        const inc = incidents.get(id)
        if (inc) {
          inc.state = reason === 'safe' ? 'closed' : 'cancelled'
          inc.timers.forEach(clearTimeout)
          inc.listeners.forEach((l) => l({ type: 'state', state: inc.state }))
        }
        return { id, state: inc?.state || 'cancelled' }
      },
    },
    diet: {
      async analyse(meals) {
        await wait(1200)
        const u = current()
        const result = analyseMeals(meals)
        u.me.meals = meals
        u.me.dietResult = result
        save()
        return result
      },
    },
    medicines: {
      async verify(nafdacNo) {
        await wait(900)
        current()
        const key = nafdacNo.toUpperCase().replace(/\s+/g, '')
        const rec = MEDICINES[key]
        const checkedAt = new Date().toISOString()
        if (!rec) return { nafdacNo: key, status: 'not_found', checkedAt, source: 'Demo data' }
        return { nafdacNo: key, ...rec, checkedAt, source: 'Demo data' }
      },
    },
    agent: {
      chat(messages, { onEvent, onDone, onError }) {
        let stopped = false
        ;(async () => {
          try {
            const me = current().me
            const last = messages[messages.length - 1]?.content || ''
            const words = agentReply(last, me).split(/(\s+)/)
            await wait(500)
            for (const w of words) {
              if (stopped) return
              onEvent({ type: 'token', text: w })
              await wait(18)
            }
            onDone?.()
          } catch (e) {
            onError?.(e)
          }
        })()
        return () => {
          stopped = true
        }
      },
    },
  }
}
