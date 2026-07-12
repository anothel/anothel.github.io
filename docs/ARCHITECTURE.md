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

Review still loads the existing `js/local-state.js`, `js/signal-schema.js`, `js/topic-taxonomy.js`, `js/explore.js`, and `js/review.js` bridge. Those files remain until Review is migrated. Review state, saved searches, defaults, and pins remain browser-local through compatible `localStorage` schemas. Other primary routes use Astro components without React hydration.

Retained legacy browser consumers:

- `js/explore.js` remains for `ReviewIsland.jsx`/`js/review.js` normalization and Review tests; `/explore/` does not load it.
- `js/local-state.js` remains for Review, Home saved-count compatibility, and topic pinning.
- `js/signal-schema.js` remains for Review and shared data/ranking regression tests.
- `js/topic-taxonomy.js` remains for Review, Home, Notes, and topic routes.
- `js/data-health.js` remains for shared Astro build helpers and legacy module renderers; Explore uses its structured ES model.

React is justified when a surface needs sustained client state or event-driven updates that cannot be completed at build time. Prefer an Astro component, semantic HTML, or native browser behavior when output is static or interaction is simple. Do not introduce a site-wide React root, client router, or SPA state layer.

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
- Explore receives build-time fallback results, source health, and topic lenses before hydration.
- Explore renders structured data through JSX; it does not inject source-provided HTML or load legacy global scripts.
- Review renders local-state guidance and an empty queue before hydration; saved browser state requires JavaScript.
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
