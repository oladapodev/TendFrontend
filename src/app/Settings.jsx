import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import Icon from '../components/Icon.jsx'
import Avatar from '../components/Avatar.jsx'
import { AVATAR_PRESETS, processAvatarFile } from './avatars.js'
import { api, isDemo } from '../api/index.js'
import {
  useChangePassword,
  useContacts,
  useDeleteAccount,
  usePlaces,
  useRequestPasswordReset,
  useResetPassword,
  useUpdateMe,
} from './data.js'
import { useLocation } from './location.jsx'
import { useAuth } from './auth.jsx'
import { useTheme } from './themeContext.js'
import { bmi } from './Onboarding.jsx'
import { Modal, SectionHead } from './Screens.jsx'

const TABS = [
  { id: 'profile', label: 'Profile & Picture', hint: 'Avatar, photo and details', icon: 'user' },
  { id: 'safety', label: 'SOS & Safety', hint: 'Countdown, sharing and GPS', icon: 'shield' },
  { id: 'preferences', label: 'Appearance & App', hint: 'Theme, alerts and display', icon: 'sliders' },
  { id: 'security', label: 'Password & Security', hint: 'Reset password, session and data', icon: 'lock' },
]

const SHARE_FIELDS = [
  ['location', 'Live location', 'GPS coordinates and accuracy radius sent during SOS'],
  ['nameAge', 'Name and age', 'Helps hospital triage identify you quickly'],
  ['bloodGenotype', 'Blood group and genotype', 'Critical for blood matching and sickle-cell care'],
  ['allergies', 'Allergies', 'Prevents harmful medication or food reactions'],
  ['infections', 'Known infections', 'Helps care teams prepare protective equipment'],
  ['conditionsMeds', 'Conditions and medication', 'Chronic conditions and current prescriptions'],
]

const LANGUAGES = [
  ['en', 'English (Nigeria)'],
  ['pcm', 'Nigerian Pidgin'],
  ['yo', 'Yorùbá'],
  ['ha', 'Hausa'],
  ['ig', 'Igbo'],
]

function passwordStrength(pw) {
  const checks = {
    len: pw.length >= 8,
    caseMix: /[a-z]/.test(pw) && /[A-Z]/.test(pw),
    numSym: /[\d\W]/.test(pw),
  }
  const score = (checks.len ? 1 : 0) + (checks.caseMix ? 1 : 0) + (checks.numSym ? 1 : 0) + (pw.length >= 12 ? 1 : 0)
  const label = !pw ? '' : score <= 1 ? 'Weak' : score === 2 ? 'Fair' : score === 3 ? 'Good' : 'Strong'
  const tone = score <= 1 ? 'red' : score === 2 ? 'amber' : 'green'
  return { checks, score, label, tone }
}

function describeBrowser() {
  const ua = navigator.userAgent || ''
  const browser = ua.includes('Edg/') ? 'Microsoft Edge' : ua.includes('Chrome/') ? 'Chrome' : ua.includes('Safari/') && !ua.includes('Chrome') ? 'Safari' : ua.includes('Firefox/') ? 'Firefox' : 'Web browser'
  const os = ua.includes('Mac OS') ? 'macOS' : ua.includes('Windows') ? 'Windows' : ua.includes('Android') ? 'Android' : ua.includes('iPhone') || ua.includes('iPad') ? 'iOS' : 'Device'
  return `${browser} on ${os}`
}

function SettingsSaveState({ mutation }) {
  if (mutation.isPending) return <span className="save-state">Saving…</span>
  if (mutation.isError) return <span className="save-state is-err"><Icon name="alert" size={14} /> Not saved: {mutation.error.message}</span>
  if (mutation.isSuccess) return <span className="save-state is-ok"><Icon name="check" size={14} stroke={3} /> Saved</span>
  return null
}

function PasswordInput({ label, value, onChange, placeholder, autoComplete, hint, rightLabel }) {
  const [show, setShow] = useState(false)
  return (
    <label className="field">
      <span className="field-head">
        <span>{label}</span>
        {rightLabel}
      </span>
      <div className="pw-wrap">
        <input
          className="input"
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
        />
        <button
          type="button"
          className="pw-toggle"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
        >
          <Icon name={show ? 'eyeOff' : 'eye'} size={18} />
        </button>
      </div>
      {hint && <small className="field-hint">{hint}</small>}
    </label>
  )
}

