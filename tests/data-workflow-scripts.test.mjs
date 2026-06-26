import test from "node:test";
import assert from "node:assert/strict";
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
        "scripts/update-static-fallbacks.mjs",
        "scripts/report-refresh.mjs"
    ]);
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
        "scripts/report-refresh.mjs",
        "scripts/update-static-fallbacks.mjs",
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
