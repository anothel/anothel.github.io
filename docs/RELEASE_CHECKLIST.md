# Release Checklist

Use this before publishing meaningful site, data, or operations changes.

## Release Policy

The project uses dated `CHANGELOG.md` entries and GitHub Pages. No Git tag is required until versioned releases exist. Deployment source limitations are canonical in `docs/DEPLOYMENT.md`.

## Required Checks

```powershell
npm run build
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
| Legacy Notes/topics | `node --test tests/static-fallback.test.mjs tests/astro-build.test.mjs` |

## Build and Route Review

- `dist/` contains all required routes from `scripts/check-dist.mjs`.
- Astro-owned routes use shared shell/navigation components.
- Explore and Review retain useful initial markup and localStorage compatibility; Explore renders directly in React while Review retains its legacy bridge.
- Notes/topic pass-through routes still exist when touched.
- Internal links and data/assets resolve under the configured root URL.

## Generated Data Review

- `data/manifest.json` counts match module data.
- `data/refresh-report.json` explains source health.
- Today has expected sections and bounded scores.
- Any `partial`, `fallback`, `staleButSafe`, or `rateLimited` state is visible and intentional.
- Remaining Notes/topic HTML and sitemap dates were regenerated after live data changes.
- Timestamp/freshness interpretation matches `docs/SIGNAL_SCHEMA.md`.

## Security Review

- Astro-rendered external data uses Astro escaping and safe URL handling.
- Legacy/browser render helpers still escape text and block unsafe URLs.
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
