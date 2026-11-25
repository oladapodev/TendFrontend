import { createContext, useContext, useEffect, useState } from 'react'

// Mock state for the prototype. Persisted in localStorage so a demo survives a refresh.
// Swap for API calls (see docs/IMPLEMENTATION_PLAN.md §6) when the backend is ready.
const KEY = 'tendai-demo-v1'

export const initialState = {
  profile: { name: '', age: '', heightCm: '', weightKg: '', sex: '' },
  onboarded: false,
  permissions: { location: 'pending', notifications: 'pending', contacts: 'pending' },
  permissionsDone: false,
  sosDelay: 5,
  contacts: [
    { id: 'c1', name: 'Adaeze Okafor', phone: '+234 803 000 0001', relationship: 'Sister', notify: ['call', 'sms'] },
    { id: 'c2', name: 'Tunde Bakare', phone: '+234 806 000 0002', relationship: 'Friend', notify: ['sms'] },
  ],
  medical: {
    bloodGroup: 'O+',
    genotype: 'AA',
    allergies: ['Penicillin'],
    infections: [],
    conditions: ['Asthma'],
    medications: ['Salbutamol inhaler'],
    notes: '',
  },
  meals: { breakfast: '', lunch: '', dinner: '', snacks: '' },
  dietResult: null,
  customPlaces: [],
  fit: { steps: 6240, stepGoal: 8000, calories: 1840, calorieGoal: 2200, waterCups: 5, waterGoal: 8, sleepHrs: 6.5 },
}

const Ctx = createContext(null)

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? { ...initialState, ...JSON.parse(raw) } : initialState
  } catch {
    return initialState
  }
}

export function StoreProvider({ children }) {
  const [state, setState] = useState(load)
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state))
    } catch {
      /* storage blocked: demo still works in memory */
    }
  }, [state])
  const update = (patch) => setState((s) => ({ ...s, ...(typeof patch === 'function' ? patch(s) : patch) }))
  const reset = () => setState(initialState)
  return <Ctx.Provider value={{ state, update, reset }}>{children}</Ctx.Provider>
}

export const useStore = () => useContext(Ctx)

export const facilities = [
  { id: 'f1', name: 'Federal Medical Centre Abeokuta', short: 'FMC Abeokuta', type: 'Federal teaching hospital', distance: 1.8, eta: 6, open: '24 hours', emergency: true, phone: '+234 800 000 1001', address: 'Idi-Aba, Abeokuta, Ogun State', x: 62, y: 34, services: ['Emergency', 'Surgery', 'Maternity', 'Paediatrics'] },
  { id: 'f2', name: 'Sacred Heart Hospital', short: 'Sacred Heart', type: 'Mission hospital', distance: 3.1, eta: 11, open: '24 hours', emergency: true, phone: '+234 800 000 1002', address: 'Lantoro, Abeokuta, Ogun State', x: 28, y: 62, services: ['Emergency', 'General medicine', 'Laboratory'] },
  { id: 'f3', name: 'Federal Neuropsychiatric Hospital Aro', short: 'Neuropsychiatric Aro', type: 'Specialist hospital', distance: 4.6, eta: 15, open: '24 hours', emergency: false, phone: '+234 800 000 1003', address: 'Aro, Abeokuta, Ogun State', x: 80, y: 72, services: ['Mental health', 'Outpatient'] },
  { id: 'f4', name: 'Ita-Eko Primary Health Centre', short: 'Ita-Eko PHC', type: 'Primary health centre', distance: 0.9, eta: 4, open: '8am – 4pm', emergency: false, phone: '+234 800 000 1004', address: 'Ita-Eko, Abeokuta, Ogun State', x: 44, y: 44, services: ['Immunisation', 'Antenatal', 'First aid'] },
  { id: 'f5', name: 'Oke-Ilewo Health Centre', short: 'Oke-Ilewo HC', type: 'Health centre', distance: 2.4, eta: 8, open: '8am – 6pm', emergency: false, phone: '+234 800 000 1005', address: 'Oke-Ilewo, Abeokuta, Ogun State', x: 18, y: 26, services: ['General clinic', 'Pharmacy'] },
]

export const bmi = (p) => {
  const h = Number(p.heightCm) / 100
  const w = Number(p.weightKg)
  if (!h || !w) return null
  return (w / (h * h)).toFixed(1)
}
