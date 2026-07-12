# Roadmap

Use this file for current stabilization and future trigger-based work. Detailed completed history belongs in `CHANGELOG.md`; this document keeps only the architecture milestone needed to explain current state.

## Completed Architecture Work

- Astro 6 static build, npm lockfile, and React integration are installed.
- `astro.config.mjs` defines `site: "https://anothel.github.io"` and `output: "static"`.
- Home, Today, Explore, Review, Status, Trends, Packages, Repos, and Links are Astro routes using shared components.
- Explore and Review are `client:load` React islands; no full React SPA or client router exists.
- CSS, checked-in JSON, browser modules, robots, sitemap, Notes/topics, and 404 output are preserved in `dist/` through Astro build-time endpoints/pass-through routes.
- CI builds and validates `dist/`, then runs Node and Playwright checks.
- A dedicated GitHub Pages workflow builds, validates, deploys only `dist/`, and handles successful scheduled refresh runs.
- Duplicate checked-in HTML for all nine Astro-owned primary routes has been removed.
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

### F1 - Convert Legacy Notes and Topic Routes

Trigger: a Notes/topic change needs shared Astro layout behavior, pass-through maintenance becomes fragile, or route-specific build tests expose drift.

Scope: migrate one route family at a time from checked-in HTML/pass-through to Astro components while preserving URLs, content, sitemap entries, and useful no-JS output.

Do not migrate solely for framework uniformity.

### F2 - Simplify Island-to-Legacy Browser Module Bridge

Trigger: Explore/Review script loading causes a measured bug, duplicated state, or maintenance cost.

Scope: move only affected behavior into the existing island. Preserve localStorage schemas and static initial markup. Do not create global React state or a SPA shell.

## Constraints

- GitHub Pages-compatible static output and stable public URLs.
- `data/*.json` remains the data contract.
- No backend, database, server function, account/login, or cloud sync.
- Review state remains browser-local.
- React remains limited to justified islands; no full React SPA.
- Keep static/no-JS output useful where practical.
- Pull future work forward only when its trigger is true.
