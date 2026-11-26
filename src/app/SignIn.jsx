import { useState } from 'react'
import { Link, Navigate, useLocation as useRouterLocation, useNavigate } from 'react-router'
import { useMutation } from '@tanstack/react-query'
import Icon, { Logo } from '../components/Icon.jsx'
import ThemeToggle from '../components/ThemeToggle.jsx'
import { api, isDemo } from '../api/index.js'
import { useAuth } from './auth.jsx'
import './app.css'

// Nigerian numbers: accept 0803…, 803…, +234803…; send E.164 (+234…).
export function toE164(raw) {
  const d = raw.replace(/\D/g, '')
  if (d.startsWith('234')) return `+${d}`
  if (d.startsWith('0')) return `+234${d.slice(1)}`
  return `+234${d}`
}
const validNg = (raw) => /^\+234[789][01]\d{8}$/.test(toE164(raw))

const COPY = {
  signin: {
    step: 'Sign in',
    title: 'Welcome back',
    hint: "Enter the phone number you signed up with. We'll text you a 6-digit code.",
    side: 'Sign in with your phone number. We use it to identify you and as the call-back number during an SOS.',
    button: 'Sign in',
    switchText: 'New to TendAI?',
    switchLink: 'Create an account',
    switchTo: '/signup',
  },
  signup: {
    step: 'Create your account',
    title: "What's your phone number?",
    hint: "We'll text you a 6-digit code to confirm it's yours. No password needed.",
    side: 'Create your account with just your phone number. It becomes your call-back number during an SOS.',
    button: 'Create account',
    switchText: 'Already have an account?',
    switchLink: 'Sign in',
    switchTo: '/signin',
  },
}

