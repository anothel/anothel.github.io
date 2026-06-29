# Roadmap

This file is the next-work queue for anothel.github.io.

Use it to choose the next useful bundle, not to store completed history. Keep shipped outcomes in `CHANGELOG.md`.

## Use This File

- Pick the highest priority bundle with a live trigger.
- Keep work workflow-level, not page-by-page.
- Each active bundle must keep Trigger, Scope, Verification, and Exit.
- Prefer copy, data, docs, and focused tests before new routes or abstractions.
- Do not run live refresh unless the selected bundle needs fresh source evidence.

## Current Baseline

The 2026-06-28 repository analysis called for several trust, tooling, and documentation basics. These are already part of the current repo and should stay maintained, not re-added:

- Public trust docs: README product purpose, `SECURITY.md`, `CONTRIBUTING.md`, `CHANGELOG.md`, `docs/THREAT_MODEL.md`, `docs/SIGNAL_SCHEMA.md`, source governance in `docs/SOURCE_GOVERNANCE.md`, and `docs/RELEASE_CHECKLIST.md`.
- Tooling entry points: `package.json`, Node `>=20`, `serve`, `validate`, `test`, `check`, and `update:data` scripts.
- Workflow split: PR CI is separate from scheduled/manual data refresh.
- Data contract baseline: Signal Schema v2, source health vocabulary, score policy ownership, generated-file ownership, and schema migration behavior are documented and tested.
- Existing safety tests: safe DOM helpers, external link `rel="noopener noreferrer"`, malicious URL/text escaping, localStorage migration, route/sitemap/404 behavior, partial/fallback/rate-limit handling, and checked-in schema drift.

Do not turn the baseline into new work unless it drifts from current behavior.

## Next Work Queue

### P0 - Publish Health Refresh

Trigger: checked-in data is older than the publish window, source health changes, a publish needs fresh evidence, or owner asks for a live source confirmation.

Scope:

- Run the existing data refresh path only; do not change source families or refresh cadence.
- Confirm whether the current partial state is GitHub 403, npm 429, or another source failure.
- If `GITHUB_TOKEN` is missing, keep GitHub 403 as known partial state and queue a token-backed rerun.
- Keep npm `n8n-workflow` active while preserved rows remain useful and rate-limited health stays visible.
- Review generated data, Today, manifest, refresh report, and static fallbacks as one publish bundle.
- Keep Roadmap P0 aligned with the real current partial cause after every refresh.

Current state:

- 2026-06-29 token-backed refresh recovered GitHub trend health to `ok`.
- npm `n8n-workflow` still returns 429, with previous package rows preserved from 2026-06-29, so current data remains publishable partial.
- Next full confirmation is only needed when package source health must prove all sources `ok` or `n8n-workflow` stops preserving useful rows.

Absorbs analysis items:

- Roadmap P0 current partial alignment.
- Current GitHub 403 rate-limit policy.
- npm `n8n-workflow` 429 policy.
- Live refresh probe, gated on network/token approval.
- Data freshness and recovery criteria before publish.

Verification:

- Run `node scripts/update-all.mjs` only when network and token access are approved.
- Run `npm.cmd run check`.
- Run `node scripts/validate-data.mjs`.
- Run `git diff --check`.

Exit:

- Generated data is publishable, or the blocker is documented in this Roadmap with reason and next trigger.
- Source health copy matches the actual failing source.

### P1 - Signal Quality Watchlist

Trigger: broad baseline tooling outranks agent-workflow signals, a watched source goes empty, owner review finds ranking wrong, or a better source replaces a weak one.

Scope:

- Tune `data/watchlists.json` and `data/signal-policy.json` before updater code.
- If checked-in policy is correct but not applied consistently, fix shared signal normalization before page-local ranking.
- Retire broad sources with `disabled: true` and `history`; do not delete provenance.
- Preserve agent, MCP, eval, workflow automation, AI engineering, and security coverage.
- Keep Today and Explore policy aligned.
- Keep source add/remove rules in `docs/SOURCE_GOVERNANCE.md` aligned with any watchlist change.
- Keep source health states, score/ranking docs, and schema migration notes aligned with any contract change.

Absorbs analysis items:

- Source add/remove guide.
- Source health state machine documentation.
- Score/ranking documentation.
- Data schema golden coverage.
- Partial/fallback/rate-limit fixtures.

Verification:

- Run `node --test tests/signal-quality-golden.test.mjs tests/signal-taxonomy.test.mjs`.
- Run `node --test tests/trend-data.test.mjs tests/package-data.test.mjs tests/repo-data.test.mjs tests/link-data.test.mjs`.
- Run `npm.cmd run check`.
- Run `git diff --check`.

Exit:

- Priority surfaces favor specific agent-workflow signals over generic tooling.
- Watchlist history explains every retirement or replacement.

### P1 - Explore Repeat-Use Tightening

Trigger: owner request or repeated visits require the same search, focus, sort, topic pin setup, or ranking/source interpretation.

Scope:

