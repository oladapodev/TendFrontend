import { useEffect, useRef, useState } from 'react'
import Icon from '../components/Icon.jsx'
import adultCall from '../assets/cpr/cpr_adult_step_02.png'
import adultPush from '../assets/cpr/cpr_adult_step_03.png'
import adultBreaths from '../assets/cpr/cpr_adult_step_05.png'
import childCall from '../assets/cpr/cpr_child_step_04.png'
import babyBreaths from '../assets/cpr/cpr_baby_step_03.png'
import babyPush from '../assets/cpr/cpr_baby_step_05.png'

// CPR guide built only from the uploaded illustrations: every step has its picture.
// Checks and calls that have no picture of their own are folded into the illustrated steps.
// Wording and illustrations must be reviewed by a clinician before launch.
const GUIDES = {
  adult: {
    label: 'Adult',
    who: 'Teens and adults',
    depth: '5–6 cm',
    hands: 'Heel of one hand in the centre of the chest, other hand on top, arms straight.',
    steps: [
      { img: adultCall, alt: 'Rescuer kneeling beside an unresponsive man, phone on speaker and a defibrillator open nearby', title: 'Check, then call 112 and get an AED', text: 'Make sure it is safe. Tap their shoulders and shout. If they do not respond and are not breathing normally, call 112 with the phone on speaker and send someone for a defibrillator (AED) if one is nearby.' },
      { img: adultPush, alt: 'Rescuer pushing on the centre of the chest with arms straight', title: 'Give 30 chest compressions', text: 'Push hard and fast in the centre of the chest, 5–6 cm deep, 100–120 times a minute. Let the chest come back up after each push.' },
      { img: adultBreaths, alt: 'Rescuer tilting the head, pinching the nose and giving a breath', title: 'Give 2 rescue breaths, then repeat', text: 'Tilt the head back, lift the chin, pinch the nose and breathe for about 1 second until the chest rises. Then go back to 30 compressions and 2 breaths, and keep going until help takes over or they breathe normally. Not trained or not willing? Keep doing compressions only. Use the AED as soon as it arrives.' },
    ],
  },
  child: {
    label: 'Child',
    who: '1 year to puberty',
    depth: 'about 5 cm (a third of the chest)',
    hands: 'One hand (or two for a bigger child) on the lower half of the breastbone.',
    steps: [
      { img: childCall, alt: 'Rescuer kneeling beside an unresponsive child, phone on speaker beside them', title: 'Check, call 112, then start CPR', text: 'Tap the child and call their name. If they do not respond and are not breathing normally, call 112 with the phone on speaker beside you. Then give 30 compressions on the lower half of the breastbone, about 5 cm deep, 100–120 a minute, followed by 2 breaths (tilt the head, lift the chin, pinch the nose). Repeat until help takes over or the child breathes normally.' },
    ],
  },
  baby: {
    label: 'Baby',
    who: 'Under 1 year',
    depth: 'about 4 cm (a third of the chest)',
    hands: 'Two fingers (or two thumbs with hands around the chest) just below the nipple line.',
    steps: [
      { img: babyBreaths, alt: 'Rescuer covering the baby’s mouth and nose with their mouth to give a breath', title: 'Check, call 112, then give 2 gentle breaths', text: 'Tap the bottom of the foot and call out (never shake a baby). If they do not respond and are not breathing normally, call 112 on speaker. Lay the baby on a firm, flat surface, keep the head level, cover the mouth and nose with your mouth and give 2 small puffs until the chest rises.' },
      { img: babyPush, alt: 'Rescuer pressing on the centre of the baby’s chest', title: 'Give 30 chest compressions, then repeat', text: 'Press in the centre of the chest just below the nipple line, about 4 cm deep, 100–120 times a minute, with two fingers or two thumbs with your hands around the chest. Then give 2 breaths and repeat until help takes over or the baby breathes normally.' },
    ],
  },
}

const BPM = 110
const COMPRESSIONS = 30
const BREATH_PAUSE_MS = 5000

