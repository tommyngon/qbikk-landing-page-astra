import { Component, lazy, Suspense, useEffect, useRef, useState } from 'react'
import type { MutableRefObject, ReactNode } from 'react'
import type { VoiceState } from './useTranscription'
const ThreeScene = lazy(() => import('./ThreeScene'))
class CubeBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch() { this.props.onError() }
  render() { return this.state.failed ? null : this.props.children }
}
export default function DeviceScene({ state, level }: { state: VoiceState; level: MutableRefObject<number> }) {
  const [enabled, setEnabled] = useState(false)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  const [visible, setVisible] = useState(!document.hidden)
  const fallback = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const preference = matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setEnabled(!preference.matches && innerWidth >= 680)
    update(); preference.addEventListener('change', update); window.addEventListener('resize', update)
    const visibility = () => setVisible(!document.hidden)
    document.addEventListener('visibilitychange', visibility)
    return () => { preference.removeEventListener('change', update); window.removeEventListener('resize', update); document.removeEventListener('visibilitychange', visibility) }
  }, [])
  useEffect(() => {
    if (!enabled || ready || failed) return
    const timer = setTimeout(() => setFailed(true), 10000)
    return () => clearTimeout(timer)
  }, [enabled, ready, failed])
  useEffect(() => {
    let frame = 0
    const update = () => {
      fallback.current?.style.setProperty('--voice-level', String(level.current))
      frame = requestAnimationFrame(update)
    }
    if (visible && state === 'listening') update()
    else fallback.current?.style.setProperty('--voice-level', '0')
    return () => cancelAnimationFrame(frame)
  }, [state, level, visible])
  const showCanvas = enabled && !failed
  return <div className={`cube-visual ${state === 'listening' ? 'cube-listening' : ''} ${state === 'processing' ? 'cube-processing' : ''}`} aria-hidden="true">
    <div ref={fallback} className={`cube-reference ${showCanvas && ready ? 'cube-reference-hidden' : ''}`}><div className="fallback-crystal"/></div>
    {showCanvas && <CubeBoundary onError={() => setFailed(true)}><Suspense fallback={null}><ThreeScene state={state} level={level} active={visible} onReady={() => setReady(true)} onFailure={() => setFailed(true)}/></Suspense></CubeBoundary>}
  </div>
}
