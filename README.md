# Molarmasse

Mobile-first molar mass calculator using the atomic masses printed on the exam
data sheet ("Grunnstoffenes periodesystem", REA3046). Norwegian bokmål by
default, English optional. Static site, no backend.

## Commands

```bash
npm install
npm run dev        # local dev server (no service worker)
npm test           # vitest: parser, integer arithmetic, rounding, extras
npm run build      # production build to dist/, includes generated sw.js
npm run preview    # serve dist/ on :4173
npm run icons      # regenerate PWA icons in public/
node scripts/screenshot.js http://localhost:4173 docs/screenshots   # 375×812 phone screenshots (needs Chrome + preview running)
```

## Deploy (Cloudflare Pages)

- Build command `npm run build`, output directory `dist`.
- Pages serves `index.html` for unknown paths (SPA mode) because there is no `404.html`.
- `wrangler.toml` sets the Pages output directory. `sitemap.xml` and `robots.txt` are generated at build time from `src/config.js`.
- `public/_headers` makes `sw.js` revalidate on every load and lets hashed assets cache for a year.
- Live at https://periodics.pages.dev (Pages project `periodics`). The domain lives in `src/config.js`.

## Docs

- `docs/PLAN.md` covers routes, structure, tokens, the decisions taken and the open questions.
- `docs/test-output.txt` is the latest test run.
- `docs/screenshots/` holds 375×812 screenshots of every screen and state.
