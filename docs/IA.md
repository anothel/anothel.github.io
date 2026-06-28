# Information Architecture

This site is a static-first personal signal dashboard for deciding what technical signals to open first.

It is not a portfolio, resume, broad blog, company-history page, or social product.

## Product Sentence

anothel.github.io gathers AI engineering and developer-workflow signals from Hacker News, GitHub, npm, and curated references so repeat visitors can decide what to open today.

## Route Groups

| Group | Routes | Job |
|---|---|---|
| Decision | Home, Today | Decide what to open first. |
| Discovery | Explore, Topics, Notes | Search across modules and inspect focused themes. |
| Source detail | Trends, Packages, Repos, Links | Inspect one source or curated list in more detail. |
| Trust / personal state | Status, Review | Check data health and revisit locally saved items. |

## Route Roles

| Route | Role |
|---|---|
| Home | Open-now board with priority picks, local review state, trust summary, and secondary module jumps. |
| Today | Generated priority brief that explains why each pick is worth opening and what to do next. |
| Explore | Cross-module search, filter, save, defaults, saved searches, and topic lenses. |
| Review | Local browser queue for items saved from Explore, with status-specific next actions. |
| Status | Source health, freshness, partial/fallback context, and recovery clues. |
| Trends | Cross-source movement across HN, GitHub, and npm. |
| Packages | npm watchlist focused on adoption and package demand. |
| Repos | GitHub watchlist focused on project traction and workflow relevance. |
| Links | Checked-in curated reference shelf. |
| Topics | Focused landing pages that add judgment and context beyond a raw Explore filter. |
| Notes | Lightweight index of topic judgment notes. |

## Terminology

- Use **Reference shelf** for checked-in curated links.
- Use **Saved queue** or **Review later** for local browser-saved items.
- Use **Tracked signals** for normalized items coming from HN, GitHub, npm, repos, packages, and links.
- Use **Data date** for checked-in data dates.
- Use **Generated at** for derived pages such as Today.
- Use **Source health** for ok, partial, error, and fallback states.
- Use **Partial** only with a short explanation of whether data remains usable.
- Signal Schema v2 is the current normalized item contract for Today, Explore, topics, and saved/review item identity.

## Freshness Vocabulary

- **Fresh** means 0-1 days old.
- **Aging** means 2-3 days old. Aging stays visible, but it is not Status attention while source health is ok.
- **Stale** means more than 3 days old. Stale or any non-ok source health becomes Status attention.

## Topic Governance

- **Promote** a topic when it helps decisions across multiple source modules and has a durable note, guidance, and actions.
- **Keep lens-only** when a theme is useful for Explore filtering but does not yet justify a focused page or Notes entry.
- **Retire** a topic when source movement no longer changes what to open, save, or compare.
- Notes stays a decision-support index for topic judgment notes, not a blog engine.

## Topic Promotion Review

- Existing seven topic pages stay promoted: AI agents, MCP, Agent skills, AI evals, AI engineering, Workflow automation, and Security.
- Developer tooling stays lens-only because it mostly catches broad baseline tooling such as TypeScript, Zod, ESLint, React, and Vite.
- No topic page is added from item count alone; promotion still requires a route job, judgment note, guidance, and actions.

## Public Scope Triage

- Public worklog route stays out. Notes already indexes durable topic judgment notes, so another worklog would duplicate the current discovery job without improving repeat use.
- Portfolio, resume, and company-history content stay out unless the product sentence changes away from a signal dashboard.
- Active navigation and sitemap should expose signal-dashboard routes, not profile, project, worklog, resume, or company-history routes.

## Source Governance

- Watchlist ownership stays in `data/watchlists.json`; updater scripts consume active entries.
- `disabled: true` keeps retired sources documented without appearing in current generated output.
- `history` records why a source changed or retired with `date` and `note`.

## Source Quality Drift Review

- Broad baseline trend inputs stay retired when they duplicate generic TypeScript, framework, linting, formatting, validation, CSS, server, or runner demand.
- Broad package, repo, and reference entries use `disabled: true` plus `history` instead of deletion, so provenance remains auditable.
- Generated data snapshots may still show retired sources until the next data refresh.

## Refresh Stability Follow-up

- Partial package and repo refreshes preserve prior active rows when transient source errors hide individual active entries.
- Trend source failures preserve prior rows for the failed source while marking that source as fallback and stale but safe.
- Disabled watchlist entries stay excluded from generated snapshots even when previous data is reused.
- Home, Today, Explore, Status, and module pages continue to share one source-health truth from generated metadata.

