import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const workflow = readFileSync(".github/workflows/update-trends.yml", "utf8");

test("data update workflow runs every data updater", () => {
    for (const script of [
        "scripts/update-trends.mjs",
        "scripts/update-packages.mjs",
        "scripts/update-repos.mjs",
        "scripts/update-links.mjs",
        "scripts/update-today.mjs",
        "scripts/update-manifest.mjs"
    ]) {
        assert.match(workflow, new RegExp(`node ${script.replace("/", "\\/")}`));
    }
});

test("today generator runs after links and before manifest", () => {
    const linksIndex = workflow.indexOf("node scripts/update-links.mjs");
    const todayIndex = workflow.indexOf("node scripts/update-today.mjs");
    const manifestIndex = workflow.indexOf("node scripts/update-manifest.mjs");

    assert.ok(linksIndex >= 0);
    assert.ok(todayIndex > linksIndex);
    assert.ok(manifestIndex > todayIndex);
});

test("data update workflow commits every generated data file", () => {
    for (const file of [
        "data/trends.json",
        "data/packages.json",
        "data/repos.json",
        "data/links.json",
        "data/today.json",
        "data/manifest.json"
    ]) {
        assert.match(workflow, new RegExp(file.replace("/", "\\/")));
    }
});

test("data update workflow documents its automation contract", () => {
    assert.match(workflow, /^name: Update data/m);
    assert.match(workflow, /workflow_dispatch:/);
    assert.match(workflow, /schedule:/);
    assert.match(workflow, /cron: "17 21 \* \* \*"/);
    assert.match(workflow, /permissions:\s*\n\s*contents: write/);
    assert.match(workflow, /concurrency:\s*\n\s*group: update-data/);
    assert.match(workflow, /node-version: "20"/);
    assert.match(workflow, /GITHUB_TOKEN: \$\{\{ secrets\.GITHUB_TOKEN \}\}/);
});

test("data update workflow verifies generated data before committing", () => {
    const fetchIndex = workflow.indexOf("name: Fetch data");
    const testIndex = workflow.indexOf("name: Verify generated data");
    const commitIndex = workflow.indexOf("name: Commit updated data");

    assert.ok(fetchIndex >= 0);
    assert.ok(testIndex > fetchIndex);
    assert.ok(commitIndex > testIndex);
    assert.match(workflow, /node --test tests\/\*\.test\.mjs/);
});
