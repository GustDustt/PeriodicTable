import { describe, expect, it } from 'vitest'
import { parseFormula, displayTokens } from '../formula.js'

const counts = (f) => parseFormula(f).counts

describe('parseFormula — basics', () => {
  it('parses simple formulas', () => {
    expect(counts('H2O')).toEqual({ H: 2, O: 1 })
    expect(counts('NaCl')).toEqual({ Na: 1, Cl: 1 })
    expect(counts('C6H12O6')).toEqual({ C: 6, H: 12, O: 6 })
  })

  it('handles nested () and []', () => {
    expect(counts('Ca(OH)2')).toEqual({ Ca: 1, O: 2, H: 2 })
    expect(counts('Al2(SO4)3')).toEqual({ Al: 2, S: 3, O: 12 })
    expect(counts('K4[Fe(CN)6]')).toEqual({ K: 4, Fe: 1, C: 6, N: 6 })
  })

  it('treats ·, * and . as hydrate separators', () => {
    const expected = { Cu: 1, S: 1, O: 9, H: 10 }
    expect(counts('CuSO4·5H2O')).toEqual(expected)
    expect(counts('CuSO4*5H2O')).toEqual(expected)
    expect(counts('CuSO4.5H2O')).toEqual(expected)
    expect(parseFormula('CuSO4·5H2O').parts).toHaveLength(2)
  })

  it('applies a leading coefficient to everything', () => {
    expect(counts('2H2O')).toEqual({ H: 4, O: 2 })
    expect(counts('2CuSO4·5H2O')).toEqual({ Cu: 2, S: 2, O: 18, H: 20 })
  })

  it('ignores whitespace and accepts Unicode subscripts', () => {
    expect(counts(' H2 O ')).toEqual({ H: 2, O: 1 })
    expect(counts('H₂O')).toEqual({ H: 2, O: 1 })
    expect(counts('SO₄²⁻')).toEqual({ S: 1, O: 4 })
  })

  it('keeps case: Co is cobalt, CO is carbon monoxide', () => {
    expect(counts('Co')).toEqual({ Co: 1 })
    expect(counts('CO')).toEqual({ C: 1, O: 1 })
  })
})

describe('parseFormula — charges', () => {
  it.each([
    ['Fe2+', { Fe: 1 }, 2],
    ['Fe3+', { Fe: 1 }, 3],
    ['Cl-', { Cl: 1 }, -1],
    ['NH4+', { N: 1, H: 4 }, 1],
    ['OH-', { O: 1, H: 1 }, -1],
    ['SO4^2-', { S: 1, O: 4 }, -2],
    ['SO42-', { S: 1, O: 4 }, -2],
    ['PO4^3-', { P: 1, O: 4 }, -3],
  ])('%s', (f, c, charge) => {
    const r = parseFormula(f)
    expect(r.ok).toBe(true)
    expect(r.counts).toEqual(c)
    expect(r.charge).toBe(charge)
    expect(r.ion).toBe(true)
  })

  it('rejects a charge in the middle', () => {
    expect(parseFormula('Na+Cl').error.code).toBe('chargeNotAtEnd')
  })
})

describe('parseFormula — lowercase input', () => {
  it('auto-capitalises a single valid reading', () => {
    const r = parseFormula('nacl')
    expect(r.ok).toBe(true)
    expect(r.interpreted).toBe('NaCl')
    expect(r.counts).toEqual({ Na: 1, Cl: 1 })
    expect(parseFormula('h2o').interpreted).toBe('H2O')
  })

  it('offers every reading when ambiguous, never guessing', () => {
    const r = parseFormula('co')
    expect(r.ok).toBe(false)
    expect(r.error.code).toBe('ambiguous')
    expect(r.candidates).toEqual(['CO', 'Co'])
  })

  it('does not auto-capitalise mixed case', () => {
    const r = parseFormula('h2O')
    expect(r.ok).toBe(false)
    expect(r.error.code).toBe('lowercase')
    expect(r.error.pos).toBe(1)
  })
})

describe('parseFormula — errors', () => {
  it.each([
    ['Xx2', 'unknownElement', 1],
    ['H2Xx', 'unknownElement', 3],
    ['Ca(OH', 'missingClose', 3],
    ['H2O)', 'unexpectedClose', 4],
    ['', 'empty', undefined],
    ['   ', 'empty', undefined],
    ['5', 'numberWithoutElement', 1],
    ['H0', 'zeroCount', 2],
    ['Ca()', 'emptyGroup', 3],
    ['CuSO4·', 'incompleteHydrate', 6],
    ['Ca(OH]2', 'mismatchedClose', 6],
    ['H2O!', 'unexpectedChar', 4],
  ])('%s -> %s at %s', (f, code, pos) => {
    const r = parseFormula(f)
    expect(r.ok).toBe(false)
    expect(r.error.code).toBe(code)
    expect(r.error.pos).toBe(pos)
  })

  it('reports positions in the original input, whitespace included', () => {
    expect(parseFormula('H2 Xx').error.pos).toBe(4)
  })
})

describe('displayTokens', () => {
  it('marks counts vs coefficients and never throws on partial input', () => {
    const t = displayTokens('2Ca(OH')
    expect(t[0]).toMatchObject({ type: 'number', role: 'coef' })
    expect(displayTokens('CuSO4·5H2O').find((x) => x.raw === '5').role).toBe('coef')
    expect(displayTokens('H2').at(-1).role).toBe('count')
    expect(displayTokens('Fe3+').at(-1)).toMatchObject({ type: 'charge', value: 3 })
  })
})
