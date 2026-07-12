import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

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
        "js/topics.js",
        "js/signal-schema.js"
    ]) {
        assert.ok(checkTargets.includes(target), `${target} should be syntax checked`);
    }
});

test("legacy renderer loads shared DOM safety for topic and note output", () => {
    const script = readFileSync("scripts/update-static-fallbacks.mjs", "utf8");

    assert.match(script, /vm\.runInNewContext\(await readFile\("js\/safe-dom\.js", "utf8"\), context\);[\s\S]*vm\.runInNewContext\(await readFile\("js\/topics\.js", "utf8"\), context\);/);
    assert.match(script, /vm\.runInNewContext\(await readFile\("js\/safe-dom\.js", "utf8"\), context\);[\s\S]*vm\.runInNewContext\(await readFile\("js\/notes\.js", "utf8"\), context\);/);
});

test("legacy renderer derives topic pages from taxonomy", () => {
    const script = readFileSync("scripts/update-static-fallbacks.mjs", "utf8");

    assert.match(script, /topicPageLabels/);
    assert.match(script, /function renderTopicPage/);
    assert.doesNotMatch(script, /const topicPages = \[/);
});

test("legacy renderer cannot recreate Astro-owned primary HTML", () => {
    const script = readFileSync("scripts/update-static-fallbacks.mjs", "utf8");

    for (const path of primaryHtml) {
        const escaped = path.replaceAll(/[.*+?^${}()|[\]\\]/g, "\\$&");
        assert.doesNotMatch(script, new RegExp(`(?:readFile|writeIfChanged)\\(\"${escaped}\"`), path);
    }
    assert.match(script, /writeIfChanged\("notes\/index\.html"/);
    assert.match(script, /writeIfChanged\(config\.routePath/);
});
