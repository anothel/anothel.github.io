# anothel.github.io

Static home hub and small dashboards served with GitHub Pages.

See `docs/ROADMAP.md` for product direction and next large work items.

## Structure

- `docs/ROADMAP.md`: direction and next large work items
- `index.html`: home hub
- `today/index.html`: generated priority brief from tracked dashboard data
- `status/index.html`: source refresh and data health overview
- `trends/index.html`: responsive tech trend dashboard
- `packages/index.html`: npm package watchlist
- `repos/index.html`: GitHub repository watchlist
- `links/index.html`: curated reference queue
- `css/site.css`: site-specific styles
- `data/trends.json`: static seed data
- `data/today.json`: generated priority brief data
- `data/manifest.json`: module index and data freshness summary
- `js/home.js`: home overview and current signal rendering
- `js/today.js`: Today priority brief rendering
- `js/status.js`: source status rendering
- `js/dashboard.js`: filtering and rendering
- `scripts/update-trends.mjs`: updates trend data from HN, GitHub, and npm
- `scripts/update-packages.mjs`: updates package watchlist data from npm
- `scripts/update-repos.mjs`: updates repository watchlist data from GitHub
- `scripts/update-links.mjs`: updates curated links data from local definitions
- `scripts/update-today.mjs`: builds the Today priority brief from generated data
- `scripts/update-manifest.mjs`: updates the module manifest from generated data files
- `scripts/report-refresh.mjs`: writes data refresh summary artifacts for operators
- `tests/trend-data.test.mjs`: trend data helper tests
- `tests/ops-docs.test.mjs`: data refresh operating docs tests
- `.github/workflows/update-trends.yml`: scheduled data update workflow
- `404.html`: GitHub Pages fallback page
- `robots.txt`: crawler rules and sitemap location
- `sitemap.xml`: public page list

## Local Preview

Use the local static server so nested routes and JSON fetches work the same way as GitHub Pages:

```powershell
node scripts/serve.mjs
```

Then open `http://127.0.0.1:58117/`.

## Publishing

Push changes to the GitHub Pages branch configured for this repository.

## Data Updates

Run locally in this order:

```powershell
$env:GITHUB_TOKEN="optional-token-for-local-github-api-refresh"
node scripts/update-trends.mjs
node scripts/update-packages.mjs
node scripts/update-repos.mjs
node scripts/update-links.mjs
node scripts/update-today.mjs
node scripts/update-manifest.mjs
```

The site is still static. Pages load checked-in JSON from `data/`, so GitHub Pages does not need a server.

## Data Refresh Automation

`.github/workflows/update-trends.yml` keeps generated data warm.

- Manual refresh: run `workflow_dispatch` from GitHub Actions.
- Manual note: the `reason` input is copied into the refresh report.
- Scheduled refresh: `schedule` runs `17 21 * * *` UTC, once per day.
- Auth: GitHub API calls use `GITHUB_TOKEN` from the workflow environment.
- Scope: only `data/trends.json`, `data/packages.json`, `data/repos.json`, `data/links.json`, `data/today.json`, and `data/manifest.json` are committed.
- Safety: `concurrency` prevents overlapping data refresh jobs, each updater is grouped in logs, and the workflow runs `node --test tests/*.test.mjs` before committing generated data.
- Run summary: every workflow run writes a GitHub Step Summary and uploads a `refresh-report` artifact with source status, counts, timestamps, and source errors.
- Failure model: source fetch failures are stored as `error` or `partial` status where the updater can keep useful data. If a full updater produces zero rows but previous checked-in data exists, the updater writes stale but safe fallback data instead of empty data.
- Fallback markers: fallback source metadata uses `fallbackUsed`, `staleButSafe`, `fallbackReason`, and `rateLimited` when applicable. The Status page and refresh report surface those markers.
- Local GitHub refresh: set `$env:GITHUB_TOKEN` before running GitHub-backed updaters to avoid low anonymous API limits. Without it, rate limits may appear as `rateLimited` fallback in the report.

## Verification

```powershell
node --test tests/*.test.mjs
node --test tests/trend-data.test.mjs
node --test tests/package-data.test.mjs
node --test tests/repo-data.test.mjs
node --test tests/link-data.test.mjs
node --test tests/home-data.test.mjs
node --test tests/today-data.test.mjs
node --test tests/today-generator.test.mjs
node --test tests/manifest.test.mjs
node --test tests/site-structure.test.mjs
node --test tests/status-ui.test.mjs
node --test tests/serve.test.mjs
node --test tests/workflow.test.mjs
node --test tests/ops-docs.test.mjs
node --check scripts/update-trends.mjs
node --check scripts/update-packages.mjs
node --check scripts/update-repos.mjs
node --check scripts/update-links.mjs
node --check scripts/update-today.mjs
node --check scripts/update-manifest.mjs
node --check scripts/report-refresh.mjs
node --check scripts/serve.mjs
node --check js/dashboard.js
node --check js/home.js
node --check js/status.js
node --check js/today.js
node --check js/package-watchlist.js
node --check js/repo-watchlist.js
node --check js/link-queue.js
```

## Notes

The old SB Admin template files were removed. This site now uses plain HTML and CSS.
