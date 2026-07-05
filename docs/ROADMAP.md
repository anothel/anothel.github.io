# Roadmap
Use this file only to pick the next safe work bundle.

Completed work belongs in `CHANGELOG.md`. Durable decisions belong in `docs/`.

## Rules

- Start the highest priority bundle whose trigger is true.
- Keep each bundle small enough to implement, test, and commit alone.
- Do not run live refresh unless fresh source evidence is needed.
- No backend, account, sync, database, framework, bundler, package dependency, or lockfile without an explicit approved architecture change.
- Keep `n8n-workflow` visible while preserved rows are useful.
- If `GITHUB_TOKEN` is missing, keep GitHub rate limits as known partial state.

## Current Source State

- Last checked-in refresh: `2026-07-05T05:19:11.615Z`.
- Generated items: 108.
- Overall status: `partial`.
- Hacker News, GitHub trends, trend npm, repo, and manual sources are `ok`.
- Active blocker: npm package refresh 429 for `n8n-workflow` has repeated 4 times; preserved package rows remain usable, so this stays an accepted partial.

## Next Work Queue

### P0 - Publish Health Refresh

Trigger: checked-in data is old, source health changes, public page dates look wrong, or owner asks for publish confirmation.

Scope:

- Run existing data refresh only when network/token access is approved.
- Review generated data, manifest, refresh report, sitemap, Today, Status, Explore, and static fallbacks together.
- If `GITHUB_TOKEN` is missing, keep GitHub rate limits as known partial state and rerun only when token-backed proof matters.
- Keep `n8n-workflow` visible while preserved rows are useful.

Verification:

- `node scripts/update-all.mjs` when live refresh is approved.
- `node scripts/validate-data.mjs`.
- `npm.cmd run check`.
- `git diff --check`.

Exit: generated data is publishable, or the exact source blocker is recorded here.

### P1 - Signal Quality Drift Tuning

Trigger: ranking drift causes broad or non-actionable signals to dominate Today/Explore.

Scope:

- Add a quick decision rule: if observed ranking quality regresses, prune from active watchlists first; if needed, tighten `data/signal-policy.json`.
- Keep broad baseline guards explicit and testable so signal quality and topic relevance stay durable.
- Keep watchlist and policy changes scoped to measured quality regressions only.

Verification:

- `node scripts/validate-data.mjs`
- `npm.cmd run check`
- `git diff --check`
- Manual check: Today's and Explore's top 10 are workflow/agent/eval/supported-topic signals under current fixture and checked-in data.

Exit: ranking drift triggers an explicit policy/watchlist adjustment path and does not grow hidden complexity.

## Architecture Gate

Trigger: a measured vanilla JavaScript blocker makes Review or Explore harder to maintain than the no-build path.

Until then: no framework, bundler, dependency, lockfile, backend, account, sync, database, or server function.

Verification:

- One focused PoC test for the measured blocker.
- `npm.cmd run check`.

Exit: adopt only if the PoC reduces shipped maintenance cost; otherwise delete it.

## Cut List

Do not re-add backlog lists for:

- code of conduct, release tags, GitHub releases, provenance, SLSA, coverage tooling, JSON Schema, large source expansion, advanced ranking, native file chooser smoke, Review fourth workflow state, link previews, profile/worklog pages, or framework conversion.

Pull one back only when a real trigger above exists.
