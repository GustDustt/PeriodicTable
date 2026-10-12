import { useTranslation } from 'react-i18next'
import Icon from '../ui/Icon.jsx'
import { useLongPress } from '../../hooks/useLongPress.js'
import './keypad.css'

// 6 columns so every key is ≥ 52 px wide on a 375 px phone. Order follows
// frequency: digits first, brackets next, rarely used charge signs last.
const KEYS = [
  { k: '1' }, { k: '2' }, { k: '3' }, { k: '4' }, { k: '5' }, { k: '6' },
  { k: '7' }, { k: '8' }, { k: '9' }, { k: '0' }, { k: '(', label: 'keys.open' }, { k: ')', label: 'keys.close' },
  { k: '[', label: 'keys.openSquare' }, { k: ']', label: 'keys.closeSquare' }, { k: '·', label: 'keys.dot' },
  { k: '+', label: 'keys.plus' }, { k: '-', text: '−', label: 'keys.minus' },
]

// Keeps focus (and the caret) in the formula field when a key is clicked.
const keepFocus = (e) => e.preventDefault()

export default function Keypad({ onInsert, onBackspace, onClear }) {
  const { t } = useTranslation()
  const backspace = useLongPress(onClear, onBackspace)
  return (
    <div className="keypad" role="group" aria-label={t('calc.keypad')}>
      {KEYS.map(({ k, text, label }) => (
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
      <button type="button" className="key key--op key--del" onMouseDown={keepFocus} aria-label={t('calc.backspace')} {...backspace}>
        <Icon name="backspace" size={26} />
      </button>
    </div>
  )
}
