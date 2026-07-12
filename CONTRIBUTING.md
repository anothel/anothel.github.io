# Contributing

## Local Setup

Use Node.js 22.12.0 or newer and npm's checked-in lockfile.

```powershell
npm ci
npm run build
npm run preview
```

Open `http://127.0.0.1:4321/`. There is no `npm run dev` script. Rebuild before previewing source or data changes. `npm run serve` provides the current `dist/` artifact at `http://127.0.0.1:58117/`; it is not the Astro development server.

If PowerShell blocks `npm.ps1`, use `npm.cmd`.

## Commands

| Command | Actual behavior |
|---|---|
| `npm ci` | Install exact dependencies from `package-lock.json`. |
| `npm run build` | Run `astro build`; write static output to `dist/`. |
| `npm run preview` | Serve current `dist/` at `127.0.0.1:4321`. |
| `npm run serve` | Serve the current `dist/` artifact at `127.0.0.1:58117`. |
| `npm run validate:data` | Validate checked-in `data/*.json` through `scripts/data-contract.mjs`. |
| `npm run check:docs` | Check internal Markdown links, repository paths, npm script names, and canonical architecture statements. External links are skipped. |
| `npm run validate` | Validate data, run all Node tests, and syntax-check listed scripts/browser modules. |
| `npm test` | Run `tests/*.test.mjs` with Node's test runner. |
| `npm run check:dist` | Validate required `dist/` routes, assets, JSON, and internal links. |
| `npm run test:e2e` | Build, then run Playwright desktop/mobile projects. |
| `npm run test:e2e:run` | Run Playwright against current `dist/` via Astro preview. |
| `npm run check` | Run data/docs checks, build, dist checks, repository validation, and Playwright. |
| `npm run update:data` | Run the live data update sequence; may call Hacker News, GitHub, and npm. |

Install the Playwright browser once when needed:

```powershell
npx playwright install chromium
```

## Adding a Route

1. Add `src/pages/<route>/index.astro` (or `src/pages/index.astro` for `/`). New routes should not extend `src/pages/[...legacy].ts`.
2. Reuse `AppShell.astro`, `HeroHeader.astro`, and existing presentation components.
3. Import checked-in JSON in Astro frontmatter when the page is data-driven; do not fetch remote sources during build.
4. Add navigation only when the route has an approved job in `docs/IA.md`.
5. Update `scripts/check-dist.mjs`, sitemap/navigation, and route tests when the route belongs to the required public surface.
6. Run `npm run build`, `npm run check:dist`, relevant Playwright checks, and `npm run check`.

## Changing a Data Field Safely

1. Identify ownership in `docs/SIGNAL_SCHEMA.md`, `data/watchlists.json`, or `data/signal-policy.json`.
2. Update the producer under `scripts/` and validation in `scripts/data-contract.mjs` together.
3. Update checked-in JSON fixtures/data only through the appropriate generator or a reviewed contract migration.
4. Update Astro/browser consumers and focused tests.
5. Run `npm run validate:data`, focused tests, then `npm run check`.

Do not use page code as an alternate data contract. `data/*.json` remains the boundary.

## Astro versus React

Use Astro for routes, layout, navigation, cards, status panels, and other build-time/static output. Use semantic HTML or native browser behavior for simple interaction.

React is justified only for a selected surface with sustained browser-local state or event-driven rerendering. Current examples are Explore and Review, each hydrated with `client:load`. Do not add React to a static route, create a site-wide React root, or turn the application into a SPA.

## Data Refresh

Live refresh requires network access and can change many generated files:

```powershell
$env:GITHUB_TOKEN="optional-token-for-local-github-api-refresh"
npm run update:data
npm run validate:data
npm run check
```

Missing `GITHUB_TOKEN` can leave GitHub-backed sources `partial` or `rateLimited`. Run refresh only when fresh source evidence is part of the task.

## Change Rules

- Keep GitHub Pages-compatible static output and existing public URLs.
- Preserve useful initial/no-JS content where practical.
- No backend, database, account/login, cloud sync, or server functions.
- Preserve Review and Explore localStorage compatibility.
- Prefer existing helpers/components over new abstractions.
- Update canonical docs when changing architecture, deployment, route jobs, data semantics, refresh workflow, release process, or security posture.
- Do not assume public reuse rights beyond `LICENSE`.

Before handoff:

```powershell
npm run check
git diff --check
```

Use `docs/RELEASE_CHECKLIST.md` for work-specific checks.

## Git Ownership

This workspace uses user-owned staging, commits, and pushes by default. Automation agents may stage and commit only when the current task explicitly allows it. Nobody should rewrite history, force push, deploy, release, or stage unrelated files without explicit instruction.
