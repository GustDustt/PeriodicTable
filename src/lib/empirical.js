import { BY_SYMBOL } from '../data/elements.js'
import { div, isZero, parseDecimal, rescale, toString, cmp } from './decimal.js'

const MAX_MULTIPLIER = 8
// How far a ratio may sit from a whole number and still count as one. 0.1 is
// the usual textbook tolerance for data given to 3–4 significant figures.
const TOLERANCE = 0.1

// entries: [{ sym, amount }] where amount is a mass % or grams (same maths:
// percentages are grams in a 100 g sample).
// Returns { ok, steps, smallest, multiplier, counts, formula, fuzzy } or { ok:false, error }.
export function empiricalFormula(entries) {
  // Blank rows are skipped but `row` in errors keeps the caller's index.
  const rows = entries
    .map((e, row) => ({ sym: e.sym || '', amount: e.amount, row }))
    .filter((e) => e.sym.trim() || String(e.amount || '').trim())
  if (rows.length < 1) return { ok: false, error: 'needRows' }
  const seen = new Set()
  const steps = []
  for (let i = 0; i < rows.length; i++) {
    const sym = rows[i].sym.trim()
    const el = BY_SYMBOL[sym]
    if (!el) return { ok: false, error: 'unknownElement', row: rows[i].row, params: { sym: sym || '?' } }
    if (seen.has(sym)) return { ok: false, error: 'duplicate', row: rows[i].row, params: { sym } }
    seen.add(sym)
    const amount = parseDecimal(rows[i].amount)
    if (!amount || amount.int <= 0n) return { ok: false, error: 'badAmount', row: rows[i].row, params: { sym } }
    const M = parseDecimal(el.mass)
    steps.push({ sym, amount: toString(amount), mass: el.mass, moles: div(amount, M, 6) })
  }

  const smallest = steps.reduce((a, s) => (cmp(s.moles, a) < 0 ? s.moles : a), steps[0].moles)
  if (isZero(smallest)) return { ok: false, error: 'badAmount', row: rows[0].row, params: { sym: steps[0].sym } }
  for (const s of steps) s.ratio = div(s.moles, smallest, 4)

  // Smallest whole multiplier that brings every ratio within tolerance of an
  // integer — 1.5 -> ×2, 1.33 -> ×3. If none fits, the best one is used and
  // flagged so the student knows the data may be off.
  let best = null
  for (let k = 1; k <= MAX_MULTIPLIER; k++) {
    const worst = Math.max(...steps.map((s) => {
      const x = Number(toString(s.ratio)) * k
      return Math.abs(x - Math.round(x))
    }))
    if (!best || worst < best.worst - 1e-9) best = { k, worst }
    if (worst <= TOLERANCE) break
  }

  const counts = {}
  for (const s of steps) {
    const scaled = Number(toString(s.ratio)) * best.k
    s.scaled = toString(rescale({ int: s.ratio.int * BigInt(best.k), scale: s.ratio.scale }, 2))
    s.whole = Math.max(1, Math.round(scaled))
    counts[s.sym] = s.whole
    s.moles = toString(rescale(s.moles, 4))
    s.ratio = toString(rescale(s.ratio, 2))
  }
  const formula = steps.map((s) => s.sym + (s.whole > 1 ? s.whole : '')).join('')
  return { ok: true, steps, smallest: toString(rescale(smallest, 4)), multiplier: best.k, counts, formula, fuzzy: best.worst > TOLERANCE }
}
