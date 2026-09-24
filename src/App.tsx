import { useEffect, useState } from 'react'
import { ArrowUpRight, Mic, Moon, Sun, Square, RotateCcw } from 'lucide-react'
import DeviceScene from './DeviceScene'
import { useTranscription } from './useTranscription'

export default function App() {
  const [dark, setDark] = useState(() => matchMedia('(prefers-color-scheme: dark)').matches)
  const voice = useTranscription()
  const listening = voice.state === 'listening' || voice.state === 'starting'
  const busy = listening || voice.state === 'processing'
  const done = voice.state === 'transcribed' && Boolean(voice.text)
  useEffect(() => { document.documentElement.style.colorScheme = dark ? 'dark' : 'light' }, [dark])
  const act = () => {
    if (listening) voice.stop()
    else { voice.clear(); void voice.start(navigator.language || 'en-US') }
  }
  return <main className={`experience ${dark ? 'theme-dark' : 'theme-light'} is-${voice.state}`}>
    <div className="identity" aria-label="QBIKK">
      {/* Exact wordmark from the supplied brand board, cropped by the SVG viewport. */}
      <svg viewBox="935 385 585 145" role="img" aria-label="QBIKK"><image href="/images/qbikk-brand-board.png" width="2481" height="1754"/></svg>
    </div>
    <button className="theme-toggle" onClick={() => setDark(value => !value)} aria-label={`Switch to ${dark ? 'light' : 'dark'} mode`} title={`Switch to ${dark ? 'light' : 'dark'} mode`}>{dark ? <Sun size={18} strokeWidth={1.4}/> : <Moon size={18} strokeWidth={1.4}/>}</button>
    <div className="hero-composition">
      <div className="hero-copy"><h1>Your pocket-sized<br/><em>perfect memory.</em></h1>
        <section className={`voice-demo ${done ? 'has-result' : ''}`} aria-label="Pocket AI voice demo">
          <div className="glass-bar">
            <span className={`voice-indicator ${listening ? 'active' : ''}`} aria-hidden="true">{[0,1,2,3,4].map(i => <i key={i} style={{animationDelay:`${i * -.14}s`}}/>)}</span>
            <div className="bar-content" aria-live="off">{voice.interim || (listening ? 'I’m listening. Take your time.' : voice.state === 'processing' ? 'Gathering your words…' : done ? 'A thought, remembered.' : 'What’s on your mind?')}</div>
            <button className="mic-button" onClick={act} disabled={!voice.supported || voice.state === 'processing'} aria-label={listening ? 'Stop and transcribe' : done ? 'Start a new voice demo' : 'Start voice demo'} aria-pressed={listening}>{listening ? <Square size={13} fill="currentColor"/> : done ? <RotateCcw size={17}/> : <Mic size={18} strokeWidth={1.6}/>}</button>
          </div>
          <div className="demo-caption"><span>{listening ? 'Tap stop to finish' : 'TRY A THOUGHT'}</span><span>VOICE DEMO <ArrowUpRight size={10}/></span></div>
          {done && <div className="demo-result" role="status"><span className="result-label">NOTED FOR THIS SESSION</span><p>“{voice.text}”</p><span className="response-note">A simple demo acknowledgment. Nothing is scheduled or saved.</span></div>}
          {voice.error && <p className="demo-notice" role="alert">{voice.error}</p>}
          {!voice.supported && <p className="demo-notice">Voice input needs a browser with speech recognition, such as Chrome, on HTTPS or localhost.</p>}
          {!busy && !done && <p className="provider-note">Microphone audio is processed by your browser’s speech provider.</p>}
          <span className="sr-only" role="status">{voice.state === 'listening' ? 'Microphone is listening. Press stop when finished.' : voice.state === 'processing' ? 'Transcribing your speech.' : ''}</span>
        </section>
      </div>
      <div className="cube-stage"><DeviceScene state={voice.state} level={voice.level}/></div>
    </div>
  </main>
}
