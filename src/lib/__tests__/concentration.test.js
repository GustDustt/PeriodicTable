import { describe, expect, it } from 'vitest'
import { solveConcentration, solveDilution } from '../concentration.js'

const dp = (digits) => ({ type: 'dp', digits })
const sf = (digits) => ({ type: 'sf', digits })

describe('solveConcentration', () => {
  it('c from n and V', () => {
    const r = solveConcentration({ n: '0.5', V: '2' }, { mode: dp(3) })
    expect(r.values.c).toMatchObject({ value: '0.250', computed: true })
  })

  it('chains m → n → c with V in mL', () => {
    // 5.844 g NaCl / 58.44 g/mol = 0.1 mol in 250 mL → 0.4 mol/L
    const r = solveConcentration({ m: '5,844', M: '58.44', V: '250' }, { mode: dp(2), volumeUnit: 'mL' })
    expect(r.values.n.value).toBe('0.10')
    expect(r.values.c.value).toBe('0.40')
    expect(r.steps.map((s) => s.id)).toEqual(['nFromM', 'c'])
    expect(r.values.VL.value).toBe('0.25')
  })

  it('mass needed for a solution: c, V, M → n → m', () => {
    const r = solveConcentration({ c: '0.1', V: '500', M: '58.44' }, { mode: dp(2), volumeUnit: 'mL' })
    expect(r.values.m.value).toBe('2.92')
  })

  it('V from n and c, returned in mL when asked', () => {
    const r = solveConcentration({ n: '0.02', c: '0.1' }, { mode: sf(3), volumeUnit: 'mL' })
    expect(r.values.V.value).toBe('200')
  })

  it('validates', () => {
    expect(solveConcentration({ n: '1' }, { mode: dp(2) }).error).toBe('needTwo')
    expect(solveConcentration({ n: 'x', V: '1' }, { mode: dp(2) })).toMatchObject({ error: 'badNumber', field: 'n' })
    expect(solveConcentration({ n: '1', V: '0' }, { mode: dp(2) }).error).toBe('divideByZero')
    expect(solveConcentration({ n: '1', V: '1', c: '1' }, { mode: dp(2) }).error).toBe('nothingToSolve')
  })
})

describe('solveDilution', () => {
  it('solves each of the four', () => {
    expect(solveDilution({ c1: '2', V1: '50', c2: '0.5' }, dp(1))).toMatchObject({ solve: 'V2', value: '200.0' })
    expect(solveDilution({ c1: '2', V1: '', c2: '0,5', V2: '200' }, dp(1))).toMatchObject({ solve: 'V1', value: '50.0' })
    expect(solveDilution({ V1: '50', c2: '0.5', V2: '200' }, dp(2))).toMatchObject({ solve: 'c1', value: '2.00' })
    expect(solveDilution({ c1: '2', V1: '50', V2: '200' }, dp(2))).toMatchObject({ solve: 'c2', value: '0.50' })
  })

  it('validates', () => {
    expect(solveDilution({ c1: '2' }, dp(2)).error).toBe('needThree')
    expect(solveDilution({ c1: '1', V1: '1', c2: '1', V2: '1' }, dp(2)).error).toBe('tooMany')
    expect(solveDilution({ c1: '1', V1: '1', c2: '0' }, dp(2)).error).toBe('divideByZero')
  })
})
