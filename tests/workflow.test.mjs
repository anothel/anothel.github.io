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
        assert.match(workflow, new RegExp(script.replace("/", "\\/")));
    }
    assert.match(workflow, /node "\$\{script\}"/);
});

test("today generator runs after links and before manifest", () => {
    const linksIndex = workflow.indexOf("scripts/update-links.mjs");
    const todayIndex = workflow.indexOf("scripts/update-today.mjs");
    const manifestIndex = workflow.indexOf("scripts/update-manifest.mjs");

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
    assert.match(workflow, /inputs:\s*\n\s*reason:/);
    assert.match(workflow, /actions\/upload-artifact@v4/);
});

test("data update workflow verifies generated data before committing", () => {
    const fetchIndex = workflow.indexOf("name: Fetch data");
    const testIndex = workflow.indexOf("name: Verify generated data");
    const summaryIndex = workflow.indexOf("name: Summarize refresh");
    const commitIndex = workflow.indexOf("name: Commit updated data");

    assert.ok(fetchIndex >= 0);
    assert.ok(testIndex > fetchIndex);
    assert.ok(summaryIndex > testIndex);
    assert.ok(commitIndex > summaryIndex);
    assert.match(workflow, /node --test tests\/\*\.test\.mjs/);
});

test("data update workflow publishes refresh report for operators", () => {
    assert.match(workflow, /node scripts\/report-refresh\.mjs --out-dir "\$\{RUNNER_TEMP\}\/refresh-report" --stdout >> "\$\{GITHUB_STEP_SUMMARY\}"/);
    assert.match(workflow, /REFRESH_REASON:/);
    assert.match(workflow, /name: refresh-report/);
    assert.match(workflow, /path: \$\{\{ runner\.temp \}\}\/refresh-report/);
    assert.match(workflow, /::group::\$\{script\}/);
    assert.match(workflow, /::error::\$\{script\} failed with exit code \$\{status\}/);
});
