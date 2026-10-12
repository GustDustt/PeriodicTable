# Claude Code task — Molar mass calculator (mobile-first)

## What we're building

A web app where a student types or taps a chemical formula and instantly gets
the molar mass, rounded **the way they choose**, using the exact atomic masses
from the exam periodic table ("Grunnstoffenes periodesystem", REA3046).

**Priority order — never trade a higher item for a lower one:**

1. Molar mass calculation is fast, correct, and effortless **on a phone**
2. Rounding the user controls
3. Everything else (extra tools, quiz, table view)

If a "fun extra" makes the calculator screen slower or more cluttered, it goes
on another route or doesn't ship.

## Use these skills

- `/pre-handoff` before finishing
- Global conventions are in `~/.claude/CLAUDE.md`. Follow them; don't restate them.

## Exceptions to CLAUDE.md for this project

- **No Supabase, no backend.** Pure static site. All logic client-side.
- **Language: Norwegian bokmål (default) + English.** The data sheet is
  Norwegian, so the audience is Norwegian students. Use i18next with
  `nb.json` + `en.json`. Lithuanian is not needed.
- **Decimal separator follows language:** comma in nb (`18,02 g/mol`), point in
  en. The user may type either — accept both everywhere.
- `localStorage` is allowed here for settings and history (per-device
  convenience, wrapped in try/catch, app must work without it).

## Stack

React 18 + Vite · react-router-dom · react-helmet-async · i18next ·
framer-motion (only for small transitions) · CSS custom properties ·
Cloudflare Pages. **Vitest** for parser/rounding tests — ask before installing.

---

## Data — already done

`src/data/elements.js` is provided (attached). 118 elements, transcribed from
the exam sheet. **Masses are strings, exactly as printed.** Do not replace them
with IUPAC values, do not "fix" them, do not convert them to floats at load.
Matching the exam sheet is the whole point.

Fields: `z, sym, mass, stable, en, name{nb,en}, state, cat`.
`stable: false` = printed in parentheses on the sheet; show it the same way.

---

## Phase 0 — plan

No code. Give me:

1. Route list
2. `src/` tree (layering per CLAUDE.md: `lib/` pure chemistry, `hooks/`,
   `components/<domain>/`, `pages/`)
3. Token set for `:root` + `[data-theme='light']`, named by role
4. Two visual directions (describe in words, one sentence each)

**Stop and wait.**

## Phase 1 — the chemistry core (`src/lib/`), no UI

### Parser — `lib/formula.js`

`parseFormula(input) → { ok, counts: { sym: n }, tokens, error }`

Must handle:

| Input | Meaning |
|---|---|
| `H2O`, `NaCl`, `C6H12O6` | basic |
| `Ca(OH)2`, `Al2(SO4)3`, `K4[Fe(CN)6]` | nested `()` and `[]` |
| `CuSO4·5H2O`, `CuSO4*5H2O`, `CuSO4.5H2O` | hydrates — `·`, `*`, or `.` followed by a coefficient |
| `2H2O` | leading coefficient multiplies everything |
| `Fe2+`, `SO4^2-`, `NH4+` | charges — strip them, mass is unaffected, show a small "ion" label |
| ` h2 o ` | whitespace ignored |

Case rules: element symbols are case-sensitive (`Co` ≠ `CO`). But if the input
is entirely lowercase (`nacl`, `h2o`), try to auto-capitalise it into a valid
formula; if exactly one valid reading exists, use it and show "Tolket som NaCl";
if several exist (`co` → Co or CO), show both as tappable choices. Never guess
silently.

Errors are specific and in the user's language, pointing at the position:
"Ukjent grunnstoff «Xx» (tegn 3)", "Mangler lukkende parentes". No generic
"invalid input".

### Arithmetic — `lib/mass.js`

**No floating point in the sum.** Convert each mass string to an integer of
ten-thousandths (`'1.008'` → `10080n` or integer), multiply by the count, sum
as integers, convert back at the end. JS floats give `18.015999999` for water;
that must be impossible here.

### Rounding — `lib/rounding.js`

Three modes, user-selectable:

| Mode | Example (H₂O = 18.016) |
|---|---|
| As exact (no rounding) | 18.016 |
| Decimal places: 0–4 | 2 → 18.02 |
| Significant figures: 1–6 | 3 → 18.0 |

Plus one switch, because teachers disagree on this:

- **Round each atomic mass before multiplying** (off by default). When on, every
  element's mass is rounded to the chosen precision first, then summed. When
  off, the exact sum is rounded once at the end.

Rules:
- Round half **up** away from zero (school convention), not banker's rounding.
- Keep trailing zeros that are significant: 3 s.f. of 18.016 is `18.0`, not `18`.
- Implement on the integer/string representation, not `toFixed`.

### Tests — `lib/__tests__/`

Write them before any UI. At minimum:

