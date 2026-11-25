import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import { createHttpApi } from './http.js'

const originalStorage = globalThis.localStorage
const originalFetch = globalThis.fetch
afterEach(() => { globalThis.fetch = originalFetch; globalThis.localStorage = originalStorage })

test('voice adapter uses the authenticated JSON contract and encodes IDs', async () => {
  globalThis.localStorage = { getItem: () => 'test-token' }
  const requests = []
  globalThis.fetch = async (url, options) => {
    requests.push({ url, ...options, body: options.body && JSON.parse(options.body) })
    return new Response(JSON.stringify({ status: 'ended' }), { status: 200 })
  }
  const { voice } = createHttpApi('/api/')
  await voice.config()
  await voice.createSession({ lat: 1, lng: 2 })
  await voice.endSession('session /?')
  await voice.targets()
  await voice.calls()
  await voice.createCall({ targetType: 'contact', targetId: 'a/b', purpose: '  Check appointment  ' })
  await voice.confirmCall('call /?')
  await voice.cancelCall('call /?')
  assert.deepEqual(requests.map(({ url, method, body }) => ({ url, method, body })), [
    { url: '/api/voice/config', method: 'GET', body: undefined },
    { url: '/api/voice/sessions', method: 'POST', body: { lat: 1, lng: 2 } },
    { url: '/api/voice/sessions/session%20%2F%3F', method: 'DELETE', body: undefined },
    { url: '/api/voice/targets', method: 'GET', body: undefined },
    { url: '/api/voice/calls', method: 'GET', body: undefined },
    { url: '/api/voice/calls', method: 'POST', body: { targetType: 'contact', targetId: 'a/b', purpose: 'Check appointment' } },
    { url: '/api/voice/calls/call%20%2F%3F/confirm', method: 'POST', body: { confirmed: true } },
    { url: '/api/voice/calls/call%20%2F%3F', method: 'DELETE', body: undefined },
  ])
  assert.equal(requests[1].headers.Authorization, 'Bearer test-token')
  assert.equal(requests[1].headers['Content-Type'], 'application/json')
})

test('purpose limits reject locally and permit inclusive boundaries', async () => {
  let count = 0
  globalThis.fetch = async () => { count++; return new Response('{}') }
  const { voice } = createHttpApi('/api')
  for (const purpose of ['', '    ', 'four', 'x'.repeat(501)]) {
    await assert.rejects(voice.createCall({ targetType: 'self', targetId: 'me', purpose }), /5–500/)
  }
  assert.equal(count, 0)
  for (const length of [5, 500]) await voice.createCall({ targetType: 'self', targetId: 'me', purpose: 'x'.repeat(length) })
  assert.equal(count, 2)
})

test('voice endpoint failures remain actionable and empty deletion succeeds', async () => {
  const { voice } = createHttpApi('/api')
  globalThis.fetch = async () => new Response(JSON.stringify({ detail: 'Calling disabled' }), { status: 403 })
  await assert.rejects(voice.confirmCall('id'), { message: 'Calling disabled', status: 403 })
  globalThis.fetch = async () => new Response(null, { status: 204 })
  assert.equal(await voice.endSession('id'), null)
})
