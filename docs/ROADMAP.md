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
- Data modules: HN/GitHub/npm/reference links plus generated Today and Status metadata, with AI evals and workflow automation coverage.
- Local browser state: saved review items, up to 3 pinned topics, explicit Explore defaults, and up to 5 saved Explore searches.

## Planning Metrics

- `Visit speed`: how many clicks from Home to a useful signal.
- `Repeat friction`: how much state must be re-selected on every visit.
- `Signal quality`: whether Today/Explore show specific agent-workflow signals over broad generic tooling.
- `Trust`: whether stale, partial, or rate-limited data is visible and understandable.
- `Static safety`: all features must degrade cleanly when fetch or localStorage is blocked.

## P0

No active P0 work. Keep security, data-loss prevention, static safety, and checked-in data integrity above product polish.

## P1 - Active / Next

1. **Accessibility pass**
   - Check keyboard reachability, visible focus, form labels, button names, landmark order, and no-JS fallbacks across Home, Today, Explore, Review, Status, and module pages.
   - Prefer markup/CSS fixes over new JavaScript.
   - Acceptance: tests or static assertions catch missing labels, unsafe focus traps, and broken landmarks.

2. **Shared UI helpers**
   - Extract repeated `escapeHtml`, `safeHref`, and date/status formatting only when touching those renderers anyway.
   - Do not create a design system or helper package just to satisfy this item.
   - Acceptance: one touched flow removes real duplication without changing behavior.

3. **Trends input data shape**
   - Move trend query groups and npm trend inputs out of updater logic only if editing those sources becomes recurring work.
   - Keep scoring heuristics in code until they have a stable data contract.
   - Acceptance: changing trend source inputs does not require editing fetch/update control flow.

## P2 - Later

- Astro + React islands only after route compatibility and localStorage migration are proven.
- Explore and Review React islands only if vanilla code becomes the blocker.
- Design-system cleanup only after repeated patterns stabilize.
- Lightweight notes index only after at least 3 real notes exist.

## Not Now

- Vite + React SPA.
- Backend/server functions.
- Accounts or sync.
- Full portfolio/resume.
- Company history.
- Broad blog engine.
- Large design-system rewrite.

## Working Rules

- User owns git staging, commits, and pushes.
- Public project docs live at repo root when they guide future work.
- Private implementation plans stay under `.superpowers/`.
- Before each large task, update or consult this roadmap.
- After each large task, keep only the next measurable work in this file.
