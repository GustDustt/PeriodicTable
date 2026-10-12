import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import RoundingButton from './RoundingButton.jsx'
import ElementChips from './ElementChips.jsx'
import Keypad from './Keypad.jsx'

const loadElementSheet = () => import('./ElementSheet.jsx')
const ElementSheet = lazy(loadElementSheet)

// The thumb-zone half of a calculator screen: rounding, element chips,
// keypad and the "Alle" sheet. Shared by the formula and sum calculators.
export default function CalcPad({ onInsert, onBackspace, onClear, keypadOn, keys }) {
  const [sheetMounted, setSheetMounted] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)

  // Fetch the sheets once the answer is on screen and the main thread is
  // idle, so the first tap on "Alle" or the rounding pill opens instantly.
  useEffect(() => {
    const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 1200))
    const cancel = window.cancelIdleCallback || clearTimeout
    const id = idle(() => {
      loadElementSheet()
      import('./RoundingSheet.jsx')
    })
    return () => cancel(id)
  }, [])

  const openSheet = () => {
    setSheetMounted(true)
    setSheetOpen(true)
  }
  const closeSheet = useCallback(() => setSheetOpen(false), [])
  const pickElement = useCallback(
    (sym) => {
      onInsert(sym)
      setSheetOpen(false)
    },
    [onInsert],
  )

  return (
    <div className="calc__pad">
      <div className="calc__tools">
        <RoundingButton />
      </div>
      <ElementChips onInsert={onInsert} onOpenAll={openSheet} />
      {keypadOn && <Keypad keys={keys} onInsert={onInsert} onBackspace={onBackspace} onClear={onClear} />}
      {sheetMounted && (
        <Suspense fallback={null}>
          <ElementSheet open={sheetOpen} onClose={closeSheet} onPick={pickElement} />
        </Suspense>
      )}
    </div>
  )
}
