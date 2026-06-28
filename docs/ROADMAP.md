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
- Public trust docs: `SECURITY.md`, `docs/THREAT_MODEL.md`, `docs/SIGNAL_SCHEMA.md`, `docs/SOURCE_GOVERNANCE.md`, and `docs/RELEASE_CHECKLIST.md` describe the operating contract.
- Architecture gate: framework PoC stays blocked until a measured vanilla JavaScript problem exceeds `docs/ARCHITECTURE.md`.

## Decision Metrics

- `Visit speed`: clicks from Home to a useful signal.
- `Repeat friction`: state the user must re-select on every visit.
- `Signal quality`: specific agent-workflow signals beating broad generic tooling.
- `Trust`: stale, partial, rate-limited, or fallback data is visible and understandable.
- `Static safety`: features degrade cleanly when fetch, JS, or localStorage is blocked.
- `Contributor confidence`: a new maintainer can run, validate, release, and report security issues from docs.

## Next Work Queue

### P0 - Verification Entry Point Baseline

Trigger: repo analysis found no root `package.json`, no standard npm scripts, and no separate PR CI, while tests and update scripts already exist.

Scope:

- Add the smallest root `package.json` that records `type`, Node engine, and scripts for serve, validate, test, check, and data update.
- Add PR CI that runs validation and whitespace checks without committing generated data.
- Keep scheduled data refresh separate from PR CI.
- Keep the existing `update-trends.yml` behavior unless renaming can be done without breaking tests or operator docs.
- Do not add package dependencies, bundlers, framework tooling, lockfiles, backend, account, sync, or build output.

Verification:

- Run `node scripts/validate-data.mjs`.
- Run `node --test tests/workflow.test.mjs tests/ops-docs.test.mjs tests/architecture-poc.test.mjs`.
- Run `git diff --check`.

Exit:

- A new contributor can run the documented commands without copying long command lists.
- PR validation exists separately from scheduled data refresh.
- Architecture gate still proves no package manager lockfile or build output was introduced.

### P0 - npm Rate Limit Partial Follow-up

Trigger: authenticated GitHub refresh recovered trend source health to ok, but npm `n8n-workflow` fetch returned 429 and kept overall refresh status partial.

Scope:

- Use the existing package updater retry and fallback path; do not add a new refresh path.
- Decide whether npm 429 handling needs only documentation, a small retry timing tweak, or no code change.
- Confirm package rows stay useful when one package fetch is partial.
- Preserve partial/rate-limit and stale-but-safe recovery meanings from current source metadata.
- Keep source families, refresh cadence, source metadata schema, localStorage schema, signal policy, route count, static fallback routes, and architecture gate unchanged unless a failing test proves otherwise.
- No new public route, framework, backend, account, sync, source family, or schema.

Verification:

- Run package updater tests covering partial package refresh.
- Run `node scripts/validate-data.mjs`.
- Run `node --test tests/package-data.test.mjs tests/status-ui.test.mjs tests/static-fallback.test.mjs tests/site-structure.test.mjs`.
- Run `git diff --check`.

Exit:

- npm 429 behavior is either accepted as a visible partial state or improved with focused retry coverage.
- Package, Status, and static fallback pages keep one recovery meaning for the npm partial state.
- No broad baseline source returns to active priority surfaces.

### P1 - Renderer Safety Audit

Trigger: external data and checked-in watchlists are rendered into multiple public pages, and the safety contract should be proven page by page.

Scope:

- Audit direct `innerHTML` use and external link rendering across page renderers.
- Add malicious fixture coverage where page-level tests are missing.
- Keep shared `safe-dom.js` as the trust boundary; do not create a second sanitizer.
- Consider a static meta policy only if it fits GitHub Pages and does not break existing external links.

Verification:

- Run `node --test tests/safe-dom.test.mjs tests/site-structure.test.mjs tests/static-fallback.test.mjs`.
- Run affected page renderer tests.
- Run `node scripts/validate-data.mjs`.

Exit:

- Public renderers prove unsafe URLs and HTML are escaped or blocked.
- External links keep `rel="noopener noreferrer"` where rendered.

### P1 - Data Contract Enforcement

Trigger: Signal Schema v2 is now documented, but validation still mostly lives in JS tests and updater code.

Scope:

- Decide whether lightweight JSON Schema files add value beyond current tests.
- Start with manifest, refresh report, signal policy, and normalized item examples.
- Keep validation local and dependency-free unless current checks become too brittle.

Verification:

- Run `node scripts/validate-data.mjs`.
- Run schema or contract tests added for the chosen data files.

Exit:

- Data contract drift fails in validation before generated HTML is accepted.
- Source additions have one documented path and one test path.

### P1 - Release Discipline Pass

Trigger: release checklist and changelog now exist, but release flow is not connected to CI or generated-data review.

Scope:

- Keep `CHANGELOG.md` current for user-visible and operator-visible changes.
- Define whether this repo uses dated releases, Git tags, or only Pages publishes.
- Connect release checklist to actual verification commands.
- Do not add provenance/SLSA machinery until the basic release contract is used.

Verification:

- Run `node --test tests/ops-docs.test.mjs`.
- Run release-doc tests added for the chosen policy.

Exit:

- A maintainer can decide whether a generated-data change is publishable from docs and CI output.

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
- Release provenance, SLSA, visual regression, and advanced ranking work before basic CI and release discipline exist.

## Working Rules

- User owns git staging, commits, and pushes.
- Public project docs live at repo root when they guide future work.
- Private implementation plans stay under `.superpowers/`.
- Before each large task, update or consult this roadmap.
- After each large task, keep only future work in this file.
