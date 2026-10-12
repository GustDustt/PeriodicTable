import { div, isZero, mul, parseDecimal, toString } from './decimal.js'
import { roundResult } from './amount.js'

const THOUSAND = { int: 1000n, scale: 0 }

// '' -> null (unknown), garbage or negative -> undefined (error), else a decimal.
function read(s) {
  if (s == null || String(s).trim() === '') return null
  const d = parseDecimal(s)
  return d && d.int >= 0n ? d : undefined
}

// Concentration with optional mass: n = m / M and c = n / V, chained.
// Fill any known values; every unknown that can be derived is, and each step
// is returned so the page can show the working with numbers substituted.
// V is given in `volumeUnit` ('L' | 'mL'); c is always mol/L.
//
// Returns { ok, values, steps } or { ok:false, error, field? }
export function solveConcentration({ m, n, V, c, M }, { mode, volumeUnit = 'L' } = {}) {
  const given = { m: read(m), n: read(n), V: read(V), c: read(c), M: read(M) }
  for (const k of Object.keys(given)) if (given[k] === undefined) return { ok: false, error: 'badNumber', field: k }
  const v = { ...given }
  if (v.V && volumeUnit === 'mL') v.V = div(v.V, THOUSAND, 12)

  // Each rule: [target, needs, compute, equation id, divisor]. Applied until
  // nothing new can be derived; order prefers the direct n = m/M route first.
  const rules = [
    ['n', ['m', 'M'], () => div(v.m, v.M, 12), 'nFromM', 'M'],
    ['n', ['c', 'V'], () => mul(v.c, v.V), 'nFromC'],
    ['c', ['n', 'V'], () => div(v.n, v.V, 12), 'c', 'V'],
    ['V', ['n', 'c'], () => div(v.n, v.c, 12), 'V', 'c'],
    ['m', ['n', 'M'], () => mul(v.n, v.M), 'm'],
  ]
  const steps = []
  let progress = true
  while (progress) {
    progress = false
    for (const [target, needs, compute, id, divisor] of rules) {
      if (v[target] || !needs.every((k) => v[k])) continue
      if (divisor && isZero(v[divisor])) return { ok: false, error: 'divideByZero' }
      v[target] = compute()
      steps.push({ id, target })
      progress = true
    }
  }
  if (!steps.length) return { ok: false, error: Object.values(given).filter(Boolean).length < 2 ? 'needTwo' : 'nothingToSolve' }

  // Display: V back in the unit the student uses; everything rounded per mode.
  const out = {}
  for (const k of ['m', 'n', 'V', 'c', 'M']) {
    if (!v[k]) continue
    let val = v[k]
    if (k === 'V' && volumeUnit === 'mL') val = mul(val, THOUSAND)
    const computed = steps.some((s) => s.target === k)
    out[k] = computed ? roundResult(val, mode) : { value: toString(given[k]), note: null }
    out[k].computed = computed
  }
  // The working is always written in litres, even when the student types mL.
  if (v.V) {
    const computed = steps.some((s) => s.target === 'V')
    // 250 mL is exactly 0.25 L; dividing by 1000 only adds zeros, so drop them.
    const exactL = volumeUnit === 'mL' ? toString(v.V).replace(/\.?0+$/, '') : toString(given.V)
    out.VL = computed ? roundResult(v.V, mode) : { value: exactL, note: null }
  }
  return { ok: true, values: out, steps }
}

// Dilution c₁V₁ = c₂V₂: exactly one of the four empty. Volumes only need to
// share a unit, so no conversion happens.
export function solveDilution({ c1, V1, c2, V2 }, mode) {
  const v = { c1: read(c1), V1: read(V1), c2: read(c2), V2: read(V2) }
  for (const k of Object.keys(v)) if (v[k] === undefined) return { ok: false, error: 'badNumber', field: k }
  const missing = Object.keys(v).filter((k) => v[k] === null)
  if (missing.length > 1) return { ok: false, error: 'needThree' }
  if (missing.length === 0) return { ok: false, error: 'tooMany' }
  const solve = missing[0]
  const other = { c1: ['c2', 'V2', 'V1'], V1: ['c2', 'V2', 'c1'], c2: ['c1', 'V1', 'V2'], V2: ['c1', 'V1', 'c2'] }[solve]
  const [a, b, d] = other
  if (isZero(v[d])) return { ok: false, error: 'divideByZero' }
  const raw = div(mul(v[a], v[b]), v[d], 12)
  const { value, note } = roundResult(raw, mode)
  return { ok: true, solve, value, note }
}
