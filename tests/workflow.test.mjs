import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const workflow = readFileSync(".github/workflows/update-trends.yml", "utf8");

test("data update workflow runs every data updater", () => {
    assert.match(workflow, /node scripts\/update-all\.mjs/);
});

test("today generator runs after links and before manifest", () => {
    assert.match(readFileSync("scripts/update-all.mjs", "utf8"), /scripts\/update-links\.mjs[\s\S]*scripts\/update-today\.mjs[\s\S]*scripts\/update-manifest\.mjs/);
});

test("static fallbacks refresh after manifest and before refresh report", () => {
    assert.match(readFileSync("scripts/update-all.mjs", "utf8"), /scripts\/update-manifest\.mjs[\s\S]*scripts\/update-static-fallbacks\.mjs[\s\S]*scripts\/report-refresh\.mjs/);
});

test("data update workflow commits every generated data file", () => {
    for (const file of [
        "data/trends.json",
        "data/packages.json",
        "data/repos.json",
        "data/links.json",
        "data/today.json",
        "data/manifest.json",
        "data/refresh-report.json"
    ]) {
        assert.match(workflow, new RegExp(file.replace("/", "\\/")));
    }
});

test("data update workflow commits refreshed static fallback pages", () => {
    for (const file of [
        "index.html",
        "today/index.html",
        "status/index.html",
        "trends/index.html",
        "packages/index.html",
        "repos/index.html",
        "links/index.html",
        "notes/index.html",
        "topics/ai-agents/index.html",
        "topics/mcp/index.html",
        "topics/agent-skills/index.html",
        "topics/ai-evals/index.html",
        "topics/workflow-automation/index.html",
        "topics/security/index.html"
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
    assert.match(workflow, /node scripts\/validate-data\.mjs/);
});

test("data update workflow publishes refresh report for operators", () => {
    assert.match(workflow, /node scripts\/report-refresh\.mjs --out-dir "\$\{RUNNER_TEMP\}\/refresh-report" --stdout >> "\$\{GITHUB_STEP_SUMMARY\}"/);
    assert.match(workflow, /REFRESH_REASON:/);
    assert.match(workflow, /name: refresh-report/);
    assert.match(workflow, /path: \$\{\{ runner\.temp \}\}\/refresh-report/);
    assert.match(readFileSync("scripts/update-all.mjs", "utf8"), /::group::\$\{script\}/);
    assert.match(readFileSync("scripts/update-all.mjs", "utf8"), /::error::\$\{script\} failed with exit code \$\{status\}/);
});
