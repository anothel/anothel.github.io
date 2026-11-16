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
