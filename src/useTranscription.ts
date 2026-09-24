import { useCallback, useEffect, useRef, useState } from 'react'

export type VoiceState = 'idle' | 'starting' | 'listening' | 'processing' | 'transcribed' | 'error'
type Result = { isFinal: boolean; 0: { transcript: string } }
type Recognition = {
  lang: string; continuous: boolean; interimResults: boolean;
  onstart: (() => void) | null;
  onresult: ((event: { results: ArrayLike<Result> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void; stop(): void; abort(): void;
}
type SpeechWindow = Window & { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition }
const speechWindow = window as SpeechWindow
const RecognitionAPI = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition

export function useTranscription() {
  const [state, setState] = useState<VoiceState>('idle')
  const [text, setText] = useState('')
  const [interim, setInterim] = useState('')
  const [error, setError] = useState('')
  const level = useRef(0)
  const session = useRef(0)
  const saved = useRef('')
  const stopping = useRef(false)
  const recognition = useRef<Recognition | null>(null)
  const cleanupAudio = useRef<() => void>(() => {})
  const finishTimer = useRef<ReturnType<typeof setTimeout>>()
  const supported = Boolean(RecognitionAPI && typeof navigator.mediaDevices?.getUserMedia === 'function' && window.isSecureContext)

  const release = useCallback(() => {
    cleanupAudio.current(); cleanupAudio.current = () => {}; level.current = 0
    clearTimeout(finishTimer.current)
  }, [])

  const stop = useCallback(() => {
    stopping.current = true
    release()
    if (recognition.current) {
      setState('processing')
      recognition.current.stop()
      finishTimer.current = setTimeout(() => {
        // End a stuck browser service while retaining confirmed text.
        session.current += 1
        recognition.current?.abort(); recognition.current = null
        setInterim(''); setState(saved.current ? 'transcribed' : 'idle')
        if (!saved.current) setError('No speech came through. Try again when you’re ready.')
      }, 4500)
    } else {
      session.current += 1 // Cancel a pending permission request safely.
      setState(saved.current ? 'transcribed' : 'idle')
    }
  }, [release])

  const start = useCallback(async (language: string) => {
    if (!RecognitionAPI || !supported || recognition.current) return
    const token = ++session.current
    stopping.current = false
    setError(''); setInterim(''); setState('starting')
    let stream: MediaStream | undefined
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true }, video: false })
      if (session.current !== token) { stream.getTracks().forEach(track => track.stop()); return }
      // This local analyser drives the cube with the actual microphone amplitude.
      // Speech recognition is separate and uses the browser's speech provider.
      let audioContext: AudioContext | undefined
      let frame = 0
      const disposeAudio = () => {
        cancelAnimationFrame(frame)
        stream?.getTracks().forEach(track => track.stop())
        if (audioContext && audioContext.state !== 'closed') void audioContext.close().catch(() => {})
      }
      cleanupAudio.current = disposeAudio
      try {
        audioContext = new AudioContext()
        await audioContext.resume()
        if (session.current !== token) { disposeAudio(); return }
        const analyser = audioContext.createAnalyser()
        analyser.fftSize = 256
        audioContext.createMediaStreamSource(stream).connect(analyser)
        const samples = new Uint8Array(analyser.fftSize)
        const sample = () => {
          analyser.getByteTimeDomainData(samples)
          let sum = 0
          for (const value of samples) sum += ((value - 128) / 128) ** 2
          level.current += (Math.min(1, Math.sqrt(sum / samples.length) * 6) - level.current) * 0.35
          frame = requestAnimationFrame(sample)
        }
        sample()
      } catch { /* Speech remains usable if the visual meter is unavailable. */ }
      if (session.current !== token) { disposeAudio(); return }
      const engine = new RecognitionAPI()
      recognition.current = engine
      engine.lang = language; engine.continuous = true; engine.interimResults = true
      const prefix = saved.current
      let received = false
      let failed = false
      engine.onstart = () => { if (session.current === token && !stopping.current) setState('listening') }
      engine.onresult = event => {
        if (session.current !== token) return
        let final = ''; let partial = ''
        for (let index = 0; index < event.results.length; index++) {
          const result = event.results[index]
          if (result.isFinal) final += result[0].transcript + ' '
          else partial += result[0].transcript
        }
        received = received || !!(final.trim() || partial.trim())
        saved.current = [prefix, final.trim()].filter(Boolean).join(' ')
        setText(saved.current); setInterim(partial)
      }
      engine.onerror = event => {
        if (session.current !== token) return
        failed = true
        const messages: Record<string, string> = {
          'not-allowed': 'Microphone access is off. Allow it in your browser’s site settings, then try again.',
          'service-not-allowed': 'Your browser’s speech service is unavailable. Try Chrome with speech recognition enabled.',
          'no-speech': 'No speech came through. Try again when you’re ready.',
          'audio-capture': 'We couldn’t find a microphone. Check your input device and try again.',
          'network': 'The speech service couldn’t connect. Check your connection and try again.',
          'language-not-supported': 'This language isn’t available in your browser’s speech service.',
          'aborted': 'Listening stopped. Your confirmed words are still here.',
        }
        setError(messages[event.error] || 'Transcription was interrupted. Your confirmed words are still here.')
        setInterim(''); setState('error'); release()
        recognition.current = null
        session.current += 1
        engine.abort()
      }
      engine.onend = () => {
        if (session.current !== token) return
        recognition.current = null; release(); setInterim('')
        if (!failed) {
          setState(saved.current ? 'transcribed' : 'idle')
          if (!received) setError('No speech came through. Try again when you’re ready.')
        }
      }
      engine.start()
    } catch (cause) {
      if (session.current !== token) return
      release(); stream?.getTracks().forEach(track => track.stop()); recognition.current = null
      setState('error')
      const name = cause instanceof DOMException ? cause.name : ''
      setError(name === 'NotAllowedError' ? 'Microphone access is off. Allow it in your browser’s site settings, then try again.' : 'We couldn’t start your microphone. Check your browser and input device, then try again.')
    }
  }, [release, supported])

  useEffect(() => () => { session.current += 1; recognition.current?.abort(); release() }, [release])
  useEffect(() => {
    const leave = () => { if (document.hidden) stop() }
    document.addEventListener('visibilitychange', leave)
    return () => document.removeEventListener('visibilitychange', leave)
  }, [stop])

  const clear = () => { saved.current = ''; setText(''); setInterim(''); setError(''); setState('idle') }
  return { state, text, interim, error, level, supported, start, stop, clear }
}
