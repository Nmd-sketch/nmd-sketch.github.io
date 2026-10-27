import { useEffect, useMemo, useRef, useState } from 'react'
import { BOOT_SEGMENTS, sampleTimeline, timelineDuration } from '../boot/timeline'

type Props = {
  hidden: boolean
  onComplete: () => void
}

const PROMPT = '~/portfolio $'

export default function BootTerminal({ hidden, onComplete }: Props) {
  const total = useMemo(() => timelineDuration(BOOT_SEGMENTS), [])
  const [reducedMotion] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  const [elapsed, setElapsed] = useState(0)
  const completedRef = useRef(false)

  const frame = useMemo(
    () => sampleTimeline(BOOT_SEGMENTS, reducedMotion ? total : elapsed),
    [elapsed, reducedMotion, total],
  )

  useEffect(() => {
    if (reducedMotion) return
    const start = performance.now()
    let raf = requestAnimationFrame(function tick() {
      const next = performance.now() - start
      setElapsed(next < total ? next : total)
      if (next < total) raf = requestAnimationFrame(tick)
    })
    return () => cancelAnimationFrame(raf)
  }, [reducedMotion, total])

  useEffect(() => {
    if (!frame.done || completedRef.current) return
    completedRef.current = true
    onComplete()
  }, [frame.done, onComplete])

  useEffect(() => {
    if (frame.done) return
    const skip = () => setElapsed(total)
    window.addEventListener('keydown', skip)
    window.addEventListener('pointerdown', skip)
    return () => {
      window.removeEventListener('keydown', skip)
      window.removeEventListener('pointerdown', skip)
    }
  }, [frame.done, total])

  return (
    <div
      aria-hidden={hidden}
      className={`fixed inset-0 z-10 flex flex-col justify-between p-[clamp(1.25rem,4vw,3rem)] transition-opacity duration-500 ${
        hidden ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
    >
      <pre className="m-0 font-mono text-[0.82rem] leading-[1.8] whitespace-pre-wrap break-words sm:text-[0.92rem]">
        {frame.lines.map((line, index) => (
          <div key={index}>
            {line.kind === 'command' ? (
              <>
                <span className="text-white/40">{PROMPT} </span>
                <span className="text-white">{line.text}</span>
              </>
            ) : (
              <span className="text-white/40">{line.text}</span>
            )}
          </div>
        ))}
        <div>
          <span className="text-white/40">{PROMPT} </span>
          <span className="text-white">{frame.typing}</span>
          <span className="cursor" />
        </div>
      </pre>

      <p className="m-0 text-[0.7rem] tracking-[0.06em] text-white/25">
        press any key to skip
      </p>
    </div>
  )
}
