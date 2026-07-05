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

- Last checked-in refresh: `2026-07-05T05:00:23.964Z`.
- Generated items: 108.
- Overall status: `partial`.
- Hacker News, trend npm, repo, and manual sources are `ok`.
- Active blocker: GitHub trend refresh is unauthenticated and rate-limited on 4 queries.
- Active blocker: npm package refresh 429 for `n8n-workflow` has repeated 2 times; preserved package rows remain usable.

## Next Work Queue

### Completed Since Last Review

- Explore: default filter restore state (focus/module/category/sort) is now persisted and recoverable via Save/Reset default controls.
- Trust-copy wording and recovery copy are shared and test-covered across Today, Home, Explore, Status, and module/static fallback surfaces via `DataHealth`.
  - Keep this as a baseline; repeat-work here is now a regression review, not roadmap expansion.
- Explore: browser summary now displays a source-health partial warning when source metadata is partial, and this path is covered by tests.
- Explore: card copy now shortens reason snippets and truncates long summaries/reasons for quicker scanning.
- Explore: saved search rows now expose Apply, Rename, and Delete actions with clearer labels, and include a one-line note that saved searches are full filter snapshots separate from topic pins.
- Explore: saved search export/import is now consistent with Review-local storage workflows, including JSON payload format, status messaging, and smoke-tested copy/paste + invalid-input behavior.
- P1 Explore Repeat Use work is complete: saved search portability and repeat-use controls are now aligned between sessions and with Review-like local data workflows.
- Documentation split is complete: `docs/DECISIONS.md` stores durable conclusions and history, while `docs/IA.md` keeps current route, vocabulary, and workflow decisions.
- P0 npm 429 partial policy now records consecutive repeated-run streaks in refresh report output and classifies partial status copy as `accepted partial` for preserved rows vs `action required partial` when trust impact is immediate.
- P0 publish health refresh ran for 2026-07-05 without `GITHUB_TOKEN`; generated data remains publishable with GitHub trend 403 partial and npm `n8n-workflow` 429 x2 recorded.

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

### P0 - npm 429 Partial Policy Clarification

Trigger: `n8n-workflow` stays 429 repeatedly while preserving package rows.

Scope:

- Record how many consecutive npm `n8n-workflow` 429 runs occurred in refresh report.
- Split partial meaning into:
  - `accepted partial`: preserved rows keep utility and no new data is required immediately.
  - `action required partial`: missing/watchlist coverage degrades trust or staleness.
- Remaining: operator rule and action once 3~5 repeated partials are observed.
- Review npm API call order/frequency in watchlist updater for rate-limit load reduction.
- Add user-facing copy that explicitly says "Some data is stale but still usable".

Verification:

- `node scripts/validate-data.mjs`
- `npm.cmd run check`
- `git diff --check`
- Manual review of refresh report and Status copy when partial repeats (3+ times).

Exit: source state explains partial cause and response rule; repeat run threshold is documented in docs.

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

### P1 - Review Workflow

Trigger: Review works as a temporary buffer but does not feel like an actionable queue.

Scope:

- Add lightweight note/tag support for saved items if useful.
- Revisit whether a fourth state (ex. `later`) is needed without over-expanding state complexity.
- Add explicit schema versioning for export JSON.
- Add import duplicate/collision preview before write.
- Improve source context and score reason visibility in Review cards.

Verification:

- `node scripts/validate-data.mjs`.
- `npm.cmd run check`.
- `git diff --check`.
- Manual smoke: export/import round-trip preserves data integrity and warns on collisions.

Exit: Review behaves as a practical processing queue with clear local-only boundaries.

### P1 - InnerHTML Rendering Audit

Trigger: any client-rendered HTML insertion path reappears without an explicit escape review.

Scope:

- Inventory all `innerHTML` usage and annotate input trust boundaries.
- For each site, verify escaping / safeHref policy and source-of-trust assumptions.
- Add or strengthen malicious fixture coverage for renderer behavior.
- Prefer DOM API or centralized safe render helpers for future output.
- Track maintenance cost for any future template-layer shift.

Verification:

- `node scripts/validate-data.mjs`.
- `npm.cmd run check`.
- `git diff --check`.
- Manual review of all `innerHTML` call sites and associated fixtures.

Exit: every user-facing HTML insertion is explainable, tested, and policy-consistent.

## Architecture Gate

Trigger: a measured vanilla JavaScript blocker makes Review or Explore harder to maintain than the no-build path.

Until then: no framework, bundler, dependency, lockfile, backend, account, sync, database, or server function.

Verification:

- One focused PoC test for the measured blocker.
- `npm.cmd run check`.

Exit: adopt only if the PoC reduces shipped maintenance cost; otherwise delete it.

## Cut List

Do not re-add backlog lists for:

- code of conduct, release tags, GitHub releases, provenance, SLSA, coverage tooling, JSON Schema, large source expansion, advanced ranking, native file chooser smoke, link previews, profile/worklog pages, or framework conversion.

Pull one back only when a real trigger above exists.
