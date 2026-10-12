import { div, mul, parseDecimal, toString } from './decimal.js'
import { roundValue } from './rounding.js'
import { molarMass } from './mass.js'

const HUNDRED = { int: 100n, scale: 0 }

// Percentage by mass of each element, from the exact sheet sum. Division is
// the only inexact step, so it is carried to 8 decimals before rounding.
// `mode` is the user's rounding; exact mode falls back to 2 decimals because
// a quotient has no exact decimal form.
export function massPercent(counts, mode) {
  const result = molarMass(counts)
  const total = parseDecimal(result.exact)
  const shown = mode && mode.type !== 'exact' ? mode : { type: 'dp', digits: 2 }
  const lines = result.lines.map((line) => {
    const share = div(mul(parseDecimal(line.subtotal), HUNDRED), total, 8)
    return {
      ...line,
      percent: toString(roundValue(share, shown)),
      fraction: Number(toString(share)) / 100,
    }
  })
  return { total: result.exact, lines }
}
