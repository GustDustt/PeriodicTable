import { describe, expect, it } from 'vitest'
import { massOf, molarMass } from '../mass.js'
import { ELEMENTS } from '../../data/elements.js'

const exact = (f) => massOf(f).result.exact
const at = (f, mode, perElement = false) => massOf(f, { mode, perElement }).result.value
const dp = (digits) => ({ type: 'dp', digits })
const sf = (digits) => ({ type: 'sf', digits })

describe('molar mass — exam sheet values, integer arithmetic', () => {
  it('H2O', () => {
    expect(exact('H2O')).toBe('18.016')
    expect(at('H2O', { type: 'exact' })).toBe('18.016')
    expect(at('H2O', dp(2))).toBe('18.02')
    expect(at('H2O', sf(3))).toBe('18.0')
  })

  it.each([
    ['NaCl', '58.44', dp(2)],
    ['C6H12O6', '180.156', { type: 'exact' }],
    ['Ca(OH)2', '74.096', { type: 'exact' }],
    ['Al2(SO4)3', '342.17', dp(2)],
    ['CuSO4·5H2O', '249.70', dp(2)],
    ['CuSO4*5H2O', '249.70', dp(2)],
    ['CuSO4.5H2O', '249.70', dp(2)],
    ['K4[Fe(CN)6]', '368.37', dp(2)],
    ['2H2O', '36.032', { type: 'exact' }],
    ['SO4^2-', '96.07', dp(2)],
    ['nacl', '58.44', dp(2)],
  ])('%s -> %s', (f, expected, mode) => {
    expect(at(f, mode)).toBe(expected)
  })

  it('never produces float noise', () => {
    // 0.1 + 0.2 style errors would show up as long tails here.
    for (const f of ['H2O', 'C6H12O6', 'CH3COOH', 'C12H22O11', 'Fe2(SO4)3·9H2O']) {
      expect(exact(f)).toMatch(/^\d+\.\d{1,3}$/)
    }
  })

  it('keeps the sheet precision in exact mode (O2 = 32.00)', () => {
    expect(exact('O2')).toBe('32.00')
  })

  it('handles parenthesised (unstable) masses', () => {
    expect(exact('Tc')).toBe('98')
  })

  it('per-element rounding changes C6H12O6 at 1 dp', () => {
    expect(at('C6H12O6', dp(1), false)).toBe('180.2')
    expect(at('C6H12O6', dp(1), true)).toBe('180.0')
  })

  it('per-element rounding shows the used masses in the working', () => {
    const r = massOf('H2O', { mode: dp(1), perElement: true }).result
    expect(r.perElement).toBe(true)
    expect(r.lines).toEqual([
      { sym: 'H', count: 2, mass: '1.008', stable: true, used: '1.0', subtotal: '2.0' },
      { sym: 'O', count: 1, mass: '16.00', stable: true, used: '16.0', subtotal: '16.0' },
    ])
  })

  it('per-element is not applied in exact mode', () => {
    expect(molarMass({ H: 2 }, { mode: { type: 'exact' }, perElement: true }).perElement).toBe(false)
  })

  it('returns no result for an invalid formula', () => {
    expect(massOf('Xx').result).toBe(null)
  })
})

describe('data file', () => {
  it('has 118 elements with string masses', () => {
    expect(ELEMENTS).toHaveLength(118)
    for (const e of ELEMENTS) expect(typeof e.mass).toBe('string')
  })
})
