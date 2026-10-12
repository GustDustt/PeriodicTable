import { parseFormula } from './formula.js'
import { molarMass } from './mass.js'
import { add, mulInt, toString } from './decimal.js'
import { normalizeMode, roundValue } from './rounding.js'

// A sum of formulas, written the way students jot it down:
//   "Na + Cl + O * 2", "2 × H2O + CO2", "CuSO4·5H2O − 5H2O"
// '+' and '−' separate terms, so charges are not supported here.
// A multiplier is "× n" / "* n" after a term or "n ×" / "n *" before it;
// "CuSO4*5H2O" stays a hydrate because a formula follows the number.

const TRAILING = /[*×]\s*(\d+)\s*$/
const LEADING = /^(\s*)(\d+)\s*[*×]/

// parseExpression(input) -> { ok, terms, error, candidates?, range?, interpreted? }
// term: { sign, k, formula, counts, start, end }  (start/end index the input)
export function parseExpression(input) {
  input = input == null ? '' : String(input)
  if (!input.trim()) return { ok: false, terms: [], error: { code: 'empty' } }

  const chunks = []
  let start = 0
  let sign = 1
  for (let i = 0; i <= input.length; i++) {
    const c = input[i]
    if (i === input.length || c === '+' || c === '-' || c === '−') {
      chunks.push({ text: input.slice(start, i), offset: start, sign, op: i })
      sign = c === '+' ? 1 : -1
      start = i + 1
    }
  }

  const terms = []
  const interpretedParts = []
  for (let n = 0; n < chunks.length; n++) {
    const { text, offset, sign: s } = chunks[n]
    if (!text.trim()) {
      // An empty term is where the student is about to type, so point at it.
      const at = n === 0 ? chunks[0].op : chunks[n - 1].op
      return { ok: false, terms, error: { code: 'emptyTerm', pos: at + 1 } }
    }
    let body = text
    let bodyStart = offset
    let k = 1
    const tail = TRAILING.exec(body)
    if (tail) {
      k *= Number(tail[1])
      body = body.slice(0, tail.index)
    }
    const lead = LEADING.exec(body)
    if (lead) {
      k *= Number(lead[2])
      bodyStart += lead[0].length
      body = body.slice(lead[0].length)
    }
    if (k === 0) return { ok: false, terms, error: { code: 'zeroCount', pos: offset + 1 } }
    if (!body.trim()) return { ok: false, terms, error: { code: 'emptyTerm', pos: offset + 1 } }

    const parsed = parseFormula(body)
    const lead0 = body.length - body.trimStart().length
    const range = [bodyStart + lead0, bodyStart + body.trimEnd().length]
    if (!parsed.ok) {
      const pos = parsed.error.pos != null ? bodyStart + parsed.error.pos : bodyStart + 1
      return {
        ok: false,
        terms,
        candidates: parsed.candidates,
        range,
        error: { ...parsed.error, pos },
      }
    }
    if (parsed.ion) return { ok: false, terms, error: { code: 'chargeNotAtEnd', pos: bodyStart + 1 } }
    const formula = parsed.interpreted ?? body.replace(/\s+/g, '')
    if (parsed.interpreted) interpretedParts.push(formula)
    terms.push({ sign: s, k, formula, counts: parsed.counts, start: range[0], end: range[1] })
  }

  return {
    ok: true,
    terms,
    error: null,
    interpreted: interpretedParts.length ? expressionText(terms) : undefined,
  }
}

// Plain-text form used for display and copying: "Na + Cl + 2 × O".
export function expressionText(terms) {
  return terms
    .map((t, i) => {
      const op = i === 0 ? (t.sign < 0 ? '− ' : '') : t.sign < 0 ? ' − ' : ' + '
      return op + (t.k > 1 ? `${t.k} × ` : '') + t.formula
    })
    .join('')
}

// Each term's mass is computed exactly like the calculator (including the
// per-element switch), multiplied by its factor, summed, and rounded once.
export function expressionMass(terms, { mode, perElement = false } = {}) {
  mode = normalizeMode(mode)
  let total = { int: 0n, scale: 0 }
  const counts = {}
  const lines = terms.map((t) => {
    const r = molarMass(t.counts, { mode, perElement })
    const subtotal = mulInt(r.sumValue, t.k * t.sign)
    total = add(total, subtotal)
    for (const sym in t.counts) counts[sym] = (counts[sym] || 0) + t.counts[sym] * t.k * t.sign
    return { ...t, mass: r.sum, subtotal: toString(subtotal) }
  })
  return {
    sum: toString(total),
    value: toString(roundValue(total, mode)),
    lines,
    counts,
    perElement: perElement && mode.type !== 'exact',
  }
}
