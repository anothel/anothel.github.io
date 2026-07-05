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

### P0 - npm `n8n-workflow` 429 Partial Handling

Trigger: `n8n-workflow` partial repeats, users are unclear about partial status, or owner asks for publish confirmation.

Scope:

- Track consecutive `n8n-workflow` 429 failures in refresh report.
- Split `partial` into user-visible states such as `accepted partial` vs `action required partial`.
- Decide watchlist or alternate indicator changes after repeated failures (3~5+ events) and document the threshold policy.
- Review npm package call ordering/frequency to reduce rate-limit pressure.
- Update status wording to explicitly say when data is usable but stale.
- Keep `n8n-workflow` in watchlist while rows are preserved and reliable.

Verification:

- `node scripts/validate-data.mjs`.
- `npm.cmd run check`.
- `git diff --check`.
- Preserve source-health clarity for both live and static pathways.

Exit: partial is immediately understandable from status and source-health copy, and action policy is documented.

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

### P1 - Documentation Slimming

Trigger: docs mix current decisions with long audit history and users struggle to find the current conclusion.

Scope:

- Introduce `docs/DECISIONS.md` or `docs/adr/` for durable decisions.
- Keep `docs/IA.md` focused on routes, vocabulary, and UX principles.
- Move completed large changes to `CHANGELOG.md` and/or decision log.
- Keep `ROADMAP.md` as a forward-looking queue.
- Add explicit “current conclusion” and “history location” sections at document tops.

Verification:

- `npm.cmd run check`.
- `git diff --check`.
- Manual doc audit: README → IA/ROADMAP/Release Checklist leads to the current decision quickly.

Exit: new contributors can find current decisions quickly and archived discussion no longer appears as active work.

### P1 - InnerHTML Audit

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
