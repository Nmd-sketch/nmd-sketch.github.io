import type { BodyLine } from '../content/render'
import type { SectionId } from '../content/sections'
import { clip, padEnd, rule, spread } from './text'

export type Tone = 'frame' | 'title' | 'body' | 'dim' | 'faint' | 'reverse'

export type CellAction =
  | { kind: 'section'; id: SectionId }
  | { kind: 'project'; index: number }
  | { kind: 'url'; href: string }

export type Cell = {
  text: string
  tone: Tone
  action?: CellAction
  selected?: boolean
}

export type Row = { cells: Cell[] }

export const MIN_COLS = 30
export const MIN_ROWS = 10
export const NARROW_COLS = 64
/** title bar + top border + separator + status + bottom border + key bar */
export const FIXED_ROWS = 6

export type SectionMeta = { id: SectionId; label: string; title: string }

export type Layout = {
  narrow: boolean
  navWidth: number
  contentWidth: number
  textWidth: number
}

export function layout(cols: number): Layout {
  const narrow = cols < NARROW_COLS
  const navWidth = narrow ? 0 : Math.min(18, Math.max(12, Math.round(cols * 0.16)))
  const contentWidth = narrow ? cols - 2 : cols - navWidth - 3

  return {
    narrow,
    navWidth,
    contentWidth,
    textWidth: Math.max(8, contentWidth - 2),
  }
}

/** Trim or pad a row so it occupies exactly `width` characters. */
function fit(cells: Cell[], width: number): Row {
  const out: Cell[] = []
  let used = 0

  for (const cell of cells) {
    if (used >= width) break
    const room = width - used
    if (cell.text.length <= room) {
      out.push(cell)
      used += cell.text.length
    } else {
      out.push({ ...cell, text: cell.text.slice(0, room) })
      used = width
    }
  }

  if (used < width) out.push({ text: ' '.repeat(width - used), tone: 'body' })
  return { cells: out }
}

/** `─ title ────── tail ` fitted to exactly `width` cells. */
function borderCells(title: string, width: number, tail = ''): Cell[] {
  const head = title === '' ? '─' : `─ ${title} `
  const tailText = tail === '' ? '' : ` ${tail} `
  const fixed = head.length + tailText.length

  if (fixed >= width) return [{ text: clip(head, width), tone: 'title' }]

  const cells: Cell[] = [{ text: head, tone: 'title' }]
  cells.push({ text: rule(width - fixed), tone: 'frame' })
  if (tailText !== '') cells.push({ text: tailText, tone: 'faint' })
  return cells
}

type NavRow = {
  label: string
  depth: number
  action: CellAction
  selected: boolean
}

/** Sidebar entries: sections, plus the project submenu of the active one. */
function navRows(
  sections: readonly SectionMeta[],
  activeIndex: number,
  submenu: readonly string[] | undefined,
  submenuIndex: number,
): NavRow[] {
  const rows: NavRow[] = []

  sections.forEach((meta, index) => {
    rows.push({
      label: meta.label,
      depth: 0,
      action: { kind: 'section', id: meta.id },
      selected: index === activeIndex,
    })

    if (index === activeIndex && submenu) {
      submenu.forEach((name, subIndex) => {
        rows.push({
          label: name,
          depth: 1,
          action: { kind: 'project', index: subIndex },
          selected: subIndex === submenuIndex,
        })
      })
    }
  })

  return rows
}

function navCell(row: NavRow, navWidth: number): Cell {
  const marker = row.depth === 0 ? ' ' : row.selected ? '▸ ' : '  '
  const text = `${'  '.repeat(row.depth)}${marker}${row.label}`

  return {
    text: padEnd(text, navWidth),
    tone: row.selected ? 'reverse' : 'dim',
    action: row.action,
    selected: row.selected,
  }
}

/** Narrow layout: the section tabs live in the top border, htop style. */
function tabBorder(
  sections: readonly SectionMeta[],
  activeIndex: number,
  width: number,
  counter: string,
): Cell[] {
  const cells: Cell[] = [{ text: '─', tone: 'frame' }]
  let used = 1

  sections.forEach((meta, index) => {
    const text = index === activeIndex ? `[${meta.label}]` : meta.label
    if (used + text.length + 1 + counter.length + 4 > width) return
    cells.push({ text: ' ', tone: 'frame' })
    cells.push({
      text,
      tone: index === activeIndex ? 'reverse' : 'dim',
      action: { kind: 'section', id: meta.id },
      selected: index === activeIndex,
    })
    used += text.length + 1
  })

  const tail = ` ${counter} `
  if (used + 1 + tail.length < width) {
    cells.push({ text: ' ', tone: 'frame' })
    used += 1
  }
  const fill = Math.max(0, width - used - tail.length)
  cells.push({ text: rule(fill), tone: 'frame' })
  if (tail.length > 0) cells.push({ text: tail, tone: 'faint' })

  return cells
}

type ScreenArgs = {
  cols: number
  rows: number
  sections: readonly SectionMeta[]
  activeIndex: number
  seconds: string
  body: BodyLine[]
  submenu?: readonly string[]
  submenuIndex?: number
}

