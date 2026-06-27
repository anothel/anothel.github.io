# Roadmap

This site is a personal technical signal dashboard. It is not a portfolio, resume, blog, company-history page, or social product.

## Direction

- Static-first: must keep working on GitHub Pages, including no-JS and blocked-fetch fallbacks.
- Data-first: HN, GitHub, npm, and curated references should feed useful reading paths.
- Calm home base: Home should answer "what should I open first?" without becoming a marketing page.
- Repeat-use bias: each round should reduce repeated filtering, searching, or checking.
- Trust first: every page should explain data freshness and partial/fallback states with the same meaning.
- Prune-first: prefer clearer copy, deleted scope, and reused helpers over new frameworks or broad rewrites.
- No accounts, sync, backend, resume content, or broad blog engine for now.

## Current Surface

- Pages: Home, Today, Explore, Review, Status, Trends, Packages, Repos, Links, Notes, and 7 topic pages.
- Core topics: AI agents, MCP, Agent skills, AI evals, AI engineering, Workflow automation, Security.
- Data modules: HN/GitHub/npm/reference links plus generated Today and Status metadata.
- Local browser state: saved review items, up to 3 pinned topics, explicit Explore defaults, and up to 5 saved Explore searches.
- Source governance: checked-in watchlist data drives trends, packages, repos, and links.

## Planning Metrics

- `Visit speed`: how many clicks from Home to a useful signal.
- `Repeat friction`: how much state must be re-selected on every visit.
- `Signal quality`: whether Today/Explore show specific agent-workflow signals over broad generic tooling.
- `Trust`: whether stale, partial, or rate-limited data is visible and understandable.
- `Static safety`: all features must degrade cleanly when fetch, JS, or localStorage is blocked.

## P0 - Trust Contract

Goal: any page should report data state with the same source of truth and no stale static fallback copy.

- [x] Run `scripts/report-refresh.mjs` before `scripts/update-static-fallbacks.mjs` in `scripts/update-all.mjs`.
- [x] Make `scripts/update-all.mjs --dry-run` print the real args, including `--json-out data/refresh-report.json`.
- [x] Keep Explore static fallback health neutral or synced with current manifest/refresh report.
- [x] Add a cross-page health consistency guard for Home, Today, Explore, and Status.
- [x] Define `Fresh / Aging / Stale` and when `Aging` becomes Status attention.
- [x] Update `docs/IA.md` so Signal Schema v2 is no longer described as deferred.
- [x] Add a small docs guard so IA cannot drift back to "schema v2 deferred".

Success:

- Status `ok`, Today `ok`, and Explore fallback `partial` cannot disagree when checked-in data is healthy.
- Status static HTML uses the current `data/refresh-report.json.generatedAt`.
- Roadmap, IA, and code agree on current topics, schema version, and deferred work.

## P1 - Signal Quality v1

Goal: "why open this first?" is visible in tests and UI, not only hidden in scoring code.

- [x] Add scoring golden fixtures for agent/MCP/evals/workflow signals versus broad generic tooling.
- [x] Keep scoring policy in code for now; do not move it into large data config before fixtures exist.
- [x] Structure score reasons so Today, Explore, and topic cards can show stable top reasons.
- [x] Add regression checks that baseline packages like React/Vite/TypeScript do not dominate by default.
- [x] Make score changes produce a useful golden diff.

Success:

- Top Today picks are not broad generic tooling by accident.
- `Signal fit` numbers have visible reasons.
- Scoring changes are reviewable without manually inspecting the whole site.

## P2 - Review Loop v2

Goal: saved items remain useful after data refreshes.

- [x] Introduce stable canonical IDs based on normalized URL when possible.
- [x] Keep legacy saved IDs working during migration.
- [ ] Store optional saved note/tag/reason.
- [x] Add Markdown export beside JSON export.
- [ ] Add Review sorting around next action or saved reason only when the saved metadata exists.
- [x] Cover import/export migration with one focused test.

Success:

- Saved queue survives module movement, title changes, query/hash changes, trailing slash changes, and `.git` URL variants.
- Review shows why an item was saved.
- A human-readable Markdown review list can be exported.

## P3 - Source Governance / Topic Notes

Goal: sources and topic pages stay maintainable without turning the site into a broad feed.

- [ ] Keep watchlists data-owned; extend only missing governance fields or disabled/history behavior.
- [ ] Require topic pages to have judgment notes, not just enough items.
- [ ] Add a topic note completeness guard for all current topic pages.
- [ ] Document `promote / keep lens-only / retire` criteria for topics.
- [ ] Keep Notes as a decision-support index, not a blog engine.

Success:

- Source changes usually touch data, not updater code.
- Topic pages justify action, not only filtering.
- New topics are promoted because they help decisions across multiple sources.

## P4 - Architecture PoC

Goal: test islands only if vanilla JS becomes the blocker.

- [ ] Pick one PoC scope: Explore filter panel or Review queue.
- [ ] Preserve GitHub Pages deployment and current public routes.
- [ ] Preserve no-JS fallback behavior.
- [ ] Include localStorage migration smoke coverage.
- [ ] Define bundle/perf budget before adding framework code.

Success:

- No route rename.
- Fallback degradation stays intact.
- Failed PoC can be removed without changing product behavior.

## Recommended Order

1. `fix: generate refresh report before static fallbacks`
2. `fix: keep explore static health in sync`
3. `docs: align IA with current schema`
4. `test: add cross-page data health consistency`
5. `test: add scoring golden fixtures`
6. `feat: stabilize saved review ids`
7. `feat: export review queue as markdown`
8. `refactor: harden watchlist governance`

## Not Now

- Vite + React SPA.
- Backend/server functions.
- Accounts or sync.
- Full portfolio/resume.
- Company history.
- Broad blog engine.
- Large design-system rewrite.
- Rename public routes just to improve labels.
- Move scoring policy into data before golden fixtures protect behavior.
- Add more topic pages from item count alone.

## Working Rules

- User owns git staging, commits, and pushes.
- Public project docs live at repo root when they guide future work.
- Private implementation plans stay under `.superpowers/`.
- Before each large task, update or consult this roadmap.
- After each large task, keep only the next measurable work in this file.
