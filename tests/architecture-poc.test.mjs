import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

function read(path) {
    return readFileSync(path, "utf8");
}

test("architecture records implemented Astro direction and static safety", () => {
    const architecture = read("docs/ARCHITECTURE.md");

    assert.match(architecture, /## Current System/);
    assert.match(architecture, /Astro static site/);
    assert.match(architecture, /Nine primary routes are Astro pages/);
    assert.match(architecture, /React is used only where browser-local interaction warrants hydration/);
    assert.match(architecture, /client:load/);
    assert.match(architecture, /Do not introduce a site-wide React root, client router, or SPA state layer/);
    assert.match(architecture, /data\/\*\.json.*source contract/s);
    assert.match(architecture, /GitHub Pages-compatible static output/);
    assert.match(architecture, /No backend, server function, database, account\/login, or cloud sync/);
    assert.match(architecture, /Review localStorage compatibility remains intact/);
});

test("package entry point exposes current Astro plus React-island toolchain", () => {
    const manifest = JSON.parse(read("package.json"));
    const ignore = read(".gitignore");

    assert.deepEqual(manifest.engines, { node: ">=22.12.0" });
    assert.equal(manifest.dependencies, undefined);
    assert.match(manifest.devDependencies?.astro || "", /^\^6\./);
    assert.match(manifest.devDependencies?.react || "", /^\^19\./);
    assert.match(manifest.devDependencies?.["react-dom"] || "", /^\^19\./);
    assert.match(manifest.devDependencies?.["@astrojs/react"] || "", /^\^6\./);
    assert.match(manifest.devDependencies?.["@playwright/test"] || "", /^\^1\./);
    assert.match(manifest.devDependencies?.["@axe-core/playwright"] || "", /^\^4\./);
    assert.equal(manifest.scripts.serve, "node scripts/serve.mjs");
    assert.equal(manifest.scripts.validate, "node scripts/validate-data.mjs");
    assert.equal(manifest.scripts.build, "astro build");
    assert.equal(manifest.scripts.test, "node --test tests/*.test.mjs");
    assert.equal(manifest.scripts["check:dist"], "node scripts/check-dist.mjs");
    assert.equal(manifest.scripts["check:docs"], "node scripts/check-docs.mjs");
    assert.equal(manifest.scripts["test:e2e"], "npm run build && playwright test");
    assert.equal(manifest.scripts["test:e2e:run"], "playwright test");
    assert.match(manifest.scripts.check, /npm run validate:data/);
    assert.match(manifest.scripts.check, /npm run check:docs/);
    assert.match(manifest.scripts.check, /npm run build/);
    assert.match(manifest.scripts.check, /npm run check:dist/);
    assert.match(manifest.scripts.check, /npm run test:e2e:run/);
    assert.equal(manifest.scripts["update:data"], "node scripts/update-all.mjs");
    assert.equal(existsSync("astro.config.mjs"), true);
    assert.equal(existsSync("src/pages/today/index.astro"), true);
    assert.match(read("astro.config.mjs"), /site: "https:\/\/anothel\.github\.io"/);
    assert.match(read("astro.config.mjs"), /integrations: \[react\(\)\]/);
    assert.match(read("src/pages/today/index.astro"), /data\/today\.json/);
    assert.match(ignore, /node_modules\//);
    assert.match(ignore, /dist\//);

    for (const path of ["pnpm-lock.yaml", "yarn.lock"]) {
        assert.equal(existsSync(path), false, `${path} should not exist for npm-based scaffold`);
    }
});

test("Review queue keeps public route and localStorage compatibility coverage", () => {
    assert.match(read("sitemap.xml"), /https:\/\/anothel\.github\.io\/review\//);
    assert.match(read("dist/review/index.html"), /data-review-static-guidance/);
    assert.match(read("tests/local-state.test.mjs"), /saved item store migrates v1 ids and normalizes missing fields/);
    assert.match(read("tests/review-ui.test.mjs"), /Review matches current and legacy ids and reports mixed stale records/);
});
