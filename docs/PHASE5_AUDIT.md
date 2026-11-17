# Phase 5 release audit — 2026-11-17

Tracking: [Issue #8](https://github.com/anothel/anothel.github.io/issues/8).
Scope: latest main `18e9955e2773c2df1950e1cd8e2c9377e5f0a6b8`, verified by fetch and GitHub branch API on November 17. No production refresh was dispatched. Public JSON schema v2, routes, localStorage formats, source safety policies, Astro and Pages workflows are unchanged.

## Actual refresh evidence: pending

GitHub Actions main history (latest 20 runs, inspected through the GitHub connector) has no Update data run after the Phase 4 merge at 09:34:38 UTC.

| Evidence | Observed result |
| --- | --- |
| Latest Update data | [44013175478](https://github.com/anothel/anothel.github.io/actions/runs/44013175478), scheduled, success, started 03:52:06 UTC, before Phase 4 |
| Generated-data commit | `cd059c410687027dfbe3f4126b836c9ba9cbc1ea`, 03:52:34 UTC |
| Following Pages | [44013240182](https://github.com/anothel/anothel.github.io/actions/runs/44013240182), success, workflow_run, source `cd059c4` |
| Phase 4 main CI | [44056831841](https://github.com/anothel/anothel.github.io/actions/runs/44056831841), success |
| Phase 4 Pages | [44056831855](https://github.com/anothel/anothel.github.io/actions/runs/44056831855), success |
| Published identity | Deploy job `133948426095`: 10 files matched `18e9955e2773c2df1950e1cd8e2c9377e5f0a6b8`, attempt 1, at 09:35:24 UTC |
| Published freshness | Same log: `generationOk: true`; manual Reference freshness unknown |

The Pages result proves published identity, not a new upstream scoring run. The next successful scheduled or separately approved refresh must still supply its run, generated commit, downstream Pages source SHA, ten-file identity verification, and real distribution comparison. Keep that acceptance item pending; no guessed rescoring of compact star strings.

## Current observations, not post-refresh improvement

Trends generated at `2026-11-17T03:52:25.773Z`: **12/24 (50%)** raw scores equal 100, unchanged from the supplied baseline. Distribution: 61×2, 66×1, 71×1, 77×1, 82×1, 88×1, 92×1, 93×1, 94×1, 95×1, 96×1, 100×12. All twelve saturated rows are GitHub results.

Raw category coverage: Agent skills 2, AI 6, AI agents 6, AI evals 3, Developer tools 3, MCP 2, Workflow automation 2. Sources: GitHub 12, Hacker News 4, npm 8. No duplicate raw URLs.

Explore normalization yields 83 distinct canonical identities, 12 at 100. Its entire ordered identity sequence matches normalization of the frozen Phase 4 source fixture with the current algorithm. Top five remain activepieces/activepieces, affaan-m/ECC, anomalyco/opencode, anthropics/claude-code, anthropics/skills. This is deterministic stability on unchanged observations, not longitudinal ranking stability or improved raw discrimination.

All seven public topic pages retain results: AI agents 35, MCP 14, Agent skills 6, AI evals 17, AI engineering 22, Workflow automation 13, Security 2. Topic memberships overlap; these counts are not additive categories. No ranking formula, quotas, source allocation, or watchlist changes were justified by these observations.

Reproduce the existing frozen comparison with `node scripts/audit-ranking.mjs`. Current raw counts can be checked with:

```sh
node -e 'const d=require("./data/trends.json"); console.log(d.generatedAt, d.items.length, d.items.filter(i=>i.score===100).length); console.log(d.items.reduce((a,i)=>(a[i.score]=(a[i.score]||0)+1,a),{}))'
```

## Confirmed product defect and small fix

Explore permits five saved searches. Previously, importing new searches into a full list returned `imported` and a positive added count even though normalization discarded them. With four saved entries and two new queries, only one persisted, but the UI reported unqualified success. A storage write failure also returned unpersisted candidates as the visible list.

Reproduction: save four distinct queries, open advanced filters, paste `["five","six"]` into saved-search import, and import. Previously: generic success despite one discarded query. Then import `["six"]` at capacity: generic success despite zero additions. Reload exposes the mismatch.

After: additions are limited to remaining slots, partial imports explicitly explain the five-search limit, a full queue asks the user to remove one, duplicates remain no-ops, and failed writes retain the persisted visible list with zero added. Existing entries and serialized version 1 shape are preserved. No dependency or schema migration.

Regression evidence: the initial two Node tests failed before the fix (`imported` versus expected `partial-import`, and false added count 1 versus 0), then passed in the full Node suite. Independent review also reproduced oversized imports (six candidates into an empty list) being truncated before capacity checking; a third failing regression now ensures the import parser retains candidates until deduplication/capacity assessment. Persisted reads and writes still cap at five. The browser regression exercises partial/full imports and persistence after reload on desktop and mobile.

## Product and explanation coverage

The existing full Playwright suite covers Home/Today recommendations, Explore search and composite filters, saving and defaults, Review selection/status/notes/removal/import/export, Home queue summary, local storage compatibility and unavailable storage, static no-JavaScript behavior, Links and all source lists, Status, and all seven Topic pages. Accessibility checks include heading hierarchy, landmarks, names, keyboard focus, serious/critical axe findings, and textual health/score equivalents. Mobile checks include 390×844 layouts, 320–412px enlarged-text source summaries, sticky offsets, touch targets, and overflow.

Ranking copy checks distinguish cumulative stars from growth, weekly npm totals from change, and observed HN counts from momentum. Home and Today use generated recommendations; Explore, Review and Topic use shared normalization evidence. Existing tests cover heuristic versus source metric labels, deterministic ranking, category diversity and duplicate identities. No measured star/download deltas or human review timestamps are invented.

## Verification and release gate

- `npm ci`: passed, 317 packages installed.
- `npm run validate:data`, `npm run build`, `npm run check:dist`: passed; 18 static pages generated.
- `npm test`: 337 tests passed, zero failures.
- Standard `npm run check`: data, documentation, build, size, syntax and Node gates passed; bundled Playwright Chromium is absent in this cloud environment. Browser installation failed with CDN HTTP 403 `Domain forbidden`.
- Full browser suite using an ignored cloud config, a dedicated preview port, and `/usr/bin/chromium`: exit 0; 143 passed, 26 intentional project skips, 1 flaky mobile Explore accessibility case passed on retry (initial 30-second timeout). Both new browser regressions passed on desktop and mobile. The timed-out accessibility case also passed a single-worker, zero-retry isolated run (1 passed in 13.2 seconds); no product assertion failure was reproduced. The initial overlapping build/test run was discarded; these counts come from the subsequent stable final build. This is Chromium viewport/emulation coverage, not a physical device claim.
- `git diff --check`: passed.
- GitHub PR CI `validate`: required for this branch; Phase 4 main success does not substitute for it. Keep the PR draft and do not merge before review and required checks.

Shell GitHub API requests were blocked by the cloud proxy; the connected GitHub tools supplied issue, branch, workflow and deployment-log evidence instead.

## Unresolved operations and rollback

[Issue #4](https://github.com/anothel/anothel.github.io/issues/4) remains open for a real human Reference shelf review and independent external monitor, recipient, heartbeat/watchdog, and observed failure/recovery alert delivery. No physical iOS validation or new physical Android verification was performed. Existing historical Android evidence is not expanded by this audit.

Release readiness is conditional: product corrections need review and this PR's required CI; post-refresh scoring acceptance remains pending the next real refresh. Revert the saved-search import correction to roll back; no data/storage migration or deployment architecture change is needed.
