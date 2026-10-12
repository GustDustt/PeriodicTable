import { useTranslation } from 'react-i18next'
import Formula from '../chem/Formula.jsx'
import Icon from '../ui/Icon.jsx'
import { useHistory } from '../../store/history.js'

// Favourites first (starred), then the last 20 formulas, one tap to reuse.
export default function HistoryChips({ onPick }) {
  const { t } = useTranslation()
  const favourites = useHistory((s) => s.favourites)
  const recent = useHistory((s) => s.recent)
  const rest = recent.filter((f) => !favourites.includes(f))
  if (!favourites.length && !rest.length) return null

  return (
    <section className="history" aria-label={`${t('calc.favourites')}, ${t('calc.recent')}`}>
      <h2 className="history__title">{favourites.length ? `${t('calc.favourites')} · ${t('calc.recent')}` : t('calc.recent')}</h2>
      <div className="chip-row">
        {favourites.map((f) => (
          <button key={`fav-${f}`} type="button" className="chip chip--fav" onClick={() => onPick(f)}>
            <Icon name="star" size={14} filled />
            <Formula value={f} />
          </button>
        ))}
        {rest.map((f) => (
          <button key={f} type="button" className="chip" onClick={() => onPick(f)}>
            <Formula value={f} />
          </button>
        ))}
      </div>
    </section>
  )
}
