export type Segment =
  | { kind: 'command'; text: string; cps: number }
  | { kind: 'output'; text: string; ms: number }
  | { kind: 'pause'; ms: number }

export type BootLine = { kind: 'command' | 'output'; text: string }

export type TimelineFrame = {
  lines: BootLine[]
  typing: string
  done: boolean
}

export const BOOT_SEGMENTS: readonly Segment[] = [
  { kind: 'pause', ms: 260 },
  { kind: 'command', text: 'cmake --build .', cps: 45 },
  {
    kind: 'output',
    text: '[1/4] Building CXX object CMakeFiles/portfolio.dir/src/main.cpp.o',
    ms: 130,
  },
  {
    kind: 'output',
    text: '[2/4] Building CXX object CMakeFiles/portfolio.dir/src/renderer.cpp.o',
    ms: 130,
  },
  {
    kind: 'output',
    text: '[3/4] Building CXX object CMakeFiles/portfolio.dir/src/scene.cpp.o',
    ms: 130,
  },
  { kind: 'output', text: '[4/4] Linking CXX executable portfolio', ms: 150 },
  { kind: 'pause', ms: 200 },
  { kind: 'command', text: 'cd build && portfolio.exe', cps: 40 },
  { kind: 'pause', ms: 380 },
]

export function segmentDuration(segment: Segment): number {
  if (segment.kind === 'command') {
    return Math.round((segment.text.length * 1000) / segment.cps)
  }
  return segment.ms
}

export function timelineDuration(segments: readonly Segment[]): number {
  return segments.reduce((total, segment) => total + segmentDuration(segment), 0)
}

export function sampleTimeline(
  segments: readonly Segment[],
  elapsedMs: number,
): TimelineFrame {
  const lines: BootLine[] = []
  let typing = ''
  let start = 0

  for (const segment of segments) {
    const duration = segmentDuration(segment)
    const local = elapsedMs - start

    if (local >= duration) {
      if (segment.kind !== 'pause') {
        lines.push({ kind: segment.kind, text: segment.text })
      }
      start += duration
      continue
    }

    if (segment.kind === 'command') {
      const typed = Math.floor((Math.max(local, 0) / duration) * segment.text.length)
      typing = segment.text.slice(0, typed)
    }
    start += duration
    break
  }

  return { lines, typing, done: elapsedMs >= timelineDuration(segments) }
}
