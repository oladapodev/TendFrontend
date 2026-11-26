# Agent voice integration

The Agent screen uses `livekit-client`'s vanilla Room SDK. No backend files or frontend environment secrets are needed. All `/voice/*` requests use the existing API base URL and bearer-token adapter.

## Backend integration requirements

Implement the assigned `/voice/config`, `/voice/sessions`, `/voice/targets`, and `/voice/calls` contract. Disabled configuration leaves text chat usable. Session tokens must permit microphone publishing and audio/transcription subscription. The backend must dispatch an AI participant with LiveKit participant kind `AGENT`. Optional `lk.agent.state` attributes are displayed (for example initializing, listening, thinking, speaking). Publish LiveKit transcription segments for both user and AI to enable live transcript updates.

The client waits at most 30 seconds for setup/connection and for an AI participant, stops local audio on exit, and deletes the session. Late session creation also triggers deletion. Enforce session/call time limits server-side too, since browser teardown requests can fail or the page can close. The backend must authorize target access, validate purpose length, enforce expiration and pending-only confirmation atomically, and never dial a merely prepared call. Disclose AI identity to telephone recipients server-side as well. Confirmation requests must be idempotent to avoid duplicate billing.

Calls/targets/config refresh every five seconds while the Agent screen is mounted, including during text chat and browser voice. A prepared call is never automatically confirmed. Before confirmation the client fetches the call again and checks the reviewed phone, purpose, and target. Call cancellation is explicit and separate from ending browser voice.

## Checks

- `node --test src/api/voice.test.js`: request methods, bodies, ID escaping, purpose boundaries, and error/empty responses.
- `npm run build`
- `npm run lint` (existing unrelated warnings may remain).

No browser automation was run. With a configured backend, manually verify HTTPS microphone approval/denial, mute/unmute, audio autoplay recovery, AI join timeout, reconnect/disconnect, partial/final transcripts, session duration expiry, navigating away during each pending await, and stopping/restarting voice quickly. Verify model-prepared pending calls appear, review does not dial, explicit confirmation queues exactly one call, changed/expired calls cannot confirm, and cancel/hang-up updates on refresh.
