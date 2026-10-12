import { memo } from 'react'
import { ELEMENTS } from '../../data/elements.js'
import { position } from '../../lib/periodic.js'
import { formatDecimal } from '../../utils/format.js'
import './periodic.css'

// Colour-coded like the exam sheet. Cells keep a 52 px minimum, so on a
// phone the table scrolls sideways instead of shrinking below tap size.
function PeriodicTable({ lang, onSelect, selected }) {
  return (
    <div className="ptable">
      {ELEMENTS.map((e) => {
        const { row, col } = position(e.z)
        return (
          <button
            key={e.z}
            type="button"
            className={`pcell cat-${e.cat} ${selected === e.z ? 'is-selected' : ''}`}
            style={{ gridRow: row, gridColumn: col }}
            onClick={() => onSelect(e)}
            aria-label={`${e.z} ${e.sym}, ${e.name[lang] || e.name.nb}`}
          >
            <span className="pcell__z">{e.z}</span>
            <span className="pcell__sym">{e.sym}</span>
            <span className="pcell__mass">{e.stable ? formatDecimal(e.mass, lang) : `(${e.mass})`}</span>
          </button>
        )
      })}
      <span className="ptable__gap" style={{ gridRow: 8, gridColumn: '1 / -1' }} aria-hidden="true" />
    </div>
  )
}

export default memo(PeriodicTable)