- Improve saved searches, preferred defaults, topic pins, active-filter clarity, and score/reason/source explanation inside Explore.
- Keep existing localStorage keys and caps unless a failing test proves they block repeat use.
- Reuse existing local-state and safe-DOM helpers.
- Do not add account sync, backend, or a new route.
- Include keyboard, ARIA, and contrast checks when changing controls.

Absorbs analysis items:

- Score/reason/source explanation.
- Accessibility smoke checks.
- First-screen explanation only when owner asks or the current first screen blocks use.

Current state:

- Dynamic and checked-in Explore cards expose score reasons, signal-fit ARIA text, source context when available, and a real source link.

Verification:

- Run `node --test tests/explore-ui.test.mjs tests/local-state.test.mjs tests/topic-ui.test.mjs`.
- Run `node --test tests/static-fallback.test.mjs tests/site-structure.test.mjs`.
- Run `npm.cmd run check`.
- Run `git diff --check`.

Exit:

- A repeat visit can restore useful Explore state without redoing routine setup.
- Any cross-device request is moved to Later Queue unless backend/account scope is approved.

### P1 - Security and Release Hardening

Trigger: renderer, workflow, release, or policy change weakens security posture or release confidence.

Scope:

- Keep `SECURITY.md`, `docs/THREAT_MODEL.md`, `docs/RELEASE_CHECKLIST.md`, `CONTRIBUTING.md`, and `CHANGELOG.md` aligned with current behavior.
- Audit renderer `innerHTML` usage when rendering generated or saved data changes.
- Expand malicious URL/text fixture tests when renderer security changes.
- Keep external link policy in `js/safe-dom.js`, `docs/THREAT_MODEL.md`, and renderer tests aligned.
- Keep the referrer policy decision aligned with external-link `noreferrer`.
- Keep GitHub Actions SHA pinning and Dependabot deferred while workflows use only GitHub-owned actions, local scripts, no package dependencies, and no lockfile.
- Revisit SHA pinning or Dependabot when third-party actions, broader workflow permissions, package dependencies, or a lockfile appear.
- Keep release checks tied to `npm.cmd run check`, generated-data review, and dated changelog entries.

Absorbs analysis items:

- Renderer XSS audit.
- `innerHTML` direct usage audit.
- URL sanitization fixture expansion.
- External link policy.
- Referrer policy.
- Actions pinning policy.
- Dependabot and GitHub Actions update policy.
- Release checklist and support scope maintenance.

Current state:

- Explore external item anchors use `rel="noopener noreferrer"`, and card activation opens with `noopener,noreferrer` instead of `location.assign` when `window.open` is available.

Verification:

- Run `node --test tests/safe-dom.test.mjs tests/module-renderers-ui.test.mjs tests/static-fallback.test.mjs`.
- Run `node --test tests/ops-docs.test.mjs tests/workflow.test.mjs`.
- Run `npm.cmd run check`.
- Run `git diff --check`.

Exit:

- Security and release docs match actual controls.
- Any deferred hardening has a concrete trigger in Later Queue or this bundle.

### P2 - Status and Source Trust

Trigger: source health, stale data, partial recovery, or fallback state is unclear on Home, Today, Status, or source detail pages.

Scope:

- Keep one shared meaning for ok, partial, error, stale, fallback, staleButSafe, and rateLimited.
- Improve shared data-health rendering before page-local copy.
- Keep useful checked-in rows visible for no-JS and blocked-fetch visits.
- Do not hide partial data that still has preserved useful rows.
- Track whether the current partial is GitHub 403, npm 429, or another source before changing copy.
- Keep source freshness and recovery copy documented in `docs/SIGNAL_SCHEMA.md` and `docs/SOURCE_GOVERNANCE.md`.

Current state:

- Shared source detail copy names npm `n8n-workflow` 429, keeps `rateLimited` and previous refresh context visible, removes long API URLs from rendered errors, and names `retry data refresh` as the recovery action.
- Source recovery coverage now keeps `emitted <= tracked`, so refresh reports do not show impossible ratios like `4/1` or `2/1`.
- Status refresh-run attention now reuses shared source detail copy, including sanitized failed-source errors and `retry data refresh`.
- The bundle should wake again only when a new source health state becomes unclear or useful preserved rows disappear.

Absorbs analysis items:

- Status partial copy.
- Data refresh failure recovery copy.
- Source freshness criteria.
- Current GitHub 403 / npm 429 explanation.

Verification:

- Run `node --test tests/status-ui.test.mjs tests/data-health.test.mjs tests/refresh-report.test.mjs`.
- Run `node --test tests/static-fallback.test.mjs tests/home-data.test.mjs tests/today-data.test.mjs`.
- Run `npm.cmd run check`.
- Run `git diff --check`.

Exit:

- Every non-ok source state names whether data remains usable and what recovery action exists.
- Any live-source uncertainty is either refreshed with approval or documented as known partial state.

### P3 - Architecture Gate

Trigger: a measured vanilla JavaScript blocker makes Review or Explore harder to maintain than the no-build path.

