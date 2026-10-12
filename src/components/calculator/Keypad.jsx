import { useTranslation } from 'react-i18next'
import Icon from '../ui/Icon.jsx'
import { useLongPress } from '../../hooks/useLongPress.js'
import './keypad.css'

const DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map((k) => ({ k }))

// 6 columns so every key is ≥ 52 px wide on a 375 px phone. Order follows
// frequency: digits first, brackets next, rarely used charge signs last.
export const FORMULA_KEYS = [
  ...DIGITS,
  { k: '(', label: 'keys.open' }, { k: ')', label: 'keys.close' },
  { k: '[', label: 'keys.openSquare' }, { k: ']', label: 'keys.closeSquare' }, { k: '·', label: 'keys.dot' },
  { k: '+', label: 'keys.plus' }, { k: '-', text: '−', label: 'keys.minus' },
]

// Sum mode: operators insert with spaces so "Na + Cl + O × 2" stays readable
// in the field; the parser ignores the spaces either way.
export const SUM_KEYS = [
  ...DIGITS,
  { k: '(', label: 'keys.open' }, { k: ')', label: 'keys.close' },
  { k: ' + ', text: '+', label: 'keys.add' }, { k: ' − ', text: '−', label: 'keys.subtract' },
  { k: ' × ', text: '×', label: 'keys.times' }, { k: '·', label: 'keys.dot' },
]

// Keeps focus (and the caret) in the formula field when a key is clicked.
const keepFocus = (e) => e.preventDefault()

export default function Keypad({ keys = FORMULA_KEYS, onInsert, onBackspace, onClear }) {
  const { t } = useTranslation()
  const backspace = useLongPress(onClear, onBackspace)
  // ⌫ fills whatever is left of the last row.
  const span = 6 - (keys.length % 6)
  return (
    <div className="keypad" role="group" aria-label={t('calc.keypad')}>
      {keys.map(({ k, text, label }) => (
        <button
          key={k}
          type="button"
          className={`key num ${/\d/.test(k) ? '' : 'key--op'}`}
          onMouseDown={keepFocus}
          onClick={() => onInsert(k)}
          aria-label={label ? t(label) : undefined}
        >
          {text || k}
        </button>
      ))}
      <button
        type="button"
        className="key key--op key--del"
        style={span > 1 ? { gridColumn: `span ${span}` } : undefined}
        onMouseDown={keepFocus}
        aria-label={t('calc.backspace')}
        {...backspace}
      >
        <Icon name="backspace" size={26} />
      </button>
    </div>
  )
}
