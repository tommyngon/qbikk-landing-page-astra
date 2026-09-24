// Browser-adapter regression checks; no microphone or network is used.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')
const compiled = ts.transpileModule(fs.readFileSync('src/useTranscription.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText
function fixture({ denied = false, pending = false, supported = true } = {}) {
  const states = [], cleanup = [], engines = [], tracks = []
  let resolveMedia
  class Engine {
    constructor() { engines.push(this) }
    start() { this.onstart?.() }
    stop() { this.stopped = true }
    abort() { this.aborted = true }
  }
  const stream = () => { const track = { stopped: false, stop() { this.stopped = true } }; tracks.push(track); return { getTracks: () => [track] } }
  const context = {
    exports: {}, require: () => ({
      useRef: value => ({ current: value }), useCallback: fn => fn,
      useState: value => { const index = states.length; states.push(value); return [value, next => { states[index] = typeof next === 'function' ? next(states[index]) : next }] },
      useEffect: fn => { const dispose = fn(); if (dispose) cleanup.push(dispose) },
    }),
    window: { SpeechRecognition: supported ? Engine : undefined, isSecureContext: true },
    navigator: { mediaDevices: { getUserMedia: () => denied ? Promise.reject(new DOMException('Denied', 'NotAllowedError')) : pending ? new Promise(resolve => { resolveMedia = () => resolve(stream()) }) : Promise.resolve(stream()) } },
    document: { hidden: false, addEventListener() {}, removeEventListener() {} },
    AudioContext: class { state = 'running'; async resume() {} async close() { this.state = 'closed' } createMediaStreamSource() { return { connect() {} } } createAnalyser() { return { fftSize: 256, getByteTimeDomainData(a) { a.fill(128) } } } },
    requestAnimationFrame: () => 1, cancelAnimationFrame() {}, setTimeout: () => 1, clearTimeout() {}, DOMException,
  }
  vm.runInNewContext(compiled, context)
  const hook = context.exports.useTranscription()
  return { hook, states, engines, tracks, cleanup, resolveMedia: () => resolveMedia() }
}
;(async () => {
  const f = fixture(); await f.hook.start('en-US')
  assert.equal(f.states[0], 'listening')
  f.engines[0].onresult({ results: [{ isFinal: true, 0: { transcript: 'A real result' } }, { isFinal: false, 0: { transcript: 'in progress' } }] })
  assert.equal(f.states[1], 'A real result'); assert.equal(f.states[2], 'in progress')
  f.hook.stop(); assert.equal(f.states[0], 'processing'); assert(f.tracks.every(t => t.stopped))
  f.engines[0].onend(); assert.equal(f.states[0], 'transcribed')
  await f.hook.start('nb-NO'); assert.equal(f.engines[1].lang, 'nb-NO')
  f.engines[1].onresult({ results: [{ isFinal: true, 0: { transcript: 'Another thought' } }] })
  assert.equal(f.states[1], 'A real result Another thought')
  f.cleanup.forEach(fn => fn()); assert(f.tracks.every(t => t.stopped)); assert(f.engines[1].aborted)
  const d = fixture({ denied: true }); await d.hook.start('en-US'); assert.equal(d.states[0], 'error'); assert.match(d.states[3], /access is off/)
  const p = fixture({ pending: true }); const start = p.hook.start('en-US'); p.hook.stop(); p.resolveMedia(); await start
  assert.equal(p.engines.length, 0); assert(p.tracks.every(t => t.stopped))
  const n = fixture(); await n.hook.start('en-US'); n.engines[0].onerror({ error: 'no-speech' }); assert.equal(n.states[0], 'error'); assert(n.tracks.every(t => t.stopped)); assert.match(n.states[3], /No speech/)
  const u = fixture({ supported: false }); assert.equal(u.hook.supported, false)
  console.log('Passed: live/interim results, append, stop cleanup, unmount, denied permission, pending cancellation, no speech, unsupported browser.')
})().catch(error => { console.error(error); process.exitCode = 1 })
