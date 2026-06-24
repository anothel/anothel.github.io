# Roadmap

This site is a personal technical signal dashboard. It is not a portfolio, resume, blog, or company-history page.

## Direction

- Static-first: must keep working on GitHub Pages.
- Data-first: HN, GitHub, npm, and curated references should feed useful reading paths.
- Calm home base: Home should answer "what should I open first?" without becoming a marketing page.
- Repeat-use bias: each round should reduce repeated filtering, searching, or checking.
- No accounts, sync, backend, resume content, or broad blog engine for now.

## Current Surface

- Pages: Home, Today, Explore, Review, Status, Trends, Packages, Repos, Links, and 3 topic pages.
- Core topics: AI agents, MCP, Agent skills.
- Data modules: HN/GitHub/npm/reference links plus generated Today and Status metadata, with expanded AI evals and workflow automation coverage.
- Local browser state: saved review items, up to 3 pinned topics, explicit Explore defaults, and up to 5 saved Explore searches.

## Planning Metrics

- `Visit speed`: how many clicks from Home to a useful signal.
- `Repeat friction`: how much state must be re-selected on every visit.
- `Signal quality`: whether Today/Explore show specific agent-workflow signals over broad generic tooling.
- `Trust`: whether stale, partial, or rate-limited data is visible and understandable.
- `Static safety`: all features must degrade cleanly when fetch or localStorage is blocked.

## Backlog Triage 2026-06-22

Imported backlog is useful and should not be treated as throwaway feedback. The split below records what moves into the current roadmap, what is deferred, and what is rejected for now.

## Audit Triage 2026-06-23

Imported audit confirmed the current direction and ranked static trust work first.

- Done: static fallback tests already covered Home, Today, Status, and module dates.
- Done: topic fallback counts/dates now match current data.
- Done: public copy now uses Data date, Generated at, and Source health instead of freshness/fallback implementation wording.
- Keep next: page role copy, score explanation, Explore mobile density, Review empty/local state, and a11y pass.
- Cut for now: React SPA and broad framework rewrite before static trust work is stable.

## Code Reanalysis Triage 2026-06-24

Imported code-based reanalysis confirms the current product shape: static-first, data-first, Home as decision hub, Today as generated brief, Explore as workbench, Review as local saved queue, Status as trust surface, modules as source detail, and topics as judgment pages.

- Keep: current vanilla/static structure until shared contracts are stable.
- Keep next: freshness labels, source health consistency, local-only Review copy, localStorage state consolidation, topic taxonomy, score reasons, and refresh report.
- Already covered: update-all / validate-data workflow, package/repo/link watchlists as data, Signal Schema v2, module shell, topic notes, IA route roles.
- Cut for now: full React SPA, backend/accounts/sync, broad blog engine, design-system rewrite, and page-count growth without taxonomy/source/score contracts.

### P0 - Do Now

Goal: make the current static site trustworthy and understandable before changing frameworks.

1. **IA and route role copy**
   - Add a short route role document.
   - Give each public page a one-line job.
   - Separate routes into Decision, Discovery, Source detail, and Trust / personal state.
   - Reason: users need to know which page answers which question before more UI work helps.
   - Done when: Home, Today, Explore, Review, Status, Trends, Packages, Repos, and Links each have distinct purpose copy.

2. **Static fallback and data sync**
   - Keep hardcoded HTML fallbacks aligned with `data/manifest.json` and `data/today.json`.
   - Remove stale dates such as old `2026-06-14`, `2026-06-15`, and `2026-06-19` from visible fallback HTML.
   - Reason: stale fallback values make loaded data look broken.
   - Done when: JS-disabled Home, Today, Status, and module page stamps match checked-in data.

3. **Home first screen**
   - Keep Home as an open-now decision board, not a full dashboard dump.
   - Prioritize 3 open-now signals, saved queue state, and a small trust strip.
   - Push Browse modules below the primary decision area.
   - Reason: Home should answer "what should I open first?" in one scan.
   - Done when: first screen shows priority picks, why/action copy, current data health, and Review state.

4. **Terminology split**
   - Links = curated reference shelf.
   - Review = saved locally in this browser.
   - Explore = search/filter/save workbench.
   - Topics = focused judgment pages, not only filters.
   - Reason: "saved references" blurs Links and Review.
   - Done when: public copy avoids mixed Links/Review wording.

