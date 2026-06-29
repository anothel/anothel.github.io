import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

import { dataUpdateScripts } from "../scripts/update-all.mjs";
import { checkTargets, listTestFiles } from "../scripts/validate-data.mjs";

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
        "scripts/validate-data.mjs",
        "scripts/signal-taxonomy.mjs",
        "scripts/watchlist-governance.mjs",
        "scripts/report-refresh.mjs",
        "scripts/update-static-fallbacks.mjs",
        "js/home.mjs",
        "js/status.mjs",
        "js/today.mjs",
        "js/topics.js",
        "js/signal-schema.js"
    ]) {
        assert.ok(checkTargets.includes(target), `${target} should be syntax checked`);
    }
});

test("static fallback renderer loads shared DOM safety before topic and note renderers", () => {
    const script = readFileSync("scripts/update-static-fallbacks.mjs", "utf8");

    assert.match(script, /vm\.runInNewContext\(await readFile\("js\/safe-dom\.js", "utf8"\), context\);[\s\S]*vm\.runInNewContext\(await readFile\("js\/topics\.js", "utf8"\), context\);/);
    assert.match(script, /vm\.runInNewContext\(await readFile\("js\/safe-dom\.js", "utf8"\), context\);[\s\S]*vm\.runInNewContext\(await readFile\("js\/notes\.js", "utf8"\), context\);/);
});

test("static fallback renderer reuses public render helpers instead of duplicating freshness logic", () => {
    const script = readFileSync("scripts/update-static-fallbacks.mjs", "utf8");

    assert.match(script, /import \{[\s\S]*buildHomeOverview[\s\S]*renderModuleRoutes[\s\S]*renderTopicMovements[\s\S]*\} from "\.\.\/js\/home\.mjs";/);
    assert.match(script, /import \{ renderExploreLinks, renderTodaySections, renderTodayStats, renderTodayStatus \} from "\.\.\/js\/today\.mjs";/);
    assert.match(script, /renderExploreLinks\(\)/);
    assert.match(script, /renderTodayStats\(today\.sections\)/);
    assert.match(script, /renderTodaySections\(today\.sections\)/);
    assert.match(script, /renderModuleRoutes\(homeRoutes\)/);
    assert.match(script, /renderTopicMovements\(topicMovements\)/);
    assert.match(script, /collectSourceRows/);
    assert.match(script, /renderSourceRows/);
    assert.doesNotMatch(script, /function (ageDays|dataState|todayStatusText|sourceDetail|renderStatusRows)\b/);
});

test("static fallback renderer derives topic pages from taxonomy", () => {
    const script = readFileSync("scripts/update-static-fallbacks.mjs", "utf8");

    assert.match(script, /topicPageLabels/);
    assert.match(script, /function renderTopicPage/);
    assert.doesNotMatch(script, /const topicPages = \[/);
});

test("static fallback trend card replacement accepts CRLF pages", () => {
    const script = readFileSync("scripts/update-static-fallbacks.mjs", "utf8");

    assert.match(script, /\\r\?\\n\\s\*<\\\/section>\\r\?\\n\\s\*<section class="rank-panel module-primary-panel"/);
});