## Review Queue Friction Audit

- Review keeps the existing localStorage key, saved item schema, canonical ids, and legacy saved id matching.
- Empty and no-JS Review states now explain that saved items are local and should start from Explore.
- Queue copy makes unread-first ordering explicit; selected-item detail gives a status-specific next action for unread, read, and done items.
- Export and import stay local portability affordances, not sync, account, backend, or route expansion.

## Signal Quality Regression Audit

- The signal quality golden fixture still keeps agent-workflow signals above broad baseline tooling.
- Today, Explore, topic landing cards, and public structure tests stayed green against current golden expectations.
- No signal policy or watchlist change was needed because broad baseline items did not dominate priority surfaces.
- Home, Today, Explore, Status, and module source health and fallback copy stayed consistent.

## Home Visit Speed Audit

- Home utility choices are reduced to items tracked, one trust state, and the saved queue.
- Open first still points to Today as the priority brief, while Review remains the single return path for saved local work.
- The trust state keeps source health, data date, and freshness visible without three separate Home choices.
- No route, localStorage schema, refresh script, framework, backend, or account scope changed.

## Status Recovery Clarity Audit

- Home, Today, Explore, Status, and module health strips now share recovery copy for ok, partial, fallback, stale, and error states.
- Partial and fallback states keep usable data visible while naming retry data refresh as the recovery action.
- Stale source details name retry data refresh directly instead of requiring refresh-report interpretation.
- No route, localStorage schema, refresh script order, signal policy, framework, backend, or account scope changed.

## Interaction State Visual Audit

- Nested actions now get their own hover/focus target instead of also brightening the parent card.
- Review queue hover and selected states are visually distinct; selected rows keep a left accent marker.
- Saved queue remove buttons gain the same hover/focus affordance as other local action buttons.
- No route, localStorage schema, refresh script, signal policy, framework, backend, or account scope changed.

## Static Snapshot Drift Audit

- `scripts/update-static-fallbacks.mjs` regenerated Home, Today, Explore, Status, module, topic, and Notes snapshots without producing drift.
- Checked-in static pages already matched shared renderer output after the interaction and recovery-copy changes.
- Static fallback copy stayed user-facing and aligned across Home, Today, Explore, Status, modules, and topics.
- No route, localStorage schema, source data, signal policy, framework, backend, or account scope changed.

## Notes Return Path Audit

- Topic note panels now link back to Notes, so the durable judgment index is reachable from promoted topic pages.
- Review details add a topic notes return path when the saved item maps to a promoted topic with judgment notes.
- Home keeps one Notes entry from topic movement, while Notes keeps topic and Explore lens links for returning to current signals.
- No route, localStorage schema, source data, signal policy, framework, backend, or account scope changed.

## End-to-End Workflow Consolidation

- Today now links to Review later from its continue block, matching its item-level next-action copy about saving useful signals.
- Home -> Today/Explore -> Review -> Notes/Status has one forward path and one return path without adding another route.
- Repeated audit slices are consolidated into workflow-level Roadmap items rather than new page-by-page audits.
- No route, localStorage schema, source data, signal policy, framework, backend, account, or sync scope changed.

## Refresh Recovery Drill

- Status refresh-run fallback attention keeps previous data context, including the previous data date from refresh-report sources.
- update-all dry-run and static fallback regeneration stayed local; no live source refresh was run.
- Refresh order, fallback markers, Status copy, and static fallback tests share the same recovery meaning for ok, stale, partial, fallback, and error states.
- Live source refresh stayed separate because it requires network approval.

## Live Source Refresh Probe

- `node scripts/update-all.mjs` refreshed live HN, GitHub, npm, repo, package, link, Today, manifest, report, and static fallback data for 2026-06-27.
- The live refresh report covered 4 modules, 6 sources, and 111 generated items.
- An initial npm 429 partial run exposed that package and repo partial row reuse was using fallback-only `staleButSafe` metadata.
- Package and repo partial row reuse now preserves previous active rows while keeping fallback-only markers reserved for true fallback states.
- Generated Today and Explore surfaces still prioritize agent-workflow signals over broad baseline tooling.

## Refresh Cadence Governance Audit