function AvatarSection({ profile, onSelectAvatar, saving }) {
  const fileRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [drag, setDrag] = useState(false)
  const current = profile.avatar || ''

  const handleFile = async (file) => {
    if (!file) return
    setErr('')
    setBusy(true)
    try {
      const dataUrl = await processAvatarFile(file)
      onSelectAvatar(dataUrl)
    } catch (e) {
      setErr(e?.message || 'Could not process image.')
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="card">
      <div className="card-head">
        <div>
          <h3>Profile picture & avatar</h3>
          <p className="muted">Upload a photo or pick an avatar shown across your profile.</p>
        </div>
        {current && (
          <button type="button" className="btn btn-ghost btn-sm" disabled={saving || busy} onClick={() => onSelectAvatar('')}>
            Use initials
          </button>
        )}
      </div>

      <div
        className={`avatar-drop ${drag ? 'is-drag' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDrag(false)
          handleFile(e.dataTransfer.files?.[0])
        }}
      >
        <Avatar profile={profile} size="xl" />
        <div className="avatar-drop-copy">
          <strong>{current.startsWith('data:image/') ? 'Custom photo active' : current.startsWith('preset:') ? 'Avatar active' : 'Monogram initials'}</strong>
          <p className="muted">PNG, JPG, or WebP up to 10 MB. Cropped to a square and compressed locally.</p>
          <div className="avatar-drop-actions">
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              hidden
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            <button type="button" className="btn btn-primary btn-sm" disabled={busy || saving} onClick={() => fileRef.current?.click()}>
              <Icon name="upload" size={16} /> {busy ? 'Optimising photo…' : 'Upload photo'}
            </button>
          </div>
        </div>
      </div>

      {err && <p className="form-error"><Icon name="alert" size={16} /> {err}</p>}

      <div className="avatar-gallery-wrap">
        <span className="avatar-gallery-label">Or choose a TendAI avatar</span>
        <div className="avatar-gallery" role="radiogroup" aria-label="Preset avatars">
          <button
            type="button"
            className={`avatar-pick ${!current ? 'is-selected' : ''}`}
            aria-checked={!current}
            role="radio"
            onClick={() => onSelectAvatar('')}
          >
            <Avatar profile={{ ...profile, avatar: '' }} size="lg" />
            <span>Initials</span>
          </button>
          {AVATAR_PRESETS.map((p) => {
            const val = `preset:${p.id}`
            const active = current === val
            return (
              <button
                key={p.id}
                type="button"
                className={`avatar-pick ${active ? 'is-selected' : ''}`}
                aria-checked={active}
                role="radio"
                onClick={() => onSelectAvatar(val)}
              >
                <Avatar profile={{ ...profile, avatar: val }} size="lg" />
                <span>{p.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function ProfileTab({ me, save }) {
  const savedForm = {
    name: me.profile.name || '',
    email: me.profile.email || '',
    city: me.profile.city || '',
    age: me.profile.age || '',
    heightCm: me.profile.heightCm || '',
    weightKg: me.profile.weightKg || '',
    sex: me.profile.sex || '',
  }
  const [draft, setDraft] = useState(null)
  const [savedToast, setSavedToast] = useState(false)
  const form = draft ?? savedForm
  const updateField = (patch) => setDraft({ ...form, ...patch })

  const dirty =
    form.name !== savedForm.name ||
    form.email !== savedForm.email ||
    form.city !== savedForm.city ||
    String(form.age) !== String(savedForm.age) ||
    String(form.heightCm) !== String(savedForm.heightCm) ||
    String(form.weightKg) !== String(savedForm.weightKg) ||
    form.sex !== savedForm.sex

  const emailValid = !form.email.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
  const ageNum = Number(form.age)
  const ageValid = form.age === '' || (ageNum >= 1 && ageNum <= 119)
  const nameValid = form.name.trim().length >= 2
  const canSave = dirty && nameValid && emailValid && ageValid && !save.isPending
  const b = bmi(form)

  const submit = (e) => {
    e.preventDefault()
    if (!canSave) return
    save.mutate(
      {
        profile: {
          name: form.name.trim(),
          email: form.email.trim(),
          city: form.city.trim(),
          age: form.age,
          heightCm: form.heightCm,
          weightKg: form.weightKg,
          sex: form.sex,
        },
      },
      {
        onSuccess: () => {
          setDraft(null)
          setSavedToast(true)
          setTimeout(() => setSavedToast(false), 2600)
        },
      },
    )
  }

  return (
    <div className="settings-stack">
      <AvatarSection
        profile={me.profile}
        saving={save.isPending}
        onSelectAvatar={(avatar) => save.mutate({ profile: { avatar } })}
      />

      <form className="card form" onSubmit={submit}>
        <div className="card-head">
          <div>
            <h3>Personal details</h3>
            <p className="muted">Used to identify you on your Medical ID and during an SOS.</p>
          </div>
          {dirty ? <span className="chip chip-amber">Unsaved changes</span> : savedToast ? <span className="chip chip-green"><Icon name="check" size={14} stroke={3} /> Updated</span> : null}
        </div>

        <div className="grid-2">
          <label className="field">
            <span>Full name</span>
            <input className="input" value={form.name} onChange={(e) => updateField({ name: e.target.value })} placeholder="e.g. Victor Adeyemi" />
            {!nameValid && <small className="field-err-inline">Enter at least 2 characters.</small>}
          </label>
          <label className="field">
            <span>Email address (optional)</span>
            <input className="input" type="email" value={form.email} onChange={(e) => updateField({ email: e.target.value })} placeholder="you@example.com" />
            {!emailValid && <small className="field-err-inline">Enter a valid email address.</small>}
          </label>
        </div>

        <div className="grid-2">
          <label className="field">
            <span>City / Area</span>
            <input className="input" value={form.city} onChange={(e) => updateField({ city: e.target.value })} placeholder="e.g. Abeokuta, Ogun State" />
          </label>
          <label className="field">
            <span>Age (years)</span>
            <input className="input" type="number" min="1" max="119" value={form.age} onChange={(e) => updateField({ age: e.target.value })} placeholder="e.g. 28" />
            {!ageValid && <small className="field-err-inline">Age must be between 1 and 119.</small>}
          </label>
        </div>

        <div className="grid-2">
          <label className="field">
            <span>Height (cm)</span>
            <input className="input" type="number" min="50" max="250" value={form.heightCm} onChange={(e) => updateField({ heightCm: e.target.value })} placeholder="e.g. 172" />
          </label>
          <label className="field">
            <span>Weight (kg)</span>
            <input className="input" type="number" min="2" max="400" value={form.weightKg} onChange={(e) => updateField({ weightKg: e.target.value })} placeholder="e.g. 70" />
          </label>
        </div>

        {b && (
          <div className="settings-inline-stat">
            <Icon name="scale" size={16} />
            <span>Calculated BMI: <strong>{b}</strong> · shown in Fit Health</span>
          </div>
        )}

        <div className="field">
          <span>Sex (optional)</span>
          <div className="choice-row choice-wrap">
            {['Female', 'Male', 'Prefer not to say'].map((o) => (
              <button type="button" key={o} className={`choice choice-sm ${form.sex === o ? 'on' : ''}`} onClick={() => updateField({ sex: o })}>
                {o}
              </button>
            ))}
          </div>
        </div>

        <div className="settings-form-foot">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            disabled={!dirty || save.isPending}
            onClick={() => setDraft(null)}
          >
            Discard
          </button>
          <button type="submit" className="btn btn-primary btn-sm" disabled={!canSave}>
            {save.isPending ? 'Saving…' : 'Save profile'}
          </button>
        </div>
      </form>
    </div>
  )
}

function SafetyTab({ me, save, loc }) {
  const s = me.settings
  const sosOpts = s.sosOptions || { soundAlert: true, vibrateAlert: true, alertHelpers: true }
  const [customInput, setCustomInput] = useState(null)
  const custom = customInput ?? String(s.sosDelay)
  const [notifPerm, setNotifPerm] = useState(() =>
    'Notification' in window ? Notification.permission : 'unsupported',
  )

  const setDelay = (n) => {
    const clamped = Math.min(30, Math.max(3, Math.round(Number(n) || 5)))
    setCustomInput(null)
    save.mutate({ settings: { sosDelay: clamped } })
  }

  const setShareAll = (allOn) => {
    save.mutate({
      settings: {
        share: {
          location: true,
          nameAge: true,
          bloodGenotype: true,
          allergies: true,
          infections: allOn,
          conditionsMeds: allOn,
        },
      },
    })
  }

  const askNotif = async () => {
    if (!('Notification' in window)) return
    try {
      const res = await Notification.requestPermission()
      setNotifPerm(res)
    } catch {
      setNotifPerm('denied')
    }
  }

  return (
    <div className="settings-stack">
      <div className="card">
        <div className="card-head">
          <div>
            <h3>SOS countdown & alerts</h3>
            <p className="muted">Time you have to cancel an accidental press before dispatch starts.</p>
          </div>
          <span className="chip chip-red">{s.sosDelay} sec</span>
        </div>

        <div className="choice-row choice-wrap">
          {[3, 5, 10, 15].map((n) => (
            <button key={n} type="button" className={`choice ${s.sosDelay === n ? 'on' : ''}`} aria-pressed={s.sosDelay === n} onClick={() => setDelay(n)}>
              {n} sec
            </button>
          ))}
        </div>

        <div className="range-row">
          <input
            type="range"
            min="3"
            max="30"
            value={Math.min(30, Math.max(3, Number(custom) || 5))}
            aria-label="SOS countdown seconds"
            onChange={(e) => setCustomInput(e.target.value)}
            onMouseUp={(e) => setDelay(e.currentTarget.value)}
            onTouchEnd={(e) => setDelay(e.currentTarget.value)}
            onKeyUp={(e) => setDelay(e.currentTarget.value)}
          />
          <div className="range-input-wrap">
            <input className="input" type="number" min="3" max="30" value={custom} onChange={(e) => setCustomInput(e.target.value)} aria-label="Custom seconds" />
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setDelay(custom)}>Apply</button>
          </div>
        </div>

        <ul className="toggle-list" style={{ marginTop: 18 }}>
          <li>
            <div className="toggle-copy">
              <strong>Countdown audio alert</strong>
              <small>Play a tone each second during SOS countdown</small>
            </div>
            <label className="switch">
              <input type="checkbox" aria-label="Countdown audio alert" checked={!!sosOpts.soundAlert} onChange={(e) => save.mutate({ settings: { sosOptions: { soundAlert: e.target.checked } } })} />
              <span />
            </label>
          </li>
          <li>
            <div className="toggle-copy">
              <strong>Vibration feedback</strong>
              <small>Pulse the phone during countdown on supported devices</small>
            </div>
            <label className="switch">
              <input type="checkbox" aria-label="Vibration feedback" checked={!!sosOpts.vibrateAlert} onChange={(e) => save.mutate({ settings: { sosOptions: { vibrateAlert: e.target.checked } } })} />
              <span />
            </label>
          </li>
          <li>
            <div className="toggle-copy">
              <strong>Alert opted-in nearby helpers</strong>
              <small>Notify enrolled community helpers close to your location</small>
            </div>
            <label className="switch">
              <input type="checkbox" aria-label="Alert opted-in nearby helpers" checked={sosOpts.alertHelpers !== false} onChange={(e) => save.mutate({ settings: { sosOptions: { alertHelpers: e.target.checked } } })} />
              <span />
            </label>
          </li>
        </ul>
      </div>

      <div className="card">
        <div className="card-head">
          <div>
            <h3>Shared during SOS</h3>
            <p className="muted">Only these fields go to the hospital and your emergency contacts.</p>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShareAll(false)}>Essential</button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShareAll(true)}>Share all</button>
          </div>
        </div>

        <ul className="toggle-list">
          {SHARE_FIELDS.map(([k, label, desc]) => (
            <li key={k}>
              <div className="toggle-copy">
                <strong>{label}</strong>
                <small>{desc}</small>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  aria-label={label}
                  checked={!!s.share?.[k]}
                  onChange={(e) => save.mutate({ settings: { share: { [k]: e.target.checked } } })}
                />
                <span />
              </label>
            </li>
          ))}
        </ul>

        <p className="note"><Icon name="heart" size={15} /> Need to update your blood group or allergies? <Link className="link-btn" style={{ padding: 0 }} to="/app/medical">Open Medical ID</Link></p>
      </div>

      <div className="card">
        <h3>Device permissions</h3>
        <p className="muted">Required for accurate emergency dispatch and live status alerts.</p>
        <div className="perm-rows">
          <div className="perm-row">
            <span className="perm-ico"><Icon name="pin" size={20} /></span>
            <div className="perm-row-copy">
              <strong>Location access</strong>
              <small>
                {loc.status === 'live'
                  ? `Active · accurate to ±${loc.pos.accuracy} m`
                  : loc.status === 'denied'
                    ? 'Blocked in browser. Enable location permission in your browser site settings.'
                    : loc.status === 'locating'
                      ? 'Getting your GPS fix…'
                      : 'Off. Turn on so SOS and Help Locator know where you are.'}
              </small>
            </div>
            {loc.status === 'live' ? (
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => loc.getFix()}>
                <Icon name="refresh" size={15} /> Refresh
              </button>
            ) : loc.status !== 'denied' ? (
              <button type="button" className="btn btn-primary btn-sm" onClick={loc.start}>
                Turn on
              </button>
            ) : (
              <span className="chip chip-red">Blocked</span>
            )}
          </div>

          <div className="perm-row">
            <span className="perm-ico"><Icon name="bell" size={20} /></span>
            <div className="perm-row-copy">
              <strong>Browser notifications</strong>
              <small>
                {notifPerm === 'granted'
                  ? 'Allowed for live incident and reminder alerts.'
                  : notifPerm === 'denied'
                    ? 'Blocked in browser site settings.'
                    : notifPerm === 'unsupported'
                      ? 'Not supported in this browser.'
                      : 'Turn on to receive incident updates.'}
              </small>
            </div>
            {notifPerm === 'granted' ? (
              <span className="chip chip-green"><Icon name="check" size={13} stroke={3} /> Allowed</span>
            ) : notifPerm === 'default' ? (
              <button type="button" className="btn btn-primary btn-sm" onClick={askNotif}>Allow</button>
            ) : (
              <span className="chip chip-grey">{notifPerm === 'denied' ? 'Blocked' : 'Unavailable'}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function PreferencesTab({ me, save }) {
  const notif = me.settings.notifications || {}
  const prefs = me.settings.preferences || {}
  const { theme, resolvedTheme, setTheme } = useTheme()
  const activeTheme = prefs.theme || theme

  const setNotif = (patch) => save.mutate({ settings: { notifications: patch } })
  const setPref = (patch) => save.mutate({ settings: { preferences: patch } })
  const chooseTheme = (mode) => {
    setTheme(mode)
    setPref({ theme: mode })
  }

  return (
    <div className="settings-stack">
      <div className="card">
        <div className="card-head">
          <div>
            <h3>Appearance</h3>
            <p className="muted">Choose light mode, dark mode, or follow your device setting.</p>
          </div>
          <span className="chip chip-grey" style={{ textTransform: 'capitalize' }}>Using {resolvedTheme}</span>
        </div>
        <div className="theme-grid" role="radiogroup" aria-label="Theme mode">
          {[
            ['light', 'Light', 'sun'],
            ['dark', 'Dark', 'moon'],
            ['system', 'System', 'monitor'],
          ].map(([mode, label, icon]) => (
            <button
              key={mode}
              type="button"
              role="radio"
              aria-checked={activeTheme === mode}
              className={`theme-option ${activeTheme === mode ? 'is-active' : ''}`}
              onClick={() => chooseTheme(mode)}
            >
              <span className={`theme-swatch is-${mode}`}>
                <span />
                <span />
              </span>
              <span className="theme-option-foot">
                <Icon name={icon} size={15} />
                <span>{label}</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <h3>Notification preferences</h3>
        <p className="muted">Choose which updates and reminders TendAI sends you.</p>
        <ul className="toggle-list">
          <li>
            <div className="toggle-copy">
              <strong>SOS & incident status updates</strong>
              <small>Real-time confirmations when hospital or contacts answer</small>
            </div>
            <label className="switch">
              <input type="checkbox" aria-label="SOS and incident status updates" checked={notif.incidentUpdates !== false} onChange={(e) => setNotif({ incidentUpdates: e.target.checked })} />
              <span />
            </label>
          </li>
          <li>
            <div className="toggle-copy">
              <strong>Daily wellness & hydration nudges</strong>
              <small>Gentle Fit Health water and movement reminders</small>
            </div>
            <label className="switch">
              <input type="checkbox" aria-label="Daily wellness and hydration nudges" checked={!!notif.wellnessReminders} onChange={(e) => setNotif({ wellnessReminders: e.target.checked })} />
              <span />
            </label>
          </li>
          <li>
            <div className="toggle-copy">
              <strong>Medical ID review reminders</strong>
              <small>Periodic check-in to keep contacts and medications current</small>
            </div>
            <label className="switch">
              <input type="checkbox" aria-label="Medical ID review reminders" checked={!!notif.checkInReminders} onChange={(e) => setNotif({ checkInReminders: e.target.checked })} />
              <span />
            </label>
          </li>
          <li>
            <div className="toggle-copy">
              <strong>Quiet hours</strong>
              <small>Pause non-urgent reminders overnight (SOS always bypasses)</small>
            </div>
            <label className="switch">
              <input type="checkbox" aria-label="Quiet hours" checked={!!notif.quietHours} onChange={(e) => setNotif({ quietHours: e.target.checked })} />
              <span />
            </label>
          </li>
        </ul>

        {notif.quietHours && (
          <div className="grid-2" style={{ marginTop: 14 }}>
            <label className="field">
              <span>Quiet hours start</span>
              <input className="input" type="time" value={notif.quietStart || '22:00'} onChange={(e) => setNotif({ quietStart: e.target.value })} />
            </label>
            <label className="field">
              <span>Quiet hours end</span>
              <input className="input" type="time" value={notif.quietEnd || '07:00'} onChange={(e) => setNotif({ quietEnd: e.target.value })} />
            </label>
          </div>
        )}
      </div>

      <div className="card">
        <h3>Display & accessibility</h3>
        <p className="muted">Adjust readability, motion and regional preferences across the app.</p>

        <ul className="toggle-list">
          <li>
            <div className="toggle-copy">
              <strong>Larger text</strong>
              <small>Increase interface font sizing for easier emergency reading</small>
            </div>
            <label className="switch">
              <input type="checkbox" aria-label="Larger text" checked={!!prefs.largeText} onChange={(e) => setPref({ largeText: e.target.checked })} />
              <span />
            </label>
          </li>
          <li>
            <div className="toggle-copy">
              <strong>Reduce motion</strong>
              <small>Minimise animations and pulse transitions</small>
            </div>
            <label className="switch">
              <input type="checkbox" aria-label="Reduce motion" checked={!!prefs.reduceMotion} onChange={(e) => setPref({ reduceMotion: e.target.checked })} />
              <span />
            </label>
          </li>
        </ul>

        <div className="grid-2" style={{ marginTop: 18 }}>
          <label className="field">
            <span>Preferred language</span>
            <select className="input" value={prefs.language || 'en'} onChange={(e) => setPref({ language: e.target.value })}>
              {LANGUAGES.map(([code, label]) => (
                <option key={code} value={code}>{label}</option>
              ))}
            </select>
          </label>
          <div className="field">
            <span>Time format</span>
            <div className="choice-row">
              {[['24h', '24-hour'], ['12h', '12-hour']].map(([val, label]) => (
                <button key={val} type="button" className={`choice ${(prefs.timeFormat !== '12h' && val === '24h') || prefs.timeFormat === val ? 'on' : ''}`} style={{ flex: 1 }} onClick={() => setPref({ timeFormat: val })}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {prefs.language && prefs.language !== 'en' && (
          <p className="note"><Icon name="globe" size={16} /> Your preferred language is saved for upcoming Nigerian language packs; screens currently display in English.</p>
        )}
      </div>
    </div>
  )
}

function SecurityTab({ me, signOut }) {
  const contacts = useContacts()
  const places = usePlaces()
  const changePw = useChangePassword()
  const reqReset = useRequestPasswordReset()
  const confirmReset = useResetPassword()
  const deleteAcc = useDeleteAccount()

  const hasPassword = !!me.security?.hasPassword
  const [mode, setMode] = useState('change') // 'change' | 'reset'
  const [curPw, setCurPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwDone, setPwDone] = useState('')

  // Reset via SMS OTP
  const [resetSent, setResetSent] = useState(false)
  const [demoCode, setDemoCode] = useState('')
  const [otp, setOtp] = useState('')
  const [resetPw, setResetPw] = useState('')
  const [resetConfirm, setResetConfirm] = useState('')
  const [cooldown, setCooldown] = useState(0)

  // Danger zone modals
  const [delOpen, setDelOpen] = useState(false)
  const [delText, setDelText] = useState('')
  const [resetDemoOpen, setResetDemoOpen] = useState(false)
  const [exportMsg, setExportMsg] = useState('')

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  const activePw = mode === 'change' ? newPw : resetPw
  const strength = useMemo(() => passwordStrength(activePw), [activePw])
  const changeMatches = newPw && newPw === confirmPw
  const resetMatches = resetPw && resetPw === resetConfirm

  const submitChange = (e) => {
    e.preventDefault()
    setPwDone('')
    if (newPw.length < 8 || !changeMatches) return
    if (hasPassword && !curPw) return
    changePw.mutate(
      { currentPassword: curPw, newPassword: newPw },
      {
        onSuccess: () => {
          setCurPw('')
          setNewPw('')
          setConfirmPw('')
          setPwDone(hasPassword ? 'Password updated.' : 'Password set for your account.')
        },
      },
    )
  }

  const sendCode = () => {
    setPwDone('')
    confirmReset.reset()
    reqReset.mutate(me.phone, {
      onSuccess: (r) => {
        setResetSent(true)
        setDemoCode(r?.demoCode || '')
        setCooldown(60)
      },
    })
  }

  const submitReset = (e) => {
    e.preventDefault()
    setPwDone('')
    if (!/^\d{6}$/.test(otp.trim()) || resetPw.length < 8 || !resetMatches) return
    confirmReset.mutate(
      { phone: me.phone, code: otp.trim(), newPassword: resetPw },
      {
        onSuccess: () => {
          setOtp('')
          setResetPw('')
          setResetConfirm('')
          setResetSent(false)
          setDemoCode('')
          setMode('change')
          setPwDone('Password reset via SMS verification. Your new password is active.')
        },
      },
    )
  }

  const exportData = async () => {
    setExportMsg('')
    try {
      const payload = {
        exportedAt: new Date().toISOString(),
        account: { id: me.id, phone: me.phone, profile: me.profile, medical: me.medical, settings: me.settings },
        emergencyContacts: contacts.data || (await api.contacts.list()),
        trustedFacilities: places.data || (await api.places.list()),
      }
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `tendai-data-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      setExportMsg('Downloaded your data export.')
    } catch {
      setExportMsg('Could not prepare export right now.')
    }
  }

  const handleResetDemo = async () => {
    await api.me.patch({
      onboarded: false,
      permissionsDone: false,
      profile: { name: '', age: '', heightCm: '', weightKg: '', sex: '', email: '', city: '', avatar: '' },
      medical: { bloodGroup: '', genotype: '', allergies: [], infections: [], conditions: [], medications: [], notes: '' },
    })
    window.location.reload()
  }

  return (
    <div className="settings-stack">
      <div className="card">
        <div className="card-head">
          <div>
            <h3>Password & recovery</h3>
            <p className="muted">
              {hasPassword
                ? `Set · last updated ${me.security?.passwordUpdatedAt ? new Date(me.security.passwordUpdatedAt).toLocaleDateString() : 'recently'}`
                : 'Add a password for sign-in, or reset anytime using your verified phone number.'}
            </p>
          </div>
          <span className={`chip ${hasPassword ? 'chip-green' : 'chip-amber'}`}>
            <Icon name="key" size={13} /> {hasPassword ? 'Password set' : 'OTP only'}
          </span>
        </div>

        <div className="seg-tabs" role="tablist" aria-label="Password action">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'change'}
            className={`seg-tab ${mode === 'change' ? 'is-on' : ''}`}
            onClick={() => { setMode('change'); changePw.reset(); reqReset.reset(); confirmReset.reset(); setPwDone('') }}
          >
            {hasPassword ? 'Change password' : 'Set password'}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'reset'}
            className={`seg-tab ${mode === 'reset' ? 'is-on' : ''}`}
            onClick={() => { setMode('reset'); changePw.reset(); reqReset.reset(); confirmReset.reset(); setPwDone('') }}
          >
            Reset via SMS code
          </button>
        </div>

        {pwDone && (
          <p className="settings-banner is-ok"><Icon name="checkCircle" size={16} /> {pwDone}</p>
        )}

        {mode === 'change' ? (
          <form className="form" style={{ marginTop: 18 }} onSubmit={submitChange}>
            {hasPassword && (
              <PasswordInput
                label="Current password"
                value={curPw}
                onChange={(e) => setCurPw(e.target.value)}
                placeholder="Enter current password"
                autoComplete="current-password"
                rightLabel={
                  <button type="button" className="link-btn" style={{ padding: 0, fontSize: 12 }} onClick={() => setMode('reset')}>
                    Forgot password?
                  </button>
                }
              />
            )}

            <PasswordInput
              label="New password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              placeholder="At least 8 characters"
              autoComplete="new-password"
            />

            {newPw && (
              <div className="pw-meter">
                <div className="pw-meter-bar">
                  <span className={`tone-${strength.tone}`} style={{ width: `${Math.max(20, strength.score * 25)}%` }} />
                </div>
                <div className="pw-meter-meta">
                  <span className={`chip chip-${strength.tone}`}>{strength.label}</span>
                  <span className={strength.checks.len ? 'ok' : ''}>8+ chars</span>
                  <span className={strength.checks.caseMix ? 'ok' : ''}>Upper & lower</span>
                  <span className={strength.checks.numSym ? 'ok' : ''}>Number or symbol</span>
                </div>
              </div>
            )}

            <PasswordInput
              label="Confirm new password"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              placeholder="Re-enter new password"
              autoComplete="new-password"
            />

            {confirmPw && !changeMatches && <p className="form-error"><Icon name="alert" size={16} /> Passwords do not match.</p>}
            {changePw.isError && <p className="form-error"><Icon name="alert" size={16} /> {changePw.error.message}</p>}

            <div className="settings-form-foot">
              <button
                type="submit"
                className="btn btn-primary btn-sm"
                disabled={changePw.isPending || newPw.length < 8 || !changeMatches || (hasPassword && !curPw)}
              >
                {changePw.isPending ? 'Saving…' : hasPassword ? 'Update password' : 'Set password'}
              </button>
            </div>
          </form>
        ) : (
          <div className="form" style={{ marginTop: 18 }}>
            <div className="reset-sms-box">
              <div>
                <strong>Verify {me.phone}</strong>
                <p className="muted">We'll text a 6-digit reset code to your registered number.</p>
              </div>
              <button type="button" className="btn btn-ghost btn-sm" disabled={reqReset.isPending || cooldown > 0} onClick={sendCode}>
                {reqReset.isPending ? 'Sending…' : cooldown > 0 ? `Resend in ${cooldown}s` : resetSent ? 'Resend code' : 'Send reset code'}
              </button>
            </div>

            {reqReset.isError && <p className="form-error"><Icon name="alert" size={16} /> {reqReset.error.message}</p>}
            {demoCode && <p className="demo-code" style={{ marginTop: 0 }}>Demo verification code: <b>{demoCode}</b></p>}

            {resetSent && (
              <form className="form" onSubmit={submitReset}>
                <label className="field">
                  <span>6-digit verification code</span>
                  <input
                    className="input otp-input"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    placeholder="••••••"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  />
                </label>

                <PasswordInput
                  label="New password"
                  value={resetPw}
                  onChange={(e) => setResetPw(e.target.value)}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                />

                {resetPw && (
                  <div className="pw-meter">
                    <div className="pw-meter-bar">
                      <span className={`tone-${strength.tone}`} style={{ width: `${Math.max(20, strength.score * 25)}%` }} />
                    </div>
                    <div className="pw-meter-meta">
                      <span className={`chip chip-${strength.tone}`}>{strength.label}</span>
                      <span className={strength.checks.len ? 'ok' : ''}>8+ chars</span>
                      <span className={strength.checks.caseMix ? 'ok' : ''}>Upper & lower</span>
                      <span className={strength.checks.numSym ? 'ok' : ''}>Number or symbol</span>
                    </div>
                  </div>
                )}

                <PasswordInput
                  label="Confirm new password"
                  value={resetConfirm}
                  onChange={(e) => setResetConfirm(e.target.value)}
                  placeholder="Re-enter new password"
                  autoComplete="new-password"
                />

                {resetConfirm && !resetMatches && <p className="form-error"><Icon name="alert" size={16} /> Passwords do not match.</p>}
                {confirmReset.isError && <p className="form-error"><Icon name="alert" size={16} /> {confirmReset.error.message}</p>}

                <div className="settings-form-foot">
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    disabled={confirmReset.isPending || otp.length !== 6 || resetPw.length < 8 || !resetMatches}
                  >
                    {confirmReset.isPending ? 'Resetting…' : 'Reset password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>

      <div className="card">
        <h3>Active session</h3>
        <p className="muted">Your verified account session on this device.</p>
        <div className="session-row">
          <span className="perm-ico"><Icon name="laptop" size={20} /></span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <strong>{describeBrowser()}</strong>
            <small className="muted" style={{ display: 'block' }}>Signed in as {me.phone}</small>
          </div>
          <span className="chip chip-green"><span className="dot" style={{ background: 'var(--green-600)' }} /> Active now</span>
        </div>
        <div style={{ marginTop: 14 }}>
          <button type="button" className="btn btn-ghost btn-sm" onClick={signOut}>
            <Icon name="logout" size={16} /> Sign out of this device
          </button>
        </div>
      </div>

      <div className="card danger-card">
        <h3>Privacy & account data</h3>
        <p className="muted">Under the Nigeria Data Protection Act (NDPA 2023), you control your personal health records.</p>

        <div className="data-actions">
          <div className="data-row">
            <div>
              <strong>Export my data</strong>
              <small className="muted">Download your profile, Medical ID, contacts, saved hospitals and settings as JSON.</small>
            </div>
            <button type="button" className="btn btn-ghost btn-sm" onClick={exportData}>
              <Icon name="download" size={16} /> Download JSON
            </button>
          </div>

          {isDemo && (
            <div className="data-row">
              <div>
                <strong>Replay onboarding (Demo)</strong>
                <small className="muted">Clear profile fields and return to the first-time setup wizard.</small>
              </div>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setResetDemoOpen(true)}>
                <Icon name="refresh" size={16} /> Reset demo
              </button>
            </div>
          )}

          <div className="data-row is-danger">
            <div>
              <strong>Delete account</strong>
              <small className="muted">Permanently erase your profile, Medical ID, contacts and settings.</small>
            </div>
            <button type="button" className="btn btn-danger btn-sm" onClick={() => { setDelText(''); setDelOpen(true) }}>
              <Icon name="trash" size={16} /> Delete account
            </button>
          </div>
        </div>

        {exportMsg && <p className="note" style={{ marginTop: 12 }}><Icon name="checkCircle" size={15} /> {exportMsg}</p>}
      </div>

      {resetDemoOpen && (
        <Modal
          title="Reset demo profile?"
          onClose={() => setResetDemoOpen(false)}
          footer={
            <>
              <button type="button" className="btn btn-ghost" onClick={() => setResetDemoOpen(false)}>Cancel</button>
              <button type="button" className="btn btn-primary" onClick={handleResetDemo}>Reset & restart</button>
            </>
          }
        >
          <p className="muted">This clears your demo profile and Medical ID fields and re-opens the onboarding setup flow.</p>
        </Modal>
      )}

      {delOpen && (
        <Modal
          title="Delete your TendAI account?"
          onClose={() => setDelOpen(false)}
          footer={
            <>
              <button type="button" className="btn btn-ghost" onClick={() => setDelOpen(false)}>Cancel</button>
              <button
                type="button"
                className="btn btn-danger"
                disabled={delText.trim().toUpperCase() !== 'DELETE' || deleteAcc.isPending}
                onClick={() => deleteAcc.mutate()}
              >
                {deleteAcc.isPending ? 'Deleting…' : 'Permanently delete'}
              </button>
            </>
          }
        >
          <div className="form">
            <p className="muted">This removes your profile, Medical ID, emergency contacts, and saved places. This action cannot be undone.</p>
            <label className="field">
              <span>Type <b>DELETE</b> to confirm</span>
              <input className="input" autoFocus value={delText} onChange={(e) => setDelText(e.target.value)} placeholder="DELETE" />
            </label>
            {deleteAcc.isError && <p className="form-error"><Icon name="alert" size={16} /> {deleteAcc.error.message}</p>}
          </div>
        </Modal>
      )}
    </div>
  )
}

export default function Settings({ me }) {
  const save = useUpdateMe()
  const { signOut } = useAuth()
  const loc = useLocation()
  const contacts = useContacts()
  const places = usePlaces()
  const [searchParams, setSearchParams] = useSearchParams()
  const [photoModal, setPhotoModal] = useState(false)

  const paramTab = searchParams.get('tab')
  const tab = TABS.some((t) => t.id === paramTab) ? paramTab : 'profile'
  const setTab = (id) => setSearchParams({ tab: id }, { replace: true })

  const readyCount = [
    !!me.profile.name,
    loc.status === 'live',
    (contacts.data?.length || 0) >= 2,
    !!me.medical?.bloodGroup,
    (places.data?.length || 0) > 0,
  ].filter(Boolean).length

  return (
    <div className="page">
      <SectionHead
        icon="settings"
        tone="grey"
        title="Settings"
        text="Manage your profile picture, SOS safety controls, notifications, and password security."
        action={<SettingsSaveState mutation={save} />}
      />

      <section className="settings-hero card">
        <div className="settings-hero-avatar">
          <Avatar profile={me.profile} size="xl" />
          <button type="button" className="avatar-cam-btn" onClick={() => setPhotoModal(true)} aria-label="Change profile picture" title="Change profile picture">
            <Icon name="camera" size={15} />
          </button>
        </div>

        <div className="settings-hero-info">
          <div className="settings-hero-name">
            <h2>{me.profile.name || 'Your profile'}</h2>
            <span className="chip chip-green"><Icon name="checkCircle" size={13} /> Verified</span>
            <span className={`chip ${readyCount >= 4 ? 'chip-green' : 'chip-amber'}`}>{readyCount}/5 SOS ready</span>
          </div>
          <p className="muted">
            {[me.phone, me.profile.city, me.profile.email].filter(Boolean).join(' · ')}
          </p>
        </div>

        <div className="settings-hero-actions">
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPhotoModal(true)}>
            <Icon name="camera" size={16} /> Change picture
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setTab('security')}>
            <Icon name="key" size={16} /> {me.security?.hasPassword ? 'Reset password' : 'Set password'}
          </button>
        </div>
      </section>

      <div className="settings-shell">
        <nav className="settings-nav" aria-label="Settings sections">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`settings-nav-item ${tab === t.id ? 'is-active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              <span className="settings-nav-ico"><Icon name={t.icon} size={18} /></span>
              <span>
                <strong>{t.label}</strong>
                <small>{t.hint}</small>
              </span>
            </button>
          ))}
        </nav>

        <div className="settings-panel">
          {tab === 'profile' && <ProfileTab me={me} save={save} />}
          {tab === 'safety' && <SafetyTab me={me} save={save} loc={loc} />}
          {tab === 'preferences' && <PreferencesTab me={me} save={save} />}
          {tab === 'security' && <SecurityTab me={me} signOut={signOut} />}
        </div>
      </div>

      {photoModal && (
        <Modal title="Update profile picture" wide onClose={() => setPhotoModal(false)} footer={<button type="button" className="btn btn-primary" onClick={() => setPhotoModal(false)}>Done</button>}>
          <AvatarSection
            profile={me.profile}
            saving={save.isPending}
            onSelectAvatar={(avatar) => save.mutate({ profile: { avatar } })}
          />
        </Modal>
      )}
    </div>
  )
}
