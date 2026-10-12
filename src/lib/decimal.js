// Exact decimal arithmetic on BigInt. A value is { int, scale } meaning
// int / 10^scale. Floats are never used for anything the user sees as a
// result: 2 × 1.008 + 16.00 must be 18.016, not 18.015999999999998.

const TEN = 10n

export function pow10(n) {
  return TEN ** BigInt(n)
}

// Accepts '18.016', '18,016', '-0.5', '.5', '7'. Returns null for anything else
// so callers can show their own error instead of a silent NaN.
export function parseDecimal(input) {
  if (input == null) return null
  const s = String(input).trim().replace(',', '.').replace('−', '-')
  const m = /^([+-]?)(\d*)(?:\.(\d*))?$/.exec(s)
  if (!m || (m[2] === '' && (m[3] === undefined || m[3] === ''))) return null
  const frac = m[3] || ''
  const int = BigInt((m[2] || '0') + frac)
  return { int: m[1] === '-' ? -int : int, scale: frac.length }
}

export function toString({ int, scale }) {
  const neg = int < 0n
  let digits = (neg ? -int : int).toString()
  if (scale > 0) {
    digits = digits.padStart(scale + 1, '0')
    digits = digits.slice(0, -scale) + '.' + digits.slice(-scale)
  } else if (scale < 0) {
    digits = digits + '0'.repeat(-scale)
  }
  return (neg && /[1-9]/.test(digits) ? '-' : '') + digits
}

export function rescale(a, scale) {
  if (scale === a.scale) return a
  if (scale > a.scale) return { int: a.int * pow10(scale - a.scale), scale }
  return { int: divRoundHalfUp(a.int, pow10(a.scale - scale)), scale }
}

export function add(a, b) {
  const scale = Math.max(a.scale, b.scale)
  return { int: rescale(a, scale).int + rescale(b, scale).int, scale }
}

export function sub(a, b) {
  return add(a, { int: -b.int, scale: b.scale })
}

export function mul(a, b) {
  return { int: a.int * b.int, scale: a.scale + b.scale }
}

export function mulInt(a, n) {
  return { int: a.int * BigInt(n), scale: a.scale }
}

// Division is the one place exactness is impossible, so the caller states how
// many decimals it needs and the last one is rounded half-up.
export function div(a, b, scale = 12) {
  if (b.int === 0n) return null
  // a/b = (a.int / 10^a.scale) / (b.int / 10^b.scale)
  const num = a.int * pow10(scale + b.scale)
  const den = b.int * pow10(a.scale)
  return { int: divRoundHalfUp(num, den), scale }
}

export function cmp(a, b) {
  const scale = Math.max(a.scale, b.scale)
  const x = rescale(a, scale).int
  const y = rescale(b, scale).int
  return x === y ? 0 : x < y ? -1 : 1
}

export function isZero(a) {
  return a.int === 0n
}

export function toNumber(a) {
  return Number(toString(a))
}

// Half up, away from zero: 2.5 -> 3, -2.5 -> -3. School convention, not
// banker's rounding.
export function divRoundHalfUp(num, den) {
  if (den < 0n) {
    num = -num
    den = -den
  }
  const neg = num < 0n
  const n = neg ? -num : num
  let q = n / den
  if ((n % den) * 2n >= den) q += 1n
  return neg ? -q : q
}
