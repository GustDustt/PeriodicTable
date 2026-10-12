import Icon from '../ui/Icon.jsx'
import { useFormat } from '../../hooks/useFormat.js'
import { useSettings } from '../../store/settings.js'
import './breakdown.css'

// The working, written the way a teacher wants it: count × mass = subtotal,
// then the sum, then the rounded answer. The caption says whether the masses
// are the sheet's exact values or already rounded.
export default function Breakdown({ result, mode }) {
  const { t, num, modeLabel } = useFormat()
  const open = useSettings((s) => s.breakdownOpen)
  const setOpen = useSettings((s) => s.setBreakdownOpen)
  if (!result) return null

  const mass = (line) => (line.stable ? num(line.used) : `(${num(line.used)})`)
  const hasUnstable = result.lines.some((l) => !l.stable)
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
                <th scope="col">{t('breakdown.element')}</th>
                <th scope="col">{t('breakdown.count')}</th>
                <th scope="col">{t('breakdown.mass')}</th>
                <th scope="col">{t('breakdown.subtotal')}</th>
              </tr>
            </thead>
            <tbody>
              {result.lines.map((line) => (
                <tr key={line.sym}>
                  <th scope="row">{line.sym}</th>
                  <td className="bd-count">{line.count} ×</td>
                  <td className="bd-mass">{mass(line)}</td>
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
          {hasUnstable && <p className="note">{t('breakdown.unstable')}</p>}
        </div>
      )}
    </section>
  )
}
