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

- Last checked-in refresh: `2026-07-04T22:07:30.155Z`.
- Generated items: 108.
- Overall status: `partial`.
- GitHub, Hacker News, trend npm, repo, and manual sources are `ok`.
- Active blocker: npm package refresh 429 for `n8n-workflow`; preserved package rows remain usable.

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

### P0 - npm 429 Partial Policy Clarification

Trigger: `n8n-workflow` stays 429 repeatedly while preserving package rows.

Scope:

- Record how many consecutive npm `n8n-workflow` 429 runs occurred in refresh report.
- Split partial meaning into:
  - `accepted partial`: preserved rows keep utility and no new data is required immediately.
  - `action required partial`: missing/watchlist coverage degrades trust or staleness.
- After 3~5 consecutive repeats, decide whether to adjust watchlist policy or adopt replacement metric source.
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

### P1 - Explore Repeat Use

Trigger: users lose context between visits, saved searches feel hidden, or repeated filtering takes too long.

Scope:

- Improve saved search edit/delete UX and expose it in common actions.
- Make default filter reset state obvious and recoverable.
- Clarify relationship between pinned topics and saved searches.
- Keep score reasoning short and consistent in cards.
- Show how source-health partial affects Explore results.
- Make localStorage export/import behavior consistent between Explore and Review.

Verification:

- `node scripts/validate-data.mjs`.
- `npm.cmd run check`.
- `git diff --check`.
- Manual smoke: saved search, defaults, pinned topics, and export/import flows persist across reload.

Exit: returning users can continue previous filter state and make a shortlist decision in 1~2 minutes.

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

### P1 - Documentation Slimming and Decision Log Separation

Trigger: docs mix current decisions with long audit history and users struggle to find the current conclusion.

Scope:

- Introduce `docs/DECISIONS.md` or `docs/adr/` for durable decisions.
- Keep `docs/IA.md` focused on routes, vocabulary, and UX principles.
- Move completed large changes to `CHANGELOG.md` and/or decision log.
- Keep `ROADMAP.md` as a forward-looking queue.
- Add explicit sections for current conclusion and history location at document tops.

Verification:

- `npm.cmd run check`.
- `git diff --check`.
- Manual doc audit: README -> IA/ROADMAP/Release Checklist leads to the current decision quickly.

Exit: new contributors can find current decisions quickly and archived discussion no longer appears as active work.

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

### P2 - Trust Copy Clarity

Trigger: users report confusion between stale, partial, fallback, and error states.

Scope:

- Consolidate shared copy for partial and recovery states across renderers.
- Make partial/recovery paths explicit: why data is still visible, what is stale, and next action.
- Keep wording consistent between Today, Home, Explore, Status, and static fallbacks.
- Ensure copy changes are test-covered and explain the difference between source freshness and recovery requirement.

Verification:

- `node scripts/validate-data.mjs`.
- `npm.cmd run check`.
- `git diff --check`.
- Manual smoke: Today and Explore surface the same partial/recovery phrase when source health is partial.

Exit: users can distinguish partial/recovery outcomes without checking Status first.

### P2 - Route and Link Checks

Trigger: route or link regressions appear after data updates or static refreshes.

Scope:

- Verify all public routes return 200 in a lightweight local check.
- Verify no obvious broken internal links in rendered pages.
- Add smoke checks for status/today/explore DOM readiness.
- Keep checks lightweight first; add heavier tooling only when value is proven.

Verification:

- `node scripts/validate-data.mjs`.
- `npm.cmd run check`.
- `git diff --check`.
- Manual: top public routes and critical links load after refresh.

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
