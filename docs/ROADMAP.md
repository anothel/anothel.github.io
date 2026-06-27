# Roadmap

This site is a personal technical signal dashboard. It is not a portfolio, resume, blog, company-history page, or social product.

## Use This File

- Keep only future work here. Completed work belongs in git history and docs, not roadmap checklists.
- Each priority needs a trigger, scope, verification path, and exit condition.
- Pull former deferred ideas forward only when they improve the signal-dashboard job.
- Delete or demote items that do not protect visit speed, repeat use, signal quality, trust, or static safety.

## Product Direction

- Static-first: must keep working on GitHub Pages, including no-JS and blocked-fetch fallbacks.
- Data-first: HN, GitHub, npm, and curated references should feed useful reading paths.
- Calm home base: Home should answer "what should I open first?" without becoming a marketing page.
- Repeat-use bias: each round should reduce repeated filtering, searching, or checking.
- Trust first: every page should explain data freshness and partial/fallback states with the same meaning.
- Prune-first: prefer clearer copy, deleted scope, and reused helpers over new frameworks or broad rewrites.

## Current Surface

- Pages: Home, Today, Explore, Review, Status, Trends, Packages, Repos, Links, Notes, and 7 topic pages.
- Core topics: AI agents, MCP, Agent skills, AI evals, AI engineering, Workflow automation, Security.
- Data modules: HN/GitHub/npm/reference links plus generated Today and Status metadata.
- Local browser state: saved review items with optional note/tag/reason, up to 3 pinned topics, explicit Explore defaults, and up to 5 saved Explore searches.
- Source governance: checked-in watchlist data drives trends, packages, repos, and links; optional disabled/history fields keep retired sources documented without current output.
- Signal policy: checked-in `data/signal-policy.json` owns Today and Explore baseline scoring policy.
- Architecture gate: framework PoC stays blocked until a measured vanilla JavaScript problem exceeds the budget in `docs/ARCHITECTURE.md`.

## Decision Metrics

- `Visit speed`: clicks from Home to a useful signal.
- `Repeat friction`: state the user must re-select on every visit.
- `Signal quality`: specific agent-workflow signals beating broad generic tooling.
- `Trust`: stale, partial, or rate-limited data is visible and understandable.
- `Static safety`: features degrade cleanly when fetch, JS, or localStorage is blocked.

## Next Work Queue

### P0 - Signal Surface Prune Pass

Trigger: refresh, review, status, and static-safety loops are stable; next risk is accumulated routes, states, and copy slowing repeat visits.

Scope:

- Audit Home, Today, Explore, Review, Status, source modules, Notes, and topic pages as one workflow.
- Delete or demote duplicate choices, copy, or route jobs only when tests show another surface already owns the same decision.
- Keep refresh cadence, source metadata schema, localStorage schema, signal policy, static fallback routes, and architecture gate unchanged unless a failing test proves otherwise.
- No new route, source family, framework, backend, account, or sync scope.

Verification:

- Run `node --test tests/site-structure.test.mjs tests/home-data.test.mjs tests/today-data.test.mjs tests/explore-ui.test.mjs tests/review-ui.test.mjs tests/static-fallback.test.mjs`.
- Run `node scripts/validate-data.mjs`.
- Run `git diff --check`.

Exit:

- One open-first path, one discovery path, one review path, and one trust path remain obvious.
- Any removed or deferred surface is recorded in IA or `Deferred Boundaries`, not active planning.
- Route and local-state count stay justified by visit speed, repeat friction, signal quality, trust, or static safety.

## Architecture Gate

Gate-only, not active queue work.

Trigger: a measured vanilla JavaScript problem exceeds the budget in `docs/ARCHITECTURE.md`.

Scope:

- Start with the smallest affected surface, likely Review or Explore.
- Keep GitHub Pages, no-JS messaging, blocked-fetch fallbacks, and public routes intact.
- Keep the client budget explicit before introducing framework tooling.

Verification:

- Run the affected UI tests plus any architecture PoC test added for the blocker.
- Compare bundled/static output against the current no-build path before accepting the PoC.

Exit:

- Adopt the PoC only if it removes measured complexity without weakening static safety; otherwise delete it.

## Deferred Boundaries

- Public worklog route stays rejected while Notes covers durable topic judgment.
- Portfolio, resume, and company-history copy stay rejected while the site sentence remains a signal dashboard.
- Vite + React SPA without a measured blocker.
- Backend or server functions.
- Accounts, sync, or cross-device identity.
- Large design-system rewrite.
- Route renames just to improve labels.
- More topic pages from item count alone.

## Working Rules

- User owns git staging, commits, and pushes.
- Public project docs live at repo root when they guide future work.
- Private implementation plans stay under `.superpowers/`.
- Before each large task, update or consult this roadmap.
- After each large task, keep only future work in this file.
