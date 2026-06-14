# anothel.github.io

Responsive tech trend dashboard served with GitHub Pages.

## Structure

- `index.html`: responsive dashboard
- `css/site.css`: site-specific styles
- `data/trends.json`: static seed data
- `js/dashboard.js`: filtering and rendering
- `scripts/update-trends.mjs`: updates trend data from HN, GitHub, and npm
- `tests/trend-data.test.mjs`: trend data helper tests
- `.github/workflows/update-trends.yml`: scheduled data update workflow
- `404.html`: GitHub Pages fallback page
- `robots.txt`: crawler rules and sitemap location
- `sitemap.xml`: public page list

## Local Preview

Open `index.html` in a browser. No build step or dependency install is required.

## Publishing

Push changes to the GitHub Pages branch configured for this repository.

## Data Updates

Run locally:

```powershell
node scripts/update-trends.mjs
```

The GitHub Actions workflow can also update `data/trends.json` once per day.

## Verification

```powershell
node --test tests/trend-data.test.mjs
node --check scripts/update-trends.mjs
node --check js/dashboard.js
```

## Notes

The old SB Admin template files were removed. This site now uses plain HTML and CSS.
