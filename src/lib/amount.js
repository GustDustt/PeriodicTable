import { div, isZero, mul, parseDecimal, toString } from './decimal.js'
import { roundValue } from './rounding.js'

// n = m / M with any two known. Inputs are user strings (comma or point).
// Returns { ok, solve: 'n'|'m'|'M', raw, value, note } or { ok:false, error }.
export function solveAmount({ m, n, M }, mode) {
  const v = { m: read(m), n: read(n), M: read(M) }
  for (const k of ['m', 'n', 'M']) if (v[k] === undefined) return { ok: false, error: 'badNumber', field: k }
  const known = Object.keys(v).filter((k) => v[k] !== null)
  if (known.length < 2) return { ok: false, error: 'needTwo' }
  if (known.length === 3) return { ok: false, error: 'tooMany' }
  const solve = ['m', 'n', 'M'].find((k) => v[k] === null)

  let raw
  if (solve === 'n') raw = isZero(v.M) ? null : div(v.m, v.M, 10)
  else if (solve === 'M') raw = isZero(v.n) ? null : div(v.m, v.n, 10)
  else raw = mul(v.n, v.M)
  if (!raw) return { ok: false, error: 'divideByZero' }

  const { value, note } = roundResult(raw, mode)
  return { ok: true, solve, raw: toString(raw), value, note, inputs: v }
}

// A quotient never has an exact decimal form, so "exact" shows 6 significant
// figures. Decimal-place rounding that would flatten a small non-zero amount
// to 0 falls back to 3 s.f. and says so, instead of claiming n = 0,00 mol.
export function roundResult(raw, mode) {
  if (!mode || mode.type === 'exact') return { value: toString(roundValue(raw, { type: 'sf', digits: 6 })), note: 'exactQuotient' }
  const r = roundValue(raw, mode)
  if (isZero(r) && !isZero(raw)) return { value: toString(roundValue(raw, { type: 'sf', digits: 3 })), note: 'tooSmall' }
  return { value: toString(r), note: null }
}

// '' -> null (unknown), garbage -> undefined (error), else a decimal.
function read(s) {
  if (s == null || String(s).trim() === '') return null
  const d = parseDecimal(s)
  return d && d.int >= 0n ? d : undefined
}
