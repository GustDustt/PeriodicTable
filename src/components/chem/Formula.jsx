import { memo } from 'react'
import { displayTokens } from '../../lib/formula.js'
import { subscriptDigits } from '../../utils/format.js'
import './formula.css'

function chargeText(n) {
  const abs = Math.abs(n)
  return (abs === 1 ? '' : String(abs)) + (n < 0 ? '−' : '+')
}

// Renders H2O as H₂O, CuSO4.5H2O as CuSO₄·5H₂O and SO42- as SO₄²⁻, using the
// same tokenizer as the parser so what is shown is exactly what is counted.
function Formula({ value, className = '' }) {
  const tokens = displayTokens(value)
  return (
    <span className={`formula ${className}`} role="img" aria-label={subscriptDigits(value || '')}>
      {tokens.map((t, i) => {
        if (t.type === 'number' && t.role === 'count') return <sub key={i}>{t.raw}</sub>
        if (t.type === 'number') return <span key={i} className="formula__coef">{t.raw}</span>
        if (t.type === 'hydrate') return <span key={i} className="formula__dot">·</span>
        if (t.type === 'charge') return <sup key={i}>{chargeText(t.value)}</sup>
        return <span key={i}>{t.value}</span>
      })}
    </span>
  )
}

export default memo(Formula)
