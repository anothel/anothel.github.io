# Deployment

## Cutover Status

The Astro Pages cutover is committed on `main`, GitHub Pages uses GitHub Actions, and the cutover was verified by a successful `Deploy Pages` run. Current source generates the nine primary routes, Notes, all seven topic routes, custom 404, robots, and sitemap only in `dist/`; no checked-in route artifact or pass-through route remains. Production verification of the final ownership cleanup is pending until its commit completes a real `Deploy Pages` run.

## Target and Build

The deployment target is GitHub Pages.

```powershell
npm ci
npm run build
```

`npm run build` runs `astro build`. Output is `dist/`; `dist/` is generated and ignored by Git.

`src/pages/404.astro`, `src/pages/robots.txt.ts`, and `src/pages/sitemap.xml.ts` own the special outputs. Sitemap routes come from `src/lib/site-routes.js`; data-driven `lastmod` values use the checked-in manifest date at build time.

`astro.config.mjs` currently requires:

```js
site: "https://anothel.github.io"
output: "static"
```

This repository is the user site `anothel.github.io`, so routes are rooted at `/` and no Astro `base` is configured. If moved to a project-site URL such as `https://owner.github.io/repository/`, set `site` to the origin, set `base` to the repository path, and verify every internal asset/data link under that base before deployment.

## Repository Workflows

`.github/workflows/ci.yml` validates pull requests and pushes to `main`. It installs dependencies and Chromium, runs `npm run check`, uploads Playwright failure artifacts, and runs `git diff --check`. It does not deploy.

`.github/workflows/update-trends.yml` runs scheduled/manual data refreshes. Its only live source stage is `node scripts/update-all.mjs`. It then runs `npm run validate:data`, `npm run build`, `npm run check:dist`, and focused Astro/Status output tests before committing generated JSON only. Astro-owned route output is never staged. A failed data contract, build, route, asset, or rendered-output check skips the commit. The refresh report is still uploaded through `if: always()` steps.

Valid partial/fallback output remains publishable only when the existing updater safety policy retains usable data and the data/artifact checks pass. Failed refresh workflows do not reach Pages; successful runs trigger the deployment workflow through `workflow_run`.

`.github/workflows/deploy-pages.yml` is the dedicated Pages workflow. It:

1. runs on approved pushes to `main`, manual dispatch, and successful `Update data` workflow runs on `main`;
2. checks out `main` after `workflow_run` so it includes the refresh workflow's generated commit;
3. runs `npm ci`, `npm run build`, and `npm run check:dist`;
4. uploads only `dist/` with `actions/upload-pages-artifact`;
5. deploys through `actions/deploy-pages` to the `github-pages` environment;
6. verifies public routes, `robots.txt`, `sitemap.xml`, an `/_astro/` asset, and custom 404 behavior.

The workflow has only `contents: read`, `pages: write`, and `id-token: write`. Deployment concurrency uses one `github-pages` group with in-progress cancellation.

The `workflow_run` trigger is required because a commit pushed by `update-trends.yml` with the repository `GITHUB_TOKEN` does not trigger another ordinary `push` workflow. No personal access token is used to force recursive execution.

Repository setting:

`Settings -> Pages -> Source -> GitHub Actions`

## Local Deployment Verification

```powershell
npm run build
npm run check:dist
npm run preview
```

Open `http://127.0.0.1:4321/` and verify the required routes. `npm run test:e2e:run` runs Playwright against the preview server using the existing `dist/`; `npm run test:e2e` rebuilds first.

Full release verification:

```powershell
npm run check
git diff --check
```

`npm run check` validates data/docs, builds once, validates `dist/`, runs repository tests/syntax checks, and runs desktop/mobile Playwright checks. It makes no live source API calls.

After deployment, the workflow probes every required primary, Notes, and topic route plus robots and sitemap. It also checks an Astro asset and direct navigation to key primary routes. A failed route, missing metadata file, missing Astro asset, or non-404 response for an unknown path fails the deployment job.

## Refresh recovery (November 2026)

