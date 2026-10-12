import { useMemo, useState } from 'react'
import Formula from '../chem/Formula.jsx'
import { useFormat } from '../../hooks/useFormat.js'
import { useSettings } from '../../store/settings.js'
import { stoichiometry } from '../../lib/stoichiometry.js'

// "How many grams of O₂ for 10 g Fe?" Type a mass for any substance; every
// other amount follows from the coefficients. With two or more reactant
// masses the limiting reactant and the leftover excess are shown.
export default function StoichTable({ species, coefficients }) {
  const { t, num } = useFormat()
  const mode = useSettings((s) => s.mode)
  const perElement = useSettings((s) => s.perElement)
  // Masses belong to one equation; a different set of species starts empty.
  const signature = species.map((s) => `${s.side}:${s.formula}`).join('|')
  const [state, setState] = useState({ signature, masses: [] })
  const masses = state.signature === signature ? state.masses : []
  const setMass = (i, v) => {
    const next = [...masses]
    next[i] = v
    setState({ signature, masses: next })
  }

  const res = useMemo(
    () => stoichiometry(species, coefficients, masses, { mode, perElement }),
    [species, coefficients, masses, mode, perElement],
  )
  const rows = res.ok ? res.rows : null

  return (
    <section className="card stack">
      <div>
        <h2 className="section__title">{t('reaction.stoichTitle')}</h2>
        <p className="note">{t('reaction.stoichIntro')}</p>
      </div>
      <ul className="stoich">
        {species.map((s, i) => {
          if (s.electron) return null
          const row = rows?.[i]
          const given = !!(masses[i] || '').trim()
          return (
            <li key={i} className={`stoich__row ${res.limiting === i ? 'is-limiting' : ''}`}>
              <div className="stoich__head num">
                <span className="stoich__species">
                  {coefficients[i] > 1 && <span className="eq__coef">{coefficients[i]}</span>}
                  <Formula value={s.formula} />
                </span>
                <span className="stoich__side">{s.side === 0 ? t('reaction.reactant') : t('reaction.product')}</span>
                {res.limiting === i && <span className="badge">{t('reaction.limiting')}</span>}
              </div>
              <div className="field__row">
                <input
                  className={`input num ${!given && row ? 'input--computed' : ''}`}
                  name={`mass-${i}`}
                  inputMode="decimal"
                  autoComplete="off"
                  aria-label={t('reaction.massOf', { formula: s.formula })}
                  value={masses[i] ?? ''}
                  placeholder={row ? num(row.m) : 'm'}
                  onChange={(e) => setMass(i, e.target.value)}
                  aria-invalid={res.error?.row === i ? 'true' : undefined}
                />
                <span className="unit">g</span>
              </div>
              {row && (
                <p className="stoich__calc num">
                  M = {num(row.M)} g/mol · n = {num(row.n)} mol
                  {!given && (
                    <>
                      {' '}· <strong>m = {num(row.m)} g</strong>
                    </>
                  )}
                </p>
              )}
              {row?.excessM && (
                <p className="note note--warn num">{t('reaction.excess', { m: num(row.excessM), n: num(row.excessN) })}</p>
              )}
            </li>
          )
        })}
      </ul>
      {!res.ok && res.error.code === 'badNumber' && <p className="note note--warn">{t('reaction.badNumber')}</p>}
      {masses.some((m) => (m || '').trim()) && (
        <button type="button" className="btn btn--ghost" onClick={() => setState({ signature, masses: [] })}>
          {t('amount.clear')}
        </button>
      )}
    </section>
  )
}
