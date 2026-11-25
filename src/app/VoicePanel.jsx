import { useCallback, useEffect, useRef, useState } from 'react'
import { ParticipantKind, Room, RoomEvent, Track } from 'livekit-client'
import { api } from '../api/index.js'
import './voice-panel.css'

const terminal = new Set(['ended', 'cancelled', 'failed'])

export default function VoicePanel({ position, textBusy, onActiveChange }) {
  const [config, setConfig] = useState(null)
  const [error, setError] = useState('')
  const [state, setState] = useState('idle')
  const [now, setNow] = useState(() => Date.now())
  const [agentState, setAgentState] = useState('waiting')
  const [ready, setReady] = useState(false)
  const [muted, setMuted] = useState(false)
  const [audioBlocked, setAudioBlocked] = useState(false)
  const [transcripts, setTranscripts] = useState([])
  const [targets, setTargets] = useState([])
  const [calls, setCalls] = useState([])
  const [target, setTarget] = useState('')
  const [purpose, setPurpose] = useState('')
  const [working, setWorking] = useState(false)
  const [review, setReview] = useState(null)
  const mounted = useRef(false)
  const current = useRef(null)
  const audio = useRef(null)
  const active = state !== 'idle'

  const end = useCallback((message = '') => {
    const session = current.current
    current.current = null
    if (session) {
      clearTimeout(session.agentTimer)
      clearTimeout(session.limitTimer)
      session.room.removeAllListeners()
      for (const publication of session.room.localParticipant.trackPublications.values()) publication.track?.stop()
      for (const participant of session.room.remoteParticipants.values()) {
        for (const publication of participant.trackPublications.values()) publication.track?.detach().forEach((element) => element.remove())
      }
      for (const element of session.elements) { element.pause(); element.srcObject = null; element.remove() }
      void session.room.disconnect().catch(() => {})
      if (session.id) void api.voice.endSession(session.id).catch((err) => {
        if (mounted.current) setError(`Audio stopped, but server session cleanup failed: ${err.message}`)
      })
    }
    if (mounted.current) {
      setState('idle'); setReady(false); setMuted(false); setAudioBlocked(false)
      if (message) setError(message)
      onActiveChange(false)
    }
  }, [onActiveChange])

  useEffect(() => {
    mounted.current = true
    let loading = false
    const refresh = async () => {
      if (loading) return
      loading = true
      try {
        const next = await api.voice.config()
        if (!mounted.current) return
        setConfig(next)
        if (next.callingEnabled) {
          const [nextTargets, nextCalls] = await Promise.all([api.voice.targets(), api.voice.calls()])
          if (mounted.current) { setTargets(nextTargets); setCalls(nextCalls) }
        }
      } catch (err) { if (mounted.current) setError(err.message) }
      finally { loading = false }
    }
    void refresh()
    const clock = setInterval(() => setNow(Date.now()), 1000)
    const timer = setInterval(refresh, 5000)
    return () => { mounted.current = false; clearInterval(clock); clearInterval(timer); end() }
  }, [end])

  const start = async () => {
    if (current.current || textBusy || !config?.enabled) return
    setError('')
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setError('Microphone requires HTTPS (or localhost) and a supported browser.'); return
    }
    const session = { room: new Room(), elements: new Set() }
    current.current = session
    const valid = () => mounted.current && current.current === session
    session.agentTimer = setTimeout(() => { if (valid()) end('Voice setup timed out. Please try again.') }, 30000)
    setState('requesting microphone'); onActiveChange(true); setTranscripts([])
    let permissionStream
    try {
      permissionStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      permissionStream.getTracks().forEach((track) => track.stop())
      if (!valid()) return
      setState('connecting')
      const credentials = await api.voice.createSession(position || {})
      session.id = credentials.sessionId
      if (!valid()) { await api.voice.endSession(session.id); return }
      const room = session.room
      const checkAgent = () => {
        if (!valid()) return
        const agents = [...room.remoteParticipants.values()].filter((p) => p.kind === ParticipantKind.AGENT)
        setReady(agents.length > 0)
        setAgentState(agents[0]?.attributes?.['lk.agent.state'] || (agents.length ? 'joined' : 'waiting'))
        if (agents.length) clearTimeout(session.agentTimer)
        else {
          clearTimeout(session.agentTimer)
          session.agentTimer = setTimeout(() => { if (valid()) end('No AI agent joined within 30 seconds. Please try again.') }, 30000)
        }
      }
      room.on(RoomEvent.TrackSubscribed, (track) => {
        if (!valid() || track.kind !== Track.Kind.Audio) return
        const element = track.attach()
        session.elements.add(element)
        audio.current?.appendChild(element)
        void element.play().catch(() => { if (valid()) setAudioBlocked(true) })
      })
      room.on(RoomEvent.TrackUnsubscribed, (track) => {
        for (const element of track.detach()) { session.elements.delete(element); element.remove() }
      })
      room.on(RoomEvent.ParticipantAttributesChanged, checkAgent)
      room.on(RoomEvent.ParticipantConnected, checkAgent)
      room.on(RoomEvent.ParticipantDisconnected, checkAgent)
      room.on(RoomEvent.Reconnecting, () => { if (valid()) setState('reconnecting') })
      room.on(RoomEvent.Reconnected, () => { if (valid()) { setState('connected'); checkAgent() } })
      room.on(RoomEvent.Disconnected, () => { if (valid()) end('Voice disconnected.') })
      room.on(RoomEvent.TranscriptionReceived, (segments, participant) => {
        if (!valid()) return
        setTranscripts((previous) => {
          const next = [...previous]
          for (const segment of segments) {
            const key = `${participant?.identity || 'unknown'}:${segment.id}`
            const item = { key, text: segment.text, final: segment.final, speaker: participant?.identity === room.localParticipant.identity ? 'You' : 'AI' }
            const index = next.findIndex((entry) => entry.key === key)
            if (index < 0) next.push(item)
            else next[index] = item
          }
          return next.slice(-100)
        })
      })
      session.limitTimer = setTimeout(() => { if (valid()) end('Voice session time limit reached.') }, (config.maxSessionSeconds > 0 ? config.maxSessionSeconds : 600) * 1000)
      clearTimeout(session.agentTimer)
      session.agentTimer = setTimeout(() => { if (valid()) end('Voice connection timed out. Please try again.') }, 30000)
      await room.connect(credentials.serverUrl, credentials.token)
      if (!valid()) { await room.disconnect(); return }
      await room.localParticipant.setMicrophoneEnabled(true)
      if (!valid()) { await room.disconnect(); return }
      setState('connected'); checkAgent()
    } catch (err) {
      permissionStream?.getTracks().forEach((track) => track.stop())
      if (valid()) end(err.name === 'NotAllowedError' ? 'Microphone permission denied. Allow microphone access and try again.' : err.message)
    }
  }

  const action = async (operation) => {
    if (working) return
    setWorking(true); setError('')
    try {
      await operation()
      const next = await api.voice.calls()
      if (mounted.current) { setCalls(next); setReview(null) }
    } catch (err) { if (mounted.current) setError(err.message) }
    finally { if (mounted.current) setWorking(false) }
  }

  return <section className="voice-panel" aria-label="AI voice and phone calls">
    <h2>Talk with TendTalk AI</h2>
    <p>You are speaking with an AI, not a clinician. This is not an emergency service. Phone calls may incur charges.</p>
    {!active && !config ? <p>Voice setup unavailable or loading. Text chat is still available.</p> : !active && !config?.enabled ? <p>Voice setup required. Text chat is still available.</p> : <>
      <p role="status">Voice: {state}{active && state === 'connected' ? ready ? ` · AI agent: ${agentState}` : ' · Waiting for AI agent' : ''}</p>
      {!active ? <button type="button" disabled={textBusy} onClick={start}>Start AI voice</button> : <>
        <button type="button" onClick={() => end()}>End voice</button>
        <button type="button" disabled={state !== 'connected'} onClick={async () => {
          const session = current.current
          if (!session) return
          try {
            await session.room.localParticipant.setMicrophoneEnabled(muted)
            if (current.current === session) setMuted(!muted)
          } catch (err) { if (mounted.current) setError(err.message) }
        }}>{muted ? 'Unmute microphone' : 'Mute microphone'}</button>
      </>}
      {audioBlocked && <button type="button" onClick={async () => {
        try { await current.current?.room.startAudio(); setAudioBlocked(false) } catch (err) { setError(err.message) }
      }}>Enable AI audio playback</button>}
      <div ref={audio} className="voice-panel-audio" />
      {transcripts.length > 0 && <div className="voice-panel-transcripts" role="log" aria-label="Live voice transcription" aria-live="polite">
        {transcripts.map((entry) => <p key={entry.key}><strong>{entry.speaker}:</strong> {entry.text}{!entry.final && ' …'}</p>)}
      </div>}
    </>}
    {config?.callingEnabled ? <>
      <h3>AI phone calls</h3>
      <p>Prepare a call, then review the phone number and purpose before explicitly confirming. Maximum call duration: {config.maxCallSeconds} seconds.</p>
      <form onSubmit={(event) => {
        event.preventDefault()
        const selected = targets[Number(target)]
        if (!selected || target === '') return
        void action(() => api.voice.createCall({ targetType: selected.type, targetId: selected.id, purpose }))
      }}>
        <label>Call recipient<select value={target} onChange={(event) => setTarget(event.target.value)} required>
          <option value="">Choose a recipient</option>
          {targets.map((entry, index) => <option key={`${entry.type}:${entry.id}`} value={index}>{entry.name} ({entry.phone})</option>)}
        </select></label>
        <label>Purpose<textarea value={purpose} minLength={5} maxLength={500} required onChange={(event) => setPurpose(event.target.value)} /></label>
        <button disabled={working || purpose.trim().length < 5 || target === ''}>Prepare call (does not dial)</button>
      </form>
      <ul>{calls.map((call) => <li key={call.id}>
        <strong>{call.targetName}</strong> · {call.phone}<p>{call.purpose}</p>
        <p>Status: {call.status}{call.error ? ` · ${call.error}` : ''}</p>
        {call.status === 'pending' && <button type="button" disabled={working || Date.parse(call.expiresAt) <= now} onClick={() => setReview(call)}>Review and confirm</button>}
        {!terminal.has(call.status) && <button type="button" disabled={working} onClick={() => void action(() => api.voice.cancelCall(call.id))}>Cancel / hang up</button>}
      </li>)}</ul>
      {review && calls.some((call) => call.id === review.id && call.status === 'pending') && <div className="voice-panel-review" role="group" aria-label="Confirm AI phone call">
        <h3>Confirm this AI call</h3><p>Call {review.targetName} at <strong>{review.phone}</strong>?</p><p>Purpose: {review.purpose}</p>
        <p>An AI will speak on your behalf. Charges may apply. Not for emergencies.</p>
        <button type="button" disabled={working || Date.parse(review.expiresAt) <= now} onClick={() => void action(async () => {
          const latest = (await api.voice.calls()).find((call) => call.id === review.id)
          if (!latest || latest.status !== 'pending' || Date.parse(latest.expiresAt) <= Date.now()) throw new Error('This call is no longer awaiting confirmation. Refresh and review it again.')
          if (latest.phone !== review.phone || latest.purpose !== review.purpose || latest.targetId !== review.targetId || latest.targetType !== review.targetType) throw new Error('Call details changed. Review the updated call before confirming.')
          return api.voice.confirmCall(review.id)
        })}>I confirm, place this call</button>
        <button type="button" disabled={working} onClick={() => setReview(null)}>Back</button>
      </div>}
    </> : config && <p>Phone calling setup required.</p>}
    {error && <p role="alert">{error}</p>}
  </section>
}
