import { displayTokens, parseFormula } from './formula.js'

// Reaction equations: parse, then balance by finding the integer null space
// of the element (and charge) matrix with exact BigInt fractions.
//
// Separators: an arrow (→ -> => = ⇌ <-> <=>) and '+' between species. A '+'
// stuck to the species before it and followed by another '+' or by nothing
// is a charge, so "Na+ + Cl- → NaCl" and "Fe+O2->Fe2O3" both read the way
// they look.

const ARROWS = /<=>|<->|⇌|⟶|→|->|=>|=/g
const ELECTRON = /^(\d*)e[-−⁻]$/

export function parseEquation(input) {
  input = input == null ? '' : String(input)
  if (!input.trim()) return { ok: false, error: { code: 'empty' } }
  const arrows = [...input.matchAll(ARROWS)]
  if (arrows.length === 0) return { ok: false, error: { code: 'noArrow' } }
  if (arrows.length > 1) return { ok: false, error: { code: 'twoArrows', pos: arrows[1].index + 1 } }
  const a = arrows[0]
  const sides = [
    { text: input.slice(0, a.index), offset: 0 },
    { text: input.slice(a.index + a[0].length), offset: a.index + a[0].length },
  ]

  const species = []
  for (let side = 0; side < 2; side++) {
    for (const chunk of splitSide(sides[side].text, sides[side].offset)) {
      const raw = chunk.text.replace(/\s+/g, '')
      if (!raw) return { ok: false, error: { code: 'emptySpecies', pos: chunk.offset + 1, params: { side } } }
      if (ELECTRON.test(raw)) {
        species.push({ side, formula: 'e-', electron: true, counts: {}, charge: -1, start: chunk.offset, end: chunk.end })
        continue
      }
      const parsed = parseFormula(chunk.text)
      if (!parsed.ok) {
        const pos = parsed.error.pos != null ? chunk.offset + parsed.error.pos : chunk.offset + 1
        return { ok: false, candidates: parsed.candidates, range: [chunk.offset, chunk.end], error: { ...parsed.error, pos } }
      }
      // The student's own coefficient (2H2O) is dropped: balancing decides it.
      const lead = parsed.lead || 1
      const counts = {}
      for (const sym in parsed.counts) counts[sym] = parsed.counts[sym] / lead
      const shown = (parsed.interpreted ?? raw).replace(/^\d+/, '')
      species.push({ side, formula: shown, counts, charge: parsed.charge || 0, start: chunk.offset, end: chunk.end })
    }
  }
  return { ok: true, species, error: null }
}

function splitSide(text, offset) {
  const out = []
  let start = 0
  for (let i = 0; i < text.length; i++) {
    if (text[i] !== '+') continue
    let j = i + 1
    while (j < text.length && /\s/.test(text[j])) j++
    const next = text[j]
    const spaceBefore = i === 0 || /\s/.test(text[i - 1])
    if (!spaceBefore && (next === undefined || next === '+')) continue
    out.push({ text: text.slice(start, i), offset: offset + start, end: offset + i })
    start = i + 1
  }
  out.push({ text: text.slice(start), offset: offset + start, end: offset + text.length })
  return out
}

// balance(species) -> { ok, coefficients } | { ok:false, error }
export function balance(species) {
  const reactants = species.filter((s) => s.side === 0)
  const products = species.filter((s) => s.side === 1)
  if (!reactants.length || !products.length) return { ok: false, error: { code: 'emptySide' } }

  const symbols = [...new Set(species.flatMap((s) => Object.keys(s.counts)))]
  for (const sym of symbols) {
    const left = reactants.some((s) => s.counts[sym])
    const right = products.some((s) => s.counts[sym])
    if (left !== right) return { ok: false, error: { code: 'oneSide', params: { sym } } }
  }

  const sign = (s) => (s.side === 0 ? 1 : -1)
  const rows = symbols.map((sym) => species.map((s) => BigInt((s.counts[sym] || 0) * sign(s))))
  if (species.some((s) => s.charge)) rows.push(species.map((s) => BigInt(s.charge * sign(s))))

  const basis = nullspace(rows, species.length)
  if (basis.length === 0) return { ok: false, error: { code: 'cannotBalance' } }
  if (basis.length > 1) return { ok: false, error: { code: 'multipleSolutions' } }

  let v = basis[0]
  if (v.every((x) => x <= 0n)) v = v.map((x) => -x)
  if (v.some((x) => x <= 0n)) return { ok: false, error: { code: 'cannotBalance' } }
  return { ok: true, coefficients: v.map(Number) }
}

