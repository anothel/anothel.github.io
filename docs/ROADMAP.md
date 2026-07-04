# Roadmap

This file is the next-work queue for anothel.github.io.

Use it to choose the next useful bundle, not to store completed history. Keep shipped outcomes in `CHANGELOG.md`.

## Use This File

- Pick the highest priority bundle with a live trigger.
- Keep work workflow-level, not page-by-page.
- Each active bundle must keep Trigger, Scope, Verification, and Exit.
- Prefer copy, data, docs, and focused tests before new routes or abstractions.
- Do not run live refresh unless the selected bundle needs fresh source evidence.
- Keep live facts short: blocker, trigger, proof needed. Move shipped details to `CHANGELOG.md` and durable docs.

## Current Baseline

The 2026-06-28, 2026-06-30, and 2026-07-04 repository analyses are already folded into this queue. Baseline items are already part of the current repo and are not re-added as work unless behavior changes:

- Public trust docs: README product purpose, `SECURITY.md`, `CONTRIBUTING.md`, `CHANGELOG.md`, `docs/THREAT_MODEL.md`, `docs/SIGNAL_SCHEMA.md`, source governance in `docs/SOURCE_GOVERNANCE.md`, `docs/RELEASE_CHECKLIST.md`, and the source-available reuse boundary.
- Tooling entry points: `package.json`, Node `>=20`, `serve`, `validate`, `test`, `check`, `update:data`, PR CI, and `.github/workflows/update-trends.yml`.
- Data contract baseline: Signal Schema v2, source health vocabulary, score policy ownership, generated-file ownership, schema migration behavior, and checked-in schema mismatch tests.
- Existing safety tests: safe DOM helpers, renderer XSS coverage, external link `rel="noopener noreferrer"`, malicious URL/text escaping, localStorage migration, route/sitemap/404 behavior, partial/fallback/rate-limit handling, and generated static page checks.
- Product identity baseline: this remains a static AI engineering / developer-workflow signal dashboard, not a security utility rewrite.

Absorbed analysis handling:

- Put live, user-visible source/date/release issues into P0 or P2.
- Put ranking and source selection issues into P1 Signal Quality.
- Put repeated Explore use issues into P1 Explore.
- Put renderer, external link policy, Actions pinning, Dependabot, and release checklist issues into P1 Security.
- Put formatter, generator, snapshot, and reviewability issues into P2 Formatting.
- Put Astro/React, JSON Schema, route/link checker, provenance, visual regression, source expansion, advanced ranking, export/import, and Native file chooser import smoke into Later Queue until their trigger exists.

## Next Work Queue

### P0 - Publish Health Refresh

Trigger: checked-in data is older than the publish window, source health changes, a public page/date mismatch is reported, a publish needs fresh evidence, or owner asks for live source confirmation.

Scope:

- Run the existing data refresh path only; do not change source families or refresh cadence.
- Confirm whether the current partial state is GitHub 403, npm 429, or another source failure.
- If `GITHUB_TOKEN` is missing, keep GitHub 403 as known partial state and queue a token-backed rerun.
- Keep npm `n8n-workflow` active while preserved rows remain useful and rate-limited health stays visible.
- Review generated data, Today, manifest, refresh report, sitemap, and static fallbacks as one publish bundle.
- Keep Roadmap P0 aligned with the real current partial cause after every refresh.

Live facts:

- Checked-in token-backed refresh `2026-07-04T06:35:21.214Z` generated 102 items with overall `partial` status.
- GitHub trend, repo, HN, trend npm, and manual sources are `ok`.
- Active non-ok source: npm package refresh 429, including `n8n-workflow`, with preserved 2026-07-04 package rows and `coverage: 25/25`.
- Data-driven `sitemap.xml` lastmod values follow `data/manifest.json` `updated`; Review and Notes remain content-date routes.

Absorbs analysis items:

- Roadmap P0 current partial alignment.
- Current GitHub 403 rate-limit policy.
- npm `n8n-workflow` 429 policy.
- Live refresh probe, gated on network/token approval.
- Data freshness and recovery criteria before publish.
- Static page, sitemap, manifest, and refresh-report date consistency.

Verification:

- Run `node scripts/update-all.mjs` only when network and token access are approved.
- Run `node --test tests/static-fallback.test.mjs tests/site-structure.test.mjs`.
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

- Improve saved searches, preferred defaults, topic pins, active-filter clarity, visible-vs-tracked count copy, and score/reason/source explanation inside Explore.
- Keep existing localStorage keys and caps unless a failing test proves they block repeat use.
- Reuse existing local-state and safe-DOM helpers.
- Do not add account sync, backend, or a new route.
- Include keyboard, ARIA, and contrast checks when changing controls.

Absorbs analysis items:

- Score/reason/source explanation.
- Accessibility smoke checks.
- Visible item count vs total tracked count explanation.
- First-screen explanation only when owner asks or the current first screen blocks use.

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
- Keep release checks tied to `npm.cmd run check`, generated-data review, public page smoke checks, and dated changelog entries.

