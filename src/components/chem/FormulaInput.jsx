import { useId } from 'react'
import Formula from './Formula.jsx'
import { useFormat } from '../../hooks/useFormat.js'

// Native-keyboard formula field for the extra tools, with the same parser
// feedback as the calculator (rendered formula, or the exact error).
export default function FormulaInput({ id, label, help, value, onChange, parsed, onPick }) {
  const { t, errorText } = useFormat()
  const statusId = useId()
  const showError = value.trim() && !parsed.ok
  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>{label}</label>
      <input
        id={id}
        name={id}
        className="input num"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        placeholder={t('calc.placeholder')}
        aria-invalid={showError ? 'true' : undefined}
        aria-describedby={statusId}
      />
      <div id={statusId} className="formula-status" aria-live="polite">
        {parsed.ok && value.trim() ? (
          <>
            <Formula value={parsed.interpreted ?? value} />
            {parsed.interpreted && <span className="note note--warn"> {t('calc.interpreted', { formula: parsed.interpreted })}</span>}
          </>
        ) : parsed.candidates ? (
          <span className="formula-status__choices">
            <span className="note">{errorText(parsed.error)}</span>
            {parsed.candidates.map((c) => (
              <button key={c} type="button" className="chip" onClick={() => onPick?.(c)}>
                <Formula value={c} />
              </button>
            ))}
          </span>
        ) : showError ? (
          <span className="note note--warn">{errorText(parsed.error)}</span>
        ) : (
          help && <span className="note">{help}</span>
        )}
      </div>
    </div>
  )
}