// ---- exact rational linear algebra ----

const abs = (x) => (x < 0n ? -x : x)
const gcd = (a, b) => {
  a = abs(a)
  b = abs(b)
  while (b) [a, b] = [b, a % b]
  return a
}
const frac = (n, d = 1n) => {
  if (d < 0n) [n, d] = [-n, -d]
  const g = gcd(n, d) || 1n
  return { n: n / g, d: d / g }
}
const fsub = (a, b) => frac(a.n * b.d - b.n * a.d, a.d * b.d)
const fmul = (a, b) => frac(a.n * b.n, a.d * b.d)
const fdiv = (a, b) => frac(a.n * b.d, a.d * b.n)

// Basis of { x : A x = 0 }, each vector scaled to coprime integers.
function nullspace(rows, cols) {
  const m = rows.map((r) => r.map((v) => frac(v)))
  const pivots = []
  let r = 0
  for (let c = 0; c < cols && r < m.length; c++) {
    const p = m.findIndex((row, i) => i >= r && row[c].n !== 0n)
    if (p < 0) continue
    ;[m[r], m[p]] = [m[p], m[r]]
    const pv = m[r][c]
    m[r] = m[r].map((x) => fdiv(x, pv))
    for (let i = 0; i < m.length; i++) {
      if (i === r || m[i][c].n === 0n) continue
      const f = m[i][c]
      m[i] = m[i].map((x, j) => fsub(x, fmul(f, m[r][j])))
    }
    pivots.push(c)
    r++
  }
  const free = [...Array(cols).keys()].filter((c) => !pivots.includes(c))
  return free.map((f) => {
    const x = Array(cols).fill(frac(0n))
    x[f] = frac(1n)
    pivots.forEach((pc, i) => {
      x[pc] = frac(-m[i][f].n, m[i][f].d)
    })
    const lcm = x.reduce((l, q) => (l * q.d) / gcd(l, q.d), 1n)
    const ints = x.map((q) => (q.n * lcm) / q.d)
    const g = ints.reduce((acc, v) => gcd(acc, v), 0n) || 1n
    return ints.map((v) => v / g)
  })
}

// ---- plain-text output (copying) ----

const SUB = '₀₁₂₃₄₅₆₇₈₉'
const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹'
const digits = (n, set) => String(n).replace(/\d/g, (d) => set[d])

// "4Fe + 3O₂ → 2Fe₂O₃", "Cu + 2Ag⁺ → Cu²⁺ + 2Ag", from the same tokens the
// on-screen formula uses.
export function speciesText(s) {
  if (s.electron) return 'e⁻'
  return displayTokens(s.formula)
    .map((t) => {
      if (t.type === 'number') return t.role === 'count' ? digits(t.raw, SUB) : t.raw
      if (t.type === 'hydrate') return '·'
      if (t.type === 'charge') return (Math.abs(t.value) === 1 ? '' : digits(Math.abs(t.value), SUP)) + (t.value < 0 ? '⁻' : '⁺')
      return t.value
    })
    .join('')
}

export function equationText(species, coefficients) {
  const side = (n) =>
    species
      .map((s, i) => ({ s, c: coefficients[i] }))
      .filter(({ s }) => s.side === n)
      .map(({ s, c }) => (c > 1 ? c : '') + speciesText(s))
      .join(' + ')
  return `${side(0)} → ${side(1)}`
}
