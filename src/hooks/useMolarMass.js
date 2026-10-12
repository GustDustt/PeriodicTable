import { useMemo } from 'react'
import { parseFormula } from '../lib/formula.js'
import { molarMass } from '../lib/mass.js'
import { useSettings } from '../store/settings.js'

// Parse + sum on every keystroke. Both are pure and sub-millisecond for any
// realistic formula, so there is deliberately no debounce: the answer must
// never lag behind what the student just typed.
export function useMolarMass(formula) {
  const mode = useSettings((s) => s.mode)
  const perElement = useSettings((s) => s.perElement)
  const parsed = useMemo(() => parseFormula(formula), [formula])
  const result = useMemo(
    () => (parsed.ok ? molarMass(parsed.counts, { mode, perElement }) : null),
    [parsed, mode, perElement],
  )
  const canonical = parsed.ok ? parsed.interpreted ?? formula.replace(/\s+/g, '') : null
  return { parsed, result, canonical, mode, perElement }
}
