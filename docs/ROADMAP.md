# Roadmap
Use this file only to pick the next safe work bundle.

Completed work belongs in `CHANGELOG.md`. Durable decisions belong in `docs/`.

## Rules

- Start the highest priority bundle whose trigger is true.
- Keep each bundle small enough to implement, test, and commit alone.
- Use `docs/RELEASE_CHECKLIST.md` to pick minimum checks before staging or committing.
- Do not run live refresh unless fresh source evidence is needed.
- No backend, account, sync, database, framework, bundler, package dependency, or lockfile without an explicit approved architecture change.
- Keep `n8n-workflow` visible while preserved rows are useful.
- If `GITHUB_TOKEN` is missing, keep GitHub rate limits as known partial state.

## Current Source State

- Last checked-in refresh: `2026-07-05T08:10:35.289Z`.
- Generated items: 108.
- Overall status: `partial`.
- Hacker News, GitHub trends, trend npm, repo, and manual sources are `ok`.
- Active blocker: npm package refresh 429 for `n8n-workflow` has repeated 6 times. Preserved package rows remain usable, so the data stays an accepted partial; choose disable or replacement for `n8n-workflow` before the next publish confirmation.

## Next Work Queue

### P0 - Publish Health Refresh and Source Partial Policy

Trigger: checked-in data is old, source health changes, public page dates look wrong, owner asks for publish confirmation, or the same source partial repeats.

Scope:

- Run existing data refresh only when network/token access is approved.
- Review generated data, manifest, refresh report, sitemap, Today, Status, Explore, and static fallbacks together.
- If `GITHUB_TOKEN` is missing, keep GitHub rate limits as known partial state and rerun only when token-backed proof matters.
- Keep `n8n-workflow` visible while preserved rows are useful: previous rows exist, package coverage stays visible, Status names the failed package, and the data date is not stale.
- Treat one-package npm downloads 429s as package-source partials, not automatic watchlist disables, while preserved rows remain useful.
- After 3 repeated same-package 429s, record the package as a watchlist replacement candidate; after 5 repeats or stale preserved rows, decide whether to disable or replace it before the next publish confirmation.
- Keep user-facing warning copy limited to source health, Status detail, and page health strips while the partial is accepted; escalate only when the data becomes stale or rows disappear.

Verification:

- `node scripts/update-all.mjs` when live refresh is approved.
- `node scripts/validate-data.mjs`.
- `git diff --check`.
- `npm.cmd run check`.

Exit: generated data is publishable, or the exact source blocker and next watchlist action threshold are recorded here.

### P1 - Explore Repeat-use Clarity

Trigger: repeated Explore use shows unclear active filters, saved-search feedback, topic-lens intent, or partial-source impact.

Scope:

- Shorten the active filter/focus summary around visible count, active filter, and source health.
- Make saved-search apply feedback name the restored filter/focus/sort state.
- Keep saved-search labels short without changing saved ids or localStorage schema.
- Reword topic lenses around why to open the lens, not only counts.
- Show whether partial sources affect the visible result set.

Verification:

- `node --test tests/explore-ui.test.mjs`
- `node --test tests/local-state.test.mjs`
- `node --test tests/topic-ui.test.mjs`
- `node --test tests/static-fallback.test.mjs`
- `npm.cmd run check`
- `git diff --check`

Exit: repeat visitors can see applied state, saved-search effect, lens intent, and partial-source impact without route, backend, sync, or schema changes.

### P1 - Today Ranking Diversity Guard

Trigger: Today or Explore top priority results drift toward one source family, broad baseline tooling, duplicate URLs, or raw popularity over topic relevance.

Scope:

- Strengthen golden fixtures before changing ranking logic.
- Guard Start section diversity so one source family does not dominate the top set.
- Keep broad baseline package/repo signals from beating agent/workflow/eval/MCP signals by popularity alone.
- Verify duplicate URL identity stays consistent across Today, Explore, and Review saved ids.
- Change `data/signal-policy.json` only when a fixture proves a ranking regression.

Verification:

- `node --test tests/signal-quality-golden.test.mjs`
- `node --test tests/today-generator.test.mjs`
- `node --test tests/data-schema.test.mjs`
- `npm.cmd run check`
- `git diff --check`

Exit: top priority remains workflow, agent, eval, MCP, or supported-topic centered without adding a larger ranking model.

### P2 - Static Fallback Generator Cleanup

Trigger: fallback drift, route-specific replacement fragility, CRLF/LF mismatch, or unclear static-fallback error output slows a checked-in page update.

Scope:

- Split route-neutral fallback replacement helpers from route-specific renderers only where drift tests need it.
- Keep Home, Today, Explore, Status, module, topic, and Notes snapshot fixtures distinct.
- Preserve CRLF/LF coverage for tagged replacement blocks.
- Make fallback drift errors name the route and marker that failed.

Verification:

- `node --test tests/static-fallback.test.mjs`
- `node --test tests/site-structure.test.mjs`
- `npm.cmd run check`
- `git diff --check`

Exit: fallback regeneration remains predictable and route drift is easier to diagnose without framework, bundler, or dependency changes.

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
