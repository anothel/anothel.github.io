# Architecture

## Current System

anothel.github.io is an Astro static site. `astro.config.mjs` sets `output: "static"`; `npm run build` generates deployable files in `dist/`. There is no server runtime.

Astro owns primary route generation and shared page structure:

- Route entry points: `src/pages/`.
- Shared document shell and navigation: `src/components/AppShell.astro`, `HeroHeader.astro`, and `RouteNav.astro`.
- Shared presentation: `SignalCard.astro`, `StatCard.astro`, and `DataHealthPanel.astro`.
- Canonical origin, navigation, public route, and sitemap model: `src/lib/site-routes.js`.
- Build-time data: checked-in `data/*.json` imports.
- Published assets/data: build-time endpoint routes under `src/pages/css/`, `src/pages/js/`, and `src/pages/data/`.

Nine primary routes are Astro pages: `/`, `/today/`, `/explore/`, `/review/`, `/status/`, `/trends/`, `/packages/`, `/repos/`, and `/links/`. `/notes/` is also a native Astro page. `src/pages/topics/[slug].astro` uses `getStaticPaths()` to generate the seven promoted topic routes from checked-in JSON and a shared topic model. `src/pages/404.astro`, `src/pages/robots.txt.ts`, and `src/pages/sitemap.xml.ts` generate the custom 404 and crawler metadata directly through Astro.

No checked-in HTML or root metadata file duplicates Astro-owned output. Route artifacts, including `404.html`, `robots.txt`, and `sitemap.xml`, exist only in `dist/` after `astro build`.

## React Islands

React is used only where browser-local interaction warrants hydration:

- `ExploreIsland.jsx` on `/explore/`, hydrated with `client:load`.
- `ReviewIsland.jsx` on `/review/`, hydrated with `client:load`.

Explore owns its filters, saved searches, pins, saved-item actions, and rendering directly through React state. Framework-independent behavior lives in `src/lib/explore-domain.js`, `explore-storage.js`, `storage-contract.js`, and `explore-model.js`; the island fetches checked-in JSON after hydration instead of serializing the full corpus into HTML. Its small build-time model renders useful controls, health, lenses, results, and saved guidance without JavaScript.

Review owns queue matching, workflow state, metadata, import/export, and rendering directly through React state. It reuses `explore-domain.js` and `explore-storage.js`; Review-specific pure behavior lives in `src/lib/review-domain.js`. The island fetches checked-in JSON after hydration and keeps the versioned browser-local saved-item contract shared with Explore and Home.

Home is not a React island. `src/scripts/home-saved-summary.js` is an Astro-bundled native ES module that reads the shared key and normalization contract through the small `storage-contract.js` module, then updates only the saved-summary region with `textContent`. `explore-storage.js` re-exports that contract for Explore and Review. Home's static output uses `??` until browser storage is readable and exposes an unavailable message when storage access is blocked.

Topic pages are also not React islands. `src/lib/topic-domain.js` uses the same `normalizeExploreData()` canonical URL deduplication and `sortItems(..., "priority")` ranking as Explore, then applies the shared topic matcher. Duplicate source rows collapse before matching and retain provenance through canonical/legacy ids, `sources`, and `sourceContext`; legacy raw counts are not preserved. `src/scripts/topic-pin.js` reads and toggles only the shared browser-local pin contract from `storage-contract.js`. Static topic output uses an honest loading label rather than claiming an unreadable pin state is false. The pin module updates text and accessibility attributes without globals, dynamic scripts, or HTML insertion.

Notes is a static Astro page with no client script or React. It renders the route-backed notes from `src/lib/topic-taxonomy.js` through Astro templates and uses the same canonical Topic and encoded Explore routes as the Topic family.

Remaining published `js/` audit:

- Active internal modules: `js/data-health.js` supplies Astro Home/Status build helpers and health tests; `js/signal-schema.js` supplies Today generation plus schema/ranking tests.
- Compatibility-only renderer set: `js/dashboard.js`, `link-queue.js`, `package-watchlist.js`, `repo-watchlist.js`, `safe-dom.js`, `status.mjs`, and `today.mjs` remain for renderer/security regression coverage and fixed public endpoints. No native route consumes them.

All currently published `/js/*.js` and `/js/*.mjs` endpoints remain to avoid breaking public URLs, including endpoints for the two active internal modules. Remove the compatibility-only set only after a production reference/usage audit and explicit compatibility-breaking approval confirm that external consumers no longer depend on those URLs.

`src/lib/topic-taxonomy.js` is the one canonical definition and matching source for Notes, Topics, Explore, data classification, sitemap route enumeration, and tests. The former Notes, taxonomy, Topic, and shared-state browser globals and their files are retired and blocked from `dist/`. `AnothelDom` remains only for the compatibility-only renderer set above.

React is justified when a surface needs sustained client state or event-driven updates that cannot be completed at build time. Prefer an Astro component, semantic HTML, or native browser behavior when output is static or interaction is simple. Do not introduce a site-wide React root, client router, or SPA state layer.

## Architecture and Asset Gates

- `tests/island-architecture.test.mjs` guards Explore/Review island boundaries plus Home/topic native-module and static Notes boundaries, including retired bridge and checked-in content HTML checks.
- `scripts/check-size.mjs` resolves Home/topic native modules, static Notes output, and Explore/Review island files from generated HTML, follows local JavaScript import graphs, and measures raw build bytes.
- Reviewed ceilings live only in `asset-size-budgets.json`; `npm run check:size` reports each route, asset, actual size, and budget.
- `npm run check` runs the architecture tests and size gate in CI after building and validating `dist/`.

## Data Flow

```text
data/watchlists.json + remote sources
    -> scripts/update-*.mjs
    -> data/*.json + refresh report
    -> Astro build imports checked-in JSON + canonical site routes
    -> dist/ static route HTML, native 404/robots/sitemap, CSS, JS, and JSON
```

`data/*.json` is the source contract. Refresh scripts own data generation; Astro does not fetch remote sources during build. `scripts/data-contract.mjs` validates JSON shape, `scripts/validate-data.mjs` runs broader repository tests/syntax checks, and `scripts/check-dist.mjs` validates generated routes/assets/data/internal links. Field, timestamp, freshness, and scoring semantics live in `docs/SIGNAL_SCHEMA.md`.

## Static and No-JS Behavior

- Astro pages produce complete static HTML.
- Home shows honest `??` saved counts and JavaScript guidance before its native module can read browser-local state.
- Explore receives build-time fallback results, source health, and topic lenses before hydration.
- Explore renders structured data through JSX; it does not inject source-provided HTML or load legacy global scripts.
- Review renders honest browser-local guidance before hydration; it does not claim the inaccessible local queue is empty without JavaScript.
- Every topic page keeps its summary, note, guidance, movers, source mix, related signals/topics, cards, and action links without JavaScript; only pin state is unavailable.
- Notes renders all seven route-backed notes without JavaScript.
- The 404, robots, sitemap, Notes, and Topic artifacts are generated only by Astro and never written outside `dist/`.

Useful static output is a constraint, not a promise that every browser-local workflow works without JavaScript.

## Decision Record: Astro with Selective React

### Decision

Use Astro static output for routing and shared components. Allow React only as selected islands. Reject a full React SPA.

### Why Astro

- Produces static files compatible with GitHub Pages.
- Supports build-time imports from checked-in JSON without a backend.
- Removes duplicated route shell/navigation markup through Astro components.
- Preserves stable public URLs while Astro owns their generated output.
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
- Topic pins keep the `anothel.preferences.pinnedTopics.v1` key, legacy array/version-1 reads, and three-topic cap.
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