// Compression coach: a steady 110/min beat that counts to 30, then prompts 2 breaths.
function CompressionCoach({ guide, onClose }) {
  const [running, setRunning] = useState(true)
  const [count, setCount] = useState(0)
  const [phase, setPhase] = useState('push') // push | breaths
  const [cycles, setCycles] = useState(0)
  const [sound, setSound] = useState(true)
  const [handsOnly, setHandsOnly] = useState(false)
  const audio = useRef(null)
  const countRef = useRef(0)
  const soundRef = useRef(sound)
  soundRef.current = sound

  const beep = (freq = 880, dur = 0.05) => {
    if (!soundRef.current) return
    try {
      audio.current ||= new (window.AudioContext || window.webkitAudioContext)()
      const ctx = audio.current
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.frequency.value = freq
      g.gain.setValueAtTime(0.25, ctx.currentTime)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur)
      o.connect(g).connect(ctx.destination)
      o.start()
      o.stop(ctx.currentTime + dur)
    } catch {
      /* no audio available */
    }
  }

  useEffect(() => {
    if (!running) return
    if (phase === 'breaths') {
      beep(520, 0.25)
      const t = setTimeout(() => {
        setPhase('push')
        setCount(0)
      }, BREATH_PAUSE_MS)
      return () => clearTimeout(t)
    }
    // Count in a ref so side effects (beep, phase change) run exactly once per beat.
    countRef.current = count // resume from where a pause left off
    const t = setInterval(() => {
      const n = countRef.current + 1
      beep(n === COMPRESSIONS ? 660 : 880)
      if (n >= COMPRESSIONS && !handsOnly) {
        countRef.current = n
        setCount(n)
        setPhase('breaths')
        setCycles((x) => x + 1)
        return
      }
      countRef.current = handsOnly && n >= COMPRESSIONS ? 0 : n
      setCount(countRef.current)
    }, 60000 / BPM)
    return () => clearInterval(t)
  }, [running, phase, handsOnly])

  useEffect(() => () => audio.current?.close?.(), [])
  useEffect(() => {
    const k = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [onClose])

  return (
    <div className="cpr-coach" role="dialog" aria-modal="true" aria-label="Compression coach">
      <div className="cpr-coach-top">
        <span className="chip chip-red"><Icon name="heart" size={14} /> {guide.label} CPR · {BPM} per minute</span>
        <button className="icon-btn cpr-coach-x" onClick={onClose} aria-label="Close compression coach"><Icon name="x" size={22} /></button>
      </div>

      <div className={`cpr-beat ${phase === 'push' && running ? 'is-beating' : ''} ${phase === 'breaths' ? 'is-breaths' : ''}`} style={{ '--beat': `${60 / BPM}s` }}>
        {phase === 'push' ? (
          <>
            <b aria-live="off">{count}</b>
            <small>{handsOnly ? 'Push hard and fast' : `of ${COMPRESSIONS} compressions`}</small>
          </>
        ) : (
          <>
            <b className="cpr-beat-word">2 breaths</b>
            <small>then back to pushing</small>
          </>
        )}
      </div>

      <p className="cpr-coach-tip" aria-live="polite">
        {phase === 'push' ? `${guide.hands} Push ${guide.depth} deep.` : 'Give 2 rescue breaths, watching the chest rise each time.'}
      </p>

      <div className="cpr-coach-actions">
        <button className="btn btn-white" onClick={() => setRunning((r) => !r)}>
          {running ? <><Icon name="clock" size={18} /> Pause</> : <><Icon name="activity" size={18} /> Resume</>}
        </button>
        <button className="btn cpr-coach-ghost" onClick={() => setSound((s) => !s)} aria-pressed={sound}>
          <Icon name="bell" size={18} /> Sound {sound ? 'on' : 'off'}
        </button>
        <button className="btn cpr-coach-ghost" onClick={() => { setHandsOnly((h) => !h); setPhase('push'); setCount(0) }} aria-pressed={handsOnly}>
          {handsOnly ? 'Hands-only: on' : 'Hands-only: off'}
        </button>
        <a className="btn cpr-coach-ghost" href="tel:112"><Icon name="phone" size={18} /> Call 112</a>
      </div>
      {!handsOnly && <p className="cpr-coach-cycles">Cycles completed: {cycles}</p>}
    </div>
  )
}

// Rendered inside the "CPR" page of Common emergencies.
export default function CprGuide() {
  const [age, setAge] = useState('adult')
  const [coach, setCoach] = useState(false)
  const g = GUIDES[age]

  return (
    <div>
      <div className="cpr-tabs-row">
      <div className="cpr-tabs" role="tablist" aria-label="Who needs CPR">
        {Object.entries(GUIDES).map(([k, v]) => (
          <button key={k} role="tab" aria-selected={age === k} className={`cpr-tab ${age === k ? 'on' : ''}`} onClick={() => setAge(k)}>
            <strong>{v.label}</strong>
            <small>{v.who}</small>
          </button>
        ))}
      </div>
      <button className="btn btn-danger" onClick={() => setCoach(true)}><Icon name="heart" size={18} /> Start compression coach</button>
      </div>

      <div className="cpr-layout">
        <ol className="cpr-steps" role="tabpanel" aria-label={`${g.label} CPR steps`}>
          {g.steps.map((s, n) => (
            <li key={s.title} className="card cpr-step">
              <div className="cpr-step-media">
                {s.img ? (
                  <img src={s.img} alt={s.alt} loading="lazy" />
                ) : (
                  <span className="cpr-step-ico"><Icon name={s.icon} size={34} stroke={1.6} /></span>
                )}
              </div>
              <div className="cpr-step-body">
                <span className="cpr-n">{n + 1}</span>
                <strong>{s.title}</strong>
                <p>{s.text}</p>
              </div>
            </li>
          ))}
        </ol>

        <aside className="cpr-aside">
          <div className="card cpr-key">
            <h3>{g.label} at a glance</h3>
            <dl>
              <div><dt>Ratio</dt><dd>30 compressions : 2 breaths</dd></div>
              <div><dt>Speed</dt><dd>100–120 a minute</dd></div>
              <div><dt>Depth</dt><dd>{g.depth}</dd></div>
              <div><dt>Hands</dt><dd>{g.hands}</dd></div>
            </dl>
            <button className="btn btn-danger btn-block" style={{ marginTop: 16 }} onClick={() => setCoach(true)}><Icon name="heart" size={18} /> Start compression coach</button>
            <a className="btn btn-ghost btn-block" style={{ marginTop: 8 }} href="tel:112"><Icon name="phone" size={18} /> Call 112</a>
          </div>
          <p className="note"><Icon name="info" size={16} /> Not trained in rescue breaths? Hands-only CPR (compressions without stopping) still helps an adult. Illustrations are previews and this guide must be checked by a clinician before launch.</p>
        </aside>
      </div>

      {coach && <CompressionCoach guide={g} onClose={() => setCoach(false)} />}
    </div>
  )
}
