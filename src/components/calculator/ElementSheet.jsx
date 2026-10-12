import { useMemo, useState } from 'react'
import Sheet from '../ui/Sheet.jsx'
import { ELEMENTS } from '../../data/elements.js'
import { useFormat } from '../../hooks/useFormat.js'
import { useMediaQuery } from '../../hooks/useMediaQuery.js'
import './keypad.css'

// Lazy-loaded: the full list only matters once "Alle" is tapped. A dense
// grid in atomic-number order beats a scaled-down periodic table here,
// because every cell stays a real 48 px touch target.
export default function ElementSheet({ open, onClose, onPick }) {
  const { t, lang, num } = useFormat()
  const [query, setQuery] = useState('')
  const fine = useMediaQuery('(pointer: fine)')

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return ELEMENTS
    return ELEMENTS.filter(
      (e) =>
        e.sym.toLowerCase().startsWith(q) ||
        e.name.nb.toLowerCase().includes(q) ||
        e.name.en.toLowerCase().includes(q) ||
        String(e.z) === q,
    )
  }, [query])

  return (
    <Sheet open={open} onClose={onClose} title={t('sheet.allTitle')} wide>
      <input
        className="input elsheet__search"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t('sheet.search')}
        aria-label={t('sheet.search')}
        autoFocus={fine}
      />
      {list.length === 0 && <p className="note">{t('sheet.noMatch')}</p>}
      <div className="elgrid">
        {list.map((e) => (
          <button
            key={e.z}
            type="button"
            className={`elcell cat-${e.cat}`}
            onClick={() => onPick(e.sym)}
            aria-label={`${e.sym}, ${e.name[lang] || e.name.nb}`}
          >
            <span className="elcell__z num">{e.z}</span>
            <span className="elcell__sym">{e.sym}</span>
            <span className="elcell__mass num">{e.stable ? num(e.mass) : `(${e.mass})`}</span>
          </button>
        ))}
      </div>
    </Sheet>
  )
}