5. **Human-readable status copy**
   - Explain partial, error, fallback, and rate-limit states in user-facing language.
   - Reason: source health is a trust feature, not an internal implementation detail.
   - Done when: Status and data health cards say whether data remains usable and what failed.

6. **Regression tests**
   - Add static fallback tests.
   - Add minimal data contract tests.
   - Reason: fallback drift and data shape drift are current risk points.
   - Done when: tests fail on stale fallback dates, mismatched manifest counts, unsafe URLs, invalid statuses, or out-of-range scores.

7. **Freshness and source-health consistency**
   - Show data age as Fresh, Aging, Stale, Fallback, Error, or Partial in user-facing copy.
   - Keep Home, Explore, Status, and module stamps on the same aggregate source-health logic.
   - Reason: "Data date" alone does not explain stale-but-usable or fallback states.
   - Done when: tests cover fresh, stale, fallback, and partial cases across shared data-health logic.
   - Done 2026-06-24.

8. **Local-only saved queue copy**
   - State that saved Review items stay in this browser only.
   - Reason: localStorage is intentional, but users should not expect account sync.
   - Done when: Review empty/header copy explains the local browser boundary without suggesting a broken feature.
   - Done 2026-06-24; existing Review/Home copy already covered this.

### Imported Backlog Decision Log

This keeps the imported review intact enough to explain why each recommendation moved where it did.

| Imported item | Decision | Why |
|---|---|---|
| Route role / IA document | P0, doing now | Framework changes will not fix unclear routes. This gives every page one job before more UI work. |
| Home as open-now decision board | P0, doing now | Matches the site question: "What is worth opening now?" Home should not become a full dashboard dump. |
| Static fallback and checked-in data sync | P0, doing now | Stale counts and dates make the site look broken when JS or fetch is slow. |
| Links vs Review terminology split | P0, doing now | Links are curated checked-in references; Review is local browser state. Mixed copy creates confusion. |
| Human-readable partial/error/fallback copy | P0, doing now | Trust states are user-facing product states, not implementation labels. |
| Today reason/action split | P0, doing now | Today must explain why to open something and what to do next, not only list high-score items. |
| Static fallback regression test | P0, doing now | Prevents old dates/counts from returning silently. |
| Data contract test | P0, doing now | Protects manifest counts, status values, URL safety, and Today section shape. |
| README page role table | P0, doing now | Keeps operator docs aligned with route roles and data model. |
| Explore compact/mobile drawer | P1, current | Valid UX issue now being addressed by Explore UX v2: desktop workbench plus mobile-collapsed filters. |
| Common module page template | Done 2026-06-22 | Trends, Packages, Repos, and Links now share a source-detail shell without changing data hooks. |
| Signal schema v2 / normalized signal view | P1, keep | Correct direction, but it touches all producers and consumers. Needs current schema tests first. |
| Topic Notes v1 | Done 2026-06-22 | Topic pages now have checked-in judgment notes with dynamic supporting signals. |
| update-all / validate-data workflow | P1, keep | Valuable once validation rules are proven by tests; then consolidate scripts and workflow. |
| sourceMeta marker cleanup | P1, keep | Status copy should drive which markers matter to users. Do after the first trust copy pass. |
| Watchlist definitions moved from scripts to data | P1, keep | Makes source lists easier to edit, but not needed before fallback trust is fixed. |
| Astro + React islands | P2, keep | Best medium-term fit: static pages plus interactive Explore/Review islands. |
| Explore and Review React islands | P2, keep | Depends on Astro route compatibility and localStorage migration. |
| Design-system rewrite | P2, keep small | Useful later for repetition, but current risk is data/copy trust, not tokens/components. |
| Lightweight notes index | P2, keep conditional | Only worth adding after at least 3 real notes exist. Avoid creating an empty blog shell. |
| Vite + React SPA | Not now | Current goal needs static fallback, direct routes, and low deploy complexity. SPA adds weight without solving the main problem. |
| Backend, accounts, sync, comments, CMS, broad blog engine | Not now | Violates static-first, no-account boundary. Review can stay local for now. |
| Portfolio/resume/company-history content | Not now | User already rejected that content direction; this site remains a personal signal radar. |

### P1 - Active / Next

These are valid backlog items. Completed items should move out of this list after verification.

