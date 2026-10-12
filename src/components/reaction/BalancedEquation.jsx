import Formula from '../chem/Formula.jsx'

// 4Fe + 3O₂ → 2Fe₂O₃ — coefficients in the accent colour so the part the
// student had to work out stands out from what they typed.
export default function BalancedEquation({ species, coefficients }) {
  const side = (n) =>
    species
      .map((s, i) => ({ s, c: coefficients[i], i }))
      .filter(({ s }) => s.side === n)
  const render = (list) =>
    list.map(({ s, c, i }, j) => (
      <span key={i} className="eq__term">
        {j > 0 && <span className="eq__op">+</span>}
        {c > 1 && <span className="eq__coef">{c}</span>}
        {s.electron ? (
          <span className="formula">
            e<sup>−</sup>
          </span>
        ) : (
          <Formula value={s.formula} />
        )}
      </span>
    ))
  return (
    <p className="eq">
      {render(side(0))}
      <span className="eq__arrow" aria-label="→">→</span>
      {render(side(1))}
    </p>
  )
}
