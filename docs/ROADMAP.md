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
- Local browser state: saved review items with optional note/tag/reason, up to 3 pinned topics, explicit Explore defaults, and up to 5 saved Explore searches.
- Source governance: checked-in watchlist data drives trends, packages, repos, and links; optional disabled/history fields keep retired sources documented without current output.
- Architecture gate: framework PoC stays blocked until a measured vanilla JavaScript problem exceeds the budget in `docs/ARCHITECTURE.md`.

## Planning Metrics

- `Visit speed`: how many clicks from Home to a useful signal.
- `Repeat friction`: how much state must be re-selected on every visit.
- `Signal quality`: whether Today/Explore show specific agent-workflow signals over broad generic tooling.
- `Trust`: whether stale, partial, or rate-limited data is visible and understandable.
- `Static safety`: all features must degrade cleanly when fetch, JS, or localStorage is blocked.

## Next Large Work

No active implementation track. Add the next roadmap item only when one planning metric regresses or Review/Explore has a measured vanilla JavaScript blocker.

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
