# Roadmap

Use this file for current stabilization and future trigger-based work. Detailed completed history belongs in `CHANGELOG.md`; this document keeps only the architecture milestone needed to explain current state.

## Completed Architecture Work

- Astro 6 static build, npm lockfile, and React integration are installed.
- `astro.config.mjs` defines `site: "https://anothel.github.io"` and `output: "static"`.
- Home, Today, Explore, Review, Status, Trends, Packages, Repos, and Links are Astro routes using shared components.
- Explore and Review are `client:load` React islands; no full React SPA or client router exists.
- CSS, checked-in JSON, published browser modules, robots, sitemap, and 404 output are generated in `dist/` through Astro pages and build-time endpoints.
- CI builds and validates `dist/`, then runs Node and Playwright checks.
- A dedicated GitHub Pages workflow builds, validates, deploys only `dist/`, and handles successful scheduled refresh runs.
- Duplicate checked-in HTML for all nine Astro-owned primary routes has been removed.
- Explore and Review directly own their React state and rendering without legacy browser-global bridges.
- Obsolete Explore/Review bridge files and their global DOM tests are retired; scoped architecture and asset-size gates protect the island boundary.
- Home reads the shared saved-record contract through a bundled native ES module; its obsolete `home.mjs` DOM runtime is retired without adding React.
- All seven promoted topic routes are native Astro static pages. Complete content is built from checked-in JSON; only pin state uses a small native client module.
- Notes and all seven Topic routes are native Astro output. Checked-in Notes/Topic HTML and their browser globals are retired.
- F1 final pass-through cleanup is complete: custom 404, robots, and sitemap are native Astro output backed by the canonical site route model. Their checked-in root files, catch-all route, and temporary sitemap updater are retired; data refresh commits JSON only.
- `js/data-health.js` and `js/signal-schema.js` remain active internal modules. Other published renderer endpoints have no native route consumers and remain compatibility-only to avoid breaking public URLs.
- Accessibility and 390x844 mobile regression checks cover critical routes.

Migration scaffold/gate work is complete. Astro migration and the automated mobile redesign milestone are complete. Remote closeout at revision `36da5fe3b207931e12dfe40cf3f11de81ec3e68c` confirmed successful CI, a same-revision GitHub Pages deployment, production route/link/accessibility checks, and browser-local workflows. Physical iOS and Android testing remains `REAL_DEVICE_DEFERRED`; no real-device validation is claimed.

Do not queue “adopt Astro,” “add build chain,” or “start React islands” as future work.

## Current Stabilization

### S0 - Data Health and Ranking Regression Watch

Last checked-in refresh: `2026-07-07T12:40:09.312Z`; 107 generated items; overall status `ok`. Retired `n8n-workflow` remains excluded after repeated npm 429s.

Trigger: source health changes, checked-in data becomes stale, top results drift toward broad/duplicate signals, or owner requests a fresh publish-health confirmation.

Scope: use existing update, source-governance, signal-policy, and golden-test paths. Live refresh requires network/token approval. Do not expand source families or ranking models without a failing product-quality case.

Verification: `npm run validate:data`, focused ranking/source tests, `npm run check`, `git diff --check`.

Exit: generated state is explained and usable, or exact blocker/decision threshold is recorded.

## Future Work

### F2 - Retire Compatibility-Only JavaScript Endpoints

Trigger: a production reference/usage audit confirms no external consumer depends on the fixed renderer `/js` URLs, and the owner explicitly approves their removal as a public compatibility break.

Scope: remove only the compatibility-only renderer modules, endpoints, and tests. Keep `js/data-health.js` and `js/signal-schema.js` while internal build/data consumers remain.

## Constraints

- GitHub Pages-compatible static output and stable public URLs.
- `data/*.json` remains the data contract.
- No backend, database, server function, account/login, or cloud sync.
- Review state remains browser-local.
- React remains limited to justified islands; no full React SPA.
- Keep static/no-JS output useful where practical.
- Pull future work forward only when its trigger is true.
