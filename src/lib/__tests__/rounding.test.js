import { describe, expect, it } from 'vitest'
import { round, normalizeMode } from '../rounding.js'
import { div, parseDecimal, toString } from '../decimal.js'

const dp = (digits) => ({ type: 'dp', digits })
const sf = (digits) => ({ type: 'sf', digits })

describe('round — decimal places', () => {
  it.each([
    ['18.016', 0, '18'],
    ['18.016', 1, '18.0'],
    ['18.016', 2, '18.02'],
    ['18.016', 3, '18.016'],
    ['18.016', 4, '18.0160'],
    ['2.5', 0, '3'],
    ['2.45', 1, '2.5'],
    ['0.125', 2, '0.13'],
    ['-2.5', 0, '-3'],
    ['-0.004', 2, '0.00'],
    ['249.7', 2, '249.70'],
  ])('%s to %i dp = %s', (v, d, out) => expect(round(v, dp(d))).toBe(out))
})

describe('round — significant figures', () => {
  it.each([
    ['18.016', 3, '18.0'],
    ['18.016', 2, '18'],
    ['18.016', 1, '20'],
    ['18.016', 6, '18.0160'],
    ['342.17', 2, '340'],
    ['99.96', 3, '100'],
    ['0.052', 1, '0.05'],
    ['0.0525', 2, '0.053'],
    ['180.156', 4, '180.2'],
    ['1.008', 3, '1.01'],
    ['0', 3, '0.00'],
  ])('%s to %i s.f. = %s', (v, d, out) => expect(round(v, sf(d))).toBe(out))
})

describe('round — misc', () => {
  it('exact mode returns the value untouched', () => {
    expect(round('18.016', { type: 'exact' })).toBe('18.016')
  })

  it('accepts comma decimals', () => {
    expect(round('18,016', dp(2))).toBe('18.02')
  })

  it('clamps out-of-range modes', () => {
    expect(normalizeMode({ type: 'dp', digits: 9 })).toEqual({ type: 'dp', digits: 4 })
    expect(normalizeMode({ type: 'sf', digits: 0 })).toEqual({ type: 'sf', digits: 1 })
    expect(normalizeMode(null)).toEqual({ type: 'dp', digits: 2 })
  })

  it('rejects garbage', () => {
    expect(round('abc', dp(2))).toBe(null)
    expect(parseDecimal('1.2.3')).toBe(null)
    expect(parseDecimal('')).toBe(null)
  })

  it('divides exactly enough', () => {
    expect(toString(div(parseDecimal('10'), parseDecimal('18.016'), 6))).toBe('0.555062')
    expect(div(parseDecimal('1'), parseDecimal('0'))).toBe(null)
  })
})
