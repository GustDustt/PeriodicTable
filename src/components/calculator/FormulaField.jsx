import { forwardRef } from 'react'
import { useTranslation } from 'react-i18next'
import Icon from '../ui/Icon.jsx'

// inputMode="none" while the chemistry keypad is shown: the field keeps its
// caret (tap to move it) but the OS keyboard stays down and the screen stays
// visible.
const FormulaField = forwardRef(function FormulaField({ value, onChange, keypadOn, onToggleKeypad, onEnter, label, placeholder }, ref) {
  const { t } = useTranslation()
  return (
    <div className="field-wrap">
      <label className="visually-hidden" htmlFor="formula">{label ?? t('calc.inputLabel')}</label>
      <input
        ref={ref}
        id="formula"
        name="formula"
        className="formula-input num"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onEnter()}
        inputMode={keypadOn ? 'none' : 'text'}
        enterKeyHint="done"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        placeholder={placeholder ?? t('calc.placeholder')}
      />
      <button
        type="button"
        className="icon-btn"
        onClick={onToggleKeypad}
        aria-label={keypadOn ? t('calc.keyboardNative') : t('calc.keyboardCustom')}
        title={keypadOn ? t('calc.keyboardNative') : t('calc.keyboardCustom')}
      >
        <Icon name={keypadOn ? 'keyboard' : 'keypad'} />
      </button>
    </div>
  )
})

export default FormulaField
