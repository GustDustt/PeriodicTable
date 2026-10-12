import { useMemo } from 'react'
import Seo from '../components/layout/Seo.jsx'
import Formula from '../components/chem/Formula.jsx'
import Icon from '../components/ui/Icon.jsx'
import BalancedEquation from '../components/reaction/BalancedEquation.jsx'
import AtomCheck from '../components/reaction/AtomCheck.jsx'
import StoichTable from '../components/reaction/StoichTable.jsx'
import { useFormat } from '../hooks/useFormat.js'
import { useCopy } from '../hooks/useCopy.js'
import { useFormulaEditor } from '../hooks/useFormulaEditor.js'
import { useCalculator } from '../store/calculator.js'
import { useToast } from '../store/toast.js'
import { balance, equationText, parseEquation } from '../lib/equation.js'
import '../components/extras/extras.css'
import '../components/reaction/reaction.css'

const EXAMPLES = ['Fe + O2 → Fe2O3', 'C3H8 + O2 → CO2 + H2O', 'Al + HCl → AlCl3 + H2', 'Cu + Ag+ → Cu2+ + Ag']
// The symbols that are awkward on a phone keyboard, one tap away. The
// hydrate dot is left out: '.' and '*' already work from any keyboard.
const QUICK = [' → ', ' + ', '(', ')']
const getEquation = () => useCalculator.getState().equation
const keepFocus = (e) => e.preventDefault()

export default function Reaksjon() {
  const { t, errorText } = useFormat()
  const equation = useCalculator((s) => s.equation)
  const setEquation = useCalculator((s) => s.setEquation)
  const showToast = useToast((s) => s.show)
  const copy = useCopy()
  const editor = useFormulaEditor({ value: equation, getValue: getEquation, setValue: setEquation })

  const parsed = useMemo(() => parseEquation(equation), [equation])
  const balanced = useMemo(() => (parsed.ok ? balance(parsed.species) : null), [parsed])
  const ok = parsed.ok && balanced?.ok
  const error = !equation.trim() ? null : !parsed.ok ? parsed.error : balanced && !balanced.ok ? balanced.error : null

  const pick = (choice) => {
    const [a, b] = parsed.range
    editor.replace(equation.slice(0, a) + choice + equation.slice(b), a + choice.length)
  }

  const onCopy = async () => {
    const text = equationText(parsed.species, balanced.coefficients)
    const done = await copy(text)
    showToast(done ? t('calc.copied', { value: text }) : t('calc.copyFailed'))
  }

  return (
    <div className="page">
      <Seo page="reaction" path="/reaksjon" />
      <h1 className="page__title">{t('reaction.title')}</h1>
      <p className="page__intro">{t('reaction.intro')}</p>

      <div className="card stack">
        <label className="field__label" htmlFor="equation">{t('reaction.inputLabel')}</label>
        <input
          ref={editor.inputRef}
          id="equation"
          name="equation"
          className="input num"
          value={equation}
          onChange={(e) => setEquation(e.target.value)}
          placeholder="Fe + O2 → Fe2O3"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby="equation-status"
        />
        <div className="quick" role="group" aria-label={t('reaction.quick')}>
          {QUICK.map((q) => (
            <button key={q} type="button" className="chip quick__key" onMouseDown={keepFocus} onClick={() => editor.insert(q)}>
              {q.trim()}
            </button>
          ))}
          <button type="button" className="chip quick__key" onMouseDown={keepFocus} onClick={editor.clear} aria-label={t('amount.clear')}>
            <Icon name="close" size={18} />
          </button>
        </div>
        <div id="equation-status" aria-live="polite">
          {!equation.trim() && (
            <div className="formula-status__choices">
              <span className="note">{t('calc.examplesLabel')}</span>
              {EXAMPLES.map((ex) => (
                <button key={ex} type="button" className="chip" onClick={() => editor.replace(ex)}>
                  {ex}
                </button>
              ))}
            </div>
          )}
          {error && !parsed.candidates && <p className="note note--warn">{errorText(error)}</p>}
          {parsed.candidates && (
            <div className="formula-status__choices">
              <span className="note">{errorText(parsed.error)}</span>
              {parsed.candidates.map((c) => (
                <button key={c} type="button" className="chip" onClick={() => pick(c)}>
                  <Formula value={c} />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {ok && (
        <>
          <section className="card stack" aria-live="polite">
            <div className="eq-head">
              <h2 className="section__title">{t('reaction.balanced')}</h2>
              <button type="button" className="icon-btn result__copy" onClick={onCopy} aria-label={t('reaction.copy')}>
                <Icon name="copy" />
              </button>
            </div>
            <BalancedEquation species={parsed.species} coefficients={balanced.coefficients} />
            <AtomCheck species={parsed.species} coefficients={balanced.coefficients} />
          </section>
          <StoichTable species={parsed.species} coefficients={balanced.coefficients} />
        </>
      )}
    </div>
  )
}
