# anothel.github.io

Static home hub and small dashboards served with GitHub Pages.

## Structure

- `index.html`: home hub
- `today/index.html`: generated priority brief from tracked dashboard data
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
- `js/dashboard.js`: filtering and rendering
- `scripts/update-trends.mjs`: updates trend data from HN, GitHub, and npm
- `scripts/update-packages.mjs`: updates package watchlist data from npm
- `scripts/update-repos.mjs`: updates repository watchlist data from GitHub
- `scripts/update-links.mjs`: updates curated links data from local definitions
- `scripts/update-today.mjs`: builds the Today priority brief from generated data
- `scripts/update-manifest.mjs`: updates the module manifest from generated data files
- `tests/trend-data.test.mjs`: trend data helper tests
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

Run locally:

```powershell
node scripts/update-trends.mjs
node scripts/update-packages.mjs
node scripts/update-repos.mjs
node scripts/update-links.mjs
node scripts/update-today.mjs
node scripts/update-manifest.mjs
```

The GitHub Actions workflow can also update all generated JSON data once per day.

## Verification

```powershell
node --test tests/trend-data.test.mjs
node --test tests/package-data.test.mjs
node --test tests/repo-data.test.mjs
node --test tests/link-data.test.mjs
node --test tests/home-data.test.mjs
node --test tests/today-data.test.mjs
node --test tests/today-generator.test.mjs
node --test tests/manifest.test.mjs
node --test tests/site-structure.test.mjs
node --test tests/serve.test.mjs
node --test tests/workflow.test.mjs
node --check scripts/update-trends.mjs
node --check scripts/update-packages.mjs
node --check scripts/update-repos.mjs
node --check scripts/update-links.mjs
node --check scripts/update-today.mjs
node --check scripts/update-manifest.mjs
node --check scripts/serve.mjs
node --check js/dashboard.js
node --check js/home.js
node --check js/today.js
node --check js/package-watchlist.js
node --check js/repo-watchlist.js
node --check js/link-queue.js
```

## Notes

The old SB Admin template files were removed. This site now uses plain HTML and CSS.
