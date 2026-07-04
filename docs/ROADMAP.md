# Roadmap

Use this file only to pick the next safe work bundle.

Completed work belongs in `CHANGELOG.md`. Durable decisions belong in `docs/`.

## Rules

- Start the highest priority bundle whose trigger is true.
- Keep each bundle small enough to implement, test, and commit alone.
- Do not run live refresh unless fresh source evidence is needed.
- No backend, account, sync, database, framework, bundler, package dependency, or lockfile without an explicit approved architecture change.

## Current Source State

- Last checked-in refresh: `2026-07-04T21:44:37.064Z`.
- Generated items: 108.
- Overall status: `partial`.
- Hacker News, trend npm, repo, and manual sources are `ok`.
- Active blockers: unauthenticated GitHub trend search 403 rate limits and npm package refresh 429 for `n8n-workflow`; preserved package rows remain usable.

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

### P1 - Signal Quality

Trigger: generic tooling outranks specific agent-workflow signals, a watched source goes empty, or owner review says ranking is wrong.

Scope:

- Prefer `data/watchlists.json` and `data/signal-policy.json` changes before updater code.
- Retire weak broad sources with `disabled: true` and `history`; do not delete provenance.
- Keep Today and Explore ranking policy aligned.

Verification:

- `node --test tests/signal-quality-golden.test.mjs tests/signal-taxonomy.test.mjs`.
- `node --test tests/trend-data.test.mjs tests/package-data.test.mjs tests/repo-data.test.mjs tests/link-data.test.mjs`.
- `npm.cmd run check`.
- `git diff --check`.

Exit: agent-workflow signals beat broad baseline tooling for the reviewed case.

### P1 - Explore Repeat Use

Trigger: repeated visits require redoing the same search, sort, focus, topic pin, or source/ranking interpretation.

Scope:

- Improve saved searches, preferred defaults, topic pins, active-filter clarity, and score/source explanation.
- Keep existing localStorage keys unless a failing test proves they block use.
- Do not add account sync, backend, or a new route.

Verification:

- `node --test tests/explore-ui.test.mjs tests/local-state.test.mjs tests/topic-ui.test.mjs`.
- `node --test tests/static-fallback.test.mjs tests/site-structure.test.mjs`.
- `npm.cmd run check`.
- `git diff --check`.

Exit: repeat Explore use needs less manual setup without changing storage scope.

### P2 - Trust Copy and Generator Cleanup

Trigger: source health, stale data, partial recovery, or generated/static fallback copy becomes unclear.

Scope:

- Keep ok, partial, error, stale, fallback, staleButSafe, and rateLimited wording consistent.
- Prefer shared renderer/generator fixes over page-local copy.
- Touch formatting/static fallback helpers only when they are already slowing review or maintenance.

Verification:

- `node --test tests/status-ui.test.mjs tests/data-health.test.mjs tests/refresh-report.test.mjs`.
- `node --test tests/static-fallback.test.mjs tests/home-data.test.mjs tests/today-data.test.mjs tests/workflow.test.mjs`.
- `npm.cmd run check`.
- `git diff --check`.

Exit: source state copy and generated fallback output match the checked-in data.

## Architecture Gate

Trigger: a measured vanilla JavaScript blocker makes Review or Explore harder to maintain than the no-build path.

Until then: no framework, bundler, dependency, lockfile, backend, account, sync, database, or server function.

Verification:

- One focused PoC test for the measured blocker.
- `npm.cmd run check`.

Exit: adopt only if the PoC reduces shipped maintenance cost; otherwise delete it.

## Cut List

Do not re-add backlog lists for:

- code of conduct, release tags, GitHub releases, provenance, SLSA, visual regression, coverage tooling, route/link checker, JSON Schema, large source expansion, advanced ranking, export/import, native file chooser smoke, link previews, profile/worklog pages, or framework conversion.

Pull one back only when a real trigger above exists.
