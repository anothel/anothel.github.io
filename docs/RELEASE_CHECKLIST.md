# Release Checklist

Use this before publishing meaningful site, data, or operations changes.

## Release Policy

The project uses dated `CHANGELOG.md` entries and GitHub Pages. No Git tag is required until versioned releases exist. Deployment source limitations are canonical in `docs/DEPLOYMENT.md`.

## Required Checks

```powershell
npm run build
npm run check:size
npm run check
git diff --check
```

`npm run check` already builds and validates `dist/`; the explicit build command remains listed because release handoff requires both commands to be valid and independently runnable.

## Minimum Extra Checks

| Work type | Focused check |
|---|---|
| Docs-only | `node --test tests/ops-docs.test.mjs tests/architecture-poc.test.mjs` |
| UI/route | Relevant Playwright spec plus `npm run test:e2e` |
| Data contract | `npm run validate:data` plus focused schema/generator tests |
| Data refresh | `npm run validate:data` and generated-data review below |
| Native Astro topics | `node --test tests/topic-ui.test.mjs tests/astro-build.test.mjs tests/island-architecture.test.mjs` |
| Native Astro Notes | `node --test tests/notes-ui.test.mjs tests/astro-build.test.mjs tests/island-architecture.test.mjs` |

## Build and Route Review

- `dist/` contains all required routes from `scripts/check-dist.mjs`.
- Astro-owned routes use shared shell/navigation components.
- Explore and Review render directly in React, retain useful static guidance/content, and share compatible localStorage records.
- All seven topic routes render complete static content; only their native pin module depends on JavaScript, and no topic route loads React.
- Notes renders all seven canonical notes without JavaScript; Notes/topic HTML must not exist as checked-in source.
- Internal links and data/assets resolve under the configured root URL.
- Home/topic raw HTML and native JavaScript, static Notes HTML/zero JavaScript, plus Explore/Review raw HTML, island JavaScript, shared React client, and transitive route JavaScript stay within `asset-size-budgets.json`.

## Generated Data Review

- `data/manifest.json` counts match module data.
- `data/refresh-report.json` explains source health.
- Today has expected sections and bounded scores.
- Any `partial`, `fallback`, `staleButSafe`, or `rateLimited` state is visible and intentional.
- Sitemap dates were regenerated after live data changes; no checked-in Notes or Topic HTML was recreated.
- Timestamp/freshness interpretation matches `docs/SIGNAL_SCHEMA.md`.

## Security Review

- Astro-rendered external data uses Astro escaping and safe URL handling.
- Notes taxonomy text uses Astro escaping and canonical internal routes.
- Topic source content is Astro-escaped, external URLs use the shared safe policy, and the pin module writes no HTML.
- External links retain required `noopener noreferrer` behavior.
- localStorage import/export remains untrusted input.
- Dependency/lockfile changes are reviewed; `package-lock.json` matches `package.json`.
- Workflow permissions/actions match `docs/THREAT_MODEL.md`.

## Documentation Review

- Architecture changes -> `docs/ARCHITECTURE.md`.
- Deployment/build/workflow changes -> `docs/DEPLOYMENT.md`.
- Route jobs/navigation changes -> `docs/IA.md`.
- Data/timestamp/score changes -> `docs/SIGNAL_SCHEMA.md`.
- Source policy changes -> `docs/SOURCE_GOVERNANCE.md`.
- Commands/development changes -> `README.md` and `CONTRIBUTING.md`.
- Security changes -> `docs/THREAT_MODEL.md` or `SECURITY.md`.
- Completed user/operator-visible work -> `CHANGELOG.md`.

## Publish Decision

Publish when required checks pass, generated partial/fallback states are intentional, docs match actual behavior, unrelated generated changes are excluded, and GitHub Pages publishing source has been confirmed according to `docs/DEPLOYMENT.md`.
