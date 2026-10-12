import { BY_SYMBOL } from '../data/elements.js'
import { COMPOUNDS } from './compounds.js'
import { parseFormula } from './formula.js'
import { molarMass } from './mass.js'

// Element pairs students actually mix up — same group or similar symbol.
const CONFUSED = {
  Na: 'K', K: 'Na', Cl: 'Br', Br: 'Cl', C: 'Si', N: 'P', P: 'N', O: 'S', S: 'O',
  Mg: 'Ca', Ca: 'Mg', Fe: 'Co', Cu: 'Zn', Zn: 'Cu', Al: 'B', H: 'He', Ag: 'Au',
  Mn: 'Mg', Ba: 'Ca', Pb: 'Sn', I: 'Br', Cr: 'Mn',
}

// Plausible wrong answers, each tagged with the mistake that produces it so
// the feedback can say *why* it was wrong.
export function distractors(parsed, mode, perElement) {
  const value = (counts) => molarMass(counts, { mode, perElement }).value
  const out = []
  const counts = parsed.counts

  if (parsed.parts && parsed.parts.length > 1) {
    out.push({ kind: 'noHydrate', value: value(parsed.parts[0].counts) })
  }
  for (const sym of Object.keys(counts)) {
    const n = counts[sym]
    out.push({ kind: 'wrongCount', sym, value: value({ ...counts, [sym]: n + 1 }) })
    if (n > 1) out.push({ kind: 'wrongCount', sym, value: value({ ...counts, [sym]: n - 1 }) })
  }
  for (const sym of Object.keys(counts)) {
    const swap = CONFUSED[sym]
    if (!swap || !BY_SYMBOL[swap] || counts[swap]) continue
    const next = {}
    for (const s of Object.keys(counts)) next[s === sym ? swap : s] = counts[s]
    out.push({ kind: 'swapped', sym, swap, value: value(next) })
  }
  return out
}

// rng: () => [0, 1). Injected so tests can be deterministic.
export function makeQuestion({ mode, perElement = false, rng = Math.random, avoid } = {}) {
  let pick
  do {
    pick = COMPOUNDS[Math.floor(rng() * COMPOUNDS.length)]
  } while (avoid && pick.formula === avoid && COMPOUNDS.length > 1)
  const parsed = parseFormula(pick.formula)
  const correct = molarMass(parsed.counts, { mode, perElement }).value

  const seen = new Set([correct])
  const wrong = []
  for (const d of shuffle(distractors(parsed, mode, perElement), rng)) {
    if (seen.has(d.value)) continue
    seen.add(d.value)
    wrong.push(d)
  }
  // Forgetting the hydrate water is the most instructive mistake, so it is
  // always among the three shown.
  wrong.sort((a, b) => (a.kind === 'noHydrate' ? -1 : b.kind === 'noHydrate' ? 1 : 0))
  const choices = shuffle([{ kind: 'correct', value: correct }, ...wrong.slice(0, 3)], rng)
  return { compound: pick, parsed, correct, choices }
}

function shuffle(list, rng) {
  const a = [...list]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
