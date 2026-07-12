# Architecture

## Current System

anothel.github.io is an Astro static site. `astro.config.mjs` sets `output: "static"`; `npm run build` generates deployable files in `dist/`. There is no server runtime.

Astro owns primary route generation and shared page structure:

- Route entry points: `src/pages/`.
- Shared document shell and navigation: `src/components/AppShell.astro`, `HeroHeader.astro`, and `RouteNav.astro`.
- Shared presentation: `SignalCard.astro`, `StatCard.astro`, and `DataHealthPanel.astro`.
- Build-time data: checked-in `data/*.json` imports.
- Preserved assets/data: build-time endpoint routes under `src/pages/css/`, `src/pages/js/`, and `src/pages/data/`.

Nine primary routes are Astro pages: `/`, `/today/`, `/explore/`, `/review/`, `/status/`, `/trends/`, `/packages/`, `/repos/`, and `/links/`. `src/pages/[...legacy].ts` copies the existing 404, robots, sitemap, Notes, and topic files into Astro output. Notes/topic pass-through routes remain checked-in static HTML; they are not Astro component implementations yet.

No checked-in HTML duplicates the nine primary routes. Their only generated HTML lives in `dist/` after `astro build`.

## React Islands

React is used only where browser-local interaction warrants hydration:

- `ExploreIsland.jsx` on `/explore/`, hydrated with `client:load`.
- `ReviewIsland.jsx` on `/review/`, hydrated with `client:load`.

Explore owns its filters, saved searches, pins, saved-item actions, and rendering directly through React state. Framework-independent behavior lives in `src/lib/explore-domain.js`, `explore-storage.js`, and `explore-model.js`; the island fetches checked-in JSON after hydration instead of serializing the full corpus into HTML. Its small build-time model renders useful controls, health, lenses, results, and saved guidance without JavaScript.

Review owns queue matching, workflow state, metadata, import/export, and rendering directly through React state. It reuses `explore-domain.js` and `explore-storage.js`; Review-specific pure behavior lives in `src/lib/review-domain.js`. The island fetches checked-in JSON after hydration and keeps the versioned browser-local saved-item contract shared with Explore and Home.

Home is not a React island. `src/scripts/home-saved-summary.js` is an Astro-bundled native ES module that reads the shared key and normalization contract through `explore-storage.js`, then updates only the saved-summary region with `textContent`. Its static output uses `??` until browser storage is readable and exposes an unavailable message when storage access is blocked. Other non-island primary routes need no client runtime.

Retained legacy modules and consumers:

- `js/local-state.js`: topic pinning, topic fallback output references, and retained topic/state compatibility tests. Seven topic pages still load it through `js/topics.js`; Notes and Home do not.
- `js/signal-schema.js`: Today data generation and shared schema/ranking regression tests.
- `js/topic-taxonomy.js`: Notes/topic runtime behavior, taxonomy generation, fallback generation, and taxonomy tests.
- `js/safe-dom.js`: Notes/topic runtime escaping, fallback generation safety, and retained renderer tests.
- `js/data-health.js`: Astro Home/Status build helpers, preserved health modules, and health regression tests.

The former Explore and Review browser-global bridges and obsolete Home DOM runtime have no production, build, generation, fallback, or test consumer and are not published to `dist/`.

React is justified when a surface needs sustained client state or event-driven updates that cannot be completed at build time. Prefer an Astro component, semantic HTML, or native browser behavior when output is static or interaction is simple. Do not introduce a site-wide React root, client router, or SPA state layer.

## Architecture and Asset Gates

- `tests/island-architecture.test.mjs` guards Explore/Review island boundaries and Home's native-module boundary, including retired bridge publication checks.
- `scripts/check-size.mjs` resolves Home's hashed module plus Explore/Review island and renderer files from generated HTML, follows their local JavaScript import graphs, and measures raw build bytes.
- Reviewed ceilings live only in `asset-size-budgets.json`; `npm run check:size` reports each route, asset, actual size, and budget.
- `npm run check` runs the architecture tests and size gate in CI after building and validating `dist/`.

## Data Flow

```text
data/watchlists.json + remote sources
    -> scripts/update-*.mjs
    -> data/*.json + refresh report + remaining Notes/topic HTML
    -> Astro build imports checked-in JSON
    -> dist/ static HTML, CSS, JS, and JSON
```

`data/*.json` is the source contract. Refresh scripts own data generation; Astro does not fetch remote sources during build. `scripts/data-contract.mjs` validates JSON shape, `scripts/validate-data.mjs` runs broader repository tests/syntax checks, and `scripts/check-dist.mjs` validates generated routes/assets/data/internal links. Field, timestamp, freshness, and scoring semantics live in `docs/SIGNAL_SCHEMA.md`.

## Static and No-JS Behavior

- Astro pages produce complete static HTML.
- Home shows honest `??` saved counts and JavaScript guidance before its native module can read browser-local state.
- Explore receives build-time fallback results, source health, and topic lenses before hydration.
- Explore renders structured data through JSX; it does not inject source-provided HTML or load legacy global scripts.
- Review renders honest browser-local guidance before hydration; it does not claim the inaccessible local queue is empty without JavaScript.
- Notes/topic routes keep existing checked-in HTML through the legacy pass-through.
- `scripts/update-static-fallbacks.mjs` updates only checked-in Notes/topic HTML and sitemap dates used by the legacy pass-through.

Useful static output is a constraint, not a promise that every browser-local workflow works without JavaScript.

## Decision Record: Astro with Selective React

### Decision

Use Astro static output for routing and shared components. Allow React only as selected islands. Reject a full React SPA.

### Why Astro

- Produces static files compatible with GitHub Pages.
- Supports build-time imports from checked-in JSON without a backend.
- Removes duplicated route shell/navigation markup through Astro components.
- Allows incremental preservation of existing assets and legacy routes.
- Supports islands without forcing hydration onto static pages.

### Why not a full React SPA

- Most routes are read-only, build-time views.
- A client router and site-wide hydration would add JavaScript and failure modes without improving those routes.
- Static HTML, direct URLs, GitHub Pages hosting, and no-JS usefulness are product constraints.
- Browser-local Review/Explore behavior does not require server state or SPA-wide state.

### Constraints that must remain true

- GitHub Pages-compatible static output.
- Existing public URLs remain stable.
- `data/*.json` remains the build/data boundary.
- No backend, server function, database, account/login, or cloud sync.
- Review localStorage compatibility remains intact, including legacy saved-id reads.
- React stays route-local and interaction-driven.
- Critical routes keep deterministic build, data, accessibility, and mobile checks.

### Revisit only when

- A required product workflow needs authenticated server state or cross-device sync.
- Static generation cannot meet measured build or content-volume requirements.
- Multiple routes need shared real-time client state that islands cannot reasonably isolate.
- GitHub Pages is no longer the deployment target.

A preference for React or speculative future flexibility is not sufficient.

## Canonical References

- Deployment: `docs/DEPLOYMENT.md`.
- Route roles: `docs/IA.md`.
- Data and scoring: `docs/SIGNAL_SCHEMA.md`.
- Development procedures: `CONTRIBUTING.md`.
- Security boundaries: `docs/THREAT_MODEL.md`.