export function buildScreen({
  cols,
  rows,
  sections,
  activeIndex,
  seconds,
  body,
  submenu,
  submenuIndex = 0,
}: ScreenArgs): Row[] {
  const { narrow, navWidth, contentWidth, textWidth } = layout(cols)
  const active = sections[activeIndex]
  const counter = `${activeIndex + 1}/${sections.length}`
  const bodyRows = Math.max(1, rows - FIXED_ROWS)
  const nav = navRows(sections, activeIndex, submenu, submenuIndex)
  const out: Row[] = []

  // tmux-style title bar: the window name, plus the tty dimensions
  out.push(
    fit(
      [{ text: spread(' portfolio.exe', `${cols}x${rows} `, cols), tone: 'reverse' }],
      cols,
    ),
  )

  // top border, pane titles included, like a real panel
  out.push(
    fit(
      narrow
        ? [
            { text: '┌', tone: 'frame' },
            ...tabBorder(sections, activeIndex, cols - 2, counter),
            { text: '┐', tone: 'frame' },
          ]
        : [
            { text: '┌', tone: 'frame' },
            ...borderCells('index', navWidth),
            { text: '┬', tone: 'frame' },
            ...borderCells(active.title, contentWidth, counter),
            { text: '┐', tone: 'frame' },
          ],
      cols,
    ),
  )

  // body: sidebar + panel, one row per character line, `~` past end of file
  for (let index = 0; index < bodyRows; index += 1) {
    const raw = body[index]
    const past = index >= body.length
    const line = past ? '~' : typeof raw === 'string' ? raw : raw.text
    const href = past || typeof raw === 'string' ? undefined : raw.href
    const tone: Tone = past ? 'faint' : 'body'
    const cells: Cell[] = [{ text: '│', tone: 'frame' }]

    if (narrow) {
      cells.push({ text: ' ', tone: 'body' })
      cells.push({
        text: padEnd(clip(line, textWidth), textWidth),
        tone,
        ...(href ? { action: { kind: 'url' as const, href } } : {}),
      })
      cells.push({ text: ' ', tone: 'body' })
    } else {
      const row = nav[index]
      cells.push(row ? navCell(row, navWidth) : { text: ' '.repeat(navWidth), tone: 'dim' })
      cells.push({ text: '│', tone: 'frame' })
      cells.push({ text: ' ', tone: 'body' })
      cells.push({
        text: padEnd(clip(line, textWidth), textWidth),
        tone,
        ...(href ? { action: { kind: 'url' as const, href } } : {}),
      })
      cells.push({ text: ' ', tone: 'body' })
    }

    cells.push({ text: '│', tone: 'frame' })
    out.push(fit(cells, cols))
  }

  // divider between the panel and the status line; the sidebar rule keeps going
  out.push(
    fit(
      narrow
        ? [
            { text: '├', tone: 'frame' },
            { text: rule(cols - 2), tone: 'frame' },
            { text: '┤', tone: 'frame' },
          ]
        : [
            { text: '├', tone: 'frame' },
            { text: rule(navWidth), tone: 'frame' },
            { text: '┼', tone: 'frame' },
            { text: rule(contentWidth), tone: 'frame' },
            { text: '┤', tone: 'frame' },
          ],
      cols,
    ),
  )

  out.push(
    fit(
      narrow
        ? [
            { text: '│', tone: 'frame' },
            { text: spread(' cpp  boost  wasm', `ready  ${seconds}s `, cols - 2), tone: 'dim' },
            { text: '│', tone: 'frame' },
          ]
        : [
            { text: '│', tone: 'frame' },
            { text: padEnd(clip(' cpp  boost  wasm', navWidth), navWidth), tone: 'dim' },
            { text: '│', tone: 'frame' },
            { text: spread('', `ready  ${seconds}s `, contentWidth), tone: 'dim' },
            { text: '│', tone: 'frame' },
          ],
      cols,
    ),
  )

  // close the frame
  out.push(
    fit(
      narrow
        ? [
            { text: '└', tone: 'frame' },
            { text: rule(cols - 2), tone: 'frame' },
            { text: '┘', tone: 'frame' },
          ]
        : [
            { text: '└', tone: 'frame' },
            { text: rule(navWidth), tone: 'frame' },
            { text: '┴', tone: 'frame' },
            { text: rule(contentWidth), tone: 'frame' },
            { text: '┘', tone: 'frame' },
          ],
      cols,
    ),
  )

  // key bar, in reverse video like a status line
  const withProjects = ' ↑↓ jk  section   ←→ hl  project'
  const baseHint = ' ↑↓ jk  change section'
  const shortHint = ' ↑↓ jk  nav'
  const signature = 'Nmd-Sketch '
  const room = cols - signature.length
  const hint =
    active.id === 'projects'
      ? room > withProjects.length + 2
        ? withProjects
        : shortHint
      : room > baseHint.length + 2
        ? baseHint
        : shortHint

  out.push(
    fit([{ text: spread(hint, signature, cols), tone: 'reverse' }], cols),
  )

  return out
}
