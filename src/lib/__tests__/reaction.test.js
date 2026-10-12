import { describe, expect, it } from 'vitest'
import { parseExpression, expressionMass, expressionText } from '../expression.js'
import { parseEquation, balance, equationText } from '../equation.js'
import { stoichiometry } from '../stoichiometry.js'

const dp = (digits) => ({ type: 'dp', digits })

describe('parseExpression / expressionMass', () => {
  const value = (s, mode = dp(2)) => {
    const p = parseExpression(s)
    expect(p.ok).toBe(true)
    return expressionMass(p.terms, { mode }).value
  }

  it('Na + Cl + O * 2', () => {
    const p = parseExpression('Na + Cl + O * 2')
    expect(p.terms.map((t) => [t.formula, t.k])).toEqual([['Na', 1], ['Cl', 1], ['O', 2]])
    expect(expressionMass(p.terms, { mode: { type: 'exact' } }).sum).toBe('90.44')
    expect(expressionMass(p.terms).counts).toEqual({ Na: 1, Cl: 1, O: 2 })
  })

  it('accepts ×, leading multipliers and formulas as terms', () => {
    expect(value('2 × H2O + CO2')).toBe(value('H2O*2+CO2'))
    expect(value('2*H2O')).toBe('36.03')
    expect(value('2H2O')).toBe('36.03')
  })

  it('keeps hydrates intact and supports subtraction', () => {
    expect(value('CuSO4*5H2O')).toBe('249.70')
    expect(value('CuSO4·5H2O − 5H2O', { type: 'exact' })).toBe('159.620')
  })

  it('matches the single-formula result for the same atoms', () => {
    expect(value('Ca + O*2 + H*2')).toBe('74.10')
  })

  it('reports empty terms and bad formulas at the right place', () => {
    expect(parseExpression('Na + ').error).toMatchObject({ code: 'emptyTerm', pos: 4 })
    expect(parseExpression('Na + Xx').error).toMatchObject({ code: 'unknownElement', pos: 6 })
    expect(parseExpression('').error.code).toBe('empty')
    expect(parseExpression('O * 0').error.code).toBe('zeroCount')
  })

  it('offers readings for an ambiguous lowercase term, with its range', () => {
    const p = parseExpression('Na + co')
    expect(p.candidates).toEqual(['CO', 'Co'])
    expect(p.range).toEqual([5, 7])
  })

  it('formats as text', () => {
    expect(expressionText(parseExpression('na+cl - o*2').terms)).toBe('Na + Cl − 2 × O')
  })
})

describe('parseEquation + balance', () => {
  const balanced = (s) => {
    const p = parseEquation(s)
    expect(p.ok).toBe(true)
    const b = balance(p.species)
    expect(b.ok).toBe(true)
    return b.coefficients
  }

  it.each([
    ['Fe + O2 -> Fe2O3', [4, 3, 2]],
    ['H2 + O2 → H2O', [2, 1, 2]],
    ['C3H8 + O2 = CO2 + H2O', [1, 5, 3, 4]],
    ['Al + HCl -> AlCl3 + H2', [2, 6, 2, 3]],
    ['KMnO4 + HCl -> KCl + MnCl2 + H2O + Cl2', [2, 16, 2, 2, 8, 5]],
    ['Fe+O2->Fe2O3', [4, 3, 2]],
    ['CuSO4·5H2O -> CuSO4 + H2O', [1, 1, 5]],
    ['Ca(OH)2 + H3PO4 -> Ca3(PO4)2 + H2O', [3, 2, 1, 6]],
  ])('%s', (eq, coef) => expect(balanced(eq)).toEqual(coef))

  it('balances ionic equations using charge', () => {
    expect(balanced('Cu + Ag+ -> Cu2+ + Ag')).toEqual([1, 2, 1, 2])
    expect(balanced('Na+ + Cl- -> NaCl')).toEqual([1, 1, 1])
    expect(balanced('Fe3+ + e- -> Fe2+')).toEqual([1, 1, 1])
  })

  it('ignores coefficients the student already typed', () => {
    expect(balanced('2H2 + O2 -> 2H2O')).toEqual([2, 1, 2])
  })

  it('explains what is wrong', () => {
    expect(parseEquation('Fe + O2').error.code).toBe('noArrow')
    expect(parseEquation('A -> B -> C').error.code).toBe('twoArrows')
    expect(parseEquation('Fe + -> FeO').error).toMatchObject({ code: 'emptySpecies' })
    expect(parseEquation('Fe + Xx -> FeO').error).toMatchObject({ code: 'unknownElement', pos: 6 })
    expect(balance(parseEquation('Fe + O2 -> FeCl3').species).error).toEqual({ code: 'oneSide', params: { sym: 'O' } })
    expect(balance(parseEquation('H2 + O2 -> H2O + H2O2').species).error.code).toBe('multipleSolutions')
  })
})

describe('stoichiometry', () => {
  const setup = (eq) => {
    const p = parseEquation(eq)
    return { species: p.species, coef: balance(p.species).coefficients }
  }

  it('mass of product from one reactant', () => {
    const { species, coef } = setup('Fe + O2 -> Fe2O3')
    const r = stoichiometry(species, coef, ['10', '', ''], { mode: dp(2) })
    expect(r.ok).toBe(true)
    // 10 g / 55.85 = 0.17905 mol Fe; Fe2O3 = 0.17905/2 × 159.70 = 14.30 g
    expect(r.rows[2].m).toBe('14.30')
    expect(r.rows[1].m).toBe('4.30')
  })

  it('finds the limiting reactant and the excess', () => {
    const { species, coef } = setup('H2 + O2 -> H2O')
    const r = stoichiometry(species, coef, ['1', '16', ''], { mode: dp(2) })
    // H2: 1 / 2.02 = 0.495 mol needs only 0.248 mol O2 of the 0.5 mol given,
    // so H2 runs out first.
    expect(r.limiting).toBe(0)
    expect(r.rows[2].m).toBe('8.92')
    expect(r.rows[1].excessM).toBe('8.08')
  })

  it('needs at least one mass', () => {
    const { species, coef } = setup('H2 + O2 -> H2O')
    expect(stoichiometry(species, coef, ['', '', ''], { mode: dp(2) }).error.code).toBe('needMass')
    expect(stoichiometry(species, coef, ['abc', '', ''], { mode: dp(2) }).error).toEqual({ code: 'badNumber', row: 0 })
  })
})

describe('equationText', () => {
  it('writes subscripts, charges and coefficients', () => {
    const eq = (s) => {
      const p = parseEquation(s)
      return equationText(p.species, balance(p.species).coefficients)
    }
    expect(eq('Fe + O2 -> Fe2O3')).toBe('4Fe + 3O₂ → 2Fe₂O₃')
    expect(eq('Cu + Ag+ -> Cu2+ + Ag')).toBe('Cu + 2Ag⁺ → Cu²⁺ + 2Ag')
    expect(eq('CuSO4·5H2O -> CuSO4 + H2O')).toBe('CuSO₄·5H₂O → CuSO₄ + 5H₂O')
  })
})
