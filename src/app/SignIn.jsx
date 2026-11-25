import { useState } from 'react'
import { Link, Navigate, useLocation as useRouterLocation, useNavigate } from 'react-router'
import { useMutation } from '@tanstack/react-query'
import Icon, { Logo } from '../components/Icon.jsx'
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

export default function SignIn() {
  const { signedIn } = useAuth()
  const nav = useNavigate()
  const loc = useRouterLocation()
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState('phone')
  const [demoCode, setDemoCode] = useState(null)

  const request = useMutation({
    mutationFn: () => api.auth.requestOtp(toE164(phone)),
    onSuccess: (r) => {
      setDemoCode(r?.demoCode || null)
      setStep('code')
    },
  })
  const verify = useMutation({
    mutationFn: () => api.auth.verifyOtp(toE164(phone), code.trim()),
    onSuccess: () => nav(loc.state?.from || '/app', { replace: true }),
  })

  if (signedIn) return <Navigate to="/app" replace />

  return (
    <div className="onb">
      <aside className="onb-side">
        <Link to="/"><Logo size={32} light /></Link>
        <div className="onb-side-body">
          <h2>One press to start the call for help.</h2>
          <p>Sign in with your phone number. We use it to identify you and as the call-back number during an SOS.</p>
        </div>
        <p className="onb-side-foot"><Icon name="lock" size={14} /> We never share your number without your permission.</p>
      </aside>
      <section className="onb-main">
        <div className="onb-card">
          {isDemo && (
            <p className="demo-banner"><Icon name="info" size={16} /> Demo mode: no backend is connected. No SMS is sent; the code is shown below.</p>
          )}
          {step === 'phone' ? (
            <>
              <span className="onb-step">Sign in</span>
              <h1>What's your phone number?</h1>
              <p className="onb-hint">We'll text you a 6-digit code.</p>
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
                {request.isError && <p className="form-error"><Icon name="alert" size={16} /> {request.error.message}</p>}
                <div className="onb-actions">
                  <Link className="link-btn" to="/">Back to home</Link>
                  <button className="btn btn-primary" disabled={!validNg(phone) || request.isPending}>
                    {request.isPending ? 'Sending…' : 'Send code'} <Icon name="arrowRight" size={18} />
                  </button>
                </div>
              </form>
            </>
          ) : (
            <>
              <span className="onb-step">Check your messages</span>
              <h1>Enter the 6-digit code</h1>
              <p className="onb-hint">Sent to {toE164(phone)}. <button className="link-btn" onClick={() => { setStep('phone'); setCode(''); verify.reset() }}>Change number</button></p>
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
                    {verify.isPending ? 'Checking…' : 'Sign in'} <Icon name="arrowRight" size={18} />
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
