# Threat Model

## System

Astro builds a static GitHub Pages site from `src/`, checked-in `data/*.json`, shared CSS/browser modules, and preserved legacy HTML routes. Explore and Review hydrate React islands in the browser. Data refresh runs through local scripts and `.github/workflows/update-trends.yml`.

There is no backend, server runtime, account system, sync service, or database.

## Assets

- Public route and build-output integrity.
- Generated data, manifest, and refresh-report integrity.
- Browser-local Review/saved-search state.
- GitHub workflow permissions and optional refresh `GITHUB_TOKEN`.
- npm dependency and lockfile integrity for build/test tooling.

## Trust Boundaries

- Remote Hacker News, GitHub, and npm data.
- Checked-in watchlists, policy, and generated JSON.
- Astro build-time rendering.
- React island hydration and preserved browser modules.
- Browser `localStorage` and imported JSON.
- GitHub Actions jobs with read or contents-write permission.
- GitHub Pages repository settings, environment protections, and hosted deployment service.

## Main Threats

- Remote or localStorage data injects markup or unsafe URLs.
- Watchlist mistakes create unsafe public links.
- Rate-limited refreshes hide stale or missing data.
- Generated data, manifest, remaining Notes/topic HTML, and Astro output drift apart.
- A workflow commits incomplete data or gains unnecessary permissions.
- Dependency or lockfile changes alter build/test behavior unexpectedly.
- Production Pages settings serve a different source than validated `dist/`.

## Current Controls

- Astro escapes interpolated text by default; data-driven Astro links use explicit safe URL/`rel` handling.
- Preserved browser renderers use `js/safe-dom.js` helpers to escape HTML and restrict hrefs.
- Explore renders structured source data through JSX, validates external URL protocols, and validates imported saved-search JSON before storage.
- Review renders source and localStorage data through JSX, validates imported records before versioned writes, and neutralizes unsafe Markdown URLs.
- External data links retain `rel="noopener noreferrer"`.
- `scripts/data-contract.mjs` validates checked-in JSON; `scripts/check-dist.mjs` validates built routes/assets/data/internal links.
- Node renderer/security tests and Playwright accessibility/mobile/smoke tests run through `npm run check`.
- Scoped island architecture tests block dynamic script/global bridges and raw-byte budgets cap generated Explore/Review JavaScript growth.
- Source metadata exposes `ok`, `partial`, `fallback`, `error`, rate limits, and stale-but-safe reuse.
- Data refresh validates before commit; workflow concurrency prevents overlapping refresh commits.
- CI has `contents: read`; data refresh has `contents: write` because it commits generated files.
- Pages deployment has `contents: read`, `pages: write`, and `id-token: write`; it uploads only validated `dist/` and uses deployment concurrency.
- Workflows currently use GitHub-owned actions at major versions; introduce full SHA pinning if third-party actions or broader permissions are added.
- `package-lock.json` pins Astro, React, Playwright, axe, and transitive build/test dependencies. Dependency changes require lockfile review and full checks.

## Rendering Inventory

| Surface | Implementation | Untrusted input control |
|---|---|---|
| Home, Today, Status, Trends, Packages, Repos, Links | Astro pages/components | Astro text escaping; `SignalCard.astro` safe href handling; explicit external `rel`. |
| Explore | Astro page + `ExploreIsland.jsx` + `src/lib/explore-*.js` | React renders structured data through JSX; external URLs and imported JSON are validated. |
| Review | `ReviewIsland.jsx` + `src/lib/review-domain.js` + shared Explore ES modules | React JSX escaping, safe external URLs, normalized versioned records, validated imports, and controlled metadata fields. |
| Notes/topics and remaining legacy HTML | `src/pages/[...legacy].ts` pass-through | Checked-in fallback generator and renderer safety tests. |
| Data/JS/CSS endpoints | Astro build-time endpoint routes | Fixed allowlists in route source; no request-time filesystem access after static build. |

## Accepted Risks

- localStorage is user-controlled, browser-local, and not recoverable without export.
- External sites may change or disappear.
- CSP and a site-wide referrer policy are not enforced; link-level `noreferrer` and renderer tests are current controls.
- GitHub Actions are major-version pinned, not commit-SHA pinned, while only GitHub-owned actions are used.
- Dependabot is not configured despite npm dependencies; dependency updates remain manual.
- Repository files cannot enforce the required Pages source setting; `Settings -> Pages -> Source -> GitHub Actions` remains an owner-controlled prerequisite.

## Review Triggers

Revisit when adding a source family, public generated-data route, dependency, third-party action, workflow permission, localStorage/import behavior, server capability, account/sync feature, or changing Pages deployment behavior.
