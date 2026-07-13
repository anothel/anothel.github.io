# Roadmap

Use this file for current stabilization and future trigger-based work. Detailed completed history belongs in `CHANGELOG.md`; this document keeps only the architecture milestone needed to explain current state.

## Completed Architecture Work

- Astro 6 static build, npm lockfile, and React integration are installed.
- `astro.config.mjs` defines `site: "https://anothel.github.io"` and `output: "static"`.
- Home, Today, Explore, Review, Status, Trends, Packages, Repos, and Links are Astro routes using shared components.
- Explore and Review are `client:load` React islands; no full React SPA or client router exists.
- CSS, checked-in JSON, browser modules, robots, sitemap, Notes, and 404 output are preserved in `dist/` through Astro build-time endpoints/pass-through routes.
- CI builds and validates `dist/`, then runs Node and Playwright checks.
- A dedicated GitHub Pages workflow builds, validates, deploys only `dist/`, and handles successful scheduled refresh runs.
- Duplicate checked-in HTML for all nine Astro-owned primary routes has been removed.
- Explore and Review directly own their React state and rendering without legacy browser-global bridges.
- Obsolete Explore/Review bridge files and their global DOM tests are retired; scoped architecture and asset-size gates protect the island boundary.
- Home reads the shared saved-record contract through a bundled native ES module; its obsolete `home.mjs` DOM runtime is retired without adding React.
- All seven promoted topic routes are native Astro static pages. Complete content is built from checked-in JSON; only pin state uses a small native client module.
- Checked-in topic HTML, `TopicApp`, `AnothelState`, `topics.js`, and `local-state.js` are retired. Data refresh now regenerates only Notes HTML and sitemap metadata outside JSON.
- Accessibility and 390x844 mobile regression checks cover critical routes.

Migration scaffold/gate work is complete. Do not queue “adopt Astro,” “add build chain,” or “start React islands” as future work.

## Current Stabilization

### S0 - Data Health and Ranking Regression Watch

Last checked-in refresh: `2026-07-07T12:40:09.312Z`; 107 generated items; overall status `ok`. Retired `n8n-workflow` remains excluded after repeated npm 429s.

Trigger: source health changes, checked-in data becomes stale, top results drift toward broad/duplicate signals, or owner requests a fresh publish-health confirmation.

Scope: use existing update, source-governance, signal-policy, and golden-test paths. Live refresh requires network/token approval. Do not expand source families or ranking models without a failing product-quality case.

Verification: `npm run validate:data`, focused ranking/source tests, `npm run check`, `git diff --check`.

Exit: generated state is explained and usable, or exact blocker/decision threshold is recorded.

## Future Work

### F1 - Convert Legacy Notes

Trigger: a Notes change needs shared Astro layout behavior, pass-through maintenance becomes fragile, or Notes-specific build tests expose drift.

Scope: migrate `/notes/` from checked-in HTML/pass-through to Astro while preserving its URL, content, sitemap entry, and useful no-JS output. Topic routes are already migrated and are not part of this bundle.

Do not migrate solely for framework uniformity.

### F2 - Retire Remaining Notes Globals by Consumer

Trigger: Notes migration removes the final production route consumer, or Notes fallback maintenance exposes measurable duplication.

Scope: retire `TopicTaxonomy`, `AnothelDom`, `NotesApp`, and their classic browser files only after Notes no longer needs them. Reassess `signal-schema.js`, `data-health.js`, and preserved renderer modules separately by proven build/test consumers. Do not delete modules merely for uniformity.

## Constraints

- GitHub Pages-compatible static output and stable public URLs.
- `data/*.json` remains the data contract.
- No backend, database, server function, account/login, or cloud sync.
- Review state remains browser-local.
- React remains limited to justified islands; no full React SPA.
- Keep static/no-JS output useful where practical.
- Pull future work forward only when its trigger is true.
