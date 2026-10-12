import { useState } from 'react'
import Seo from '../components/layout/Seo.jsx'
import Segmented from '../components/ui/Segmented.jsx'
import FormulaInput from '../components/chem/FormulaInput.jsx'
import { useMolarMass } from '../hooks/useMolarMass.js'
import { useFormat } from '../hooks/useFormat.js'
import { useCalculator } from '../store/calculator.js'
import { solveConcentration, solveDilution } from '../lib/concentration.js'
import '../components/extras/extras.css'
import '../components/reaction/reaction.css'

const EMPTY_C = { m: '', n: '', V: '', c: '', M: '' }
const EMPTY_D = { c1: '', V1: '', c2: '', V2: '' }

// One labelled number field. A value the page worked out is shown as an
// accent placeholder, so the student's own numbers are never overwritten.
function NumberField({ id, label, unit, value, computed, onChange, invalid, readOnly, note }) {
  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>{label}</label>
      <div className="field__row">
        <input
          id={id}
          name={id}
          className={`input num ${computed && !value ? 'input--computed' : ''}`}
          inputMode="decimal"
          autoComplete="off"
          value={value}
          placeholder={computed || ''}
          onChange={(e) => onChange(e.target.value)}
          readOnly={readOnly}
          aria-invalid={invalid ? 'true' : undefined}
        />
        <span className="unit">{unit}</span>
      </div>
      {note && <span className="note">{note}</span>}
    </div>
  )
}

