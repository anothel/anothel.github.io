# Roadmap

This site is a personal technical signal dashboard. It is not a portfolio, resume, blog, or company-history page.

## Direction

- Static-first: must keep working on GitHub Pages.
- Data-first: HN, GitHub, npm, and curated references should feed useful reading paths.
- Calm home base: Home should answer "what should I open first?" without becoming a marketing page.
- Repeat-use bias: each round should reduce repeated filtering, searching, or checking.
- Prune-first: prefer clearer copy, deleted scope, and reused helpers over new frameworks or broad rewrites.
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

No active P1 work. Promote the next item only when a P2 trigger becomes real.

## P2 - Later

- Astro + React islands only after route compatibility and localStorage migration are proven.
- Explore and Review React islands only if vanilla code becomes the blocker.
- Design-system cleanup only after repeated patterns stabilize.
- Lightweight notes index only after at least 3 real notes exist.
- Export/import Review JSON only after local-state portability becomes a real need.
- Visual regression only after UI layout stabilizes enough to make snapshots useful.
- More topic pages only when each has a judgment note, not just item count.

## Not Now

- Vite + React SPA.
- Backend/server functions.
- Accounts or sync.
- Full portfolio/resume.
- Company history.
- Broad blog engine.
- Large design-system rewrite.
- Rename public routes just to improve labels.
- Refactor all duplicated helpers at once.
- Move scoring policy into data before the policy stabilizes.

## Working Rules

- User owns git staging, commits, and pushes.
- Public project docs live at repo root when they guide future work.
- Private implementation plans stay under `.superpowers/`.
- Before each large task, update or consult this roadmap.
- After each large task, keep only the next measurable work in this file.
