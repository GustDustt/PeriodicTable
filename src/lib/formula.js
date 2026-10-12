import { BY_SYMBOL } from '../data/elements.js'

// parseFormula(input) -> {
//   ok, counts: { sym: n }, tokens, error, parts, charge, ion,
//   interpreted?   string the input was auto-capitalised to (only when ok)
//   candidates?    several valid readings of an all-lowercase input
// }
// error: { code, pos?, params? }, pos is 1-based into the ORIGINAL input so the
// UI can say "tegn 3" and the student finds the character they typed.

const HYDRATE = new Set(['·', '•', '⋅', '*', '.', '∙'])
const OPEN = { '(': ')', '[': ']', '{': '}' }
const CLOSE = new Set([')', ']', '}'])
const SUB = '₀₁₂₃₄₅₆₇₈₉'
const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹'
const MAX_READINGS = 12

// Strip whitespace and fold Unicode sub/superscripts into plain ASCII while
// remembering where each character came from in the original string.
function normalize(input) {
  const chars = []
  const map = []
  let inSup = false
  for (let i = 0; i < input.length; i++) {
    const c = input[i]
    if (/\s/.test(c)) continue
    const sub = SUB.indexOf(c)
    const sup = SUP.indexOf(c)
    if (sub >= 0) {
      chars.push(String(sub)); map.push(i); inSup = false
    } else if (sup >= 0) {
      if (!inSup) { chars.push('^'); map.push(i) }
      chars.push(String(sup)); map.push(i); inSup = true
    } else if (c === '⁺' || c === '⁻' || c === '−' || c === '–') {
      chars.push(c === '⁺' ? '+' : '-'); map.push(i); inSup = false
    } else {
      chars.push(c); map.push(i); inSup = false
    }
  }
  return { s: chars.join(''), map }
}

// Pulls a trailing charge off the string. Without '^' the digits before the
// sign are ambiguous (Fe2+ vs NH4+), so: one atom and one digit -> charge
// (Fe2+, O2-); several atoms -> the last digit of a multi-digit run is the
// charge (SO42- = SO4 2-), a single digit stays a count (NH4+ = NH4 +).
function splitCharge(s) {
  const caret = /\^(\d*)([+-]?)$/.exec(s)
  if (caret) {
    if (!caret[1] && !caret[2]) return { body: s.slice(0, caret.index), charge: null, bad: caret.index }
    const n = caret[1] ? Number(caret[1]) : 1
    return { body: s.slice(0, caret.index), charge: caret[2] === '-' ? -n : n, at: caret.index }
  }
  const m = /(\d*)([+-]+)$/.exec(s)
  if (!m) return { body: s, charge: null }
  const signs = m[2]
  if (signs.length > 1 && new Set(signs).size > 1) return { body: s, charge: null, bad: m.index + m[1].length }
  const sign = signs[0] === '-' ? -1 : 1
  let digits = m[1]
  const before = s.slice(0, m.index)
  const monoatomic = /^\d*[A-Z][a-z]?$/.test(before)
  let chargeDigits = ''
  if (signs.length > 1) {
    chargeDigits = String(signs.length)
  } else if (digits.length === 1 && monoatomic) {
    chargeDigits = digits; digits = ''
  } else if (digits.length > 1) {
    chargeDigits = digits.slice(-1); digits = digits.slice(0, -1)
  }
  const n = chargeDigits ? Number(chargeDigits) : 1
  return { body: before + digits, charge: sign * n, at: before.length + digits.length }
}

function tokenize(s) {
  const tokens = []
  let i = 0
  while (i < s.length) {
    const c = s[i]
    if (/[A-Z]/.test(c)) {
      let sym = c
      if (/[a-z]/.test(s[i + 1] || '')) sym += s[i + 1]
      tokens.push({ type: 'element', value: sym, pos: i })
      i += sym.length
    } else if (/[a-z]/.test(c)) {
      let sym = c
      if (/[a-z]/.test(s[i + 1] || '')) sym += s[i + 1]
      tokens.push({ type: 'lower', value: sym, pos: i })
      i += sym.length
    } else if (/\d/.test(c)) {
      let j = i
      while (/\d/.test(s[j] || '')) j++
      tokens.push({ type: 'number', value: Number(s.slice(i, j)), raw: s.slice(i, j), pos: i })
      i = j
    } else if (OPEN[c]) {
      tokens.push({ type: 'open', value: c, pos: i }); i++
    } else if (CLOSE.has(c)) {
      tokens.push({ type: 'close', value: c, pos: i }); i++
    } else if (HYDRATE.has(c)) {
      tokens.push({ type: 'hydrate', value: '·', pos: i }); i++
    } else {
      tokens.push({ type: 'other', value: c, pos: i }); i++
    }
  }
  return tokens
}

