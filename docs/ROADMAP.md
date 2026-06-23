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

- **Watchlist definitions as data**: move source definitions out of update scripts after updater behavior is stable.

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

### 1. P0 Trust And Role Pass

Goal: make the current site explain itself and avoid stale fallback data.

- Add IA route role doc.
- Update top-page copy and terminology.
- Sync static fallback values with checked-in data.
- Add static fallback and data contract tests.
- Improve Today action copy and Status partial/fallback copy.

Done when:
- JS-disabled fallback values match current checked-in data.
- Each route has a distinct one-line role.
- Links and Review wording no longer overlap.
- Data health states are understandable without reading implementation docs.

Success metric:
- A first-time visitor can answer: what this site is, what to open first, where saved items live, and whether the data is usable.

### 2. P1 sourceMeta Marker Cleanup

Goal: make source health metadata smaller, consistent, and easier to explain in Status and refresh reports.

- Inventory current `sourceMeta` marker fields across generated data files.
- Keep only markers that Status, Home, and refresh reports render clearly.
- Normalize partial, fallback, stale, and rate-limit naming across modules.
- Add tests that reject unknown or contradictory source health markers.

Done when:
- Status and refresh reports explain every retained marker.
- Generated JSON avoids duplicate names for the same state.
- Tests catch unknown source markers and contradictory status/fallback combinations.

Success metric:
- A partial refresh can be understood from Status without reading updater code.

## Recently Completed

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
