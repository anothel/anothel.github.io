# Changelog

All notable project and operations changes should be recorded here.

This repository does not yet use versioned releases. Use dated entries until a tag policy is adopted.

## Unreleased

- Rewrote Roadmap as a future-work queue with concrete publish, review, signal-quality, Explore, trust, and architecture-gate bundles.
- Folded the repo analysis intake and accepted follow-up work directly into the Roadmap.
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
- Confirmed published Home, Today, Explore, Review, Status, source detail, topic, and data JSON routes match checked-in source health.
- Ran another token-backed refresh; GitHub trends stayed `ok`, while npm `n8n-workflow` remained the only accepted partial source.
- Kept npm `n8n-workflow` active as accepted visible partial source health because preserved package rows still cover workflow automation.
- Ran unauthenticated publish-health refresh; generated data stayed publishable with GitHub trend 403 partial and npm `n8n-workflow` 429 partial visible.
- Ran token-backed publish-health rerun; all refresh sources recovered to `ok` with 108 generated items and no source errors.
- Clarified Review's stale local-saved state when saved browser records no longer match current data.
- Browser-smoked Explore save to Review, Review status and metadata updates, exports, and cleanup on the local static server.
- Added a Paste JSON Review import path so local saved queues can be restored without automating a file chooser.
- Removed the completed Saved Review Workflow bundle from the active Roadmap and queued native file chooser smoke as a later trigger.

## 2026-06-28

- Watchlist governance rejects `history.date` values after the current data date.
- Today baseline priority scoring derives baseline penalty from `data/signal-policy.json`.
- Source detail static pages keep top source rows in checked-in HTML for no-JS and blocked-fetch visits.
- Authenticated GitHub refresh recovered GitHub trend source health to `ok`; npm `n8n-workflow` 429 remains the active partial follow-up.
