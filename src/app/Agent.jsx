import { useEffect, useRef, useState } from 'react'
import VoicePanel from './VoicePanel.jsx'
import Icon from '../components/Icon.jsx'
import { useLocation } from './location.jsx'
import { api } from '../api/index.js'

const prompts = [
  'What should I do if someone faints?',
  'Explain my genotype in simple words',
  'What can I eat to lower my blood pressure?',
  'Help me prepare questions for my doctor',
]

export default function Agent({ me }) {
  const loc = useLocation()
  const first = me.profile.name.split(' ')[0] || 'there'
  const [msgs, setMsgs] = useState([{ role: 'assistant', content: `Hi ${first}, I'm TendTalk. Ask me a health question, or ask for help preparing for a hospital visit.` }])
  const [text, setText] = useState('')
  const [voiceActive, setVoiceActive] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const end = useRef(null)
  const stop = useRef(null)

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [msgs, busy])
  useEffect(() => () => stop.current?.(), [])

  const send = (t) => {
    const v = (t ?? text).trim()
    if (!v || busy || voiceActive) return
    const history = [...msgs, { role: 'user', content: v }]
    setMsgs([...history, { role: 'assistant', content: '', pending: true }])
    setText('')
    setBusy(true)
    setError(null)
    const finish = () => {
      setBusy(false)
      setMsgs((m) => m.map((x, i) => (i === m.length - 1 ? { ...x, pending: false } : x)))
    }
    const fix = loc.pos
    stop.current = api.agent.chat(
      history.map(({ role, content }) => ({ role, content })),
      {
        lat: fix?.lat,
        lng: fix?.lng,
        onEvent: (e) => {
          const piece = typeof e === 'string' ? e : e.text || ''
          if (!piece) return
          setMsgs((m) => m.map((x, i) => (i === m.length - 1 ? { ...x, content: x.content + piece } : x)))
        },
        onDone: finish,
        onError: (err) => {
          setError(err)
          setMsgs((m) => (m[m.length - 1]?.content ? m : m.slice(0, -1)))
          setBusy(false)
        },
      },
    )
  }

  const cancel = () => {
    stop.current?.()
    setBusy(false)
    setMsgs((m) => m.map((x, i) => (i === m.length - 1 ? { ...x, pending: false } : x)))
  }

  return (
    <div className="agent">
      <div className="agent-head">
        <span className="agent-av"><Icon name="sparkle" size={22} /></span>
        <div>
          <strong>TendTalk</strong>
          <small><span className="dot-online" /> Your TendAI health companion</small>
        </div>
      </div>

      <VoicePanel position={loc.pos} textBusy={busy} onActiveChange={setVoiceActive} />
      <div className="agent-body" aria-live="polite">
        {msgs.map((m, n) => (
          <div key={n} className={`msg msg-${m.role === 'user' ? 'me' : 'ai'}`}>
            {m.role !== 'user' && <span className="msg-av"><Icon name="sparkle" size={14} /></span>}
            {m.pending && !m.content ? <p className="typing"><i /><i /><i /></p> : <p>{m.content}</p>}
          </div>
        ))}
        {error && <p className="form-error"><Icon name="alert" size={16} /> {error.message} <button className="link-btn" onClick={() => send(msgs.filter((m) => m.role === 'user').at(-1)?.content)}>Retry</button></p>}
        {msgs.length === 1 && (
          <div className="agent-prompts">
            {prompts.map((p) => <button key={p} onClick={() => send(p)}>{p}</button>)}
          </div>
        )}
        <div ref={end} />
      </div>

      <form className="agent-input" onSubmit={(e) => { e.preventDefault(); send() }}>
        <input disabled={voiceActive} aria-label="Message TendTalk" value={text} onChange={(e) => setText(e.target.value)} placeholder="Ask TendTalk anything about your health…" />
        {busy ? (
          <button type="button" className="send-btn" onClick={cancel} aria-label="Stop reply"><Icon name="x" size={18} /></button>
        ) : (
          <button className="send-btn" aria-label="Send" disabled={voiceActive || !text.trim()}><Icon name="send" size={18} /></button>
        )}
      </form>
      <p className="agent-foot">AI can explain and organise. Qualified professionals make clinical decisions. In an emergency, press SOS or call 112.</p>
    </div>
  )
}