- Scheduled refresh stays once daily at `17 21 * * *` UTC with manual `workflow_dispatch`; no cadence change was needed.
- Workflow concurrency, grouped update logs, validate-before-commit, Step Summary, and `refresh-report` artifact remain the operator contract.
- Trend GitHub query-level skips now mark the GitHub trend source `partial`, set `rateLimited`, and list the skipped query names in `data/refresh-report.json` and Status.
- Query-level error copy drops long API URLs from generated metadata so Status stays reviewable.
- Anonymous GitHub limits remain expected locally; set `GITHUB_TOKEN` before live refresh when a fully ok trend report matters.

## Signal Surface Prune Pass

- Current routes remain justified by distinct jobs: Home opens, Today prioritizes, Explore discovers, Review returns, Status explains trust, source modules inspect, Notes and topic pages add judgment.
- Home -> Today/Explore -> Review -> Notes/Status remains the core workflow.
- No route or state was deleted because public structure, workflow, and static fallback tests already assign each surface a separate job.
- Future Roadmap work should stay bundled by workflow instead of creating page-by-page audit follow-ups.
- No route, localStorage schema, source family, framework, backend, account, or sync scope changed.

## Source Governance Prune Pass

- Broad active npm sources `react`, `typescript`, and `playwright` are retired from trend and package watchlists with `disabled: true` plus `history`.
- Checked-in trend and package snapshots omit those retired direct watchlist entries, so source modules start with agent, MCP, eval, workflow, and AI SDK signals instead of generic baseline tooling.
- Today, Explore, Status, Home, and topic static snapshots were regenerated from the pruned checked-in data without changing source families, routes, schemas, refresh cadence, or signal policy.
- Baseline scoring policy stays in `data/signal-policy.json`; source pruning now removes broad inputs that no longer need active collection.

## Live Refresh Confirmation Pass

- Network-approved `node scripts/update-all.mjs` refreshed live HN, GitHub, npm, repo, package, link, Today, manifest, report, and static fallback data after source pruning.
- Retired direct watchlist entries `react`, `typescript`, and `playwright` stayed absent from generated trends, packages, repos, links, Today, Explore, and static snapshots.
- The live refresh report covered 4 modules, 6 sources, and 108 generated items.
- GitHub trend refresh remains `partial` under unauthenticated local refresh because four GitHub search queries hit rate limits; use `GITHUB_TOKEN` for the next confirmation pass.

## Refresh Auth Preflight Pass

- `node scripts/update-all.mjs` now warns local operators when `GITHUB_TOKEN` is missing before running GitHub-backed refreshes.
- The warning keeps the existing refresh path and explains that unauthenticated GitHub calls may remain `partial` or `rateLimited`.
- The authenticated confirmation itself remains gated on a real `GITHUB_TOKEN`; no source family, route, schema, or refresh cadence changed.

## Authenticated GitHub Refresh Pass

- With `GITHUB_TOKEN` present, the live refresh ran the existing `node scripts/update-all.mjs` path and the GitHub trend source recovered to `ok`.
- No GitHub rate-limit or skipped-query errors remained in `data/refresh-report.json`.
- Retired direct watchlist entries stayed absent from generated priority surfaces after the authenticated refresh.
- The remaining refresh `partial` status came from npm `n8n-workflow` 429, not GitHub auth.

## Roadmap Analysis P0 Corrections

- Watchlist governance now rejects `history.date` values after the current data date, and former `2026-06-28` watchlist history entries were corrected to `2026-06-27`.
- Today baseline priority scoring now derives the baseline penalty from `data/signal-policy.json` instead of a hard-coded `26`.
- Trends, Packages, Repos, and Reference shelf static pages now keep top source rows in checked-in HTML, so no-JS and blocked-fetch visits still expose item links.
- The remaining active data issue is npm `n8n-workflow` 429 partial state; GitHub trend auth recovery is complete.

## Documentation Trust Baseline

- README now uses the same product sentence as IA: a static-first personal signal dashboard for deciding what to open next.
- Public operating docs now cover security reporting, contribution workflow, Signal Schema v2, source governance, threat model, release checklist, and changelog.
- Package entry point and PR CI are established without dependencies, lockfiles, framework tooling, backend, account, sync, or build output.
- Roadmap now separates future operational work from completed documentation work, with data contract enforcement as the next P0 queue.
- npm `n8n-workflow` 429 remains an accepted visible partial state because previous rows are preserved and `rateLimited` metadata is explicit.

## Renderer Safety Audit

