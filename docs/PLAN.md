# Molarmasse — plan and decisions

All phases were built in one pass, as requested. This file records the Phase 0
plan and every decision that would normally have been a question.

## Routes

| Route | Page | Loaded |
|---|---|---|
| `/` | Calculator (the product) | lazy, but prefetched as soon as `App.jsx` runs |
| `/sum` | Sum calculator: `Na + Cl + O × 2` | lazy |
| `/reaksjon` | Balance an equation + stoichiometry / limiting reactant | lazy |
| `/stoffmengde` | n = m / M | lazy (via the "Mer" tab) |
| `/konsentrasjon` | c = n/V (via m and M) and dilution c₁V₁ = c₂V₂ | lazy (via the "Mer" tab) |
| `/masseprosent` | Mass percent | lazy (via the "Mer" tab) |
| `/empirisk` | Empirical formula | lazy (via the "Mer" tab) |
| `/periodesystem` | Periodic table | lazy |
| `/quiz` | Quiz | lazy (via the "Mer" tab) |
| `/mer` | More tools + settings + about | lazy |
| `*` | 404 (noindex) | lazy |

Bottom tab bar (5 tabs, calculator first): Kalkulator · Sum · Reaksjon · Tabell · Mer.
n = m/M, Konsentrasjon, Masse-%, Empirisk and Quiz are listed under Mer, and that tab stays highlighted on those routes.
On ≥ 900 px it becomes a top bar.

`/?f=<formula>` prefills the calculator. The periodic table's "Bruk i kalkulatoren" uses it, and it works for shared links too.

## `src/` tree

```
data/elements.js        exam-sheet data (unchanged, moved from the repo root)
lib/                    pure chemistry, no React. Tested.
  decimal.js            BigInt fixed-point arithmetic
  formula.js            parseFormula, displayTokens
  mass.js               molarMass, massOf, atomicMass
  rounding.js           round, roundValue, normalizeMode
  amount.js             n = m/M solver
  composition.js        mass percent
  empirical.js          empirical formula with steps
  quiz.js, compounds.js question + distractor generation
  periodic.js           grid positions, COMMON chips
  expression.js         sums: "Na + Cl + O × 2"
  equation.js           parse + balance equations (BigInt null space), text output
  stoichiometry.js      masses through coefficients, limiting reactant, excess
  concentration.js      c = n/V chained with n = m/M; dilution
  storage.js            safe localStorage wrapper
  __tests__/            vitest
hooks/                  useMolarMass, useFormat, useLongPress, useCopy, useTheme, useMediaQuery
store/                  zustand: settings, history, calculator (current formula), quiz, toast
utils/                  editing.js (caret insert/delete), format.js (locale decimals)
components/
  calculator/           ResultCard, FormulaField, Breakdown, Keypad, ElementChips,
                        HistoryChips, RoundingButton/Sheet/Controls, ElementSheet
  chem/                 Formula (H₂O renderer), FormulaInput
  periodic/             PeriodicTable
  layout/               AppShell, TabBar, Seo
  ui/                   Sheet, Toast, Segmented, Switch, Icon
  extras/extras.css
pages/                  Calculator, Stoffmengde, Masseprosent, Empirisk, Periodesystem, Quiz, Mer, NotFound
i18n/                   nb.json (default), en.json
styles/                 tokens.css, base.css
sw.js                   service-worker template (build injects the file list)
```

The project CLAUDE.md overrides the global one in one place: `lib/` holds pure
chemistry as well as the storage wrapper, because there are no external clients.

## Tokens (`src/styles/tokens.css`)

Named by role: `--bg --surface --surface-2 --surface-3 --border --fg --fg-muted
--fg-subtle --accent --accent-strong --accent-fg --accent-soft --warn --warn-soft
--danger --success --focus --overlay --shadow --key --key-pressed --key-op
--cat-{nonmetal,semimetal,metal}[-bg] --font-ui --font-num --radius --radius-sm
--gutter --tap --key-h --tab-h --safe-bottom --ease`.
Dark is the default in `:root`; `[data-theme='light']` overrides. The theme follows
`prefers-color-scheme` unless it is set manually under Mer → Tema.

