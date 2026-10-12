import { BY_SYMBOL } from '../data/elements.js'
import { add, mulInt, parseDecimal, toString } from './decimal.js'
import { normalizeMode, roundValue } from './rounding.js'
import { parseFormula } from './formula.js'

// The sheet's mass string -> exact decimal. '1.008' stays 1008 / 10^3; it is
// never passed through parseFloat.
export function atomicMass(sym) {
  const el = BY_SYMBOL[sym]
  return el ? parseDecimal(el.mass) : null
}

// molarMass(counts, { mode, perElement }) -> {
//   exact:  sum of the sheet's masses, written to the sheet's precision
//   sum:    the sum actually used (differs from exact when perElement is on)
//   value:  sum rounded to `mode` — the number the student writes down
//   lines:  [{ sym, count, mass, used, subtotal, stable }] for the working
//   perElement: whether masses were rounded before multiplying
// }
export function molarMass(counts, { mode, perElement = false } = {}) {
  mode = normalizeMode(mode)
  // Rounding each mass first is meaningless in exact mode, so it is reported
  // as not applied rather than silently doing nothing.
  const applyPer = perElement && mode.type !== 'exact'
  let exact = { int: 0n, scale: 0 }
  let sum = { int: 0n, scale: 0 }
  const lines = []
  for (const sym of Object.keys(counts)) {
    const n = counts[sym]
    const mass = atomicMass(sym)
    if (!mass) throw new Error(`Unknown element ${sym}`)
    const used = applyPer ? roundValue(mass, mode) : mass
    const subtotal = mulInt(used, n)
    exact = add(exact, mulInt(mass, n))
    sum = add(sum, subtotal)
    lines.push({
      sym,
      count: n,
      mass: BY_SYMBOL[sym].mass,
      stable: BY_SYMBOL[sym].stable,
      used: toString(used),
      subtotal: toString(subtotal),
    })
  }
  return {
    exact: toString(exact),
    sum: toString(sum),
    value: toString(roundValue(sum, mode)),
    sumValue: sum,
    lines,
    perElement: applyPer,
  }
}

// One call from text to number, for extras and the quiz.
export function massOf(formula, options) {
  const parsed = parseFormula(formula)
  if (!parsed.ok) return { parsed, result: null }
  return { parsed, result: molarMass(parsed.counts, options) }
}