Absorbs analysis items:

- Renderer XSS audit.
- `innerHTML` direct usage audit.
- URL sanitization fixture expansion.
- External link policy.
- Referrer policy.
- Actions pinning policy.
- Dependabot and GitHub Actions update policy.
- Release checklist and support scope maintenance.

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
- Distinguish data date, last refresh attempt, source health, and page snapshot generation when those claims are shown.
- Do not claim GitHub Pages publish time unless it is measured by an approved smoke check.
- Keep source freshness and recovery copy documented in `docs/SIGNAL_SCHEMA.md` and `docs/SOURCE_GOVERNANCE.md`.

Absorbs analysis items:

- Status partial copy.
- Data refresh failure recovery copy.
- Source freshness criteria.
- Current GitHub 403 / npm 429 explanation.
- Data-generated vs refresh-attempt vs page-generated copy boundaries.

Verification:

- Run `node --test tests/status-ui.test.mjs tests/data-health.test.mjs tests/refresh-report.test.mjs`.
- Run `node --test tests/static-fallback.test.mjs tests/home-data.test.mjs tests/today-data.test.mjs`.
- Run `npm.cmd run check`.
- Run `git diff --check`.

Exit:

- Every non-ok source state names whether data remains usable and what recovery action exists.
- Any live-source uncertainty is either refreshed with approval or documented as known partial state.

### P2 - Formatting and Generator Maintainability

Trigger: review, security audit, or generator change is slowed by long lines, regex replacement fragility, or mixed rendering patterns.

Scope:

- Prefer formatting-only diffs before behavior changes.
- Keep dependency-free formatting unless repeated mismatch proves a tool is worth owning.
- Split only the smallest helper needed when an updater or renderer change is already underway.
- Prefer explicit static fallback markers before adding broader HTML parsing or a framework.
- Keep generated HTML, source data, manifest, refresh report, sitemap, and static fallbacks aligned after any generator edit.

Live facts:

- Remaining static fallback regex should move only when the touched block is already being changed.

Absorbs analysis items:

- Long JS/MJS/YAML lines reduce review quality.
- Regex-based static fallback replacement is fragile when page structure changes.
- Large updater scripts should only be split where it reduces current edit risk.
- New formatter, parser, framework, or build step needs a measured maintenance trigger.

Verification:

- Run `node scripts/validate-data.mjs`.
- Run `node --test tests/static-fallback.test.mjs tests/site-structure.test.mjs tests/workflow.test.mjs`.
- Run `npm.cmd run check`.
- Run `git diff --check`.

Exit:

- The touched file is easier to review without unrelated behavior changes.
- Any remaining long-line or regex fragility has a concrete pull-forward trigger.

## Trigger Gates

### Architecture Gate

Gate trigger: a measured vanilla JavaScript blocker makes Review or Explore harder to maintain than the no-build path.

Do not start a framework, bundler, dependency, lockfile, backend, account, sync, database, or server-function PoC before this trigger exists.

Boundary:

- No backend, account, sync, database, framework, bundler, package dependency, or lockfile without a triggered PoC that beats the current static path.

Absorbs analysis items:

- Astro/React island PoC.
- Framework conversion.
- Browser global helper risk.

When triggered:

- Start with the smallest affected surface, likely Review first and Explore second.
- Keep GitHub Pages, checked-in HTML, no-JS messaging, blocked-fetch fallbacks, and public routes intact.
- Add or update one focused architecture PoC test for the measured blocker.
- Delete the PoC if it does not clearly reduce shipped maintenance cost.

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
  - Why later: `scripts/validate-data.mjs` and focused data contract tests already catch current mismatches.
  - Pull forward when: schema mismatches escape tests, external contributors need machine-readable contracts, or new source types make JS-only validation unclear.
- Meta CSP
  - Why later: GitHub Pages constraints and current renderer behavior need checking before adding a policy that can break pages.
  - Pull forward when: Security and Release Hardening reviews static-page policy headers or renderer risk increases.
- Release tags and GitHub releases
  - Why later: dated changelog plus GitHub Pages publish is enough for the current site.
  - Pull forward when: users need installable/versioned artifacts or rollback points by version.
- Separate `DATA_CONTRACT.md`
  - Why later: `docs/SIGNAL_SCHEMA.md`, `docs/SOURCE_GOVERNANCE.md`, `scripts/validate-data.mjs`, and data contract tests already cover the current contract.
  - Pull forward when: external contributors need one contract entry point or schema mismatches escape existing docs/tests.
- README structure contract test
  - Why later: README now describes runtime areas with wildcards instead of pretending to enumerate every file.
  - Pull forward when: README again disagrees with actual source layout or starts naming exact inventories.
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

- User owns staging, commits, and pushes by default.
- Agents may stage and commit only when the current task explicitly allows it.
- Never push, deploy, release, or change external services without explicit approval.
- Before a large task, consult this file and pick one bundle.
- After a large task, remove completed work from this file and record outcome in `CHANGELOG.md`.