class ParseError extends Error {
  constructor(code, pos, params) {
    super(code)
    this.info = { code, pos, params }
  }
}

function addCounts(into, from, k = 1) {
  for (const sym in from) into[sym] = (into[sym] || 0) + from[sym] * k
}

// Recursive descent over the token list. Each group returns counts in order
// of first appearance, which is the order teachers write the working in.
function parseTokens(tokens) {
  let p = 0
  const peek = () => tokens[p]

  function sequence(closer) {
    const counts = {}
    let any = false
    while (p < tokens.length) {
      const t = peek()
      if (t.type === 'element') {
        if (!BY_SYMBOL[t.value]) throw new ParseError('unknownElement', t.pos, { sym: t.value })
        p++
        addCounts(counts, { [t.value]: 1 }, count())
        any = true
      } else if (t.type === 'open') {
        p++
        const inner = sequence(OPEN[t.value])
        const end = peek()
        if (!end || end.type !== 'close') throw new ParseError('missingClose', t.pos, { bracket: OPEN[t.value] })
        if (end.value !== OPEN[t.value]) {
          throw new ParseError('mismatchedClose', end.pos, { expected: OPEN[t.value], got: end.value })
        }
        if (!inner.any) throw new ParseError('emptyGroup', t.pos)
        p++
        addCounts(counts, inner.counts, count())
        any = true
      } else if (t.type === 'close') {
        if (!closer) throw new ParseError('unexpectedClose', t.pos, { bracket: t.value })
        break
      } else if (t.type === 'lower') {
        const cap = t.value[0].toUpperCase() + t.value.slice(1)
        throw new ParseError('lowercase', t.pos, { sym: t.value, suggestion: BY_SYMBOL[cap] ? cap : t.value[0].toUpperCase() })
      } else if (t.type === 'number') {
        throw new ParseError(any ? 'misplacedNumber' : 'numberWithoutElement', t.pos)
      } else if (t.type === 'hydrate') {
        break
      } else {
        throw new ParseError('unexpectedChar', t.pos, { char: t.value })
      }
    }
    return { counts, any }
  }

  function count() {
    const t = peek()
    if (t && t.type === 'number') {
      p++
      if (t.value === 0) throw new ParseError('zeroCount', t.pos)
      return t.value
    }
    return 1
  }

  function coefficient() {
    const t = peek()
    if (t && t.type === 'number') {
      p++
      if (t.value === 0) throw new ParseError('zeroCount', t.pos)
      return t.value
    }
    return 1
  }

  const parts = []
  let lead = 1
  let first = true
  while (true) {
    const start = peek()
    const coef = coefficient()
    const seq = sequence(null)
    if (!seq.any) {
      if (first && !start) throw new ParseError('empty')
      if (start && start.type === 'number' && first) throw new ParseError('numberWithoutElement', start.pos)
      throw new ParseError('incompleteHydrate', start ? start.pos : tokens[tokens.length - 1].pos)
    }
    // A leading coefficient (2H2O) multiplies the whole formula; one after a
    // hydrate dot only multiplies its own part (·5H2O).
    if (first) lead = coef
    parts.push({ coef: first ? 1 : coef, counts: seq.counts })
    first = false
    const t = peek()
    if (!t) break
    if (t.type === 'hydrate') {
      p++
      if (!peek()) throw new ParseError('incompleteHydrate', t.pos)
      continue
    }
    throw new ParseError('unexpectedClose', t.pos, { bracket: t.value })
  }

  const counts = {}
  for (const part of parts) addCounts(counts, part.counts, part.coef * lead)
  return { counts, parts, lead }
}

