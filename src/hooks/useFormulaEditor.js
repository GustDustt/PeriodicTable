import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useSettings } from '../store/settings.js'
import { useToast } from '../store/toast.js'
import { deleteBackward, insertText } from '../utils/editing.js'

// Shared by every screen with the chemistry keypad. Keypad edits go through
// the same caret/selection the native input uses, so tapping into the middle
// of "CaOH2" and pressing "(" works as expected. getValue reads the store
// directly so rapid taps never act on a stale render.
export function useFormulaEditor({ value, getValue, setValue }) {
  const { t } = useTranslation()
  const showToast = useToast((s) => s.show)
  const keypadOn = useSettings((s) => s.keypad)
  const setKeypad = useSettings((s) => s.setKeypad)
  const inputRef = useRef(null)
  const caret = useRef(null)
  const focusAfterToggle = useRef(false)

  useLayoutEffect(() => {
    const el = inputRef.current
    if (caret.current == null || !el) return
    el.setSelectionRange(caret.current, caret.current)
    caret.current = null
  }, [value])

  useEffect(() => {
    if (!focusAfterToggle.current) return
    focusAfterToggle.current = false
    if (keypadOn) inputRef.current?.blur()
    else inputRef.current?.focus()
  }, [keypadOn])

  const edit = useCallback(
    (fn) => {
      const el = inputRef.current
      const current = getValue()
      const start = el ? el.selectionStart : current.length
      const end = el ? el.selectionEnd : current.length
      const next = fn(current, start, end)
      caret.current = next.caret
      setValue(next.value)
    },
    [getValue, setValue],
  )

  const insert = useCallback((text) => edit((v, s, e) => insertText(v, s, e, text)), [edit])
  const backspace = useCallback(() => edit(deleteBackward), [edit])

  const replace = useCallback(
    (next, at = next.length) => {
      caret.current = at
      setValue(next)
    },
    [setValue],
  )

  const clear = useCallback(() => {
    const previous = getValue()
    if (!previous) return
    caret.current = 0
    setValue('')
    showToast(t('calc.cleared'), {
      label: t('calc.undo'),
      run: () => {
        caret.current = previous.length
        setValue(previous)
      },
    })
  }, [getValue, setValue, showToast, t])

  const toggleKeypad = useCallback(() => {
    focusAfterToggle.current = true
    setKeypad(!useSettings.getState().keypad)
  }, [setKeypad])

  return { inputRef, insert, backspace, clear, replace, keypadOn, toggleKeypad }
}
