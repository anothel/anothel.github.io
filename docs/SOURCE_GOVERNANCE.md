# Source Governance

Source governance decides what gets collected, what gets retired, and how partial data is explained.

## Ownership

`data/watchlists.json` owns checked-in source definitions for:

- Trend npm packages and GitHub queries.
- Package watchlist.
- Repo watchlist.
- Reference shelf links.

Updater scripts consume active entries only.

## Adding A Source

Add a source only when it improves one of:

- Visit speed.
- Repeat use.
- Agent-workflow signal quality.
- Trust in freshness or recovery.
- Topic judgment already promoted by IA.

Required checks:

- The source has a concrete route job or ranking job.
- It is not broad baseline tooling already covered by other sources.
- It has a stable URL or package/repo identity.
- It can fail without hiding existing useful rows.

## Retiring A Source

Prefer `disabled: true` plus `history` over deletion when provenance matters.

History entries must include:

- `date` in `YYYY-MM-DD` format.
- `note` explaining why the source changed or retired.

Governance validation rejects future `history.date` values after the current data date.

## Partial And Fallback Rules

- Partial data is acceptable when useful rows remain and Status explains the failed part.
- Fallback data is acceptable when previous checked-in rows are safer than an empty page.
- `fallbackUsed` and `staleButSafe` are reserved for true fallback states, not ordinary partial row reuse.
- Rate limits must stay visible through source metadata and refresh-report.

## Current Rate Limit Decision

npm `n8n-workflow` returned 429 during refresh and reached 6 consecutive 429 runs. It is retired from npm package and trend refreshes with `disabled: true` plus history instead of deletion. No replacement is added because workflow automation remains covered by n8n repo/link plus Inngest, Trigger.dev, and Temporal packages.

Status refresh-run detail uses the same sanitized recovery copy as source health cards.
