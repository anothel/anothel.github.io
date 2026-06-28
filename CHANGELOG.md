# Changelog

All notable project and operations changes should be recorded here.

This repository does not yet use versioned releases. Use dated entries until a tag policy is adopted.

## Unreleased

- Added public security, contribution, signal schema, source governance, threat model, and release checklist docs.
- Expanded README around operating commands, data refresh, verification, and project boundaries.
- Reworked Roadmap around future operational trust work: verification entry points, npm partial handling, renderer safety, data contract enforcement, and release discipline.
- Added dependency-free `package.json` scripts and read-only PR CI validation.
- Marked npm 429 partial refreshes as explicit `rateLimited` metadata while preserving useful package rows.
- Added shared external-link attribute rendering and static fallback coverage for renderer safety.
- Strengthened data contract negative fixtures and documented dated GitHub Pages release policy.
- Recorded the generated data publish drill outcome and promoted module-type warning cleanup as the next Roadmap item.
- Renamed Home, Today, and Status ESM browser modules to `.mjs` so Node validation runs without module-type warnings.
- Confirmed npm `n8n-workflow` still returns 429 with preserved package rows; next publish confirmation needs `GITHUB_TOKEN`.
- Ran authenticated refresh with `gh auth token`; GitHub trends recovered to `ok`, leaving npm `n8n-workflow` as the only accepted non-ok source.
- Confirmed refreshed priority, topic, and module snapshots remain publishable without watchlist or signal-policy changes.
- Confirmed generated data, static snapshots, docs, and release notes are ready for user-owned staging and commit.

## 2026-06-28

- Watchlist governance rejects `history.date` values after the current data date.
- Today baseline priority scoring derives baseline penalty from `data/signal-policy.json`.
- Source detail static pages keep top source rows in checked-in HTML for no-JS and blocked-fetch visits.
- Authenticated GitHub refresh recovered GitHub trend source health to `ok`; npm `n8n-workflow` 429 remains the active partial follow-up.