export default function Konsentrasjon() {
  const { t, num } = useFormat()
  const [tab, setTab] = useState('c')
  const [unit, setUnit] = useState('mL')
  const [formula, setFormula] = useState(() => useCalculator.getState().formula)
  const [cv, setCv] = useState(EMPTY_C)
  const [dv, setDv] = useState(EMPTY_D)
  const { parsed, result, canonical, mode } = useMolarMass(formula)

  const fromFormula = !!result
  const conc = solveConcentration({ ...cv, M: fromFormula ? result.value : cv.M }, { mode, volumeUnit: unit })
  const dil = solveDilution(dv, mode)

  const shownC = (k) => (conc.ok && conc.values[k] ? num(conc.values[k].value) : '')
  const computedC = (k) => (conc.ok && conc.values[k]?.computed ? num(conc.values[k].value) : '')
  const setC = (k) => (value) => setCv((s) => ({ ...s, [k]: value }))
  const setD = (k) => (value) => setDv((s) => ({ ...s, [k]: value }))

  const step = ({ id }) => {
    const V = `${shownC('VL')} L`
    switch (id) {
      case 'nFromM': return `n = m / M = ${shownC('m')} g / ${shownC('M')} g/mol = ${shownC('n')} mol`
      case 'nFromC': return `n = c · V = ${shownC('c')} mol/L · ${V} = ${shownC('n')} mol`
      case 'c': return `c = n / V = ${shownC('n')} mol / ${V} = ${shownC('c')} mol/L`
      case 'V': return `V = n / c = ${shownC('n')} mol / ${shownC('c')} mol/L = ${V}`
      case 'm': return `m = n · M = ${shownC('n')} mol · ${shownC('M')} g/mol = ${shownC('m')} g`
      default: return ''
    }
  }
  const errorFor = (res, field) => (res.error === 'badNumber' ? t('conc.badNumber', { field }) : t(`conc.${res.error}`))
  const dilFormula = dil.ok && {
    V2: `V₂ = c₁ · V₁ / c₂ = ${num(dv.c1)} · ${num(dv.V1)} / ${num(dv.c2)} = ${num(dil.value)}`,
    V1: `V₁ = c₂ · V₂ / c₁ = ${num(dv.c2)} · ${num(dv.V2)} / ${num(dv.c1)} = ${num(dil.value)}`,
    c2: `c₂ = c₁ · V₁ / V₂ = ${num(dv.c1)} · ${num(dv.V1)} / ${num(dv.V2)} = ${num(dil.value)} mol/L`,
    c1: `c₁ = c₂ · V₂ / V₁ = ${num(dv.c2)} · ${num(dv.V2)} / ${num(dv.V1)} = ${num(dil.value)} mol/L`,
  }[dil.solve]

  return (
    <div className="page">
      <Seo page="conc" path="/konsentrasjon" />
      <h1 className="page__title">{t('conc.title')}</h1>
      <Segmented
        label={t('conc.title')}
        value={tab}
        onChange={setTab}
        options={[
          { value: 'c', label: t('conc.tabC') },
          { value: 'd', label: t('conc.tabD') },
        ]}
      />

      {tab === 'c' ? (
        <>
          <p className="page__intro">{t('conc.introC')}</p>
          <div className="card stack">
            <FormulaInput
              id="conc-formula"
              label={t('amount.formula')}
              help={t('amount.formulaHelp')}
              value={formula}
              onChange={setFormula}
              parsed={parsed}
              onPick={setFormula}
            />
            <NumberField
              id="conc-M"
              label={t('amount.M')}
              unit="g/mol"
              value={fromFormula ? num(result.value) : cv.M}
              readOnly={fromFormula}
              onChange={setC('M')}
              note={fromFormula ? t('amount.fromFormula', { formula: canonical }) : null}
            />
            <NumberField id="conc-m" label={t('amount.m')} unit="g" value={cv.m} computed={computedC('m')} onChange={setC('m')} invalid={conc.field === 'm'} />
            <NumberField id="conc-n" label={t('amount.n')} unit="mol" value={cv.n} computed={computedC('n')} onChange={setC('n')} invalid={conc.field === 'n'} />
            <div className="stack">
              <NumberField id="conc-V" label={t('conc.V')} unit={unit} value={cv.V} computed={computedC('V')} onChange={setC('V')} invalid={conc.field === 'V'} />
              <Segmented
                label={t('conc.volumeUnit')}
                value={unit}
                onChange={setUnit}
                options={[
                  { value: 'mL', label: 'mL' },
                  { value: 'L', label: 'L' },
                ]}
              />
            </div>
            <NumberField id="conc-c" label={t('conc.c')} unit="mol/L" value={cv.c} computed={computedC('c')} onChange={setC('c')} invalid={conc.field === 'c'} />
            <button type="button" className="btn btn--ghost" onClick={() => { setCv(EMPTY_C); setFormula('') }}>
              {t('amount.clear')}
            </button>
          </div>
          <section className="card stack" aria-live="polite">
            <h2 className="answer__title">{t('conc.working')}</h2>
            {conc.ok ? (
              <ul className="steps num answer__eq">
                {unit === 'mL' && cv.V && <li>V = {num(cv.V)} mL = {shownC('VL')} L</li>}
                {conc.steps.map((s) => <li key={s.id}>{step(s)}</li>)}
                {unit === 'mL' && conc.values.V?.computed && <li>V = {shownC('VL')} L = {shownC('V')} mL</li>}
              </ul>
            ) : (
              <p className="note">{errorFor(conc, conc.field)}</p>
            )}
          </section>
        </>
      ) : (
        <>
          <p className="page__intro">{t('conc.introD')}</p>
          <div className="card stack">
            <p className="answer__eq num">c₁ · V₁ = c₂ · V₂</p>
            {[
              ['c1', 'conc.c1', 'mol/L'],
              ['V1', 'conc.V1', t('conc.anyUnit')],
              ['c2', 'conc.c2', 'mol/L'],
              ['V2', 'conc.V2', t('conc.anyUnit')],
            ].map(([k, label, u]) => (
              <NumberField
                key={k}
                id={`dil-${k}`}
                label={t(label)}
                unit={u}
                value={dv[k]}
                computed={dil.ok && dil.solve === k ? num(dil.value) : ''}
                onChange={setD(k)}
                invalid={dil.field === k}
              />
            ))}
            <p className="note">{t('conc.sameUnit')}</p>
            <button type="button" className="btn btn--ghost" onClick={() => setDv(EMPTY_D)}>
              {t('amount.clear')}
            </button>
          </div>
          <section className="card stack" aria-live="polite">
            <h2 className="answer__title">{t('conc.working')}</h2>
            {dil.ok ? (
              <>
                <p className="answer__eq num">{dilFormula}</p>
                {dil.note && <p className="note note--warn">{t(`amount.${dil.note}`)}</p>}
              </>
            ) : (
              <p className="note">{errorFor(dil, dil.field)}</p>
            )}
          </section>
        </>
      )}
    </div>
  )
}