## Visual directions

1. **Exam sheet at night (built):** graphite surfaces with one mint accent
   reserved for the answer and the primary actions. The answer is the
   brightest thing on screen, and the periodic table keeps the sheet's three
   category colours.
2. **Printed paper (not built as a separate direction):** off-white paper,
   dark-green ink and ruled-line breakdown rows, like a lab notebook. It
   survives as the light theme.

## Open questions → defaults chosen

| Question | Default used | Where to change |
|---|---|---|
| Site name / domain | "Molarmasse", `https://periodics.pages.dev` (confirmed) | `src/config.js`, `public/manifest.webmanifest`, `index.html` title |
| "Round each atomic mass first" default | **Off** (as the brief says) | `src/store/settings.js` |
| Default rounding | 2 decimal places | `DEFAULT_MODE` in `src/lib/rounding.js` |
| Po, At, 104–118 | **Not re-verified.** The values are untouched. The `// VERIFY` comments stay on Po and At (category). | `src/data/elements.js` |

## Judgement calls worth knowing

- **Charges without `^` are ambiguous.** `Fe2+`: the 2 is the charge (one atom, one digit). `NH4+`: the 4 is a count. `SO42-`: the last digit is the charge. The rendered formula always shows the reading (Fe²⁺, NH₄⁺, SO₄²⁻), so nothing is guessed silently. `O2-` is read as oxide (O²⁻); write `O2^-` for superoxide.
- **"Exact" keeps the sheet's precision.** O₂ shows `32.00`, not `32`. The scale is the largest number of decimals among the masses used.
- **Per-element rounding in s.f. mode** rounds each mass to n s.f., sums, then rounds the sum to n s.f. In d.p. mode the sum already has n decimals.
- **Lowercase readings are ranked.** When there are several, the reading whose heaviest element is lightest comes first (CO before Co, NH₃ before Nh₃). All readings are shown, and the user must pick one.
- **Quotients (n = m/M, %)** are never exact. "Exact" mode shows 6 s.f. for n and 2 d.p. for percentages. If d.p. rounding would turn a non-zero n into 0,00, it falls back to 3 s.f. and says so on screen.
- **framer-motion** is used only in the bottom sheets, which load lazily (and are prefetched when the browser is idle). The toast uses CSS. This keeps about 28 kB gzipped out of the calculator's first load.
- **PWA without a plugin.** A 20-line Vite plugin in `vite.config.js` writes every built file into `sw.js`, so the whole app, every route included, works offline after the first visit. The icons are generated by `scripts/make-icons.js` using only Node built-ins.

## Sum and Reaksjon (added after the first handoff)

- **Sum syntax:** `+` and `−` separate terms. A count is written as `× n` or `* n` after a term, or `n ×` before it. `CuSO4*5H2O` stays a hydrate because a formula follows the number. Charges aren't allowed in sums, because `+` is the operator there.
- **Balancing** finds the integer null space of the element/charge matrix using exact fractions. The app explains why when an element is on only one side, when the equation can't be balanced, or when there are several independent solutions. Any coefficients the student typed are ignored.
- **Separating species with `+`:** a `+` stuck to the species before it, and followed by another `+` or by nothing, is a charge. Every other `+` separates species. So `Na+ + Cl- → NaCl` and `Fe+O2->Fe2O3` both work, and `e-` is an electron.
- **Stoichiometry** uses M rounded to the student's setting, the same as n = m/M. The reactant with the smallest n / coefficient is the limiting one, and the excess of the other reactants is shown.
- **Concentration** fills in whatever can be worked out from the values given, chaining m → n → c, c·V → n → m, and so on, and shows each step with the numbers substituted. Volume can be typed in mL or L, but the working is always written in litres. In dilution, V₁ and V₂ only need to share a unit, so nothing is converted.
