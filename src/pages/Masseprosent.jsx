import { useMemo, useState } from 'react'
import Seo from '../components/layout/Seo.jsx'
import FormulaInput from '../components/chem/FormulaInput.jsx'
import { useMolarMass } from '../hooks/useMolarMass.js'
import { useFormat } from '../hooks/useFormat.js'
import { useCalculator } from '../store/calculator.js'
import { massPercent } from '../lib/composition.js'
import { BY_SYMBOL } from '../data/elements.js'
import '../components/extras/extras.css'

export default function Masseprosent() {
  const { t, num, lang } = useFormat()
  const [formula, setFormula] = useState(() => useCalculator.getState().formula)
  const { parsed, mode } = useMolarMass(formula)
  const data = useMemo(() => (parsed.ok ? massPercent(parsed.counts, mode) : null), [parsed, mode])

  return (
    <div className="page">
      <Seo page="percent" path="/masseprosent" />
      <h1 className="page__title">{t('percent.title')}</h1>
      <p className="page__intro">{t('percent.intro')}</p>

      <div className="card">
        <FormulaInput id="percent-formula" label={t('percent.formula')} value={formula} onChange={setFormula} parsed={parsed} onPick={setFormula} />
      </div>

      {data && (
        <section className="card stack" aria-live="polite">
          <p className="note num">{t('percent.total', { value: num(data.total) })}</p>
          <ul className="bars">
            {data.lines.map((l) => (
              <li key={l.sym} className="bar">
                <div className="bar__head num">
                  <span className="bar__sym">{l.sym}</span>
                  <span className="bar__name">{BY_SYMBOL[l.sym].name[lang] || BY_SYMBOL[l.sym].name.nb}</span>
                  <span className="bar__calc">
                    {l.count} × {l.stable ? num(l.mass) : `(${l.mass})`} = {num(l.subtotal)}
                  </span>
                  <strong className="bar__pct">{num(l.percent)} %</strong>
                </div>
                <div className={`bar__track cat-${BY_SYMBOL[l.sym].cat}`} aria-hidden="true">
                  <div className="bar__fill" style={{ transform: `scaleX(${Math.min(1, l.fraction)})` }} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
