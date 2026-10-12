import { parseDecimal, rescale, toString } from './decimal.js'

// mode: { type: 'exact' } | { type: 'dp', digits: 0–4 } | { type: 'sf', digits: 1–6 }
export const DEFAULT_MODE = { type: 'dp', digits: 2 }
export const DP_RANGE = [0, 4]
export const SF_RANGE = [1, 6]

export function normalizeMode(mode) {
  if (!mode || typeof mode !== 'object') return DEFAULT_MODE
  if (mode.type === 'exact') return { type: 'exact' }
  const [lo, hi] = mode.type === 'sf' ? SF_RANGE : mode.type === 'dp' ? DP_RANGE : [null, null]
  if (lo === null) return DEFAULT_MODE
  const d = Number.isInteger(mode.digits) ? mode.digits : lo
  return { type: mode.type, digits: Math.min(hi, Math.max(lo, d)) }
}

// Works on decimal values ({ int, scale }), never on floats, so trailing zeros
// that carry meaning survive: 3 s.f. of 18.016 is '18.0', not '18'.
export function roundValue(value, mode) {
  mode = normalizeMode(mode)
  if (mode.type === 'exact') return value
  if (mode.type === 'dp') return rescale(value, mode.digits)
  if (value.int === 0n) return rescale(value, Math.max(0, mode.digits - 1))
  const exp = magnitude(value)
  let dp = mode.digits - 1 - exp
  let out = rescale(value, dp)
  // 99.96 to 3 s.f. carries into a new digit (100.0); drop one decimal so the
  // result still has exactly the requested number of significant figures.
  if (magnitude(out) > exp) out = rescale(value, dp - 1)
  return out
}

// Power of ten of the leading digit: 18.016 -> 1, 0.052 -> -2.
function magnitude({ int, scale }) {
  const len = (int < 0n ? -int : int).toString().length
  return len - 1 - scale
}

export function round(input, mode) {
  const value = typeof input === 'string' ? parseDecimal(input) : input
  if (!value) return null
  return toString(roundValue(value, mode))
}
