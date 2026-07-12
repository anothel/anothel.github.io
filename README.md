# anothel.github.io

Static-first personal signal dashboard for deciding what technical signal to open next.

This repository is an Astro static site deployed to GitHub Pages. Astro generates routes and shared layout/components; React is limited to hydrated islands on Explore and Review. It is not a React SPA. Checked-in `data/*.json` files are the build-time data contract.

## Start Here

Requires Node.js 22.12.0 or newer.

```powershell
npm ci
npm run build
npm run preview
```

Open `http://127.0.0.1:4321/`. `npm run preview` serves the current `dist/` build; rebuild after source or data changes.

Primary verification:

```powershell
npm run check
git diff --check
```

If PowerShell blocks `npm.ps1`, use `npm.cmd`, for example `npm.cmd run check`.

## Architecture

- `src/pages/`: Astro route entry points. Nine primary routes are implemented directly in Astro.
- `src/components/`: shared Astro presentation plus the direct React `ExploreIsland.jsx` and legacy-bridged `ReviewIsland.jsx`.
- `src/lib/explore-*.js`: framework-independent Explore normalization, filtering, models, and storage compatibility.
- `src/pages/[...legacy].ts`: build-time pass-through for existing Notes, topic, and 404 HTML routes not yet converted to Astro components.
- `data/*.json`: checked-in source snapshots, manifest, refresh report, watchlists, Today brief, and scoring policy.
- `scripts/`: data generation, remaining Notes/topic HTML generation, and build-output checks.
- `js/`: browser behavior reused by hydrated islands and preserved legacy pages.
- `dist/`: ignored Astro build output.

Only Explore and Review hydrate React, both with `client:load`. Other primary routes render static Astro HTML. Useful initial Explore content and Review guidance exist before client behavior loads; legacy topic/Notes routes preserve checked-in no-JS HTML.

See [Architecture](docs/ARCHITECTURE.md), [Deployment](docs/DEPLOYMENT.md), and [Contributing](CONTRIBUTING.md) for canonical details.

## Routes

| Route | Job |
|---|---|
| `/` | Open-now hub, priority signals, trust summary, and local saved-count summary. |
| `/today/` | Generated priority brief with reasons and next actions. |
| `/explore/` | Cross-source search, filters, saved searches, and save actions. |
| `/review/` | Browser-local saved queue and workflow state. |
| `/status/` | Data completeness, freshness, validation, and recovery evidence. |
| `/trends/` | Ranked movement across Hacker News, GitHub, and npm. |
| `/packages/` | npm package watchlist. |
| `/repos/` | GitHub repository watchlist. |
| `/links/` | Curated reference shelf. |

Route ownership and intentional overlaps are documented in [Information Architecture](docs/IA.md).

## Data

`data/*.json` is the source contract consumed by Astro builds and browser behavior. `data/watchlists.json` owns refresh inputs; `npm run update:data` produces module snapshots and Today, updates manifest/report metadata, then refreshes the remaining Notes/topic HTML and sitemap. Primary-route HTML is generated only by Astro in `dist/`.

```powershell
$env:GITHUB_TOKEN="optional-token-for-local-github-api-refresh"
npm run update:data
npm run validate:data
npm run check
```

Refreshes use external APIs. `GITHUB_TOKEN` is optional, but missing authentication can leave GitHub sources `partial` or `rateLimited`. Do not run live refresh merely to validate a code or docs change.

Validation commands:

- `npm run validate:data`: focused `data/*.json` contract validation.
- `npm run check:docs`: deterministic internal Markdown links, repository paths, npm scripts, and architecture-label checks; external URLs are not requested.
- `npm run validate`: data validation, Node tests, and syntax checks.
- `npm run check`: data/documentation validation, Astro build, `dist/` checks, repository tests/syntax checks, and Playwright.

Timestamp, freshness, field, and score semantics are canonical in [Signal Schema v2](docs/SIGNAL_SCHEMA.md). Repository JSON uses `generatedAt` (camelCase), not `generated_at`.

## Automation

- `.github/workflows/ci.yml`: read-only CI on pull requests and pushes to `main`; installs Node/Chromium and runs `npm run check` plus `git diff --check`.
- `.github/workflows/update-trends.yml`: scheduled/manual data refresh; validates output, then commits checked-in data and the remaining Notes/topic HTML.
- `.github/workflows/deploy-pages.yml`: builds and validates `dist/`, deploys only that artifact to GitHub Pages, and verifies production routes.

Pages must use `Settings -> Pages -> Source -> GitHub Actions`. See [Deployment](docs/DEPLOYMENT.md).

## Product Constraints

- No backend or server runtime.
- No database, account, login, or cloud sync.
- Review and saved-search state stays in browser `localStorage`; JSON import/export provides local portability.
- Keep useful static/no-JS output where practical.
- Keep React limited to justified interactive islands; do not turn the site into a full React SPA.

## Project Docs

- [Architecture](docs/ARCHITECTURE.md): current Astro/React-island design and decision record.
- [Deployment](docs/DEPLOYMENT.md): build output, Pages requirements, workflows, and local verification.
- [Information Architecture](docs/IA.md): route roles, navigation, and intentional overlaps.
- [Roadmap](docs/ROADMAP.md): completed migration summary, current stabilization, and future triggers.
- [Signal Schema v2](docs/SIGNAL_SCHEMA.md): data, timestamps, freshness, and scoring.
- [Source Governance](docs/SOURCE_GOVERNANCE.md): watchlist, partial, and fallback policy.
- [Threat Model](docs/THREAT_MODEL.md), [Security Policy](SECURITY.md), and [Release Checklist](docs/RELEASE_CHECKLIST.md).
- [Accessibility Testing](docs/ACCESSIBILITY_TESTING.md), [Durable Decisions](docs/DECISIONS.md), and [Changelog](CHANGELOG.md).

## License and Reuse

This repository is source-available with all rights reserved unless otherwise noted in `LICENSE`. The current `LICENSE` is not an open-source license.
