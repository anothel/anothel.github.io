# Deployment

## Cutover Status

The Astro Pages cutover is committed on `main`, GitHub Pages uses GitHub Actions, and the cutover was verified by a successful `Deploy Pages` run. Current source generates the nine primary routes and all seven topic routes only in `dist/`; checked-in HTML remains only for Notes and 404, while robots and sitemap are checked-in pass-through assets. A topic-migration production deployment is not verified until the commit containing it completes a real `Deploy Pages` run.

## Target and Build

The deployment target is GitHub Pages.

```powershell
npm ci
npm run build
```

`npm run build` runs `astro build`. Output is `dist/`; `dist/` is generated and ignored by Git.

`astro.config.mjs` currently requires:

```js
site: "https://anothel.github.io"
output: "static"
```

This repository is the user site `anothel.github.io`, so routes are rooted at `/` and no Astro `base` is configured. If moved to a project-site URL such as `https://owner.github.io/repository/`, set `site` to the origin, set `base` to the repository path, and verify every internal asset/data link under that base before deployment.

## Repository Workflows

`.github/workflows/ci.yml` validates pull requests and pushes to `main`. It installs dependencies and Chromium, runs `npm run check`, uploads Playwright failure artifacts, and runs `git diff --check`. It does not deploy.

`.github/workflows/update-trends.yml` runs scheduled/manual data refreshes. Its only live source stage is `node scripts/update-all.mjs`. It then runs `npm run validate:data`, `npm run build`, `npm run check:dist`, and focused Astro/Notes/Status output tests before committing generated data, Notes HTML, and sitemap metadata. Primary/topic HTML is never staged. A failed data contract, build, route, asset, or rendered-output check skips the commit. The refresh report is still uploaded through `if: always()` steps.

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