function parseStrict(input) {
  const { s, map } = normalize(input)
  const orig = (pos) => (pos == null ? undefined : (map[pos] ?? input.length) + 1)
  if (!s) return { ok: false, counts: {}, tokens: [], error: { code: 'empty' } }

  const { body, charge, at, bad } = splitCharge(s)
  if (bad != null) {
    return { ok: false, counts: {}, tokens: tokenize(s), error: { code: 'badCharge', pos: orig(bad) } }
  }
  const tokens = tokenize(body)
  if (at != null) tokens.push({ type: 'charge', value: charge, pos: at })
  for (const t of tokens) t.at = orig(t.pos)

  const stray = tokens.find((t) => t.type === 'other' && (t.value === '+' || t.value === '-' || t.value === '^'))
  if (stray) return { ok: false, counts: {}, tokens, error: { code: 'chargeNotAtEnd', pos: stray.at } }

  try {
    const res = parseTokens(tokens.filter((t) => t.type !== 'charge'))
    return {
      ok: true,
      counts: res.counts,
      parts: res.parts,
      lead: res.lead,
      charge: charge ?? null,
      ion: charge != null && charge !== 0,
      tokens,
      error: null,
    }
  } catch (e) {
    if (!(e instanceof ParseError)) throw e
    const { code, pos, params } = e.info
    return { ok: false, counts: {}, tokens, error: { code, pos: orig(pos), params } }
  }
}

// Every way to split one run of lowercase letters into element symbols.
function segmentations(run) {
  const out = []
  const walk = (rest, acc) => {
    if (out.length > MAX_READINGS) return
    if (!rest) return out.push(acc)
    for (const len of [1, 2]) {
      if (rest.length < len) continue
      const sym = rest[0].toUpperCase() + rest.slice(1, len)
      if (BY_SYMBOL[sym]) walk(rest.slice(len), acc + sym)
    }
  }
  walk(run, '')
  return out
}

function readings(input) {
  const pieces = input.split(/([a-z]+)/)
  let combos = ['']
  for (let i = 0; i < pieces.length; i++) {
    const options = i % 2 ? segmentations(pieces[i]) : [pieces[i]]
    if (!options.length) return []
    combos = combos.flatMap((c) => options.map((o) => c + o)).slice(0, MAX_READINGS)
  }
  return combos
}

// Heavier, rarer elements are the less likely intended reading, so NH3 comes
// before Nh3 (nihonium) and CO before Co.
function plausibility(counts) {
  return Math.max(...Object.keys(counts).map((s) => BY_SYMBOL[s].z))
}

export function parseFormula(input) {
  input = input == null ? '' : String(input)
  const strict = parseStrict(input)
  const lettersOnlyLower = /[a-z]/.test(input) && !/[A-Z]/.test(input)
  if (strict.ok || !lettersOnlyLower) return strict

  // Only an all-lowercase input is auto-capitalised. Mixed case is taken
  // literally because Co and CO are different substances.
  const seen = new Set()
  const valid = []
  for (const candidate of readings(input.replace(/\s+/g, ''))) {
    if (seen.has(candidate)) continue
    seen.add(candidate)
    const r = parseStrict(candidate)
    if (r.ok) valid.push({ formula: candidate, result: r })
  }
  if (valid.length === 1) return { ...valid[0].result, interpreted: valid[0].formula }
  if (valid.length > 1) {
    valid.sort((a, b) => plausibility(a.result.counts) - plausibility(b.result.counts))
    return {
      ok: false,
      counts: {},
      tokens: strict.tokens,
      candidates: valid.map((v) => v.formula),
      error: { code: 'ambiguous', params: { options: valid.map((v) => v.formula).join(', ') } },
    }
  }
  return strict
}

// Lightweight tokens for rendering while the user is still typing — never
// throws, so half-finished input like "Ca(OH" still shows subscripts.
export function displayTokens(input) {
  const { s } = normalize(input || '')
  const { body, charge, at } = splitCharge(s)
  const tokens = tokenize(body)
  let prev = null
  for (const t of tokens) {
    if (t.type === 'number') {
      t.role = prev && (prev.type === 'element' || prev.type === 'lower' || prev.type === 'close') ? 'count' : 'coef'
    }
    prev = t
  }
  if (at != null) tokens.push({ type: 'charge', value: charge, pos: at })
  return tokens
}
