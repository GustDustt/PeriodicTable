import { memo } from 'react'
import Formula from './Formula.jsx'
import { parseExpression, expressionText } from '../../lib/expression.js'
import { subscriptDigits } from '../../utils/format.js'

// "Na + Cl + 2 × O" with every term drawn as a formula (subscripts, hydrate
// dot). Takes parsed terms, or a raw string for example chips.
function Expression({ terms, value, className = '' }) {
  const list = terms ?? (parseExpression(value).terms || [])
  if (!list.length) return <span className={className}>{value}</span>
  return (
    <span className={`expression ${className}`} role="img" aria-label={subscriptDigits(expressionText(list))}>
      {list.map((t, i) => (
        <span key={i} className="expression__term">
          {i > 0 && <span className="expression__op">{t.sign < 0 ? '−' : '+'}</span>}
          {i === 0 && t.sign < 0 && <span className="expression__op">−</span>}
          {t.k > 1 && <span className="expression__k">{t.k} ×</span>}
          <Formula value={t.formula} />
        </span>
      ))}
    </span>
  )
}

export default memo(Expression)
