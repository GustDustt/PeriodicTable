import { useTranslation } from 'react-i18next'
import Segmented from '../ui/Segmented.jsx'
import Switch from '../ui/Switch.jsx'
import { DP_RANGE, SF_RANGE } from '../../lib/rounding.js'
import { massOf } from '../../lib/mass.js'
import { useSettings } from '../../store/settings.js'
import { useFormat } from '../../hooks/useFormat.js'
import './rounding.css'

const range = ([lo, hi]) => Array.from({ length: hi - lo + 1 }, (_, i) => lo + i)
// Glucose shows the per-atom switch's effect at most settings, so the
// example makes the difference visible before the student commits to it.
const EXAMPLE = 'C6H12O6'

export default function RoundingControls() {
  const { t } = useTranslation()
  const { num } = useFormat()
  const mode = useSettings((s) => s.mode)
  const perElement = useSettings((s) => s.perElement)
  const setMode = useSettings((s) => s.setMode)
  const setPerElement = useSettings((s) => s.setPerElement)

  const pickType = (type) => {
    if (type === mode.type) return
    setMode(type === 'exact' ? { type } : { type, digits: type === 'dp' ? 2 : 3 })
  }
  const digits = mode.type === 'dp' ? range(DP_RANGE) : mode.type === 'sf' ? range(SF_RANGE) : []
  const example = massOf(EXAMPLE, { mode, perElement }).result.value

  return (
    <div className="rounding">
      <Segmented
        label={t('rounding.title')}
        value={mode.type}
        onChange={pickType}
        options={[
          { value: 'exact', label: t('rounding.modeExact') },
          { value: 'dp', label: t('rounding.modeDp') },
          { value: 'sf', label: t('rounding.modeSf') },
        ]}
      />
      {digits.length > 0 && (
        <div className="digits" role="radiogroup" aria-label={t('rounding.digits')}>
          {digits.map((d) => (
            <button
              key={d}
              type="button"
              role="radio"
              aria-checked={mode.digits === d}
              className="digits__opt num"
              onClick={() => setMode({ type: mode.type, digits: d })}
            >
              {d}
            </button>
          ))}
        </div>
      )}
      <Switch
        label={t('rounding.perElement')}
        help={mode.type === 'exact' ? t('rounding.perElementExact') : t('rounding.perElementHelp')}
        checked={perElement}
        disabled={mode.type === 'exact'}
        onChange={setPerElement}
      />
      <p className="note num">{t('rounding.example', { value: num(example) })}</p>
    </div>
  )
}
