import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import Seo from '../components/layout/Seo.jsx'
import ResultCard from '../components/calculator/ResultCard.jsx'
import FormulaField from '../components/calculator/FormulaField.jsx'
import Breakdown from '../components/calculator/Breakdown.jsx'
import HistoryChips from '../components/calculator/HistoryChips.jsx'
import CalcPad from '../components/calculator/CalcPad.jsx'
import { useMolarMass } from '../hooks/useMolarMass.js'
import { useFormat } from '../hooks/useFormat.js'
import { useCopy } from '../hooks/useCopy.js'
import { useFormulaEditor } from '../hooks/useFormulaEditor.js'
import { useCalculator } from '../store/calculator.js'
import { useHistory } from '../store/history.js'
import { useToast } from '../store/toast.js'
import '../components/calculator/calculator.css'

// A formula counts as "used" once the student has stopped typing on a valid
// one for this long; saving on every keystroke would fill history with H, H2…
const REMEMBER_AFTER_MS = 1500

const getFormula = () => useCalculator.getState().formula

export default function Calculator() {
  const { t, num } = useFormat()
  const formula = useCalculator((s) => s.formula)
  const setFormula = useCalculator((s) => s.setFormula)
  const { parsed, result, canonical, mode } = useMolarMass(formula)
  const favourites = useHistory((s) => s.favourites)
  const remember = useHistory((s) => s.remember)
  const toggleFavourite = useHistory((s) => s.toggleFavourite)
  const showToast = useToast((s) => s.show)
  const copy = useCopy()
  const editor = useFormulaEditor({ value: formula, getValue: getFormula, setValue: setFormula })
  const [params, setParams] = useSearchParams()

  // /?f=Fe lets the periodic table and shared links prefill the calculator.
  useEffect(() => {
    const f = params.get('f')
    if (f != null) {
      setFormula(f)
      setParams({}, { replace: true })
    }
  }, [params, setParams, setFormula])

  useEffect(() => {
    if (!canonical) return
    const timer = setTimeout(() => remember(canonical), REMEMBER_AFTER_MS)
    return () => clearTimeout(timer)
  }, [canonical, remember])

  const pick = editor.replace

  const onCopy = async () => {
    if (!result) return
    const text = `${num(result.value)} g/mol`
    const ok = await copy(text)
    showToast(ok ? t('calc.copied', { value: text }) : t('calc.copyFailed'))
    if (ok && canonical) remember(canonical)
  }

  return (
    <div className="calc">
      <Seo page="calculator" path="/" app />
      <h1 className="visually-hidden">{t('seo.calculator.title')}</h1>

      <div className="calc__main">
        <div className="calc__head">
          <ResultCard
            formula={formula}
            parsed={parsed}
            result={result}
            canonical={canonical}
            favourite={!!canonical && favourites.includes(canonical)}
            onToggleFavourite={() => canonical && toggleFavourite(canonical)}
            onCopy={onCopy}
            onPick={pick}
          />
          <FormulaField
            ref={editor.inputRef}
            value={formula}
            onChange={setFormula}
            keypadOn={editor.keypadOn}
            onToggleKeypad={editor.toggleKeypad}
            onEnter={() => canonical && remember(canonical)}
          />
        </div>
        <div className="calc__scroll">
          <HistoryChips onPick={pick} />
          <Breakdown result={result} mode={mode} />
        </div>
      </div>

      <CalcPad
        onInsert={editor.insert}
        onBackspace={editor.backspace}
        onClear={editor.clear}
        keypadOn={editor.keypadOn}
      />
    </div>
  )
}
