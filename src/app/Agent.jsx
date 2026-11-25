import { useEffect, useRef, useState } from 'react'
import Icon from '../components/Icon.jsx'
import { useStore } from './store.jsx'

const prompts = [
  'What should I do if someone faints?',
  'Explain my genotype in simple words',
  'What can I eat to lower my blood pressure?',
  'Help me prepare questions for my doctor',
]

function reply(text, state) {
  const t = text.toLowerCase()
  if (t.includes('faint'))
    return "If someone faints: lay them flat and raise their legs about 30 cm. Loosen tight clothing and check that they are breathing. If they don't wake within a minute, or they aren't breathing normally, press SOS or call 112 and start CPR. The CPR guide is in your tools."
  if (t.includes('genotype'))
    return `Your genotype is ${state.medical.genotype || 'not recorded yet'}. Genotype describes the type of haemoglobin in your blood. AA is the usual type. AS means you carry the sickle-cell trait but usually have no symptoms. SS means sickle-cell disease. It matters most for family planning, so a doctor or genetic counsellor can explain what it means for you.`
  if (t.includes('blood pressure') || t.includes('eat'))
    return 'Foods that can help: more vegetables (ugwu, spinach, garden egg), fruit such as bananas and oranges, beans and fish, and less salt, seasoning cubes and fried food. Check your readings regularly and follow the plan your doctor gave you. You can log your meals in Diet for personalised suggestions.'
  if (t.includes('doctor') || t.includes('question'))
    return 'Good questions to bring:\n1. What is my diagnosis, in simple words?\n2. What are my treatment options and their side effects?\n3. What should I watch out for at home?\n4. When should I come back, or go to emergency?\nI can save these to your notes.'
  return "I can explain health information, help you prepare for a visit, and point you to the right tool in TendAI. For anything urgent, press the red SOS button. What would you like to know?"
}

export default function Agent() {
  const { state } = useStore()
  const first = state.profile.name.split(' ')[0] || 'there'
  const [msgs, setMsgs] = useState([{ from: 'ai', text: `Hi ${first}, I'm TendTalk. Ask me a health question, or ask for help preparing for a hospital visit.` }])
  const [text, setText] = useState('')
  const [typing, setTyping] = useState(false)
  const end = useRef(null)
  useEffect(() => end.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), [msgs, typing])

  const send = (t) => {
    const v = (t ?? text).trim()
    if (!v) return
    setMsgs((m) => [...m, { from: 'me', text: v }])
    setText('')
    setTyping(true)
    setTimeout(() => {
      setMsgs((m) => [...m, { from: 'ai', text: reply(v, state) }])
      setTyping(false)
    }, 900)
  }

  return (
    <div className="agent">
      <div className="agent-head">
        <span className="agent-av"><Icon name="sparkle" size={22} /></span>
        <div>
          <strong>TendTalk</strong>
          <small><span className="dot-online" /> Your TendAI health companion</small>
        </div>
        <span className="demo-tag" style={{ marginLeft: 'auto' }}>Demo replies</span>
      </div>

      <div className="agent-body">
        {msgs.map((m, n) => (
          <div key={n} className={`msg msg-${m.from}`}>
            {m.from === 'ai' && <span className="msg-av"><Icon name="sparkle" size={14} /></span>}
            <p>{m.text}</p>
          </div>
        ))}
        {typing && (
          <div className="msg msg-ai">
            <span className="msg-av"><Icon name="sparkle" size={14} /></span>
            <p className="typing"><i /><i /><i /></p>
          </div>
        )}
        {msgs.length === 1 && (
          <div className="agent-prompts">
            {prompts.map((p) => <button key={p} onClick={() => send(p)}>{p}</button>)}
          </div>
        )}
        <div ref={end} />
      </div>

      <form className="agent-input" onSubmit={(e) => { e.preventDefault(); send() }}>
        <button type="button" className="icon-btn" aria-label="Voice input"><Icon name="mic" size={20} /></button>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Ask TendTalk anything about your health…" />
        <button className="send-btn" aria-label="Send" disabled={!text.trim()}><Icon name="send" size={18} /></button>
      </form>
      <p className="agent-foot">AI can explain and organise. Qualified professionals make clinical decisions.</p>
    </div>
  )
}