- `H2O` → 18.016 exact, 18.02 (2 dp), 18.0 (3 s.f.)
- `NaCl` → 58.44
- `C6H12O6` → 180.156
- `Ca(OH)2` → 74.096
- `Al2(SO4)3` → 342.17
- `CuSO4·5H2O` = `CuSO4*5H2O` = `CuSO4.5H2O` → 249.70
- `K4[Fe(CN)6]` → 368.37, `2H2O`, `SO4^2-`, `nacl`, `co` (ambiguous)
- Errors: `Xx2`, `Ca(OH`, `H2O)`, empty string, `5`
- Per-element rounding on vs off gives different results for `C6H12O6` at 1 dp

**Stop. Show me the test output.**

## Phase 2 — the calculator screen (this is the product)

One screen, route `/`. Design it for a phone held in one hand, in a classroom,
possibly mid-exercise. Then make it work on desktop — not the other way round.

### Layout (phone, portrait)

```
┌──────────────────────────┐
│  M = 18,02 g/mol     ⧉   │  ← result: huge, always visible, tap ⧉ to copy
│  H₂O                     │  ← formula, rendered with subscripts
├──────────────────────────┤
│  H  2 × 1,008  =  2,016  │  ← breakdown, collapsible, shows the working
│  O  1 × 16,00  = 16,00   │     the way a teacher wants it written
├──────────────────────────┤
│  [ 2 desimaler ▾ ]       │  ← rounding: one tap to open, remembers choice
├──────────────────────────┤
│  H  C  N  O  Na  Cl  S … │  ← element chips: most-used first, scroll for all
│  1  2  3  4  5  6  7  8  │
│  9  0  (  )  ·  ⌫        │  ← custom keypad, bottom of screen, thumb zone
└──────────────────────────┘
```

Requirements:

- **Result updates live on every keystroke.** No "Calculate" button.
- **Custom on-screen keypad is the default input on touch devices.** The OS
  keyboard is wrong for this — it hides half the screen and has no `(` `)` `·`
  on the first page. Show the keypad, and set `inputMode="none"` on the field
  when it's active. A small "⌨" toggle switches to the native keyboard for
  people who prefer typing.
- Element chips: the ~20 most common in school chemistry first (H C N O Na Cl
  S K Ca Mg Fe Cu Al P Zn Ag Br I F Li), then a "Alle" chip that opens a
  bottom sheet with the full periodic table — tap an element to insert it.
- Tapping a digit right after an element inserts it as a subscript count.
- Touch targets ≥ 48×48 px. Keypad keys bigger. No hover-dependent UI.
- Long-press ⌫ clears everything. Show a brief undo toast.
- Formula display renders subscripts (H₂O) and the hydrate dot (·) properly.
- Breakdown table uses the **chosen rounding** where per-element rounding is on,
  and the sheet's exact values where it's off — label which.
- Copy button copies `18,02 g/mol` in the user's locale format.
- Works offline after first load (service worker / PWA manifest — "Legg til
  på hjemskjerm" should give a real app icon). Ask before adding a plugin for it.
- Respects `prefers-color-scheme`, manual light/dark toggle.
- 60 fps on a mid-range Android. Nothing heavy on this route — lazy-load
  everything that isn't the calculator.

**Stop after the layout shell, then after the keypad, then after the result
area. Screenshot each at 375×812.**

## Phase 3 — settings and history

- Rounding mode, per-element switch, language, theme → `localStorage`.
- Last 20 formulas as tappable chips under the result ("Nylig").
- Favourites: star a formula to pin it.
- No accounts, no sync.

## Phase 4 — extras (separate routes, lazy-loaded)

Each extra reuses `lib/` — no duplicated chemistry. Build in this order; stop
after each and I'll decide if the next one is worth it.

1. **n = m / M** (`/stoffmengde`) — enter a formula and any two of mass, moles,
   molar mass; get the third. Show the formula with the numbers substituted in.
2. **Masseprosent** (`/masseprosent`) — percentage of each element in a
   compound. Simple bar for each element.
3. **Empirisk formel** (`/empirisk`) — from mass percentages → empirical
   formula, showing every step (divide by M, divide by smallest, multiply to
   whole numbers).
4. **Periodesystem** (`/periodesystem`) — the full table, colour-coded like the
   exam sheet (non-metal / semi-metal / metal), tap for details: mass,
   electronegativity, state at 25 °C, Norwegian name.
5. **Quiz** (`/quiz`) — "What is the molar mass of …?" with the user's rounding
   setting, multiple choice with plausible distractors (wrong count on one
   element, forgotten hydrate water, swapped element). Streak counter.

Navigation for extras: a bottom tab bar on phone, max 5 items, calculator is
always the first tab.

## Phase 5 — finish

- `/seo-page` style Helmet on each route (nb title/description, `og:locale`
  `nb_NO`).
- Run `/pre-handoff`.
- Lighthouse is not the target — check real INP on a phone.

---

## Do not touch once approved

- `src/data/elements.js` values
- `lib/` public function signatures (tests depend on them)
- Rounding behaviour once tests pass

## Open questions for me (ask in Phase 0)

- Site name / domain
- Should "round each atomic mass first" default to on or off for your class?
- Any element count the sheet prints that you want me to re-verify? (Po, At and
  104–118 were hard to read on the photo.)
