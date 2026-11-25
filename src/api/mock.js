// Demo backend that runs in the browser. Same shape as the real API (./http.js), so screens don't care which one they get.
// Everything here is simulated: no calls, texts or alerts are sent.
import { setToken, getToken, clearToken } from './session.js'

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

function defaultSettings() {
  return {
    sosDelay: 5,
    share: { location: true, nameAge: true, bloodGenotype: true, allergies: true, infections: false, conditionsMeds: false },
    sosOptions: { soundAlert: true, vibrateAlert: true, alertHelpers: true },
    notifications: {
      incidentUpdates: true,
      wellnessReminders: true,
      checkInReminders: true,
      quietHours: false,
      quietStart: '22:00',
      quietEnd: '07:00',
    },
    preferences: { theme: '', language: 'en', largeText: false, reduceMotion: false, timeFormat: '24h' },
  }
}

function defaultProfile() {
  return { name: '', age: '', heightCm: '', weightKg: '', sex: '', email: '', city: '', avatar: '' }
}

function defaultSecurity() {
  return { hasPassword: false, passwordUpdatedAt: null }
}

function newUser(phone) {
  return {
    passwordHash: null,
    me: {
      id: uid('u'),
      phone,
      onboarded: false,
      permissionsDone: false,
      profile: defaultProfile(),
      medical: { bloodGroup: '', genotype: '', allergies: [], infections: [], conditions: [], medications: [], notes: '' },
      settings: defaultSettings(),
      security: defaultSecurity(),
      fit: { steps: 6240, stepGoal: 8000, calories: 1840, calorieGoal: 2200, waterCups: 5, waterGoal: 8, sleepHrs: 6.5 },
      meals: null,
      dietResult: null,
    },
    contacts: [],
    places: [],
    reports: [],
  }
}

function normalizeUser(u) {
  const me = u.me || {}
  return {
    ...u,
    passwordHash: u.passwordHash || null,
    reports: u.reports || [],
    me: {
      ...me,
      profile: { ...defaultProfile(), ...(me.profile || {}) },
      settings: deepMerge(defaultSettings(), me.settings || {}),
      security: {
        ...defaultSecurity(),
        ...(me.security || {}),
        hasPassword: Boolean(u.passwordHash || me.security?.hasPassword),
      },
    },
  }
}

async function hashSecret(secret, salt) {
  const input = `${salt}:${secret}`
  if (globalThis.crypto?.subtle) {
    const data = new TextEncoder().encode(input)
    const digest = await globalThis.crypto.subtle.digest('SHA-256', data)
    return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
  }
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return `fnv_${(h >>> 0).toString(16)}`
}

