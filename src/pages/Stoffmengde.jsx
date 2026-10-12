import { useState } from 'react'
import Seo from '../components/layout/Seo.jsx'
import FormulaInput from '../components/chem/FormulaInput.jsx'
import Formula from '../components/chem/Formula.jsx'
import { useMolarMass } from '../hooks/useMolarMass.js'
import { useFormat } from '../hooks/useFormat.js'
import { useCalculator } from '../store/calculator.js'
import { solveAmount } from '../lib/amount.js'
import { parseDecimal, toString } from '../lib/decimal.js'
import '../components/extras/extras.css'

const UNITS = { m: 'g', n: 'mol', M: 'g/mol' }

export default function Stoffmengde() {
  const { t, num } = useFormat()
  // Starts from whatever is in the calculator — the usual next step after
  // finding M is n = m/M for the same substance.
  const [formula, setFormula] = useState(() => useCalculator.getState().formula)
  const [values, setValues] = useState({ m: '', n: '', M: '' })
  const { parsed, result, canonical, mode } = useMolarMass(formula)

  const fromFormula = !!result
  const inputs = { ...values, M: fromFormula ? result.value : values.M }
  const answer = solveAmount(inputs, mode)
  const set = (k) => (e) => setValues((v) => ({ ...v, [k]: e.target.value }))
  const shown = (k) => {
    if (answer.ok && answer.solve === k) return num(answer.value)
    const d = parseDecimal(inputs[k])
    return d ? num(toString(d)) : ''
  }

  const field = (k) => (
    <div className="field" key={k}>
      <label className="field__label" htmlFor={`amount-${k}`}>{t(`amount.${k}`)}</label>
      <div className="field__row">
        <input
          id={`amount-${k}`}
          name={k}
          className={`input num ${answer.ok && answer.solve === k ? 'input--answer' : ''}`}
          inputMode="decimal"
          autoComplete="off"
          value={k === 'M' && fromFormula ? num(result.value) : answer.ok && answer.solve === k ? num(answer.value) : values[k]}
          onChange={set(k)}
          readOnly={(k === 'M' && fromFormula) || (answer.ok && answer.solve === k)}
          aria-invalid={answer.error === 'badNumber' && answer.field === k ? 'true' : undefined}
        />
        <span className="unit">{UNITS[k]}</span>
      </div>
      {k === 'M' && fromFormula && (
        <span className="note">{t('amount.fromFormula', { formula: canonical })}</span>
      )}
    </div>
  )

  const equation = answer.ok && {
    n: `n = m / M = ${shown('m')} g / ${shown('M')} g/mol = ${shown('n')} mol`,
    m: `m = n · M = ${shown('n')} mol · ${shown('M')} g/mol = ${shown('m')} g`,
    M: `M = m / n = ${shown('m')} g / ${shown('n')} mol = ${shown('M')} g/mol`,
  }[answer.solve]

  const clearAll = () => {
    setValues({ m: '', n: '', M: '' })
    setFormula('')
  }

  const errorKey = !answer.ok && answer.error
  const errorText = errorKey === 'badNumber' ? t('amount.badNumber', { field: answer.field }) : errorKey ? t(`amount.${errorKey}`) : ''

  return (
    <div className="page">
      <Seo page="amount" path="/stoffmengde" />
      <h1 className="page__title">{t('amount.title')}</h1>
      <p className="page__intro">{t('amount.intro')}</p>

      <div className="card stack">
        <FormulaInput
          id="amount-formula"
          label={t('amount.formula')}
          help={t('amount.formulaHelp')}
          value={formula}
          onChange={setFormula}
          parsed={parsed}
          onPick={setFormula}
        />
        {['m', 'n', 'M'].map(field)}
        <button type="button" className="btn btn--ghost" onClick={clearAll}>{t('amount.clear')}</button>
      </div>

      <section className="card answer" aria-live="polite">
        <h2 className="answer__title">{t('amount.result')}</h2>
        {answer.ok ? (
          <>
            <p className="answer__eq num">{equation}</p>
            {fromFormula && (
              <p className="note">
                <Formula value={canonical} />: M = {num(result.value)} g/mol
              </p>
            )}
            {answer.note && <p className="note note--warn">{t(`amount.${answer.note}`)}</p>}
          </>
        ) : (
          <p className="note">{errorText}</p>
        )}
      </section>
    </div>
  )
}
