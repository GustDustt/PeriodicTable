import { useState } from 'react'
import Seo from '../components/layout/Seo.jsx'
import Formula from '../components/chem/Formula.jsx'
import Segmented from '../components/ui/Segmented.jsx'
import Icon from '../components/ui/Icon.jsx'
import { useFormat } from '../hooks/useFormat.js'
import { empiricalFormula } from '../lib/empirical.js'
import { add, parseDecimal, toString } from '../lib/decimal.js'
import '../components/extras/extras.css'

const START = [
  { sym: 'C', amount: '' },
  { sym: 'H', amount: '' },
  { sym: 'O', amount: '' },
]

export default function Empirisk() {
  const { t, num } = useFormat()
  const [unit, setUnit] = useState('percent')
  const [rows, setRows] = useState(START)

  const filled = rows.some((r) => r.amount.trim())
  const res = filled ? empiricalFormula(rows) : null
  const sum = rows.reduce((acc, r) => {
    const d = parseDecimal(r.amount)
    return d ? add(acc, d) : acc
  }, { int: 0n, scale: 0 })
  const sumNum = Number(toString(sum))
  const sumOff = unit === 'percent' && res?.ok && (sumNum < 99 || sumNum > 101)

  // One element per field, so capitalising is never ambiguous here (unlike
  // the calculator, where co could be Co or CO).
  const symbol = (v) => v.trim().slice(0, 1).toUpperCase() + v.trim().slice(1, 2).toLowerCase()
  const update = (i, key) => (e) => {
    const value = key === 'sym' ? symbol(e.target.value) : e.target.value
    setRows((list) => list.map((r, j) => (j === i ? { ...r, [key]: value } : r)))
  }
  const remove = (i) => setRows((list) => list.filter((_, j) => j !== i))
  const addRow = () => setRows((list) => [...list, { sym: '', amount: '' }])
  const unitLabel = unit === 'percent' ? '%' : 'g'

  return (
    <div className="page">
      <Seo page="empirical" path="/empirisk" />
      <h1 className="page__title">{t('empirical.title')}</h1>
      <p className="page__intro">{t('empirical.intro')}</p>

      <div className="card stack">
        <Segmented
          label={t('empirical.unit')}
          value={unit}
          onChange={setUnit}
          options={[
            { value: 'percent', label: t('empirical.unitPercent') },
            { value: 'grams', label: t('empirical.unitGrams') },
          ]}
        />
        {rows.map((r, i) => (
          <div className="emp-row" key={i}>
            <input
              className="input emp-row__sym"
              name={`sym-${i}`}
              value={r.sym}
              onChange={update(i, 'sym')}
              aria-label={`${t('empirical.element')} ${i + 1}`}
              autoCapitalize="characters"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              maxLength={2}
            />
            <input
              className="input num"
              name={`amount-${i}`}
              value={r.amount}
              onChange={update(i, 'amount')}
              inputMode="decimal"
              autoComplete="off"
              aria-label={`${t('empirical.amount')} ${r.sym || i + 1}`}
              aria-invalid={res && !res.ok && res.row === i ? 'true' : undefined}
            />
            <span className="unit">{unitLabel}</span>
            <button type="button" className="icon-btn" onClick={() => remove(i)} aria-label={t('empirical.removeRow', { sym: r.sym || i + 1 })} disabled={rows.length <= 1}>
              <Icon name="trash" size={20} />
            </button>
          </div>
        ))}
        <button type="button" className="btn btn--ghost" onClick={addRow}>
          <Icon name="plus" size={18} /> {t('empirical.addRow')}
        </button>
      </div>

      {res && !res.ok && <p className="note note--warn" aria-live="polite">{t(`empirical.${res.error}`, res.params)}</p>}

      {res?.ok && (
        <section className="card stack" aria-live="polite">
          <div className="emp-result">
            <span className="note">{t('empirical.result')}</span>
            <Formula value={res.formula} className="emp-result__formula" />
          </div>
          {sumOff && <p className="note note--warn">{t('empirical.sumWarning', { sum: num(toString(sum)) })}</p>}
          {res.fuzzy && <p className="note note--warn">{t('empirical.fuzzy')}</p>}

          <h2 className="step__title">{t('empirical.step1')}</h2>
          <ul className="steps num">
            {res.steps.map((s) => (
              <li key={s.sym}>
                n({s.sym}) = {num(s.amount)} g / {num(s.mass)} g/mol = <strong>{num(s.moles)} mol</strong>
              </li>
            ))}
          </ul>

          <h2 className="step__title">{t('empirical.step2')}</h2>
          <ul className="steps num">
            {res.steps.map((s) => (
              <li key={s.sym}>
                {s.sym}: {num(s.moles)} / {num(res.smallest)} = <strong>{num(s.ratio)}</strong>
              </li>
            ))}
          </ul>

          <h2 className="step__title">{res.multiplier > 1 ? t('empirical.step3', { k: res.multiplier }) : t('empirical.step3one')}</h2>
          <ul className="steps num">
            {res.steps.map((s) => (
              <li key={s.sym}>
                {s.sym}: {res.multiplier > 1 ? `${num(s.ratio)} × ${res.multiplier} = ${num(s.scaled)} ≈ ` : `${num(s.ratio)} ≈ `}
                <strong>{s.whole}</strong>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
