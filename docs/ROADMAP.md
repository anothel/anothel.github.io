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

### P0 - Live Refresh Confirmation Pass

Trigger: source governance pruning changed checked-in watchlists and snapshots locally; the next live refresh must prove retired sources stay absent under real HN, GitHub, and npm responses.

Scope:

- Run the existing refresh pipeline with network/auth approval; do not add a new refresh path.
- Confirm retired direct watchlist entries stay absent from trends, packages, repos, links, Today, Explore, and static snapshots.
- Preserve partial/rate-limit and stale-but-safe recovery meanings from current source metadata.
- Keep source families, refresh cadence, source metadata schema, localStorage schema, signal policy, route count, static fallback routes, and architecture gate unchanged unless a failing test proves otherwise.
- No new public route, framework, backend, account, sync, or source family.

Verification:

- Run `node scripts/update-all.mjs` with network approval and `GITHUB_TOKEN` when available.
- Run `node scripts/validate-data.mjs`.
- Run `node --test tests/signal-quality-golden.test.mjs tests/today-data.test.mjs tests/explore-ui.test.mjs tests/topic-ui.test.mjs tests/static-fallback.test.mjs tests/site-structure.test.mjs`.
- Run `git diff --check`.

Exit:

- Live refreshed data omits retired direct watchlist entries.
- Source health remains understandable for ok, partial, fallback, stale, and error states.
- Broad baseline signals still do not dominate agent-workflow priority surfaces after live refresh.

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

- Page-by-page audit follow-ups when the issue can be handled as one workflow pass.
- New audit slice without a failing test, user report, or measured metric.
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
