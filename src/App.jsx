import { lazy, Suspense, useEffect } from 'react'
import { Navigate, Route, Routes, useLocation as useRouterLocation, useNavigate } from 'react-router'
import Landing from './landing/Landing.jsx'
import { Spinner } from './components/QueryState.jsx'
import ThemeProvider from './components/ThemeProvider.jsx'
import { AuthProvider, useAuth } from './app/auth.jsx'

// The app (map, query hooks, screens) loads only when someone opens it, keeping the landing page light.
const SignIn = lazy(() => import('./app/SignIn.jsx'))
const WebApp = lazy(() => import('./app/WebApp.jsx'))

function ScrollToTop() {
  const { pathname } = useRouterLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

function LegacyHashRedirect() {
  const navigate = useNavigate()
  useEffect(() => {
    const hash = window.location.hash
    if (hash.startsWith('#/app')) {
      const path = hash.replace(/^#/, '')
      navigate(path, { replace: true })
    }
  }, [navigate])
  return null
}

function RequireAuth({ children }) {
  const { signedIn } = useAuth()
  const loc = useRouterLocation()
  if (!signedIn) return <Navigate to="/signin" replace state={{ from: loc.pathname }} />
  return children
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ScrollToTop />
        <LegacyHashRedirect />
        <Suspense fallback={<div className="gate"><Spinner /></div>}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/signin" element={<SignIn key="signin" mode="signin" />} />
            <Route path="/signup" element={<SignIn key="signup" mode="signup" />} />
            <Route path="/app/*" element={<RequireAuth><WebApp /></RequireAuth>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </ThemeProvider>
  )
}
