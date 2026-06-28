# Roadmap

This site is a personal technical signal dashboard. It is not a portfolio, resume, blog, company-history page, or social product.

## Use This File

- Keep only future work here. Completed work belongs in git history, `CHANGELOG.md`, and decision docs.
- Each priority needs trigger, scope, verification, and exit.
- Bundle related slices into one workflow-level task when possible.
- Delete or demote items that do not protect visit speed, repeat use, signal quality, trust, static safety, or contributor confidence.

## Product Direction

- Static-first: GitHub Pages, no-JS fallback, and blocked-fetch fallback must keep useful content visible.
- Data-first: HN, GitHub, npm, and curated references should feed useful reading paths.
- Calm home base: Home answers "what should I open first?" without becoming marketing.
- Repeat-use bias: reduce repeated filtering, searching, and status checking.
- Trust first: stale, partial, fallback, and rate-limited states stay visible and consistent.
- Prune-first: prefer clearer copy, deleted scope, reused helpers, and tests over new frameworks.

## Current Surface

- Pages: Home, Today, Explore, Review, Status, Trends, Packages, Repos, Links, Notes, and 7 topic pages.
- Core topics: AI agents, MCP, Agent skills, AI evals, AI engineering, Workflow automation, Security.
- Data modules: HN/GitHub/npm/reference links plus generated Today and Status metadata.
- Source detail pages: Trends, Packages, Repos, and Links keep checked-in top rows for no-JS and blocked-fetch visits.
- Local browser state: saved review items with optional note/tag/reason, up to 3 pinned topics, explicit Explore defaults, and up to 5 saved Explore searches.
- Source governance: `data/watchlists.json` drives trends, packages, repos, and links; disabled/history fields keep retired sources auditable.
- Signal policy: `data/signal-policy.json` owns Today and Explore baseline scoring policy.
- Renderer safety: shared `safe-dom.js` owns text escaping, href blocking, and external item link attributes across public renderers and static fallbacks.
- Data contract gate: `node scripts/validate-data.mjs` owns manifest, refresh-report, signal-policy, and normalized item contract checks.
- Release policy: dated changelog entries and normal GitHub Pages publishes; no Git tag is required yet.
- Public trust docs: `SECURITY.md`, `docs/THREAT_MODEL.md`, `docs/SIGNAL_SCHEMA.md`, `docs/SOURCE_GOVERNANCE.md`, and `docs/RELEASE_CHECKLIST.md` describe the operating contract.
- Verification entry point: dependency-free `package.json` scripts; package entry point and PR CI are established.
- No package dependencies, package manager lockfile, framework tooling, backend, account, sync, or build output exists.
- npm partial recovery: npm `n8n-workflow` 429 is accepted as visible partial source health with preserved rows and explicit `rateLimited` metadata.
- Publish drill: current checked-in data is publishable from local checks while npm `n8n-workflow` 429 remains visible `partial` source health.
- Module syntax: Home, Today, and Status ESM browser modules use `.mjs` while global helper scripts stay `.js`.
- npm partial confirmation: npm `n8n-workflow` 429 remains accepted with preserved package rows and visible `rateLimited` metadata.
- Architecture gate: framework PoC stays blocked until a measured vanilla JavaScript problem exceeds `docs/ARCHITECTURE.md`.

## Decision Metrics

- `Visit speed`: clicks from Home to a useful signal.
- `Repeat friction`: state the user must re-select on every visit.
- `Signal quality`: specific agent-workflow signals beating broad generic tooling.
- `Trust`: stale, partial, rate-limited, or fallback data is visible and understandable.
- `Static safety`: features degrade cleanly when fetch, JS, or localStorage is blocked.
- `Contributor confidence`: a new maintainer can run, validate, release, and report security issues from docs.

## Next Work Queue

### P0 - Authenticated Refresh Publish Confirmation

Trigger: latest local refresh lacked `GITHUB_TOKEN` and reintroduced GitHub trend `partial`, while npm `n8n-workflow` remains an accepted partial source.

Scope:

- Run the existing refresh path with `GITHUB_TOKEN` present.
- Confirm GitHub trend source recovers to `ok`, and npm partial remains the only accepted non-ok source.
- Keep route count, source families, release policy, package deps, lockfiles, framework, backend, account, and sync unchanged.
- Do not add retries, mirrors, proxies, provenance, tags, or release automation unless token-backed refresh still cannot produce a clear publish decision.

Verification:

- Run `node scripts/update-all.mjs` with `GITHUB_TOKEN`.
- Run `node --test tests/package-data.test.mjs tests/refresh-report.test.mjs tests/static-fallback.test.mjs tests/site-structure.test.mjs`.
- Run `node scripts/validate-data.mjs`.
- Run `npm run check`.
- Run `git diff --check`.

Exit:

- Current generated data is publishable or blocked from a token-backed refresh report.
- If GitHub remains partial with a token, the blocker is documented in Roadmap instead of treated as npm fallout.

## Architecture Gate

Gate-only, not active queue work.

Trigger: a measured vanilla JavaScript problem exceeds the budget in `docs/ARCHITECTURE.md`.

Scope:

- Start with the smallest affected surface, likely Review or Explore.
- Keep GitHub Pages, no-JS messaging, blocked-fetch fallbacks, and public routes intact.
- Keep the client budget explicit before introducing framework tooling.

Verification:

- Run affected UI tests plus any architecture PoC test added for the blocker.
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
- Release provenance, SLSA, visual regression, and advanced ranking work stay deferred until a failing test shows a concrete gap.

## Working Rules

- User owns git staging, commits, and pushes.
- Public project docs live at repo root when they guide future work.
- Private implementation plans stay under `.superpowers/`.
- Before each large task, update or consult this roadmap.
- After each large task, keep only future work in this file.
