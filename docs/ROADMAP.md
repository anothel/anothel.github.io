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
- Signal policy: checked-in `data/signal-policy.json` owns generated Today baseline scoring penalties and intent thresholds.
- Architecture gate: framework PoC stays blocked until a measured vanilla JavaScript problem exceeds the budget in `docs/ARCHITECTURE.md`.

## Planning Metrics

- `Visit speed`: how many clicks from Home to a useful signal.
- `Repeat friction`: how much state must be re-selected on every visit.
- `Signal quality`: whether Today/Explore show specific agent-workflow signals over broad generic tooling.
- `Trust`: whether stale, partial, or rate-limited data is visible and understandable.
- `Static safety`: all features must degrade cleanly when fetch, JS, or localStorage is blocked.

## P5 - Public Scope Triage

Goal: revisit former Not Now items without turning this into a resume, company-history page, or broad blog.

- [ ] Audit whether a small public worklog would improve repeat-use or trust more than current Notes.
- [ ] Decide if any portfolio/resume/company-history content has a signal-dashboard job.
- [ ] Keep route additions static and removable; no account, sync, backend, or SPA requirement.
- [ ] Add copy tests before adding any public route.

Success:

- Former Not Now content either earns a concrete route job or stays out.
- New content does not weaken the site sentence or GitHub Pages fallback.

## Not Now

- Vite + React SPA.
- Backend/server functions.
- Accounts or sync.
- Large design-system rewrite.
- Rename public routes just to improve labels.
- Add more topic pages from item count alone.

## Working Rules

- User owns git staging, commits, and pushes.
- Public project docs live at repo root when they guide future work.
- Private implementation plans stay under `.superpowers/`.
- Before each large task, update or consult this roadmap.
- After each large task, keep only the next measurable work in this file.
