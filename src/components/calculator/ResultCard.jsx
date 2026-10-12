import Formula from '../chem/Formula.jsx'
import Icon from '../ui/Icon.jsx'
import { useFormat } from '../../hooks/useFormat.js'

const EXAMPLES = ['H2O', 'NaCl', 'Ca(OH)2', 'CuSO4·5H2O']

// The answer, huge and always on screen. Below it: the formula as it will be
// written (H₂O), or exactly what is wrong with the input and where.
export default function ResultCard({ formula, parsed, result, canonical, favourite, onToggleFavourite, onCopy, onPick }) {
  const { t, num, errorText } = useFormat()
  const empty = !formula.trim()
  const value = result ? num(result.value) : '–'

  return (
    <section className="result" aria-label={t('calc.resultLabel')}>
      <div className="result__top">
        <span className="result__label">{t('calc.resultLabel')}</span>
        {parsed.ok && parsed.ion && <span className="badge">{t('calc.ion')}</span>}
        <span className="result__spacer" />
        <button
          type="button"
          className="icon-btn"
          onClick={onToggleFavourite}
          disabled={!canonical}
          aria-pressed={favourite}
          aria-label={favourite ? t('calc.favouriteRemove') : t('calc.favouriteAdd')}
        >
          <Icon name="star" filled={favourite} />
        </button>
        <button type="button" className="icon-btn result__copy" onClick={onCopy} disabled={!result} aria-label={t('calc.copy')}>
          <Icon name="copy" />
        </button>
      </div>

      <output className={`result__value num ${result ? '' : 'is-empty'}`} aria-live="polite" aria-atomic="true">
        <span className="result__m">M =</span> <strong>{value}</strong> <span className="result__unit">g/mol</span>
      </output>

      <div className="result__formula">
        {empty ? (
          <div className="result__choices">
            <span className="result__hint">{t('calc.examplesLabel')}</span>
            {EXAMPLES.map((f) => (
              <button key={f} type="button" className="chip" onClick={() => onPick(f)}>
                <Formula value={f} />
              </button>
            ))}
          </div>
        ) : parsed.ok ? (
          <>
            <Formula value={canonical} className="result__chem" />
            {parsed.interpreted && <span className="result__note">{t('calc.interpreted', { formula: parsed.interpreted })}</span>}
          </>
        ) : parsed.candidates ? (
          <div className="result__choices">
            <span className="result__note">{errorText(parsed.error)}</span>
            {parsed.candidates.map((c) => (
              <button key={c} type="button" className="chip" onClick={() => onPick(c)}>
                <Formula value={c} />
              </button>
            ))}
          </div>
        ) : (
          <p className="result__error" role="alert">{errorText(parsed.error)}</p>
        )}
      </div>
    </section>
  )
}
