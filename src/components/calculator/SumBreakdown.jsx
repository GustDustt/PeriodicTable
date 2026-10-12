import Icon from '../ui/Icon.jsx'
import Formula from '../chem/Formula.jsx'
import { useFormat } from '../../hooks/useFormat.js'
import { useSettings } from '../../store/settings.js'
import './breakdown.css'

// Working for the sum calculator: one row per term (factor × M = subtotal),
// then the sum and the rounded answer — same layout as the formula working.
export default function SumBreakdown({ result, mode }) {
  const { t, num, modeLabel } = useFormat()
  const open = useSettings((s) => s.breakdownOpen)
  const setOpen = useSettings((s) => s.setBreakdownOpen)
  if (!result) return null
  const rounded = result.value !== result.sum

  return (
    <section className="breakdown">
      <button type="button" className="breakdown__toggle" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span>{t('breakdown.title')}</span>
        <Icon name="chevron" size={20} className={open ? 'is-flipped' : ''} />
      </button>
      {open && (
        <div className="breakdown__body">
          <p className="note">
            {result.perElement ? t('breakdown.perElement', { mode: modeLabel(mode) }) : t('breakdown.exact')}
          </p>
          <table className="breakdown__table num">
            <thead className="visually-hidden">
              <tr>
                <th scope="col">{t('sum.term')}</th>
                <th scope="col">{t('breakdown.count')}</th>
                <th scope="col">{t('breakdown.mass')}</th>
                <th scope="col">{t('breakdown.subtotal')}</th>
              </tr>
            </thead>
            <tbody>
              {result.lines.map((line, i) => (
                <tr key={i}>
                  <th scope="row" className="bd-term">
                    {line.sign < 0 && '− '}
                    <Formula value={line.formula} />
                  </th>
                  <td className="bd-count">{line.k} ×</td>
                  <td className="bd-mass">{num(line.mass)}</td>
                  <td className="bd-sub">= {num(line.subtotal)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th scope="row" colSpan={3}>{t('breakdown.sum')}</th>
                <td className="bd-sub">{num(result.sum)}</td>
              </tr>
              {rounded && (
                <tr className="bd-final">
                  <th scope="row" colSpan={3}>{t('breakdown.rounded')} ({modeLabel(mode)})</th>
                  <td className="bd-sub">≈ {num(result.value)}</td>
                </tr>
              )}
            </tfoot>
          </table>
        </div>
      )}
    </section>
  )
}
