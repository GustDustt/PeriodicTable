import { useTranslation } from 'react-i18next'
import { COMMON } from '../../lib/periodic.js'
import './keypad.css'

const keepFocus = (e) => e.preventDefault()

export default function ElementChips({ onInsert, onOpenAll }) {
  const { t } = useTranslation()
  return (
    <div className="elchips" role="group" aria-label={t('calc.elements')}>
      <div className="chip-row elchips__scroll">
        {COMMON.map((sym) => (
          <button key={sym} type="button" className="elchip" onMouseDown={keepFocus} onClick={() => onInsert(sym)}>
            {sym}
          </button>
        ))}
      </div>
      <button type="button" className="elchip elchip--all" onMouseDown={keepFocus} onClick={onOpenAll} aria-haspopup="dialog">
        {t('calc.all')}
      </button>
    </div>
  )
}
