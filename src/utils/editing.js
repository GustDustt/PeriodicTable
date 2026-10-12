// Pure text edits for the on-screen keypad. They mirror what a native input
// would do with the caret/selection so keypad and keyboard behave the same.
export function insertText(value, start, end, text) {
  const s = clamp(start ?? value.length, value)
  const e = clamp(end ?? s, value)
  return { value: value.slice(0, s) + text + value.slice(e), caret: s + text.length }
}

export function deleteBackward(value, start, end) {
  const s = clamp(start ?? value.length, value)
  const e = clamp(end ?? s, value)
  if (s !== e) return { value: value.slice(0, s) + value.slice(e), caret: s }
  if (s === 0) return { value, caret: 0 }
  return { value: value.slice(0, s - 1) + value.slice(s), caret: s - 1 }
}

function clamp(n, value) {
  return Math.max(0, Math.min(value.length, n))
}
