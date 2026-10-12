import { describe, expect, it } from 'vitest'
import { solveAmount } from '../amount.js'
import { massPercent } from '../composition.js'
import { empiricalFormula } from '../empirical.js'
import { makeQuestion } from '../quiz.js'
import { parseFormula } from '../formula.js'
import { position } from '../periodic.js'
import { ELEMENTS } from '../../data/elements.js'

const dp = (digits) => ({ type: 'dp', digits })

describe('solveAmount (n = m / M)', () => {
  it('solves n', () => {
    const r = solveAmount({ m: '10,0', n: '', M: '18.02' }, dp(3))
    expect(r).toMatchObject({ ok: true, solve: 'n', value: '0.555' })
  })
  it('solves m and M', () => {
    expect(solveAmount({ n: '0.5', M: '58.44' }, dp(2)).value).toBe('29.22')
    expect(solveAmount({ m: '29.22', n: '0,5' }, dp(2)).value).toBe('58.44')
  })
  it('falls back to s.f. instead of showing 0', () => {
    expect(solveAmount({ m: '0.01', M: '342.17' }, dp(2))).toMatchObject({ value: '0.0000292', note: 'tooSmall' })
  })
  it('validates', () => {
    expect(solveAmount({ m: '1' }, dp(2)).error).toBe('needTwo')
    expect(solveAmount({ m: '1', n: '2', M: '3' }, dp(2)).error).toBe('tooMany')
    expect(solveAmount({ m: 'abc', n: '2' }, dp(2)).error).toBe('badNumber')
    expect(solveAmount({ m: '1', M: '0' }, dp(2)).error).toBe('divideByZero')
  })
})

describe('massPercent', () => {
  it('water is 11.19 % H, 88.81 % O', () => {
    const r = massPercent(parseFormula('H2O').counts, dp(2))
    expect(r.lines.map((l) => l.percent)).toEqual(['11.19', '88.81'])
  })
})

describe('empiricalFormula', () => {
  it('CH2O from glucose percentages', () => {
    const r = empiricalFormula([
      { sym: 'C', amount: '40.0' },
      { sym: 'H', amount: '6.7' },
      { sym: 'O', amount: '53.3' },
    ])
    expect(r.formula).toBe('CH2O')
    expect(r.multiplier).toBe(1)
  })
  it('multiplies to whole numbers (Fe2O3)', () => {
    const r = empiricalFormula([
      { sym: 'Fe', amount: '69,9' },
      { sym: 'O', amount: '30,1' },
    ])
    expect(r.formula).toBe('Fe2O3')
    expect(r.multiplier).toBe(2)
  })
  it('reports bad rows', () => {
    expect(empiricalFormula([{ sym: 'Xx', amount: '5' }]).error).toBe('unknownElement')
    expect(empiricalFormula([{ sym: 'C', amount: '' }]).error).toBe('badAmount')
    expect(empiricalFormula([{ sym: 'C', amount: '1' }, { sym: 'C', amount: '1' }]).error).toBe('duplicate')
  })
})

describe('quiz', () => {
  it('has one correct answer and distinct choices', () => {
    let seed = 1
    const rng = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
    for (let i = 0; i < 50; i++) {
      const q = makeQuestion({ mode: dp(2), rng })
      const values = q.choices.map((c) => c.value)
      expect(new Set(values).size).toBe(values.length)
      expect(q.choices.filter((c) => c.kind === 'correct')).toHaveLength(1)
      expect(values.length).toBeGreaterThanOrEqual(3)
    }
  })
})

describe('periodic layout', () => {
  it('puts every element in a unique cell', () => {
    const cells = new Set(ELEMENTS.map((e) => JSON.stringify(position(e.z))))
    expect(cells.size).toBe(118)
  })

  it('puts La and Ac in group 3, f-block rows start at Ce and Th', () => {
    expect(position(57)).toEqual({ row: 6, col: 3 })
    expect(position(89)).toEqual({ row: 7, col: 3 })
    expect(position(58)).toEqual({ row: 9, col: 4 })
    expect(position(90)).toEqual({ row: 10, col: 4 })
    expect(position(72)).toEqual({ row: 6, col: 4 })
  })
})
