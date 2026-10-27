export function clip(text: string, width: number): string {
  return text.length <= width ? text : text.slice(0, width)
}

export function padEnd(text: string, width: number): string {
  return text.length >= width ? clip(text, width) : text + ' '.repeat(width - text.length)
}

export function rule(width: number): string {
  return '─'.repeat(Math.max(0, width))
}

/** Left-aligned and right-aligned text on one line, padded to `width`. */
export function spread(left: string, right: string, width: number): string {
  if (left.length + right.length >= width) return clip(left, width)
  return left + ' '.repeat(width - left.length - right.length) + right
}

/**
 * Greedy word wrap. Continuation lines are prefixed with `indent` spaces and
 * still fit inside `width`.
 */
export function wrapText(text: string, width: number, indent = 0): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let current: string[] = []
  let budget = width

  const flush = () => {
    if (current.length === 0) return
    lines.push((lines.length === 0 ? '' : ' '.repeat(indent)) + current.join(' '))
    current = []
    budget = Math.max(8, width - indent)
  }

  for (const word of words) {
    const candidate = [...current, word].join(' ')
    if (current.length === 0 || candidate.length <= budget) {
      current.push(word)
    } else {
      flush()
      current.push(word)
    }
  }
  flush()

  return lines.length > 0 ? lines : ['']
}