- **Shared UI helpers**: extract repeated `escapeHtml`, `safeHref`, and date/status formatting only when touching those renderers anyway.
- Done: refresh report now appears on Status with last run, changed modules, attention sources, and run context.
- Done: shared local state module now owns saved items and pinned topics. Explore defaults and saved searches stay Explore-local until another page needs them.
- Done: package, repo, and link definitions moved to data. Trends stay in scripts until query groups and scoring heuristics have a clean data shape.

### P2 - Framework / Architecture Later

- **Astro + React islands**: medium-term target because this site is static pages plus a few interactive islands.
- **Explore and Review React islands**: only after Astro PoC proves route compatibility and localStorage migration.
- **Design-system component cleanup**: keep narrow; avoid a broad rewrite until repeated patterns are stable.
- **Lightweight notes index**: only after at least 3 real notes exist.

### Not Now / Cut With Reasons

- **Vite + React SPA**: cut for now because it weakens no-JS fallback, complicates GitHub Pages routing, and does not solve stale data/copy trust.
- **Backend, accounts, sync, comments, CMS, broad blog engine**: cut for now because it breaks static-first and no-account constraints.
- **Portfolio/resume/company-history content**: cut because it conflicts with the chosen content direction and the user explicitly does not want that burden.

## Current / Next Work

Next item to promote: shared UI helpers only when touching renderers, or a narrow accessibility pass.

## Recently Completed

### 2026-06-24 - P1 Explore Density Pass

Goal: make Explore results scan better after score reasons increased card content.

- Done: Explore result cards now use auto-fit columns on desktop instead of a fixed two-column grid.
- Done: card padding, gaps, heading size, and score reason text are tighter while preserving mobile one-column layout.
- Verified: focused site-structure tests and full validation pass.

Success metric:
- Explore can show more result cards per desktop row without adding new JS, state, or component abstractions.

### 2026-06-24 - P1 Score Reasons

Goal: explain why high-priority Today and Explore cards rank well without changing the scoring model.

- Done: added `scoreReasons` to the shared Signal Schema v2 normalized item contract.
- Done: Today generation preserves up to 3 concise score reasons in checked-in `data/today.json`.
- Done: Today and Explore render score reasons with escaping and existing card styles.
- Verified: focused Today, Explore, data schema, and full validation pass.

Success metric:
- Priority cards now expose metric, reason, and signal-fit context from existing data instead of adding a new scoring system.

### 2026-06-24 - P1 Topic Taxonomy As Data

Goal: make topic definitions one checked-in contract instead of repeated literals.

- Done: added shared topic labels, slugs, route paths, descriptions, matching rules, reasons, and boosts in `js/topic-taxonomy.js`.
- Done: Home, Explore, Topic pages, and `scripts/signal-taxonomy.mjs` now reuse the shared contract.
- Done: Home topic movement stays scoped to the three real topic pages while Explore keeps broader lenses.
- Verified: taxonomy, Home, Explore, Topic UI, site structure, and full validation pass.

Success metric:
- Adding or renaming a topic now routes through one shared contract plus intentional page/copy changes.

### 2026-06-24 - P1 Shared Local State Module

Goal: remove duplicated localStorage handling without changing saved queue behavior.

- Done: added `AnothelState` as the shared browser-state helper.
- Done: saved item storage keys, v1-to-v2 migration, status normalization, stale-id summary, and blocked-storage fallback now live in one place.
- Done: Home, Explore, and Review now read the same saved item record format.
- Done: Home, Explore, and Topic pages now share pinned topic storage and validation.
- Deferred: Explore defaults and saved searches remain Explore-local because no other page consumes them yet.
- Verified: focused local-state, Home, Explore, Review, and Topic tests pass.

Success metric:
- A saved item and pinned topic have one interpretation across Home, Explore, Review, and Topics.

### 2026-06-24 - P0 Freshness And Trust Pass

Goal: make source freshness and local-only Review state harder to misread.

- Done: source health cards now show Fresh, Aging, Stale, Fallback, Error, or Partial labels.
- Done: fallback/error/partial details keep safety and failure context after the user-facing freshness label.
- Done: Home Data state now uses Fresh/Aging/Stale instead of the vague `current`.
- Done: Review and Home already had local-browser saved queue copy, so no new UI was added.
- Verified: focused DataHealth, Home, Status, and static fallback tests pass.