- Shared `safe-dom.js` owns text escaping, href blocking, and link attribute rendering for public renderers.
- External item links rendered from generated data and static fallbacks carry `rel="noopener noreferrer"`; internal route links stay plain hrefs.
- Today, Home, source detail modules, topic pages, Notes, and Review reuse the same link-attribute helper instead of page-local link policy.
- Existing malicious fixture tests still prove unsafe URLs and generated text are blocked or escaped; no sanitizer, framework, backend, route, account, or sync scope changed.

## Data Contract Enforcement

- `node scripts/validate-data.mjs` remains the single data contract gate for manifest, refresh-report, signal policy, normalized items, watchlists, source metadata, and syntax checks.
- `tests/data-schema.test.mjs` now includes focused negative drift fixtures for duplicate manifest module ids, refresh-report module mismatch, and non-downranking signal policy penalty.
- JSON Schema files stay deferred until current tests miss real drift; no dependency, package manager lockfile, framework, backend, account, or sync scope changed.

## Release Discipline Pass

- The release policy stays dated changelog entries and normal GitHub Pages publishes.
- `docs/RELEASE_CHECKLIST.md` names `npm run check`, `node scripts/validate-data.mjs`, `git diff --check`, generated-data review, dated changelog review, and publish decision checks.
- No Git tag, provenance, SLSA, framework, backend, account, or sync scope changed.

## Generated Data Publish Drill

- Current checked-in data is publishable from local checks when `npm run check`, `node scripts/validate-data.mjs`, and `git diff --check` pass.
- npm `n8n-workflow` 429 remains accepted visible partial source health with `rateLimited` metadata because preserved package rows keep the surface useful.
- No live network refresh, route, source family, release policy, package dependency, lockfile, framework, backend, account, or sync scope changed.

## Module Type Warning Cleanup

- Home, Today, and Status browser modules now use `.mjs`, matching their ESM exports and removing Node 24 module-type warnings from validation.
- CommonJS-compatible `signal-schema.js` and `topic-taxonomy.js` stay `.js`, so existing `require` callers and browser globals keep working.
- No package-wide `"type": "module"`, dependency, bundler, transpiler, framework, backend, account, or sync scope changed.

## npm Partial Recovery Confirmation

- Network-approved refresh still returned npm `n8n-workflow` 429.
- 25 package rows stayed preserved with `rateLimited` metadata, so npm partial remains accepted source health rather than a watchlist removal.
- The same local run lacked `GITHUB_TOKEN`, so GitHub trend refresh became `partial` again and publish confirmation needs a token-backed refresh report.

## Authenticated Refresh Publish Confirmation

- `gh auth token` supplied `GITHUB_TOKEN` to the existing refresh path without printing the token.
- GitHub trend source recovered to `ok`; no skipped GitHub trend queries or GitHub rate-limit errors remained.
- Only npm `n8n-workflow` 429 remains non-ok, and the preserved package rows keep generated surfaces publishable under accepted partial source health.
- No route, source family, release policy, package dependency, lockfile, framework, backend, account, or sync scope changed.

## Current Signal Diff Triage

- After the authenticated refresh, refreshed Home, Today, Explore, topic, and module snapshots stayed publishable.
- Today start-here picks, topic top movers, and source detail rows show agent-workflow signals still lead the priority surfaces over broad baseline tooling.
- The only non-ok source health remains npm `n8n-workflow` 429 with preserved package rows and visible `rateLimited` metadata.
- No watchlist, signal policy, route, source family, release policy, package dependency, lockfile, framework, backend, account, or sync scope changed.

## Publish Readiness Diff Review

- The generated data, static snapshots, docs, and release notes matched the release checklist.
- route count, navigation, source health copy, dated changelog entry, and known npm partial state stayed publishable.
- `data/manifest.json`, `data/refresh-report.json`, and Today sections stayed aligned with checked-in static fallback pages.
- User-owned staging, commit, push, and GitHub Pages publish remain outside repository automation.

## Signal Policy

- Scoring policy ownership stays in `data/signal-policy.json`.
- baseline titles list broad tools that should not dominate agent-workflow signals by raw popularity alone.
- baseline penalty and intent threshold tune generated Today ranking without editing updater code.
- Today and Explore share baseline titles; Explore uses an embedded fallback only when the policy JSON fetch is blocked.

## Deferred Decisions

- Framework islands stay deferred until vanilla JavaScript blocks a specific Explore or Review workflow.