Scope:

- Start with the smallest affected surface, likely Review first and Explore second.
- Keep GitHub Pages, checked-in HTML, no-JS messaging, blocked-fetch fallbacks, and public routes intact.
- No backend, account, sync, database, framework, bundler, package dependency, or lockfile unless the PoC beats the current path on measured complexity.
- Delete the PoC if it does not clearly reduce shipped maintenance cost.

Absorbs analysis items:

- Astro/React island PoC.
- Framework conversion.
- Browser global helper risk.

Verification:

- Add or update one focused architecture PoC test for the measured blocker.
- Run affected UI tests for the chosen surface.
- Run `npm.cmd run check`.
- Run `git diff --check`.

Exit:

- Framework PoC waits for a measured vanilla JavaScript blocker.
- Adopt only if static safety and shipped size stay within `docs/ARCHITECTURE.md`; otherwise delete the PoC.

## Later Queue

These items are queued with lower priority. They stay below the active queue because the current repo already has a smaller working path or the work needs a clearer trigger.

- `CODE_OF_CONDUCT.md`
  - Why later: there is no active public contributor process to moderate today.
  - Pull forward when: external contributions or community discussion become regular enough that conduct handling needs a written policy.
- Separate `RELEASE.md`
  - Why later: `docs/RELEASE_CHECKLIST.md` already covers current release steps.
  - Pull forward when: versioned releases start and release process needs a shorter root-level entry point.
- Package-wide `"type": "module"`
  - Why later: current browser module and CommonJS-compatible helper split is stable and tested.
  - Pull forward when: module warnings return, tests require package-wide ESM, or the helper split starts causing maintenance cost.
- Rename `.github/workflows/update-trends.yml`
  - Why later: workflow display name already says `Update data`, so behavior is clear in GitHub Actions UI.
  - Pull forward when: operator mistakes or docs confusion keep coming from the legacy filename.
- JSON Schema files
  - Why later: `scripts/validate-data.mjs` and focused data contract tests already catch current drift.
  - Pull forward when: schema drift escapes tests, external contributors need machine-readable contracts, or new source types make JS-only validation unclear.
- Meta CSP
  - Why later: GitHub Pages constraints and current renderer behavior need checking before adding a policy that can break pages.
  - Pull forward when: Security and Release Hardening reviews static-page policy headers or renderer risk increases.
- Release tags and GitHub releases
  - Why later: dated changelog plus GitHub Pages publish is enough for the current site.
  - Pull forward when: users need installable/versioned artifacts or rollback points by version.
- Provenance or SLSA
  - Why later: there is no release artifact chain beyond checked-in static files and GitHub Pages publish.
  - Pull forward when: release tags, generated artifacts, or external consumers need supply-chain attestation.
- Visual regression
  - Why later: static/UI tests already cover current layout and fallback contracts.
  - Pull forward when: UI regressions escape tests or major visual changes land.
- Coverage tooling
  - Why later: the focused Node tests are more useful than a coverage number right now.
  - Pull forward when: regressions escape tested areas or coverage data would guide pruning.
- Route/link checker
  - Why later: serve, site-structure, sitemap, static fallback, and route tests cover current route risk.
  - Pull forward when: broken links escape those tests or source expansion adds many external URLs.
- Large source expansion
  - Why later: current source freshness, partial recovery, and fallback copy should stay stable before adding more sources.
  - Pull forward when: existing watched sources are stable and owner review identifies specific missing source families.
- Advanced ranking
  - Why later: current signal policy already keeps agent-workflow signals ahead of broad baseline tooling.
  - Pull forward when: signal-quality tests or owner review show ranking failure.
- Advanced settings export/import
  - Why later: Review already supports the useful export/import baseline.
  - Pull forward when: richer settings, cross-device migration, or backup/restore flows are requested.
- Native file chooser import smoke
  - Why later: Review now has file import and pasted JSON import; current browser automation can smoke the pasted path but cannot drive the OS file picker.
  - Pull forward when: manual browser QA is requested or the browser automation tool exposes a supported file-upload action.
- Link preview policy
  - Why later: the site renders links, not previews.
  - Pull forward when: previews are introduced or external metadata fetching becomes part of the product.
- Portfolio, resume, social, company-history, or public worklog routes
  - Why later: current scope is a signal dashboard, not a personal profile site.
  - Pull forward when: owner explicitly wants public identity/work history pages.
- Backend, account, sync, database, server functions, or cross-device identity
  - Why later: static GitHub Pages keeps the attack surface small and deployment simple.
  - Pull forward when: local-only state blocks a required workflow and the owner accepts backend/account scope.
- Framework, bundler, dependency, or lockfile
  - Why later: no-build static pages are currently working and tested.
  - Pull forward when: the Architecture Gate finds a measured vanilla JavaScript maintenance blocker.

## Working Rules

- User owns staging, commits, and pushes.
- Before a large task, consult this file and pick one bundle.
- After a large task, remove completed work from this file and record outcome in `CHANGELOG.md`.
