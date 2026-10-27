import type { Project } from './projects'
import type { Section } from './sections'
import { padEnd, wrapText } from '../tui/text'

const WHEN_COL = 12
const LABEL_COL = 10
const GAP = 2

/** A screen line; `{ text, href }` makes the whole line open a link. */
export type BodyLine = string | { text: string; href: string }

/** Wrap `text` so every line starts at `indent` and stays inside `width`. */
function block(text: string, indent: number, width: number): string[] {
  const pad = ' '.repeat(indent)
  return wrapText(text, Math.max(16, width - indent)).map((line) => pad + line)
}

/** Lay out blocks of text side by side, each in its own column. */
function joinColumns(blocks: string[][], width: number, gap = GAP): string[] {
  if (blocks.length === 0) return []
  if (blocks.length === 1) return blocks[0]

  const colWidth = Math.floor((width - gap * (blocks.length - 1)) / blocks.length)
  const height = Math.max(...blocks.map((lines) => lines.length))
  const out: string[] = []

  for (let row = 0; row < height; row += 1) {
    const line = blocks
      .map((lines) => padEnd(lines[row] ?? '', colWidth))
      .join(' '.repeat(gap))
    out.push(line.trimEnd())
  }

  return out
}

function proseLines(paragraphs: readonly string[], width: number): string[] {
  return paragraphs.flatMap((paragraph, index) => [
    ...wrapText(paragraph, width),
    ...(index < paragraphs.length - 1 ? [''] : []),
  ])
}

function entryLines(
  entries: readonly { when: string; what: string; detail: string }[],
  width: number,
): string[] {
  const out: string[] = []

  entries.forEach((entry, index) => {
    if (index > 0) out.push('')

    const head = wrapText(entry.what, Math.max(16, width - WHEN_COL))
    out.push(padEnd(entry.when, WHEN_COL) + head[0])
    for (const rest of head.slice(1)) out.push(' '.repeat(WHEN_COL) + rest)
    out.push(...block(entry.detail, WHEN_COL, width))
  })

  return out
}

function groupLines(
  group: { name: string; items: readonly string[] },
  width: number,
): string[] {
  const lines = [group.name]

  for (const item of group.items) {
    wrapText(item, Math.max(12, width - 2)).forEach((line, index) => {
      lines.push(index === 0 ? `- ${line}` : `  ${line}`)
    })
  }

  return lines
}

function columnLines(
  groups: readonly { name: string; items: readonly string[] }[],
  width: number,
): string[] {
  if (groups.length < 2 || width < 54) {
    return groups.flatMap((group, index) => [
      ...(index > 0 ? [''] : []),
      ...groupLines(group, width),
    ])
  }

  return joinColumns(
    groups.map((group) => groupLines(group, width)),
    width,
  )
}

function rowLines(
  rows: readonly { label: string; value: string }[],
  width: number,
): string[] {
  return rows.flatMap((row) => {
    const value = wrapText(row.value, Math.max(16, width - LABEL_COL))
    const head = padEnd(row.label, LABEL_COL) + value[0]
    return [head, ...value.slice(1).map((line) => ' '.repeat(LABEL_COL) + line)]
  })
}

function projectLines(
  projects: readonly Project[],
  index: number,
  width: number,
  narrow: boolean,
): BodyLine[] {
  const safe = Math.min(Math.max(index, 0), projects.length - 1)
  const project = projects[safe]
  const out: BodyLine[] = []

  if (narrow) {
    const tabs = projects
      .map((item, itemIndex) => (itemIndex === safe ? `[${item.name}]` : item.name))
      .join(' ')
    out.push(...wrapText(`repo: ${tabs}`, width, 6), '')
  }

  out.push(project.name, '─'.repeat(width))
  const stack = ['tech', ...project.stack.map((item) => `- ${item}`)]
  const sideBySide = !narrow && width >= 54

  if (sideBySide) {
    const half = Math.floor((width - GAP) / 2)
    out.push(
      ...joinColumns([wrapText(project.description, half), stack], width),
    )
  } else {
    out.push(...wrapText(project.description, width), '', ...stack)
  }

  out.push('')
  const prefix = 'link      '
  if (prefix.length + project.url.length <= width) {
    out.push({ text: prefix + project.url, href: project.url })
  } else {
    out.push('link', { text: project.url, href: project.url })
  }

  return out
}

/** The screen body for one section, as pre-wrapped character lines. */
export function sectionLines(
  section: Section,
  width: number,
  projectIndex = 0,
  narrow = false,
): BodyLine[] {
  const columns = Math.max(20, Math.floor(width))

  switch (section.kind) {
    case 'prose':
      return proseLines(section.paragraphs, columns)
    case 'entries':
      return entryLines(section.entries, columns)
    case 'projects':
      return projectLines(section.projects, projectIndex, columns, narrow)
    case 'columns':
      return columnLines(section.groups, columns)
    case 'rows':
      return rowLines(section.rows, columns)
  }
}