export default function SignIn({ mode = 'signin' }) {
  const t = COPY[mode]
  const { signedIn } = useAuth()
  const nav = useNavigate()
  const loc = useRouterLocation()
  const [phone, setPhone] = useState(() => loc.state?.phone || '')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [authMethod, setAuthMethod] = useState('otp') // otp | password | reset
  const [step, setStep] = useState('phone') // phone | code
  const [demoCode, setDemoCode] = useState(null)
  const [notice, setNotice] = useState('')

  // Carry the typed number (and where to return after sign-in) when switching between sign in and sign up.
  const switchState = { ...loc.state, phone }

  const request = useMutation({
    mutationFn: () => api.auth.requestOtp(toE164(phone), mode),
    onSuccess: (r) => {
      setDemoCode(r?.demoCode || null)
      setStep('code')
    },
  })
  const verify = useMutation({
    mutationFn: () => api.auth.verifyOtp(toE164(phone), code.trim()),
    onSuccess: () => nav(loc.state?.from || '/app', { replace: true }),
  })
  const loginPw = useMutation({
    mutationFn: () => api.auth.loginWithPassword(toE164(phone), password),
    onSuccess: () => nav(loc.state?.from || '/app', { replace: true }),
  })
  const reqReset = useMutation({
    mutationFn: () => api.auth.requestPasswordReset(toE164(phone)),
    onSuccess: (r) => {
      setDemoCode(r?.demoCode || null)
      setStep('code')
    },
  })
  const confirmReset = useMutation({
    mutationFn: () => api.auth.resetPassword({ phone: toE164(phone), code: code.trim(), newPassword: newPw }),
    onSuccess: () => {
      setCode('')
      setNewPw('')
      setConfirmPw('')
      setDemoCode(null)
      setAuthMethod('password')
      setStep('phone')
      setNotice('Password reset. Sign in with your new password below.')
    },
  })

  if (signedIn) return <Navigate to="/app" replace />

  const method = mode === 'signup' ? 'otp' : authMethod
  const switchMethod = (next) => {
    setAuthMethod(next)
    setStep('phone')
    setCode('')
    setDemoCode(null)
    setNotice('')
    request.reset()
    verify.reset()
    loginPw.reset()
    reqReset.reset()
    confirmReset.reset()
  }

  return (
    <div className="onb">
      <aside className="onb-side">
        <Link to="/"><Logo size={32} light /></Link>
        <div className="onb-side-body">
          <h2>One press to start the call for help.</h2>
          <p>{t.side}</p>
        </div>
        <p className="onb-side-foot"><Icon name="lock" size={14} /> We never share your number without your permission.</p>
      </aside>
      <section className="onb-main">
        <ThemeToggle className="onb-theme" />
        <div className="onb-card">
          {isDemo && (
            <p className="demo-banner"><Icon name="info" size={16} /> Demo mode: no backend is connected. No SMS is sent; codes are shown below.</p>
          )}

          {mode === 'signin' && step === 'phone' && method !== 'reset' && (
            <div className="seg-tabs" style={{ marginBottom: 20 }} role="tablist" aria-label="Sign in method">
              <button type="button" role="tab" aria-selected={method === 'otp'} className={`seg-tab ${method === 'otp' ? 'is-on' : ''}`} onClick={() => switchMethod('otp')}>
                SMS code
              </button>
              <button type="button" role="tab" aria-selected={method === 'password'} className={`seg-tab ${method === 'password' ? 'is-on' : ''}`} onClick={() => switchMethod('password')}>
                Password
              </button>
            </div>
          )}

          {notice && <p className="settings-banner is-ok" style={{ marginBottom: 16 }}><Icon name="checkCircle" size={16} /> {notice}</p>}

          {method === 'otp' && step === 'phone' && (
            <>
              <span className="onb-step">{t.step}</span>
              <h1>{t.title}</h1>
              <p className="onb-hint">{t.hint}</p>
              <form
                className="onb-form"
                onSubmit={(e) => {
                  e.preventDefault()
                  if (validNg(phone)) request.mutate()
                }}
              >
                <label className="field">
                  <span>Phone number</span>
                  <div className="phone-input">
                    <span className="phone-cc">🇳🇬 +234</span>
                    <input className="input input-lg" autoFocus inputMode="tel" autoComplete="tel-national" placeholder="803 123 4567" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>
                </label>
                {phone && !validNg(phone) && <p className="form-hint">Enter a Nigerian mobile number, e.g. 0803 123 4567.</p>}
                {request.isError && (
                  <p className="form-error">
                    <Icon name="alert" size={16} /> {request.error.message}
                    {(request.error.status === 404 || request.error.status === 409) && (
                      <Link className="link-btn" to={t.switchTo} state={switchState}>{t.switchLink}</Link>
                    )}
                  </p>
                )}
                <div className="onb-actions">
                  <Link className="link-btn" to="/">Back to home</Link>
                  <button className="btn btn-primary" disabled={!validNg(phone) || request.isPending}>
                    {request.isPending ? 'Sending OTP Code…' : 'Send code'} <Icon name="arrowRight" size={18} />
                  </button>
                </div>
              </form>
              <p className="auth-switch">{t.switchText} <Link className="link-btn" to={t.switchTo} state={switchState}>{t.switchLink}</Link></p>
            </>
          )}

          {method === 'otp' && step === 'code' && (
            <>
              <span className="onb-step">Check your messages</span>
              <h1>Enter the 6-digit code</h1>
              <p className="onb-hint">Sent to {toE164(phone)}. <button type="button" className="link-btn" onClick={() => { setStep('phone'); setCode(''); verify.reset() }}>Change number</button></p>
              {demoCode && <p className="demo-code">Demo code: <b>{demoCode}</b></p>}
              <form
                className="onb-form"
                onSubmit={(e) => {
                  e.preventDefault()
                  if (/^\d{6}$/.test(code.trim())) verify.mutate()
                }}
              >
                <label className="field">
                  <span>Code</span>
                  <input className="input input-lg otp-input" autoFocus inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="••••••" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} />
                </label>
                {verify.isError && <p className="form-error"><Icon name="alert" size={16} /> {verify.error.message}</p>}
                <div className="onb-actions">
                  <button type="button" className="link-btn" disabled={request.isPending} onClick={() => request.mutate()}>
                    {request.isPending ? 'Sending…' : 'Resend code'}
                  </button>
                  <button className="btn btn-primary" disabled={code.length !== 6 || verify.isPending}>
                    {verify.isPending ? 'Signing In' : t.button} <Icon name="arrowRight" size={18} />
                  </button>
                </div>
              </form>
            </>
          )}

          {method === 'password' && (
            <>
              <span className="onb-step">Sign in with password</span>
              <h1>Welcome back</h1>
              <p className="onb-hint">Use your phone number and the password saved in Settings.</p>
              <form
                className="onb-form"
                onSubmit={(e) => {
                  e.preventDefault()
                  if (validNg(phone) && password) loginPw.mutate()
                }}
              >
                <label className="field">
                  <span>Phone number</span>
                  <div className="phone-input">
                    <span className="phone-cc">🇳🇬 +234</span>
                    <input className="input input-lg" autoFocus inputMode="tel" autoComplete="tel-national" placeholder="803 123 4567" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>
                </label>
                <label className="field">
                  <span className="field-head">
                    <span>Password</span>
                    <button type="button" className="link-btn" style={{ padding: 0, fontSize: 13 }} onClick={() => switchMethod('reset')}>
                      Forgot password?
                    </button>
                  </span>
                  <div className="pw-wrap">
                    <input
                      className="input input-lg"
                      type={showPw ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button type="button" className="pw-toggle" onClick={() => setShowPw((v) => !v)} aria-label={showPw ? 'Hide password' : 'Show password'}>
                      <Icon name={showPw ? 'eyeOff' : 'eye'} size={18} />
                    </button>
                  </div>
                </label>
                {phone && !validNg(phone) && <p className="form-hint">Enter a Nigerian mobile number, e.g. 0803 123 4567.</p>}
                {loginPw.isError && <p className="form-error"><Icon name="alert" size={16} /> {loginPw.error.message}</p>}
                <div className="onb-actions">
                  <Link className="link-btn" to="/">Back to home</Link>
                  <button className="btn btn-primary" disabled={!validNg(phone) || !password || loginPw.isPending}>
                    {loginPw.isPending ? 'Signing in…' : 'Sign in'} <Icon name="arrowRight" size={18} />
                  </button>
                </div>
              </form>
              <p className="auth-switch">{t.switchText} <Link className="link-btn" to={t.switchTo} state={switchState}>{t.switchLink}</Link></p>
            </>
          )}

          {method === 'reset' && step === 'phone' && (
            <>
              <span className="onb-step">Reset password</span>
              <h1>Verify your number</h1>
              <p className="onb-hint">We'll send a 6-digit code to reset your account password.</p>
              <form
                className="onb-form"
                onSubmit={(e) => {
                  e.preventDefault()
                  if (validNg(phone)) reqReset.mutate()
                }}
              >
                <label className="field">
                  <span>Phone number</span>
                  <div className="phone-input">
                    <span className="phone-cc">🇳🇬 +234</span>
                    <input className="input input-lg" autoFocus inputMode="tel" autoComplete="tel-national" placeholder="803 123 4567" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>
                </label>
                {phone && !validNg(phone) && <p className="form-hint">Enter a Nigerian mobile number, e.g. 0803 123 4567.</p>}
                {reqReset.isError && <p className="form-error"><Icon name="alert" size={16} /> {reqReset.error.message}</p>}
                <div className="onb-actions">
                  <button type="button" className="link-btn" onClick={() => switchMethod('password')}>Back to sign in</button>
                  <button className="btn btn-primary" disabled={!validNg(phone) || reqReset.isPending}>
                    {reqReset.isPending ? 'Sending…' : 'Send reset code'} <Icon name="arrowRight" size={18} />
                  </button>
                </div>
              </form>
            </>
          )}

          {method === 'reset' && step === 'code' && (
            <>
              <span className="onb-step">Reset password</span>
              <h1>Choose a new password</h1>
              <p className="onb-hint">Code sent to {toE164(phone)}. <button type="button" className="link-btn" onClick={() => setStep('phone')}>Change number</button></p>
              {demoCode && <p className="demo-code">Demo reset code: <b>{demoCode}</b></p>}
              <form
                className="onb-form"
                onSubmit={(e) => {
                  e.preventDefault()
                  if (/^\d{6}$/.test(code.trim()) && newPw.length >= 8 && newPw === confirmPw) confirmReset.mutate()
                }}
              >
                <label className="field">
                  <span>6-digit code</span>
                  <input className="input input-lg otp-input" autoFocus inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="••••••" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} />
                </label>
                <label className="field">
                  <span>New password</span>
                  <div className="pw-wrap">
                    <input className="input" type={showPw ? 'text' : 'password'} autoComplete="new-password" placeholder="At least 8 characters" value={newPw} onChange={(e) => setNewPw(e.target.value)} />
                    <button type="button" className="pw-toggle" onClick={() => setShowPw((v) => !v)} aria-label={showPw ? 'Hide password' : 'Show password'}>
                      <Icon name={showPw ? 'eyeOff' : 'eye'} size={18} />
                    </button>
                  </div>
                </label>
                <label className="field">
                  <span>Confirm new password</span>
                  <input className="input" type={showPw ? 'text' : 'password'} autoComplete="new-password" placeholder="Re-enter new password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} />
                </label>
                {confirmPw && newPw !== confirmPw && <p className="form-error"><Icon name="alert" size={16} /> Passwords do not match.</p>}
                {confirmReset.isError && <p className="form-error"><Icon name="alert" size={16} /> {confirmReset.error.message}</p>}
                <div className="onb-actions">
                  <button type="button" className="link-btn" onClick={() => switchMethod('password')}>Cancel</button>
                  <button className="btn btn-primary" disabled={code.length !== 6 || newPw.length < 8 || newPw !== confirmPw || confirmReset.isPending}>
                    {confirmReset.isPending ? 'Resetting…' : 'Reset password'} <Icon name="arrowRight" size={18} />
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </section>
    </div>
  )
}
