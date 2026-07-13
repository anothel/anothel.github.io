import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";

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
        "scripts/report-refresh.mjs"
    ]);
});

test("update-all dry-run prints the real command args", () => {
    const output = execFileSync(process.execPath, ["scripts/update-all.mjs", "--dry-run"], { encoding: "utf8" });

    assert.match(output, /node scripts\/report-refresh\.mjs --json-out data\/refresh-report\.json/);
    assert.match(output, /scripts\/update-manifest\.mjs[\s\S]*scripts\/report-refresh\.mjs --json-out data\/refresh-report\.json/);
    assert.doesNotMatch(output, /update-static-fallbacks/);
});

test("validate-data discovers repository test files without shell globs", async () => {
    const tests = await listTestFiles();

    assert.ok(tests.includes("tests/workflow.test.mjs"));
    assert.ok(tests.includes("tests/special-output.test.mjs"));
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
        "js/status.mjs",
        "js/today.mjs",
        "src/lib/site-routes.js",
        "src/lib/topic-taxonomy.js",
        "js/signal-schema.js"
    ]) {
        assert.ok(checkTargets.includes(target), `${target} should be syntax checked`);
    }
    assert.ok(!checkTargets.includes("scripts/update-static-fallbacks.mjs"));
    assert.ok(!checkTargets.includes("js/topic-taxonomy.js"));
    assert.ok(!checkTargets.includes("js/topics.js"));
});
