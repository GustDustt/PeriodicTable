import { useTranslation } from 'react-i18next'

// Proof that the equation balances: atoms (and charge) left vs right.
export default function AtomCheck({ species, coefficients }) {
  const { t } = useTranslation()
  const totals = {}
  const charge = [0, 0]
  species.forEach((s, i) => {
    const c = coefficients[i]
    for (const sym in s.counts) {
      totals[sym] ??= [0, 0]
      totals[sym][s.side] += s.counts[sym] * c
    }
    charge[s.side] += (s.charge || 0) * c
  })
  const hasCharge = species.some((s) => s.charge)
  const sign = (n) => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : '0')

  return (
    <table className="atomcheck num">
      <caption className="note">{t('reaction.check')}</caption>
      <thead>
        <tr>
          <th scope="col">{t('breakdown.element')}</th>
          <th scope="col">{t('reaction.left')}</th>
          <th scope="col">{t('reaction.right')}</th>
        </tr>
      </thead>
      <tbody>
        {Object.entries(totals).map(([sym, [l, r]]) => (
          <tr key={sym}>
            <th scope="row">{sym}</th>
            <td>{l}</td>
            <td>{r}</td>
          </tr>
        ))}
        {hasCharge && (
          <tr>
            <th scope="row">{t('reaction.charge')}</th>
            <td>{sign(charge[0])}</td>
            <td>{sign(charge[1])}</td>
          </tr>
        )}
      </tbody>
    </table>
  )
}
