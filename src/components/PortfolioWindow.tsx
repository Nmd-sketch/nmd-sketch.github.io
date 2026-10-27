import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { SECTIONS, type SectionId } from '../content/sections'
import { sectionLines } from '../content/render'
import { BOOT_SEGMENTS, timelineDuration } from '../boot/timeline'
import {
  FIXED_ROWS,
  MIN_COLS,
  MIN_ROWS,
  buildScreen,
  layout,
  type Tone,
} from '../tui/screen'

type Props = {
  open: boolean
}

// Boot doubles as the load gate, so its script length is the honest "ready" time.
const READY_SECONDS = (timelineDuration(BOOT_SEGMENTS) / 1000).toFixed(2)

const TONE: Record<Tone, string> = {
  frame: 'text-white/35',
  title: 'text-white/85',
  body: 'text-white/90',
  dim: 'text-white/55',
  faint: 'text-white/25',
  reverse: 'bg-white text-black',
}

export default function PortfolioWindow({ open }: Props) {
  const [active, setActive] = useState<SectionId>(SECTIONS[0].id)
  const [project, setProject] = useState(0)
  const hostRef = useRef<HTMLDivElement>(null)
  const screenRef = useRef<HTMLElement>(null)
  const probeRef = useRef<HTMLSpanElement>(null)
  const [cell, setCell] = useState({ ch: 0, line: 0, cols: 0, height: 0 })

  const activeIndex = SECTIONS.findIndex((section) => section.id === active)
  const current = SECTIONS[activeIndex]
  const { narrow, textWidth } = layout(Math.max(MIN_COLS, cell.cols))

  const projectCount = current.kind === 'projects' ? current.projects.length : 0
  const projectIndex = projectCount > 0 ? Math.min(project, projectCount - 1) : 0
  const submenu = useMemo(
    () => (current.kind === 'projects' ? current.projects.map((item) => item.name) : undefined),
    [current],
  )

  // Measure the character cell so the screen can be composed as a real grid.
  useLayoutEffect(() => {
    const host = hostRef.current
    const probe = probeRef.current
    if (!host || !probe) return

    let alive = true
    const measure = () => {
      if (!alive) return
      const box = probe.getBoundingClientRect()
      const ch = box.width / 10
      const computed = Number.parseFloat(getComputedStyle(probe).lineHeight)
      const line = Number.isFinite(computed) && computed > 0 ? computed : box.height
      if (ch <= 0 || line <= 0) return

      const next = {
        ch,
        line,
        cols: Math.max(MIN_COLS, Math.floor((host.clientWidth + 0.5) / ch)),
        height: screenRef.current?.clientHeight ?? 0,
      }
      setCell((prev) =>
        prev.ch === next.ch &&
        prev.line === next.line &&
        prev.cols === next.cols &&
        prev.height === next.height
          ? prev
          : next,
      )
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(host)
    if (screenRef.current) observer.observe(screenRef.current)
    void document.fonts.ready.then(measure)

    return () => {
      alive = false
      observer.disconnect()
    }
  }, [])

  const body = useMemo(
    () => sectionLines(current, textWidth, projectIndex, narrow),
    [current, textWidth, projectIndex, narrow],
  )

  const rows = narrow
    ? body.length + FIXED_ROWS
    : Math.max(MIN_ROWS, Math.floor((cell.height + 0.5) / cell.line) || MIN_ROWS)

  const screen = useMemo(
    () =>
      buildScreen({
        cols: cell.cols,
        rows,
        sections: SECTIONS,
        activeIndex,
        seconds: READY_SECONDS,
        body,
        submenu,
        submenuIndex: projectIndex,
      }),
    [cell.cols, rows, activeIndex, body, submenu, projectIndex],
  )

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      const sectionStep =
        event.key === 'ArrowDown' || event.key === 'j'
          ? 1
          : event.key === 'ArrowUp' || event.key === 'k'
            ? -1
            : 0

      if (sectionStep !== 0) {
        event.preventDefault()
        const next = (activeIndex + sectionStep + SECTIONS.length) % SECTIONS.length
        setActive(SECTIONS[next].id)
        return
      }

      const projectStep =
        event.key === 'ArrowRight' || event.key === 'l'
          ? 1
          : event.key === 'ArrowLeft' || event.key === 'h'
            ? -1
            : 0

      if (projectStep === 0 || projectCount < 2) return
      event.preventDefault()
      setProject((prev) => (prev + projectStep + projectCount) % projectCount)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, activeIndex, projectCount])

  return (
    <div ref={hostRef} className="w-full max-w-[78rem]">
      <section
        ref={screenRef}
        inert={!open}
        aria-label="portfolio.exe"
        style={cell.ch > 0 ? { width: `${(cell.cols * cell.ch).toFixed(2)}px` } : undefined}
        className={`relative mx-auto overflow-hidden bg-black font-mono text-[0.86rem] leading-[1.5] transition-[opacity,transform] duration-500 ease-out ${
          narrow ? '' : 'h-[min(86svh,50rem)]'
        } ${
          open
            ? 'translate-y-0 opacity-100'
            : 'pointer-events-none translate-y-1.5 opacity-0'
        }`}
      >
        <span
          ref={probeRef}
          aria-hidden="true"
          className="pointer-events-none invisible absolute top-0 left-0 inline-block whitespace-pre"
        >
          MMMMMMMMMM
        </span>

        <div className="whitespace-pre" role="group" aria-label="Terminal screen">
          {screen.map((row, rowIndex) => (
            <div key={rowIndex}>
              {row.cells.map((item, cellIndex) => {
                const action = item.action
                const classes = `tui-btn ${TONE[item.tone]} hover:bg-white hover:text-black focus-visible:bg-white focus-visible:text-black focus-visible:outline-none`

                if (action?.kind === 'url') {
                  return (
                    <a
                      key={cellIndex}
                      className={classes}
                      href={action.href}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {item.text}
                    </a>
                  )
                }

                if (action) {
                  return (
                    <button
                      key={cellIndex}
                      type="button"
                      className={classes}
                      aria-pressed={item.selected === true}
                      onClick={() => {
                        if (action.kind === 'section') setActive(action.id)
                        else setProject(action.index)
                      }}
                    >
                      {item.text}
                    </button>
                  )
                }

                return (
                  <span key={cellIndex} className={TONE[item.tone]}>
                    {item.text}
                  </span>
                )
              })}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
