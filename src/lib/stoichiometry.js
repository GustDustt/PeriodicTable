import { cmp, div, mul, mulInt, parseDecimal, sub, isZero, toString } from './decimal.js'
import { molarMass } from './mass.js'
import { roundResult } from './amount.js'

// Masses -> amounts through a balanced equation.
// species: from parseEquation; coefficients: from balance; masses: strings
// per species ('' = unknown). M is the molar mass the student would write
// (rounded per their setting), so the working matches their notebook.
//
// Returns { ok, rows, limiting, basis } where each row has
//   M, given, n, m (theoretical), excessN/excessM (unused reactant)
export function stoichiometry(species, coefficients, masses, { mode, perElement = false } = {}) {
  const rows = species.map((s, i) => {
    const M = s.electron ? null : molarMass(s.counts, { mode, perElement }).value
    const raw = (masses[i] ?? '').toString().trim()
    const given = raw ? parseDecimal(raw) : null
    return { coef: coefficients[i], side: s.side, M, given: raw ? given : null, bad: !!raw && (!given || given.int < 0n) }
  })
  const badRow = rows.findIndex((r) => r.bad)
  if (badRow >= 0) return { ok: false, error: { code: 'badNumber', row: badRow } }

  const known = rows
    .map((r, i) => ({ r, i }))
    .filter(({ r }) => r.given && r.M && !isZero(parseDecimal(r.M)))
  if (!known.length) return { ok: false, error: { code: 'needMass' } }

  // Extent of reaction ξ = n / coefficient. With several reactant masses the
  // smallest ξ wins: that reactant runs out first (limiting reactant).
  const extent = ({ r }) => div(div(r.given, parseDecimal(r.M), 12), { int: BigInt(r.coef), scale: 0 }, 12)
  const reactants = known.filter(({ r }) => r.side === 0)
  const pool = reactants.length ? reactants : known.filter(({ r }) => r.side === 1).slice(0, 1)
  let basis = pool[0]
  let xi = extent(basis)
  for (const k of pool.slice(1)) {
    const e = extent(k)
    if (cmp(e, xi) < 0) {
      basis = k
      xi = e
    }
  }

  const out = rows.map((r, i) => {
    if (!r.M) return { coef: r.coef, side: r.side, M: null }
    const n = mulInt(xi, r.coef)
    const m = mul(n, parseDecimal(r.M))
    const row = {
      coef: r.coef,
      side: r.side,
      M: r.M,
      given: r.given ? toString(r.given) : null,
      n: roundResult(n, mode).value,
      m: roundResult(m, mode).value,
    }
    if (r.given && r.side === 0 && i !== basis.i) {
      const nGiven = div(r.given, parseDecimal(r.M), 12)
      const leftover = sub(nGiven, n)
      if (leftover.int > 0n) {
        row.excessN = roundResult(leftover, mode).value
        row.excessM = roundResult(mul(leftover, parseDecimal(r.M)), mode).value
      }
    }
    return row
  })

  return { ok: true, rows: out, basis: basis.i, limiting: reactants.length > 1 ? basis.i : null }
}
