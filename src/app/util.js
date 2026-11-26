// Plain helpers shared by screens (kept out of component files so Fast Refresh works).

// Map centre used only to show a map before the device location is known. Never sent as an SOS location.
export const ABEOKUTA = { lat: 7.1557, lng: 3.3451 }

// Local calendar day, e.g. 2026-11-25, `offset` days ago.
export function dayKey(offset = 0) {
  const d = new Date()
  d.setDate(d.getDate() - offset)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function dayLabel(offset) {
  if (offset === 0) return 'Today'
  const d = new Date()
  d.setDate(d.getDate() - offset)
  return d.toLocaleDateString('en-NG', { weekday: 'short' })
}

// Today's logged Fit values (zeros if the saved ones are from an earlier day).
export function fitToday(fit) {
  const f = fit || {}
  const fresh = f.date === dayKey(0)
  return {
    stepGoal: f.stepGoal || 8000, calorieGoal: f.calorieGoal || 2200, waterGoal: f.waterGoal || 8, history: f.history || {},
    steps: fresh ? f.steps || 0 : 0, calories: fresh ? f.calories || 0 : 0,
    waterCups: fresh ? f.waterCups || 0 : 0, sleepHrs: fresh ? f.sleepHrs || 0 : 0,
  }
}
