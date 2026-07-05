# Durable Decisions

## Current Conclusions

- This site stays static-first and trust-first: no backend, no account/sync layer, no database, and no dependency management layer in the runtime path.
- Review and saved searches are browser-local; portability is explicit via export/import JSON, not cloud sync.
- Source health drives trust copy and fallback behavior through the shared `DataHealth` language across Today, Home, Explore, Status, and module pages.
- `npm` package `n8n-workflow` can remain active in an accepted partial state while preserved rows keep package coverage usable.
- Ranking quality policy remains in `data/signal-policy.json`, applied consistently across Today and Explore.

## Decision Locations

- Operational decisions and live refresh state: `docs/ROADMAP.md` and `data/refresh-report.json`.
- Data contracts and schema rules: `docs/SIGNAL_SCHEMA.md` and `scripts/validate-data.mjs`.
- Trust and threat posture: `docs/THREAT_MODEL.md` and `SECURITY.md`.

## History

- `P1 - Explore Repeat Use`: completed.
  - Saved-search controls now include portable export/import and status feedback consistent with Review.
  - Completed items now live in `CHANGELOG.md`, not the active Roadmap.
- `P1 - Signal Quality`: regression watch is active when ranking drift affects top signals; scope remains policy/watchlist adjustments only when evidence appears.
- `P2 - Trust Copy`: shared recovery and partial copy is handled through `DataHealth` and static/dynamic surfaces.
