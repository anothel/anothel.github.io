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
- npm package watchlist updater review is complete: package downloads already run sequentially with bounded retries, so extra throttling is deferred until 3~5 repeated 429s prove it helps.
- P0 npm partial user-facing copy is complete: shared and static status text says some data is stale but still usable and labels preserved `n8n-workflow` rows as accepted partial.
- Review detail now shows source context and score reasons for saved items without changing local storage.
- P1 Review Workflow work is complete: saved items have note/tag/reason metadata, status filters, schema-v2 JSON export/import, Markdown export, local-only copy, source context, score reasons, and import collision preview before write.
- P1 InnerHTML Rendering Audit is complete: `docs/THREAT_MODEL.md` inventories current insertion surfaces, input trust boundaries, and fixture ownership for renderer safety.
- P0 npm 429 decision is complete for the current evidence: `n8n-workflow` stays visible as an accepted partial while preserved rows keep workflow-automation package coverage useful.

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
