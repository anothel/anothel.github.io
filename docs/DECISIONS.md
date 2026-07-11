# Durable Decisions

## Current Conclusions

- Astro static output owns primary routes and shared components; React is limited to Explore and Review islands. See `docs/ARCHITECTURE.md` for the decision record.
- GitHub Pages remains the deployment target, but no checked-in workflow currently deploys `dist/`. See `docs/DEPLOYMENT.md`.
- No backend, account/sync layer, database, server function, or full React SPA.
- Review, saved searches, defaults, and pins remain browser-local; JSON export/import provides portability, not cloud sync.
- `data/*.json` remains the build/data contract. Ranking policy remains in `data/signal-policy.json` and timestamp/score semantics remain in `docs/SIGNAL_SCHEMA.md`.
- Source health and fallback behavior stay shared across decision, discovery, status, and source routes.
- `n8n-workflow` remains retired from npm refreshes after repeated 429s; workflow automation remains covered by other repo/link/package sources.

## Decision Locations

- Architecture and revisit conditions: `docs/ARCHITECTURE.md`.
- Deployment/build/workflows: `docs/DEPLOYMENT.md`.
- Route jobs and overlaps: `docs/IA.md`.
- Data contracts and scoring: `docs/SIGNAL_SCHEMA.md`.
- Current/future triggers: `docs/ROADMAP.md`.
- Trust and security: `docs/THREAT_MODEL.md` and `SECURITY.md`.
- Completed work: `CHANGELOG.md`.
