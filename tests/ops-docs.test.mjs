import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");
const docs = {
    readme: read("README.md"),
    contributing: read("CONTRIBUTING.md"),
    architecture: read("docs/ARCHITECTURE.md"),
    deployment: read("docs/DEPLOYMENT.md"),
    ia: read("docs/IA.md"),
    roadmap: read("docs/ROADMAP.md"),
    schema: read("docs/SIGNAL_SCHEMA.md"),
    threat: read("docs/THREAT_MODEL.md"),
    release: read("docs/RELEASE_CHECKLIST.md")
};
const manifest = JSON.parse(read("package.json"));

test("active docs describe current Astro architecture, not migration intent", () => {
    assert.match(docs.readme, /This repository is an Astro static site/);
    assert.match(docs.architecture, /Astro builds a static|Astro static site|Astro static output/);
    assert.match(docs.architecture, /ExploreIsland\.jsx.*client:load/s);
    assert.match(docs.architecture, /ReviewIsland\.jsx.*client:load/s);
    assert.match(docs.architecture, /Reject a full React SPA|Reject a full React SPA/i);

    const active = [docs.readme, docs.architecture, docs.roadmap, docs.contributing].join("\n");
    assert.doesNotMatch(active, /Astro static output is approved for future route\/layout migration/i);
    assert.doesNotMatch(active, /^### P\d - Astro Static Build Scaffold$/m);
    assert.doesNotMatch(active, /Add Astro in a build-chain PR before migrating pages/i);
    assert.doesNotMatch(active, /ships as plain HTML, CSS, JavaScript/i);
    assert.doesNotMatch(active, /site now uses plain HTML and CSS/i);
});

test("architecture records current routes, island boundary, constraints, and revisit conditions", () => {
    for (const route of ["/", "/today/", "/explore/", "/review/", "/status/", "/trends/", "/packages/", "/repos/", "/links/"]) {
        assert.match(docs.architecture, new RegExp(route.replaceAll("/", "\\/")));
    }
    for (const path of ["src/pages/404.astro", "src/pages/robots.txt.ts", "src/pages/sitemap.xml.ts", "src/lib/site-routes.js"]) {
        assert.ok(docs.architecture.includes(path), path);
    }
    assert.doesNotMatch(docs.architecture, /src\/pages\/\[\.\.\.legacy\]\.ts|scripts\/update-static-fallbacks\.mjs/);
    assert.match(docs.architecture, /src\/pages\/topics\/\[slug\]\.astro/);
    assert.match(docs.architecture, /\/notes\/.*native Astro page/);
    assert.match(docs.architecture, /404\.html.*robots\.txt.*sitemap\.xml.*only in `dist\/`/s);
    assert.match(docs.architecture, /src\/lib\/topic-taxonomy\.js.*one canonical definition/s);
    assert.match(docs.architecture, /src\/scripts\/topic-pin\.js/);
    assert.match(docs.architecture, /former Notes, taxonomy, Topic, and shared-state browser globals.*retired/s);
    assert.match(docs.architecture, /data\/\*\.json.*source contract/s);
    assert.match(docs.architecture, /No backend, server function, database, account\/login, or cloud sync/s);
    assert.match(docs.architecture, /### Why Astro/);
    assert.match(docs.architecture, /### Why not a full React SPA/);
    assert.match(docs.architecture, /### Revisit only when/);
});

test("deployment docs match Astro config and checked-in workflows", () => {
    const config = read("astro.config.mjs");
    const ci = read(".github/workflows/ci.yml");
    const refresh = read(".github/workflows/update-trends.yml");
    const pages = read(".github/workflows/deploy-pages.yml");

    assert.match(config, /site: "https:\/\/anothel\.github\.io"/);
    assert.match(config, /output: "static"/);
    assert.doesNotMatch(config, /\bbase:/);
    assert.match(docs.deployment, /npm run build/);
    assert.match(docs.deployment, /Output is `dist\/`/);
    assert.match(docs.deployment, /user site `anothel\.github\.io`/);
    assert.match(docs.deployment, /no Astro `base` is configured/);
    assert.match(docs.deployment, /ci\.yml.*does not deploy/s);
    assert.match(docs.deployment, /deploy-pages\.yml.*dedicated Pages workflow/s);
    assert.match(docs.deployment, /cutover was verified by a successful `Deploy Pages` run/);
    assert.match(docs.deployment, /final ownership cleanup.*real `Deploy Pages` run/s);
    assert.match(docs.deployment, /Astro-owned (?:HTML|route output) is never staged/);
    assert.match(docs.deployment, /Settings -> Pages -> Source -> GitHub Actions/);
    assert.match(docs.deployment, /workflow_run.*GITHUB_TOKEN/s);
    assert.match(ci, /npm run check/);
    assert.doesNotMatch(ci, /deploy-pages|upload-pages-artifact/);
    assert.match(refresh, /node scripts\/update-all\.mjs/);
    assert.doesNotMatch(refresh, /deploy-pages|upload-pages-artifact/);
    assert.match(pages, /npm run build[\s\S]*npm run check:dist[\s\S]*path: dist/);
    assert.match(pages, /actions\/deploy-pages@v4/);
});

test("development docs describe every npm script without inventing a dev script", () => {
    for (const [name, command] of Object.entries(manifest.scripts)) {
        const documented = name === "test" ? "npm test" : `npm run ${name}`;
        assert.match(docs.contributing, new RegExp(documented.replaceAll(/[.*+?^${}()|[\]\\]/g, "\\$&")), `${name}: ${command}`);
    }
    assert.equal(manifest.scripts.dev, undefined);
    assert.match(docs.contributing, /There is no `npm run dev` script/);
    assert.match(docs.contributing, /Adding a Route/);
    assert.match(docs.contributing, /Changing a Data Field Safely/);
    assert.match(docs.contributing, /Astro versus React/);
});

test("documented repository paths exist", () => {
    for (const path of [
        "astro.config.mjs",
        "package-lock.json",
        ".github/workflows/ci.yml",
        ".github/workflows/deploy-pages.yml",
        ".github/workflows/update-trends.yml",
        "src/pages/404.astro",
        "src/pages/robots.txt.ts",
        "src/pages/sitemap.xml.ts",
        "src/pages/index.astro",
        "src/pages/today/index.astro",
        "src/pages/explore/index.astro",
        "src/pages/review/index.astro",
        "src/pages/status/index.astro",
        "src/pages/trends/index.astro",
        "src/pages/packages/index.astro",
        "src/pages/repos/index.astro",
        "src/pages/links/index.astro",
        "src/pages/notes/index.astro",
        "src/pages/topics/[slug].astro",
        "src/components/AppShell.astro",
        "src/components/HeroHeader.astro",
        "src/components/RouteNav.astro",
        "src/components/ExploreIsland.jsx",
        "src/components/ReviewIsland.jsx",
        "src/lib/explore-domain.js",
        "src/lib/explore-storage.js",
        "src/lib/explore-model.js",
        "src/lib/review-domain.js",
        "src/lib/topic-domain.js",
        "src/lib/topic-taxonomy.js",
        "src/lib/site-routes.js",
        "src/scripts/topic-pin.js",
        "asset-size-budgets.json",
        "scripts/data-contract.mjs",
        "scripts/validate-data.mjs",
        "scripts/check-dist.mjs",
        "scripts/check-size.mjs",
        "docs/ARCHITECTURE.md",
        "docs/DEPLOYMENT.md",
        "docs/IA.md",
        "docs/SIGNAL_SCHEMA.md",
        "docs/SOURCE_GOVERNANCE.md",
        "docs/THREAT_MODEL.md",
        "docs/RELEASE_CHECKLIST.md"
    ]) {
        assert.equal(existsSync(path), true, path);
    }

    for (const path of [
        "js/local-state.js",
        "js/notes.js",
        "js/topic-taxonomy.js",
        "js/topics.js",
        "notes/index.html",
        "topics/agent-skills/index.html",
        "topics/mcp/index.html"
    ]) {
        assert.equal(existsSync(path), false, `${path} should stay retired`);
    }
});

test("IA documents implemented page jobs, navigation, and intentional overlaps", () => {
    for (const route of ["/today/", "/explore/", "/review/", "/status/", "/trends/", "/packages/", "/repos/", "/links/"]) {
        assert.ok(docs.ia.includes(`| \`${route}\``), route);
    }
    assert.match(docs.ia, /Primary navigation: Home, Today, Explore, Review, Status/);
    assert.match(docs.ia, /Source navigation: Trends, Packages, Repos, Reference shelf/);
    assert.match(docs.ia, /## Intentional Overlaps/);
    assert.match(docs.ia, /Home and Today both show priority signals/);
    assert.match(docs.ia, /Explore and Review both show saved state/);
    assert.match(docs.ia, /Status and health panels share source-health language/);
    assert.ok(docs.ia.includes("| `/topics/<slug>/`"));
    assert.ok(docs.ia.includes("| `/notes/`"));
    assert.match(docs.ia, /only pin state uses a native client module/);
    assert.match(docs.ia, /Notes is native Astro output with no client script/);
});

test("IA records the migration parity decision for Trends and Links filters", () => {
    assert.match(docs.ia, /## Migration Parity Decisions/);
    assert.match(docs.ia, /Legacy Trends exposed source, category, query, and sort controls/);
    assert.match(docs.ia, /Legacy Links exposed category and query controls/);
    assert.match(docs.ia, /Explore is the one cross-source filtering surface/);
});

test("data contract, timestamps, freshness, and scores are discoverable", () => {
    assert.match(docs.readme, /data\/\*\.json.*source contract/s);
    assert.match(docs.schema, /Repository JSON uses camelCase `generatedAt`/);
    assert.match(docs.schema, /`generated_at` is not a current field name/);
    assert.match(docs.schema, /generatedAt.*pipeline generation time/s);
    assert.match(docs.schema, /fresh.*0-1 whole UTC days/s);
    assert.match(docs.schema, /aging.*2-3 whole UTC days/s);
    assert.match(docs.schema, /stale.*more than 3 whole UTC days/s);
    assert.match(docs.schema, /Scores are bounded `0\.\.100` ranking heuristics, not probabilities/s);
    assert.match(docs.schema, /data\/signal-policy\.json/);
    assert.match(docs.schema, /npm run validate:data/);
});

test("roadmap separates completed migration, stabilization, and future work", () => {
    assert.match(docs.roadmap, /## Completed Architecture Work/);
    assert.match(docs.roadmap, /## Current Stabilization/);
    assert.match(docs.roadmap, /## Future Work/);
    assert.match(docs.roadmap, /Migration scaffold\/gate work is complete/);
    assert.match(docs.roadmap, /dedicated GitHub Pages workflow builds, validates, deploys only `dist\/`/);
    assert.match(docs.roadmap, /All seven promoted topic routes are native Astro static pages/);
    assert.match(docs.roadmap, /F1 final pass-through cleanup is complete:.*custom 404, robots, and sitemap.*native Astro/s);
    assert.match(docs.roadmap, /### F2 - Retire Compatibility-Only JavaScript Endpoints/);
    assert.match(docs.roadmap, /production reference\/usage audit.*owner explicitly approves/s);
    assert.doesNotMatch(docs.roadmap, /### F1 - Retire the Final Pass-through Assets/);
    assert.doesNotMatch(docs.roadmap, /Convert Legacy Notes/);
    assert.doesNotMatch(docs.roadmap, /This feature does not exist today|no checked-in workflow deploys `dist\/`/);
    assert.doesNotMatch(docs.roadmap, /^### P\d - Astro Static Build Scaffold$/m);
});

test("security and release docs reflect dependencies and Pages deployment", () => {
    assert.match(docs.threat, /npm dependency and lockfile integrity/);
    assert.match(docs.threat, /package-lock\.json.*pins Astro, React, Playwright, axe/s);
    assert.match(docs.threat, /Dependabot is not configured despite npm dependencies/);
    assert.match(docs.threat, /Pages deployment has `contents: read`, `pages: write`, and `id-token: write`/);
    assert.match(docs.release, /npm run build/);
    assert.match(docs.release, /npm run check/);
    assert.match(docs.release, /docs\/DEPLOYMENT\.md/);
    assert.match(docs.threat, /src\/pages\/topics\/\[slug\]\.astro/);
    assert.match(docs.threat, /src\/pages\/notes\/index\.astro.*canonical ES Topic taxonomy/s);
    assert.match(docs.threat, /no browser runtime/);
    assert.match(docs.release, /All seven topic routes render complete static content/);
    assert.doesNotMatch([docs.threat, docs.release].join("\n"), /dependency-free workflow posture|no package dependencies or lockfile/i);
});
