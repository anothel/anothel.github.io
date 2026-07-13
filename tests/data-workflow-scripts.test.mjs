import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

import { dataUpdateScripts } from "../scripts/update-all.mjs";
import { checkTargets, listTestFiles } from "../scripts/validate-data.mjs";

const primaryHtml = [
    "index.html",
    "today/index.html",
    "explore/index.html",
    "review/index.html",
    "status/index.html",
    "trends/index.html",
    "packages/index.html",
    "repos/index.html",
    "links/index.html"
];
const retiredNotesGlobal = ["Notes", "App"].join("");
const topicHtml = ["agent-skills", "ai-agents", "ai-engineering", "ai-evals", "mcp", "security", "workflow-automation"]
    .map((slug) => `topics/${slug}/index.html`);

test("update-all owns the full data refresh order", () => {
    assert.deepEqual(dataUpdateScripts, [
        "scripts/update-trends.mjs",
        "scripts/update-packages.mjs",
        "scripts/update-repos.mjs",
        "scripts/update-links.mjs",
        "scripts/update-today.mjs",
        "scripts/update-manifest.mjs",
        "scripts/report-refresh.mjs",
        "scripts/update-static-fallbacks.mjs"
    ]);
});

test("update-all dry-run prints the real command args", () => {
    const output = execFileSync(process.execPath, ["scripts/update-all.mjs", "--dry-run"], { encoding: "utf8" });

    assert.match(output, /node scripts\/report-refresh\.mjs --json-out data\/refresh-report\.json/);
    assert.match(output, /scripts\/update-manifest\.mjs[\s\S]*scripts\/report-refresh\.mjs --json-out data\/refresh-report\.json[\s\S]*scripts\/update-static-fallbacks\.mjs/);
});

test("validate-data discovers repository test files without shell globs", async () => {
    const tests = await listTestFiles();

    assert.ok(tests.includes("tests/workflow.test.mjs"));
    assert.ok(tests.includes("tests/static-fallback.test.mjs"));
    assert.ok(tests.includes("tests/data-schema.test.mjs"));
});

test("validate-data syntax checks data workflow scripts and public JavaScript", () => {
    for (const target of [
        "scripts/update-all.mjs",
        "scripts/check-dist.mjs",
        "scripts/validate-data.mjs",
        "scripts/signal-taxonomy.mjs",
        "scripts/watchlist-governance.mjs",
        "scripts/report-refresh.mjs",
        "scripts/update-static-fallbacks.mjs",
        "js/status.mjs",
        "js/today.mjs",
        "src/lib/topic-taxonomy.js",
        "js/signal-schema.js"
    ]) {
        assert.ok(checkTargets.includes(target), `${target} should be syntax checked`);
    }
    assert.ok(!checkTargets.includes("js/topic-taxonomy.js"));
    assert.ok(!checkTargets.includes("js/topics.js"));
});

test("sitemap updater has no Notes browser or VM renderer", () => {
    const script = readFileSync("scripts/update-static-fallbacks.mjs", "utf8");

    assert.doesNotMatch(script, /notes\/index\.html|js\/notes\.js|js\/safe-dom\.js|node:vm|runInNewContext/);
    assert.doesNotMatch(script, new RegExp(`\\b${retiredNotesGlobal}\\b`));
});

test("fallback updater uses canonical topic routes only for sitemap metadata", () => {
    const script = readFileSync("scripts/update-static-fallbacks.mjs", "utf8");

    assert.match(script, /import taxonomy from "\.\.\/src\/lib\/topic-taxonomy\.js"/);
    assert.match(script, /taxonomy\.topicPageLabels/);
    assert.match(script, /updateSitemapLastmod/);
    assert.doesNotMatch(script, /function renderTopicPage|topicRuntime\s*\(/);
});

test("sitemap updater cannot recreate Astro-owned Notes, primary, or topic HTML", () => {
    const script = readFileSync("scripts/update-static-fallbacks.mjs", "utf8");

    for (const path of ["notes/index.html", ...primaryHtml, ...topicHtml]) {
        const escaped = path.replaceAll(/[.*+?^${}()|[\]\\]/g, "\\$&");
        assert.doesNotMatch(script, new RegExp(`(?:readFile|writeIfChanged)\\(\"${escaped}\"`), path);
    }
    assert.match(script, /writeIfChanged\("sitemap\.xml"/);
    assert.doesNotMatch(script, /writeIfChanged\(config\.routePath/);
    assert.equal(existsSync("notes/index.html"), false);
    for (const path of topicHtml) assert.equal(existsSync(path), false, path);
});
