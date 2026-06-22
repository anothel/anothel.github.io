# anothel.github.io

Static home hub and small dashboards served with GitHub Pages.

See `docs/ROADMAP.md` for product direction and next large work items.

## Structure

- `docs/ROADMAP.md`: direction and next large work items
- `docs/IA.md`: page role and route grouping notes
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
- `scripts/update-all.mjs`: runs every data updater in the scheduled order
- `scripts/validate-data.mjs`: runs data tests and public JavaScript syntax checks
- `scripts/report-refresh.mjs`: writes data refresh summary artifacts for operators
- `tests/trend-data.test.mjs`: trend data helper tests
- `tests/ops-docs.test.mjs`: data refresh operating docs tests
- `.github/workflows/update-trends.yml`: scheduled data update workflow
- `404.html`: GitHub Pages fallback page
- `robots.txt`: crawler rules and sitemap location
- `sitemap.xml`: public page list

## Page Roles

| Group | Page | Job |
|---|---|---|
| Decision | Home | Decide what to open first from current AI engineering signals. |
| Decision | Today | Show the generated priority brief with reason and next action. |
| Discovery | Explore | Search, filter, save, and reuse cross-module signal views. |
| Discovery | Topics | Add focused judgment around recurring themes such as AI agents, MCP, and agent skills. |
| Trust / state | Review | Keep a local browser-only saved queue. |
| Trust / state | Status | Explain refresh health, partial data, fallback, and source failures. |
| Source detail | Trends | Show movement across HN, GitHub, and npm. |
| Source detail | Packages | Track npm package adoption signals. |
| Source detail | Repos | Track GitHub project traction signals. |
| Source detail | Links | Keep checked-in curated reference links. |

## Local Preview

Use the local static server so nested routes and JSON fetches work the same way as GitHub Pages:

```powershell
node scripts/serve.mjs
```

Then open `http://127.0.0.1:58117/`.

## Publishing

Push changes to the GitHub Pages branch configured for this repository.

## Data Updates

Run the full local refresh in the same order as GitHub Actions:

```powershell
$env:GITHUB_TOKEN="optional-token-for-local-github-api-refresh"
node scripts/update-all.mjs
node scripts/validate-data.mjs
```

Individual updater scripts stay available for focused refreshes, but the full flow should use `update-all` so Today and Manifest are rebuilt after source data changes.

The site is still static. Pages load checked-in JSON from `data/`, so GitHub Pages does not need a server.

## Data Refresh Automation

`.github/workflows/update-trends.yml` keeps generated data warm.

- Manual refresh: run `workflow_dispatch` from GitHub Actions.
- Manual note: the `reason` input is copied into the refresh report.
- Scheduled refresh: `schedule` runs `17 21 * * *` UTC, once per day.
- Auth: GitHub API calls use `GITHUB_TOKEN` from the workflow environment.
- Scope: only `data/trends.json`, `data/packages.json`, `data/repos.json`, `data/links.json`, `data/today.json`, and `data/manifest.json` are committed.
- Safety: `concurrency` prevents overlapping data refresh jobs, `node scripts/update-all.mjs` groups each updater in logs, and the workflow runs `node scripts/validate-data.mjs` before committing generated data.
- Run summary: every workflow run writes a GitHub Step Summary and uploads a `refresh-report` artifact with source status, counts, timestamps, and source errors.
- Failure model: source fetch failures are stored as `error` or `partial` status where the updater can keep useful data. If a full updater produces zero rows but previous checked-in data exists, the updater writes stale but safe fallback data instead of empty data.
- Fallback markers: fallback source metadata uses `fallbackUsed`, `staleButSafe`, `fallbackReason`, and `rateLimited` when applicable. The Status page and refresh report surface those markers.
- Local GitHub refresh: set `$env:GITHUB_TOKEN` before running GitHub-backed updaters to avoid low anonymous API limits. Without it, rate limits may appear as `rateLimited` fallback in the report.

## Verification

```powershell
node scripts/validate-data.mjs
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
node --check scripts/update-all.mjs
node --check scripts/validate-data.mjs
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
node --check js/explore.js
node --check js/review.js
node --check js/topics.js
node --check js/signal-schema.js
node --check js/data-health.js
```

## Notes

The old SB Admin template files were removed. This site now uses plain HTML and CSS.