function validatePassword(pw) {
  if (!pw || pw.length < 8) throw new MockError('Password must be at least 8 characters.', 422)
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

function currentEntry() {
  const token = getToken()
  const key = token && db.sessions[token]
  if (!key || !db.users[key]) throw new MockError('Please sign in again.', 401)
  db.users[key] = normalizeUser(db.users[key])
  return { key, user: db.users[key] }
}

function current() {
  return currentEntry().user
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

/* ---- health reports (demo: values are generated, not read from the uploaded file) ---- */

export const LAB_TESTS = [
  { key: 'hb', name: 'Haemoglobin (Hb)', unit: 'g/dL', low: 12.0, high: 16.0, base: 13.2, dp: 1 },
  { key: 'pcv', name: 'Packed cell volume (PCV)', unit: '%', low: 36, high: 48, base: 40, dp: 0 },
  { key: 'wbc', name: 'White blood cells', unit: '×10⁹/L', low: 4.0, high: 11.0, base: 6.2, dp: 1 },
  { key: 'fbs', name: 'Fasting blood sugar', unit: 'mmol/L', low: 3.9, high: 5.5, base: 5.1, dp: 1 },
  { key: 'hba1c', name: 'HbA1c', unit: '%', low: 4.0, high: 5.6, base: 5.3, dp: 1 },
  { key: 'chol', name: 'Total cholesterol', unit: 'mmol/L', low: null, high: 5.2, base: 4.7, dp: 1 },
  { key: 'creat', name: 'Creatinine', unit: 'µmol/L', low: 60, high: 110, base: 82, dp: 0 },
  { key: 'alt', name: 'ALT (liver enzyme)', unit: 'U/L', low: 7, high: 40, base: 24, dp: 0 },
]
const testByKey = Object.fromEntries(LAB_TESTS.map((t) => [t.key, t]))
const round = (v, dp) => Math.round(v * 10 ** dp) / 10 ** dp
const toResult = (t, value) => ({ key: t.key, test: t.name, value: round(value, t.dp), unit: t.unit, refLow: t.low, refHigh: t.high })

// Three dated sample reports with a gentle trend (sugar and cholesterol up, Hb down) so comparison has something to show.
const SAMPLE_SERIES = {
  hb: [13.1, 12.4, 11.6], pcv: [40, 38, 35], wbc: [6.1, 6.8, 6.4], fbs: [5.2, 5.9, 6.4],
  hba1c: [5.4, 5.8, 6.1], chol: [4.8, 5.1, 5.6], creat: [80, 84, 83], alt: [22, 25, 23],
}
const SAMPLE_DATES = [['2026-03-10', 'Sample Diagnostics, Abeokuta'], ['2026-07-14', 'Sample Diagnostics, Abeokuta'], ['2026-11-02', 'Sample Labs, Lagos']]

function statusOf(r) {
  if (r.refLow != null && r.value < r.refLow) return 'low'
  if (r.refHigh != null && r.value > r.refHigh) return 'high'
  return 'normal'
}

const MEANING = {
  hb: { low: 'A low or falling haemoglobin can mean anaemia, which may cause tiredness or breathlessness. Common causes include low iron, blood loss, malaria or other illness.', high: 'A high haemoglobin can happen with dehydration, smoking or some lung and blood conditions.' },
  pcv: { low: 'PCV usually moves with haemoglobin. A low PCV supports the possibility of anaemia.', high: 'A high PCV can come from dehydration or some blood conditions.' },
  wbc: { low: 'Low white cells can follow some infections or medicines and may lower your defence against infection.', high: 'High white cells often mean your body is fighting an infection or inflammation.' },
  fbs: { low: 'Low fasting sugar can cause shakiness or fainting, sometimes from diabetes medicines or skipped meals.', high: 'A fasting sugar above the normal range can be a sign of prediabetes or diabetes, especially if it is rising over time.' },
  hba1c: { low: 'A low HbA1c is uncommon and can be affected by some blood conditions.', high: 'HbA1c shows your average sugar over about 3 months. A rising value above 5.6% can mean prediabetes (5.7–6.4%) or diabetes (6.5% and above).' },
  chol: { high: 'Raised cholesterol increases the long-term risk of heart disease and stroke. Diet, activity and sometimes medicine can bring it down.' },
  creat: { low: 'Low creatinine is usually not a concern and can reflect low muscle mass.', high: 'High creatinine can mean the kidneys are not filtering as well as usual. Dehydration and some medicines can also raise it.' },
  alt: { high: 'A raised ALT can mean the liver is irritated, for example from fatty liver, alcohol, some medicines or hepatitis.' },
}
const QUESTIONS = {
  hb: ['Do I have anaemia, and what is causing it?', 'Should I take iron, or test for malaria or blood loss?', 'When should I repeat this test?'],
  pcv: ['Does my PCV match my haemoglobin result?', 'Do I need any treatment for this?'],
  wbc: ['Could I have an infection right now?', 'Should this be rechecked?'],
  fbs: ['Do I have prediabetes or diabetes?', 'Do I need an HbA1c or a glucose tolerance test?', 'What changes to diet and activity would help most?'],
  hba1c: ['Does this mean prediabetes or diabetes?', 'What target should I aim for?', 'How often should I check it?'],
  chol: ['What is my overall heart risk?', 'Should I check LDL and HDL cholesterol separately?', 'Do I need medicine, or can diet and exercise be enough?'],
  creat: ['How are my kidneys working (eGFR)?', 'Could any of my medicines be affecting this?'],
  alt: ['What could be irritating my liver?', 'Should I be tested for hepatitis B or C?', 'Should I stop any medicine or alcohol?'],
}

function buildInsights(reports) {
  const sorted = [...reports].sort((a, b) => a.date.localeCompare(b.date))
  const latest = sorted.at(-1)
  const prev = sorted.at(-2)
  if (!latest) return { items: [], latestId: null }
  const items = []
  for (const r of latest.results) {
    const st = statusOf(r)
    const before = prev?.results.find((x) => x.key === r.key)
    const changePct = before && before.value ? ((r.value - before.value) / before.value) * 100 : null
    const bigChange = changePct != null && Math.abs(changePct) >= 10
    if (st === 'normal' && !bigChange) continue
    const dir = st !== 'normal' ? st : changePct > 0 ? 'high' : 'low'
    const meaning = MEANING[r.key]?.[dir] || 'This value has changed noticeably since your last report.'
    items.push({
      key: r.key,
      test: r.test,
      status: st,
      value: r.value,
      unit: r.unit,
      previous: before?.value ?? null,
      changePct: changePct == null ? null : Math.round(changePct),
      summary: st !== 'normal'
        ? `${r.test} is ${st === 'high' ? 'above' : 'below'} the normal range${before ? `, ${changePct > 0 ? 'up' : 'down'} ${Math.abs(Math.round(changePct))}% since your last report` : ''}.`
        : `${r.test} is still in range but has ${changePct > 0 ? 'risen' : 'fallen'} ${Math.abs(Math.round(changePct))}% since your last report.`,
      meaning,
      questions: QUESTIONS[r.key] || ['What does this result mean for me?', 'Do I need to repeat this test?'],
    })
  }
  const rank = { high: 0, low: 0, normal: 1 }
  items.sort((a, b) => rank[a.status] - rank[b.status])
  return { items, latestId: latest.id, comparedWith: prev?.id ?? null, note: 'AI can explain and organise. Qualified professionals make clinical decisions.' }
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
      async requestOtp(phone, mode = 'signin') {
        await wait(500)
        if (phone.replace(/\D/g, '').length < 10) throw new MockError('Enter a valid Nigerian phone number.', 422)
        const exists = !!db.users[phone.replace(/\D/g, '')]
        if (mode === 'signin' && !exists) throw new MockError('No account uses this number yet.', 404)
        if (mode === 'signup' && exists) throw new MockError('This number already has an account.', 409)
        return { sent: true, demoCode: DEMO_OTP }
      },
      async verifyOtp(phone, code) {
        await wait(600)
        if (code !== DEMO_OTP) throw new MockError('That code is not right. In demo mode the code is 123456.', 400)
        const key = phone.replace(/\D/g, '')
        if (!db.users[key]) db.users[key] = newUser(phone)
        db.users[key] = normalizeUser(db.users[key])
        const token = uid('t')
        db.sessions[token] = key
        save()
        setToken(token)
        return { token, me: db.users[key].me }
      },
      async loginWithPassword(phone, password) {
        await wait(500)
        const key = phone.replace(/\D/g, '')
        const entry = db.users[key] ? normalizeUser(db.users[key]) : null
        if (!entry) throw new MockError('No account found for that phone number.', 404)
        if (!entry.passwordHash) throw new MockError('No password is set for this number yet. Sign in with an SMS code first.', 400)
        const hash = await hashSecret(password, key)
        if (hash !== entry.passwordHash) throw new MockError('Incorrect phone number or password.', 401)
        db.users[key] = entry
        const token = uid('t')
        db.sessions[token] = key
        save()
        setToken(token)
        return { token, me: entry.me }
      },
      async changePassword({ currentPassword, newPassword }) {
        await wait(450)
        validatePassword(newPassword)
        const { key, user } = currentEntry()
        if (user.passwordHash) {
          const curHash = await hashSecret(currentPassword || '', key)
          if (curHash !== user.passwordHash) throw new MockError('Current password is not correct.', 400)
        }
        user.passwordHash = await hashSecret(newPassword, key)
        user.me.security = { hasPassword: true, passwordUpdatedAt: new Date().toISOString() }
        save()
        return { ok: true, security: user.me.security }
      },
      async requestPasswordReset(phone) {
        await wait(450)
        const key = phone.replace(/\D/g, '')
        if (key.length < 10) throw new MockError('Enter a valid Nigerian phone number.', 422)
        if (!db.users[key]) throw new MockError('No account found for that phone number.', 404)
        return { sent: true, demoCode: DEMO_OTP }
      },
      async resetPassword({ phone, code, newPassword }) {
        await wait(500)
        if (code !== DEMO_OTP) throw new MockError('That code is not right. In demo mode the code is 123456.', 400)
        validatePassword(newPassword)
        const key = phone.replace(/\D/g, '')
        const user = db.users[key] ? normalizeUser(db.users[key]) : null
        if (!user) throw new MockError('No account found for that phone number.', 404)
        user.passwordHash = await hashSecret(newPassword, key)
        user.me.security = { hasPassword: true, passwordUpdatedAt: new Date().toISOString() }
        db.users[key] = user
        save()
        return { ok: true, security: user.me.security }
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
      async remove() {
        await wait(300)
        const { key } = currentEntry()
        delete db.users[key]
        for (const [tok, phoneKey] of Object.entries(db.sessions)) {
          if (phoneKey === key) delete db.sessions[tok]
        }
        save()
        clearToken()
        return null
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
      async create({ lat, lng, accuracy, shareFields, alertHelpers = true }) {
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
          ...(alertHelpers ? [{ id: 'helpers', kind: 'helpers', name: 'Nearby helpers', detail: 'Opted-in people nearby', status: 'queued', channels: [] }] : []),
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
    reports: {
      async list() {
        await wait(200)
        const u = current()
        return [...(u.reports || [])].sort((a, b) => b.date.localeCompare(a.date))
      },
      // Demo stand-in for OCR: nudges the last values (or baselines) instead of reading the file.
      async extract(file) {
        await wait(1500)
        const u = current()
        const last = [...(u.reports || [])].sort((a, b) => b.date.localeCompare(a.date))[0]
        const results = LAB_TESTS.map((t) => {
          const prev = last?.results.find((r) => r.key === t.key)?.value ?? t.base
          return toResult(t, prev * (1 + (Math.random() - 0.45) * 0.12))
        })
        return { fileName: file?.name || 'report', lab: '', date: new Date().toISOString().slice(0, 10), results, demo: true }
      },
      async create({ date, lab, results, fileName }) {
        await wait(400)
        const u = current()
        u.reports ||= []
        const item = { id: uid('rep'), date, lab, fileName, results: results.map((r) => ({ ...r, value: Number(r.value) })) }
        u.reports.push(item)
        save()
        return item
      },
      async remove(id) {
        await wait(200)
        const u = current()
        u.reports = (u.reports || []).filter((r) => r.id !== id)
        save()
        return null
      },
      async insights() {
        await wait(900)
        return buildInsights(current().reports || [])
      },
      async loadSamples() {
        await wait(500)
        const u = current()
        u.reports ||= []
        SAMPLE_DATES.forEach(([date, lab], i) => {
          if (u.reports.some((r) => r.date === date)) return
          u.reports.push({ id: uid('rep'), date, lab, fileName: `sample-report-${i + 1}.pdf`, sample: true, results: Object.entries(SAMPLE_SERIES).map(([k, vals]) => toResult(testByKey[k], vals[i])) })
        })
        save()
        return null
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
