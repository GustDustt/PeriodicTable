# Molarmasse — project rules

Global conventions apply (`~/.claude/CLAUDE.md`). These are the overrides.

## Overrides

- **No Supabase, no backend.** Static site on Cloudflare Pages.
- **Languages: nb (default) + en.** Copy is in `src/i18n/nb.json` / `en.json`.
  Norwegian letters æ ø å must survive edits. There is no Lithuanian.
- **Decimal comma in nb, point in en**, display only (`utils/format.js`).
  Inputs accept both. Internally every value is a '.'-decimal string.
- `localStorage` is allowed for settings and history, always through
  `lib/storage.js` (it never throws).
- `lib/` is pure chemistry plus the storage wrapper. It has no React imports.

## Never

- Change values in `src/data/elements.js`. They match the exam sheet on purpose.
- Use floats for a molar mass. Use `lib/decimal.js` (BigInt).
- Change the public signatures of `parseFormula`, `molarMass`, `round` or
  `roundValue`, or the rounding behaviour. `src/lib/__tests__` pins them.
- Import `framer-motion`, or anything heavy, from code on the calculator's
  first load. `ui/Sheet.jsx` is only reached through lazy imports.

## Design

- Fonts: system UI stack (`--font-ui`), and `ui-rounded` with tabular numerals for numbers (`--font-num`). There are no web fonts, so the first load stays small and the app works offline.
- Palette: see `src/styles/tokens.css`. Dark is the default, plus `[data-theme='light']`. Mint `--accent` is reserved for the answer and primary actions. Element categories use `--cat-*`.
- Touch targets ≥ 48 px. Keypad keys are 54 px (48 px on short screens).

## Verify

`npm test`, `npm run build`, then `node scripts/screenshot.js` against `npm run preview`.
