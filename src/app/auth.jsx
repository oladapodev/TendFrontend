import { createContext, useContext, useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { api } from '../api/index.js'
import { getToken, onTokenChange, clearToken } from '../api/session.js'

const Ctx = createContext(null)

export function AuthProvider({ children }) {
  const [token, setTok] = useState(getToken)
  const qc = useQueryClient()
  useEffect(() => {
    const off = onTokenChange(setTok)
    return () => {
      off()
    }
  }, [])
  const signOut = async () => {
    await api.auth.logout()
    clearToken()
    qc.clear()
  }
  return <Ctx.Provider value={{ signedIn: !!token, signOut }}>{children}</Ctx.Provider>
}

export const useAuth = () => useContext(Ctx)
