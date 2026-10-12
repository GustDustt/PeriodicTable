import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Seo from '../components/layout/Seo.jsx'
import ResultCard from '../components/calculator/ResultCard.jsx'
import FormulaField from '../components/calculator/FormulaField.jsx'
import Breakdown from '../components/calculator/Breakdown.jsx'
import HistoryChips from '../components/calculator/HistoryChips.jsx'
import RoundingButton from '../components/calculator/RoundingButton.jsx'
import ElementChips from '../components/calculator/ElementChips.jsx'
import Keypad from '../components/calculator/Keypad.jsx'
import { useMolarMass } from '../hooks/useMolarMass.js'
import { useFormat } from '../hooks/useFormat.js'
import { useCopy } from '../hooks/useCopy.js'
import { useCalculator } from '../store/calculator.js'
import { useHistory } from '../store/history.js'
import { useSettings } from '../store/settings.js'
import { useToast } from '../store/toast.js'
import { deleteBackward, insertText } from '../utils/editing.js'
import '../components/calculator/calculator.css'

const loadElementSheet = () => import('../components/calculator/ElementSheet.jsx')
const ElementSheet = lazy(loadElementSheet)

// A formula counts as "used" once the student has stopped typing on a valid
// one for this long; saving on every keystroke would fill history with H, H2…
const REMEMBER_AFTER_MS = 1500

export default function Calculator() {
  const { t, num } = useFormat()
  const formula = useCalculator((s) => s.formula)
  const setFormula = useCalculator((s) => s.setFormula)
  const { parsed, result, canonical, mode } = useMolarMass(formula)
  const keypadOn = useSettings((s) => s.keypad)
  const setKeypad = useSettings((s) => s.setKeypad)
  const favourites = useHistory((s) => s.favourites)
  const remember = useHistory((s) => s.remember)
  const toggleFavourite = useHistory((s) => s.toggleFavourite)
  const showToast = useToast((s) => s.show)
  const copy = useCopy()

  const inputRef = useRef(null)
  const caret = useRef(null)
  const focusAfterToggle = useRef(false)
  const [sheetMounted, setSheetMounted] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [params, setParams] = useSearchParams()

  // Fetch the sheets once the answer is on screen and the main thread is
  // idle, so the first tap on "Alle" or the rounding pill opens instantly.
  useEffect(() => {
    const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 1200))
    const cancel = window.cancelIdleCallback || clearTimeout
    const id = idle(() => {
      loadElementSheet()
      import('../components/calculator/RoundingSheet.jsx')
    })
    return () => cancel(id)
  }, [])

  // /?f=Fe lets the periodic table and shared links prefill the calculator.
  useEffect(() => {
    const f = params.get('f')
    if (f != null) {
      setFormula(f)
      setParams({}, { replace: true })
    }
  }, [params, setParams, setFormula])

  useLayoutEffect(() => {
    const el = inputRef.current
    if (caret.current == null || !el) return
    el.setSelectionRange(caret.current, caret.current)
    caret.current = null
  }, [formula])

  useEffect(() => {
    if (!focusAfterToggle.current) return
    focusAfterToggle.current = false
    if (keypadOn) inputRef.current?.blur()
    else inputRef.current?.focus()
  }, [keypadOn])

  useEffect(() => {
    if (!canonical) return
    const timer = setTimeout(() => remember(canonical), REMEMBER_AFTER_MS)
    return () => clearTimeout(timer)
  }, [canonical, remember])

  // Keypad edits go through the same caret/selection the native input uses,
  // so tapping into the middle of "CaOH2" and pressing "(" works as expected.
  const edit = useCallback(
    (fn) => {
      const el = inputRef.current
      const current = useCalculator.getState().formula
      const start = el ? el.selectionStart : current.length
      const end = el ? el.selectionEnd : current.length
      const next = fn(current, start, end)
      caret.current = next.caret
      setFormula(next.value)
    },
    [setFormula],
  )

  const insert = useCallback((text) => edit((v, s, e) => insertText(v, s, e, text)), [edit])
  const backspace = useCallback(() => edit(deleteBackward), [edit])

  const clear = useCallback(() => {
    const previous = useCalculator.getState().formula
    if (!previous) return
    caret.current = 0
    setFormula('')
    showToast(t('calc.cleared'), {
      label: t('calc.undo'),
      run: () => {
        caret.current = previous.length
        setFormula(previous)
      },
    })
  }, [setFormula, showToast, t])

  const pick = useCallback(
    (f) => {
      caret.current = f.length
      setFormula(f)
    },
    [setFormula],
  )

  const onCopy = async () => {
    if (!result) return
    const text = `${num(result.value)} g/mol`
    const ok = await copy(text)
    showToast(ok ? t('calc.copied', { value: text }) : t('calc.copyFailed'))
    if (ok && canonical) remember(canonical)
  }

  const toggleKeypad = () => {
    focusAfterToggle.current = true
    setKeypad(!keypadOn)
  }

  const openSheet = () => {
    setSheetMounted(true)
    setSheetOpen(true)
  }
  const closeSheet = useCallback(() => setSheetOpen(false), [])
  const pickElement = useCallback(
    (sym) => {
      insert(sym)
      setSheetOpen(false)
    },
    [insert],
  )

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
            ref={inputRef}
            value={formula}
            onChange={setFormula}
            keypadOn={keypadOn}
            onToggleKeypad={toggleKeypad}
            onEnter={() => canonical && remember(canonical)}
          />
        </div>
        <div className="calc__scroll">
          <HistoryChips onPick={pick} />
          <Breakdown result={result} mode={mode} />
        </div>
      </div>

      <div className="calc__pad">
        <div className="calc__tools">
          <RoundingButton />
        </div>
        <ElementChips onInsert={insert} onOpenAll={openSheet} />
        {keypadOn && <Keypad onInsert={insert} onBackspace={backspace} onClear={clear} />}
      </div>

      {sheetMounted && (
        <Suspense fallback={null}>
          <ElementSheet open={sheetOpen} onClose={closeSheet} onPick={pickElement} />
        </Suspense>
      )}
    </div>
  )
}