The September 20 refresh [run 35543988579](https://github.com/anothel/anothel.github.io/actions/runs/35543988579) fetched, validated, built, and checked the artifact successfully. Two rendered-output assertions failed, so the guarded commit step was correctly skipped:

- Status output was required to contain a stale source even after a successful refresh. Output checks now compare every source row with its data-derived health, freshness, and pipeline status. Fixed-time Status model tests retain coverage of stale, unknown, failed, partial, and fallback states.
- Source records were compared using incomplete HTML escaping. Astro also escapes apostrophes as `&#39;`. Checks now cover that encoding and verify fields in every ordered row. An isolated fresh-data build with quotes, ampersands, and HTML-like external text exercises the actual workflow assertions without live API calls or modifying checked-in data.

The historical log identifies the failing `calesthio/OpenMontage` summary assertion, but its complete generated source snapshot is unavailable. The isolated fixture reproduces both failures against the original `main` tests; it does not reconstruct the exact historical description.

The same fixture also replaces a previously selected Today repository. Today's output check now verifies every generated title in section order instead of requiring `anthropics/skills` to remain selected forever. The prior assertion was reproduced failing on this valid replacement; it was not one of the two failures in the September log.

Full validation also exposed an obsolete assertion for the SecureKit Home project card removed in the July Home redesign. Home link checks now verify the generated Today priority destinations and external-link protection. The mobile Home layout assertion likewise follows the current skim panel, visible trust text (the wrapper uses `display: contents`), and Status link instead of retired markup.

The first recovery PR's [CI run 43788038430](https://github.com/anothel/anothel.github.io/actions/runs/43788038430) passed all Node checks but exposed a separate Status layout defect: at 360px and 200% text, wider fallback-font metrics pushed labels outside their cells. Status labels now wrap long words just like their values, without clipping or reducing text size. The existing containment, overlap, column-count, and document-overflow assertions remain; the regression also covers Status at 320px through 200% text.

The public Actions workflow page reported `Update data` as `disabled_inactivity`, with GitHub's 60-day inactivity banner (rechecked November 16). The cron remains daily at **21:17 UTC** (06:17 the next day in Korea); editing tests does not establish that the schedule is enabled. The latest successful Pages run visible in history was [29919615684](https://github.com/anothel/anothel.github.io/actions/runs/29919615684), on July 22. Its source manifest is dated July 7. Direct production HTTP verification was blocked by the Cloud environment's network policy, so the currently served bytes still require verification.

Maintainer recovery after reviewing and merging the fix:

1. Open **Actions → Update data → Enable workflow** if the inactivity banner remains. Confirm the workflow is active; do not assume a branch push re-enabled it.
2. Run **Update data → Run workflow** on `main`. Inspect all validation stages and confirm a generated-data commit was pushed. Existing validation and commit guards remain required.
3. Confirm the successful refresh starts **Deploy Pages** through `workflow_run`, and that checkout includes the newly committed JSON. A `GITHUB_TOKEN` push alone does not start ordinary push workflows.
4. Verify deployment probes, then compare the published `/data/manifest.json` and `/status/` with the new commit. Confirm the next scheduled run occurs. Check **Settings → Pages → Source → GitHub Actions** if deployment needs recovery.

No automatic keepalive commits are added. Public repositories can have scheduled workflows disabled again after prolonged inactivity; monitor missed refreshes separately from individual source freshness. Workflow enablement and Pages settings are repository settings and are not changed by this patch.

## Phase 2: separate clocks and published identity

### Confirmed operational evidence (November 16, 2026)

The July snapshot described in the recovery investigation is historical. During Phase 2, `main` advanced to [`799a85ce7d5e1de776b6d05a17644f3656804411`](https://github.com/anothel/anothel.github.io/commit/799a85ce7d5e1de776b6d05a17644f3656804411), a generated-data commit. Its manifest generation is `2026-11-16T06:43:15.067Z` and its report records `workflow_dispatch`, run `43818654907`, on `main`. The connected GitHub API confirmed that [this run's update job](https://github.com/anothel/anothel.github.io/actions/runs/43818654907) completed fetch, data validation, build, artifact/output checks, report upload and commit successfully.

The subsequent [Deploy Pages run 43818729715](https://github.com/anothel/anothel.github.io/actions/runs/43818729715) also completed successfully according to the public Actions history. Its existing route probes do not establish dataset identity, which this Phase 2 change adds.

This confirms a manual refresh, not a subsequent scheduled execution. The current manual reference source has no successful-update timestamp; the new checker honestly reports source freshness as unknown even while pipeline generation is current. Do not manufacture a source timestamp from the refresh clock. The previous `disabled_inactivity` observation is historical: the current workflow-enabled setting could not be rechecked because direct API access was denied and the available connector did not expose that setting. Production HTTP access to `https://anothel.github.io/data/manifest.json` was blocked by this Cloud environment's proxy (403), so this investigation does not establish the currently served bytes. Inspect the live Actions/Pages state before making operational claims.

### Pipeline freshness versus source freshness

- **Pipeline generation clock:** `manifest.generatedAt`, evaluated using elapsed hours. The daily 21:17 UTC schedule (06:17 the next day in Korea) has a **36-hour maximum age**, allowing twelve hours beyond the normal cadence for scheduling, processing and deployment. This is an output-liveness threshold, not an exact cron execution SLA. More than 36 hours is `overdue`; missing/invalid timestamps or timestamps over five minutes in the future are `unknown`.
- **Source freshness:** each source's successful timestamp and existing source policy. Automated sources become stale after three whole UTC days; manual sources after ninety. Partial, failed and fallback states remain independent. An empty source with `ok` and a valid timestamp remains a legitimate empty result. A future successful timestamp over five minutes ahead is unknown, rather than being clamped to fresh.
- **Report creation clock:** `refresh-report.generatedAt` is report assembly time. Recreating the summary after a failed fetch cannot reset the manifest clock. Actions summaries now show the workflow state *before the summary* and the manifest generation timestamp. A summary can contain previous/retained source rows; only the full job conclusion and commit step establish success. A later upload or push can still fail after the summary.
- **Site build/deployment clock:** a successful build or Pages job can publish an old but valid dataset. Identity verification proves which bytes were published; it does not assert that their timestamps are recent or every source succeeded.

Status remains static, script-free HTML and shows its build-time assessment timestamp and pipeline freshness independently of source health. It does not change as the page ages and cannot alert. Do not use its rendered `current` label as a live monitor. Local data validation remains deterministic: old but structurally valid snapshots do not make ordinary PR CI depend on today's date.

```sh
npm run check:refresh
npm run check:refresh -- --site-url https://anothel.github.io/
```

The checker reads all nine allowlisted JSON endpoints, validates the existing data contract, requires complete coverage of the four expected modules, evaluates the current clock, and emits a JSON assessment. Exit 0 requires current pipeline generation, an `ok` report and healthy source evidence; stale, missing, future, failed, partial or fallback evidence exits 1. HTTP, timeout, redirect, JSON and schema failures also exit nonzero. Requests use a cache-busting query, `Cache-Control: no-cache, no-store`, and ten-second timeouts. Redirects are rejected: pass the final HTTPS Pages base URL directly. This checker reads published output, not GitHub workflow state; a failed run with recent previously published data may remain within the grace window.

### Published-data verification

`check:dist` now requires every generated JSON file to match the checked-out source bytes. After that gate passes, Pages records SHA-256 hashes of all nine `data/` files and rendered `/status/` HTML, plus the exact checked-out commit SHA. The expectation is uploaded as the seven-day `deployment-expectation` workflow artifact, separate from the Pages artifact. The deploy job downloads that same run's expectation and checks out the recorded SHA; it does not reconstruct expected data from a moving `main` or rebuild time-dependent Status HTML.

On `workflow_run`, build checkout still resolves current `main` to include the generated commit pushed by Update data. The recorded build SHA is the actual expected deployment source, which may be newer than the triggering run's `head_sha` if another change arrived. The verifier reports that SHA explicitly.

After deployment, the verifier requires **one complete attempt** to match every expected file. A matching manifest with a different Today, source, policy, watchlist, report or Status file fails. It uses unique queries per attempt and no-cache headers, rejects redirects/non-2xx responses, and retries transient errors or propagation mismatch at most twelve times, with ten-second delays and ten-second request timeouts (under four minutes). A network failure is a failed verification, never proof of success. CDN behavior cannot be universally controlled: persistent old cache responses correctly remain unverified. Existing route, Astro asset, robots, sitemap and custom-404 probes remain required.

For an existing deployment, download its original `deployment-expectation` artifact and run:

```sh
npm run check:published -- --expectation /path/to/deployment-expectation.json --site-url https://anothel.github.io/
```

For local end-to-end comparison against a preview server, first build and validate, then create an expectation from that same artifact:

```sh
npm run build
npm run check:dist
node scripts/verify-published.mjs --write-expectation /tmp/deployment-expectation.json --source-sha "$(git rev-parse HEAD)"
npm run preview
# In another terminal:
npm run check:published -- --expectation /tmp/deployment-expectation.json --site-url http://127.0.0.1:4321/
```

Rebuilding creates a different Status assessment timestamp; retain the original expectation when checking a real deployment. Byte equality intentionally treats formatting changes as different deployments. A verification failure happens **after** Pages has published; it does not automatically revert the site. Inspect the named paths, expected SHA, propagation and newer/superseding deployment before deciding to redeploy.

Published refresh health is a separate, explicit warning in the Pages job. An identity match never hides unhealthy freshness. Valid partial/fallback data remains publishable under the existing safety policy; this advisory adds no exception to validation, artifact checks or publication identity. The standalone checker exits nonzero so an independent monitor can alert.

### Missed-schedule alerts and minimal independent integration

**A workflow cannot reliably detect its own absence when its scheduler is disabled.** Another scheduled workflow in this repository shares that failure domain; it is not reliable missed-schedule alerting. This change intentionally adds neither another internal cron nor automatic keepalive commits.

Use an existing independently scheduled runner/monitor, hourly, with a maintained checkout of this repository and Node 22.12 or newer, to run:

```sh
node scripts/check-refresh.mjs --site-url https://anothel.github.io/
```

No npm dependencies or GitHub token are required for that command. Give it a one-minute execution budget, alert on nonzero exit or runner timeout, and retain the JSON output. Provisioning the runner and notification destination is a maintainer action; this PR does not establish an external alert service. If only pipeline missed-refresh alerting is needed, a minimal external HTTP/JSON age check against `/data/manifest.json` with the same 36-hour rule suffices; it does not cover individual source failures. Monitor the independent runner's own missing heartbeat as well. For immediate workflow failure notifications, configure GitHub Actions notifications separately; output-age detection is intentionally delayed by the grace window.

### Diagnosis, recovery and rollback

| Evidence | Interpretation | Recovery |
| --- | --- | --- |
| Current generation, stale/partial/fallback source | Pipeline assembled output; source freshness or fetch coverage degraded | Inspect named source errors, token permissions/rate limits and retained timestamps. Retry Update data after correcting the source cause. |
| Overdue/missing generation | Published refresh liveness not confirmed; scheduler, fetch, validation, push or deploy may be responsible | Inspect Actions run history and workflow-enabled state; do not infer the cause from age alone. |
| Failed Update data, new summary time | Summary ran via `always()`; no successful refresh/commit established | Inspect first failed step and generated-data commit; keep safety/validation gates. |
| Source commit updated, published hashes differ | Wrong/older/partially propagated deployment or unreadable output | Check actual build SHA and Pages artifact; allow bounded propagation, then rerun Deploy Pages on the intended source. |
| HTTP/permission/network failure | Production output unverified | Repeat from an authorized network and preserve the failure; never label production verified. |

1. In **Actions → Update data**, enable the workflow if disabled. Confirm the live setting; manual execution alone is not evidence of future scheduled execution.
2. Run **Update data** on `main`, inspect every gate and confirm the pushed JSON commit. Check the report for partial/fallback sources even if the job succeeds.
3. Confirm the downstream **Deploy Pages** run uses that generated data (or a documented newer source), passes identity and route probes, and review its separate freshness assessment.
4. Run the published checker from a network that can reach Pages, inspect `/status/`, and confirm the next scheduled execution. Enable Actions failure notifications and the independent monitor.
5. Roll back code through a reviewed revert of the Phase 2 commits, keeping the merged Phase 1 fixes. If incorrect data was actually published, redeploy a known-good source through the existing Pages workflow and compare its original artifact expectation. Restoring an old snapshot does not restore freshness; keep its age visible. Do not delete valid generated data or bypass guards to obtain green checks.