Success metric:
- Home, Explore, Status, and module source cards expose data age/state through shared health rendering.

### 2026-06-23 - P1 Watchlist Definitions As Data

Goal: make package, repo, and link source lists easier to edit without touching updater logic.

- Done: added `data/watchlists.json` for npm package, GitHub repo, and curated link definitions.
- Done: package, repo, and link updater scripts now load default definitions from checked-in data.
- Done: tests fail if exported defaults drift from `data/watchlists.json`.
- Deferred: Trends use query groups, npm package inputs, and scoring heuristics, so they stay in scripts until a shared data shape is worth it.

Success metric:
- Updating package, repo, and link watchlists no longer requires editing fetch/update logic.

### 2026-06-23 - P1 sourceMeta Marker Cleanup

Goal: keep source health metadata limited to fields that Status and refresh reports explain.

- Done: removed unused unrendered fallback marker from fallback source metadata.
- Done: tightened source metadata schema so unknown rendered-state markers are rejected.
- Verified: source metadata, fallback safety, Status, DataHealth, and refresh-report tests pass.

Success metric:
- Fallback source metadata now keeps only the markers surfaced by Status, README, and refresh reports.

### 2026-06-22 - P1 Update-All / Validate-Data Workflow Consolidation

Goal: make local and scheduled data refresh harder to run in a partial or inconsistent order.

- Done: added `scripts/update-all.mjs` to run Trends, Packages, Repos, Links, Today, and Manifest in one ordered flow.
- Done: added `scripts/validate-data.mjs` to discover repository tests and syntax-check data workflow scripts plus public JavaScript.
- Done: aligned GitHub Actions with the local update and validation commands.
- Done: updated README operator commands and tests so docs, workflow, and scripts share one contract.
- Verified: targeted workflow tests and the full validation command pass.

Success metric:
- One command refreshes generated data, one command verifies generated data and static page contracts, and scheduled refresh uses the same command path.

### 2026-06-22 - P1 Signal Schema v2

Goal: define one normalized signal contract across Trends, Packages, Repos, Links, Today, Explore, and Review.

- Done: added shared `SignalSchema` v2 normalizer and validator.
- Done: Explore delegates normalization and source meta collection to the shared schema.
- Done: Review keeps saved-id matching through Explore normalized v2 items.
- Done: Today generator maps shared schema candidates into brief sections and emits v2 ids/metadata.
- Verified: data schema, Explore, Review, Today, and structure tests cover the shared contract.

Success metric:
- A saved or generated signal has stable id, source module, display module, URL, score, source context, and validation rules across Explore, Review, and Today.

### 2026-06-22 - P1 Module Pages v2

Goal: make source detail pages feel like desktop pages on PC and compact flows on mobile.

- Done: moved Trends and Links filters out of sticky sidebars.
- Done: shared the module shell across Trends, Packages, Repos, and Links.
- Done: preserved all renderer hooks and static data behavior.
- Done: kept status/freshness visible near module stats.
- Verified: structure tests, renderer tests, whitespace check, and browser desktop/mobile layout checks.

Success metric:
- A visitor can move between source detail pages without relearning the layout, while each page still keeps its own purpose and data controls.

### 2026-06-22 - P1 Topic Notes v1

Goal: make topic pages express judgment, not only filtered item lists.

- Done: added checked-in topic notes for AI agents, MCP, and Agent skills.
- Done: notes render without JavaScript on each topic page.
- Done: Topic JS refreshes note supporting links from current normalized topic signals.
- Done: added tests for note copy, supporting signal selection, escaping, unsafe links, HTML slots, and static fallback notes.

Success metric:
- A topic page now answers why the topic is worth watching before listing filtered signals.

## Later

- More topic pages only when data justifies them.
- Lightweight `/notes/` index only after at least 3 real notes exist.

## Not Now

- Full portfolio/resume.
- Company history.
- Backend/server functions.
- Accounts or sync.
- Large design-system rewrite.
- Blog engine.

## Working Rules

- User owns git staging, commits, and pushes.
- Public project docs live at repo root when they guide future work.
- Private implementation plans stay under `.superpowers/`.
- Before each large task, update or consult this roadmap.
- After each large task, remove completed planning detail or move the next measurable step up.
