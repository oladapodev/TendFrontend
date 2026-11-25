import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { ABEOKUTA } from './util.js'

// Live device location. Falls back to central Abeokuta (marked approximate) when location is off.
const Ctx = createContext(null)

export function LocationProvider({ children }) {
  const [pos, setPos] = useState(null) // { lat, lng, accuracy, at }
  const [status, setStatus] = useState('idle') // idle | locating | live | denied | unavailable
  const watchId = useRef(null)

  const start = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setStatus('unavailable')
      return
    }
    if (watchId.current != null) return
    setStatus((s) => (s === 'live' ? s : 'locating'))
    watchId.current = navigator.geolocation.watchPosition(
      (p) => {
        setPos({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: Math.round(p.coords.accuracy), at: p.timestamp })
        setStatus('live')
      },
      (err) => {
        setStatus(err.code === 1 ? 'denied' : 'unavailable')
        if (watchId.current != null) navigator.geolocation.clearWatch(watchId.current)
        watchId.current = null
      },
      { enableHighAccuracy: true, maximumAge: 15_000, timeout: 20_000 },
    )
  }, [])

  // One fresh fix for SOS, with a short timeout so the emergency flow never hangs.
  const getFix = useCallback(
    () =>
      new Promise((resolve) => {
        if (!('geolocation' in navigator)) return resolve(pos)
        navigator.geolocation.getCurrentPosition(
          (p) => {
            const fix = { lat: p.coords.latitude, lng: p.coords.longitude, accuracy: Math.round(p.coords.accuracy), at: p.timestamp }
            setPos(fix)
            setStatus('live')
            resolve(fix)
          },
          () => resolve(pos),
          { enableHighAccuracy: true, maximumAge: 30_000, timeout: 5_000 },
        )
      }),
    [pos],
  )

  useEffect(() => {
    // Start watching only if permission was already granted, so we never prompt without explaining first.
    navigator.permissions
      ?.query({ name: 'geolocation' })
      .then((p) => {
        if (p.state === 'granted') start()
        if (p.state === 'denied') setStatus('denied')
      })
      .catch(() => {})
    return () => {
      if (watchId.current != null) navigator.geolocation.clearWatch(watchId.current)
    }
  }, [start])

  const value = { pos, status, start, getFix, center: pos || ABEOKUTA, approximate: !pos }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useLocation = () => useContext(Ctx)
