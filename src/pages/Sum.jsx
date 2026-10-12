import { useMemo } from 'react'
import Seo from '../components/layout/Seo.jsx'
import ResultCard from '../components/calculator/ResultCard.jsx'
import FormulaField from '../components/calculator/FormulaField.jsx'
import SumBreakdown from '../components/calculator/SumBreakdown.jsx'
import CalcPad from '../components/calculator/CalcPad.jsx'
import { SUM_KEYS } from '../components/calculator/Keypad.jsx'
import Expression from '../components/chem/Expression.jsx'
import { useFormat } from '../hooks/useFormat.js'
import { useCopy } from '../hooks/useCopy.js'
import { useFormulaEditor } from '../hooks/useFormulaEditor.js'
import { useCalculator } from '../store/calculator.js'
import { useSettings } from '../store/settings.js'
import { useToast } from '../store/toast.js'
import { parseExpression, expressionMass } from '../lib/expression.js'
import '../components/calculator/calculator.css'

const EXAMPLES = ['Na + Cl + O × 2', '2 × H2O + CO2', 'CuSO4·5H2O − 5 × H2O']
const getExpression = () => useCalculator.getState().expression
const renderExample = (f) => <Expression value={f} />

// Same screen as the formula calculator, but the input is a sum of terms:
// "Na + Cl + O × 2". Handy when writing atoms out is quicker than a formula.
export default function Sum() {
  const { t, num } = useFormat()
  const expression = useCalculator((s) => s.expression)
  const setExpression = useCalculator((s) => s.setExpression)
  const mode = useSettings((s) => s.mode)
  const perElement = useSettings((s) => s.perElement)
  const showToast = useToast((s) => s.show)
  const copy = useCopy()
  const editor = useFormulaEditor({ value: expression, getValue: getExpression, setValue: setExpression })

  const parsed = useMemo(() => parseExpression(expression), [expression])
  const result = useMemo(
    () => (parsed.ok ? expressionMass(parsed.terms, { mode, perElement }) : null),
    [parsed, mode, perElement],
  )

  // An ambiguous lowercase term ("co") is replaced in place by the reading
  // the student taps, leaving the rest of the sum untouched.
  const pick = (choice) => {
    if (parsed.range) {
      const [a, b] = parsed.range
      editor.replace(expression.slice(0, a) + choice + expression.slice(b), a + choice.length)
    } else {
      editor.replace(choice)
    }
  }

  const onCopy = async () => {
    if (!result) return
    const text = `${num(result.value)} g/mol`
    const ok = await copy(text)
    showToast(ok ? t('calc.copied', { value: text }) : t('calc.copyFailed'))
  }

  return (
    <div className="calc">
      <Seo page="sum" path="/sum" />
      <h1 className="visually-hidden">{t('seo.sum.title')}</h1>

      <div className="calc__main">
        <div className="calc__head">
          <ResultCard
            formula={expression}
            parsed={parsed}
            result={result}
            canonical={null}
            showFavourite={false}
            onCopy={onCopy}
            onPick={pick}
            examples={EXAMPLES}
            renderExample={renderExample}
            rendered={parsed.ok ? <Expression terms={parsed.terms} className="result__chem" /> : null}
          />
          <FormulaField
            ref={editor.inputRef}
            value={expression}
            onChange={setExpression}
            keypadOn={editor.keypadOn}
            onToggleKeypad={editor.toggleKeypad}
            onEnter={() => {}}
            label={t('sum.inputLabel')}
            placeholder={t('sum.placeholder')}
          />
        </div>
        <div className="calc__scroll">
          {!expression.trim() && <p className="note">{t('sum.help')}</p>}
          <SumBreakdown result={result} mode={mode} />
        </div>
      </div>

      <CalcPad
        keys={SUM_KEYS}
        onInsert={editor.insert}
        onBackspace={editor.backspace}
        onClear={editor.clear}
        keypadOn={editor.keypadOn}
      />
    </div>
  )
}
