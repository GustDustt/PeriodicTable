// Display-only formatting. Values stay as '.'-decimal strings everywhere else;
// only what the user reads (and copies) gets the locale's comma.
export function formatDecimal(value, lang) {
  if (value == null) return ''
  const s = String(value)
  const local = lang === 'en' ? s : s.replace('.', ',')
  return local.replace(/^-/, '−')
}

// Formula as plain text with Unicode subscripts — for aria-labels and titles.
const SUB = '₀₁₂₃₄₅₆₇₈₉'
export function subscriptDigits(text) {
  // No lookbehind: it is a parse error on iOS < 16.4 and would blank the app.
  return text.replace(/([A-Za-z)\]}])(\d+)/g, (_, p, d) => p + [...d].map((c) => SUB[c]).join(''))
}
