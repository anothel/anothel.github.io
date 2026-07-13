import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { warnIfMissingGitHubToken } from "../scripts/update-all.mjs";

const workflow = readFileSync(".github/workflows/update-trends.yml", "utf8");
const pagesWorkflow = readFileSync(".github/workflows/deploy-pages.yml", "utf8");

test("data update workflow runs every data updater", () => {
    assert.match(workflow, /node scripts\/update-all\.mjs/);
});

test("today generator runs after links and before manifest", () => {
    assert.match(readFileSync("scripts/update-all.mjs", "utf8"), /scripts\/update-links\.mjs[\s\S]*scripts\/update-today\.mjs[\s\S]*scripts\/update-manifest\.mjs/);
});

test("refresh report is generated after the manifest", () => {
    const updateAll = readFileSync("scripts/update-all.mjs", "utf8");

    assert.match(updateAll, /scripts\/update-manifest\.mjs[\s\S]*scripts\/report-refresh\.mjs/);
    assert.doesNotMatch(updateAll, /update-static-fallbacks/);
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

test("data update workflow does not commit Astro-owned output", () => {
    const commitStep = workflow.slice(workflow.indexOf("name: Commit updated data"));
    for (const file of [
        "404.html",
        "robots.txt",
        "sitemap.xml",
        "notes/index.html",
        "index.html",
        "today/index.html",
        "explore/index.html",
        "review/index.html",
        "status/index.html",
        "trends/index.html",
        "packages/index.html",
        "repos/index.html",
        "links/index.html",
        "topics/agent-skills/index.html",
        "topics/ai-agents/index.html",
        "topics/ai-engineering/index.html",
        "topics/ai-evals/index.html",
        "topics/mcp/index.html",
        "topics/security/index.html",
        "topics/workflow-automation/index.html"
    ]) {
        assert.equal(commitStep.includes(file), false, file);
    }
});

test("data update workflow documents its automation contract", () => {
    assert.match(workflow, /^name: Update data/m);
    assert.match(workflow, /workflow_dispatch:/);
    assert.match(workflow, /schedule:/);
    assert.match(workflow, /cron: "17 21 \* \* \*"/);
    assert.match(workflow, /permissions:\s*\n\s*contents: write/);
    assert.match(workflow, /concurrency:\s*\n\s*group: update-data/);
    assert.match(workflow, /node-version: "22\.12\.0"/);
    assert.match(workflow, /cache: npm/);
    assert.match(workflow, /name: Install dependencies\s*\n\s*run: npm ci/);
    assert.match(workflow, /GITHUB_TOKEN: \$\{\{ secrets\.GITHUB_TOKEN \}\}/);
    assert.match(workflow, /inputs:\s*\n\s*reason:/);
    assert.match(workflow, /actions\/upload-artifact@v4/);
});

test("data update workflow verifies generated data before committing", () => {
    const fetchIndex = workflow.indexOf("name: Fetch data");
    const validateIndex = workflow.indexOf("name: Validate generated data");
    const buildIndex = workflow.indexOf("name: Build generated site");
    const distIndex = workflow.indexOf("name: Validate generated artifact");
    const renderedIndex = workflow.indexOf("name: Verify Astro output");
    const summaryIndex = workflow.indexOf("name: Summarize refresh");
    const uploadIndex = workflow.indexOf("name: Upload refresh report");
    const commitIndex = workflow.indexOf("name: Commit updated data");

    assert.ok(fetchIndex >= 0);
    assert.ok(validateIndex > fetchIndex);
    assert.ok(buildIndex > validateIndex);
    assert.ok(distIndex > buildIndex);
    assert.ok(renderedIndex > distIndex);
    assert.ok(summaryIndex > renderedIndex);
    assert.ok(uploadIndex > summaryIndex);
    assert.ok(commitIndex > uploadIndex);
    assert.match(workflow, /npm run validate:data[\s\S]*npm run build[\s\S]*npm run check:dist/);
    assert.match(workflow, /node --test tests\/astro-build\.test\.mjs tests\/special-output\.test\.mjs tests\/status-data\.test\.mjs/);
    assert.equal(workflow.match(/node scripts\/update-all\.mjs/g)?.length, 1);
    assert.doesNotMatch(workflow.slice(validateIndex, commitIndex), /GITHUB_TOKEN|curl|node scripts\/update-all\.mjs/);
});

test("data update workflow publishes refresh report for operators", () => {
    assert.match(workflow, /node scripts\/report-refresh\.mjs --out-dir "\$\{RUNNER_TEMP\}\/refresh-report" --stdout >> "\$\{GITHUB_STEP_SUMMARY\}"/);
    assert.match(workflow, /REFRESH_REASON:/);
    assert.match(workflow, /name: refresh-report/);
    assert.match(workflow, /path: \|[\s\S]*\$\{\{ runner\.temp \}\}\/refresh-report[\s\S]*data\/refresh-report\.json/);
    assert.match(workflow, /name: Summarize refresh\s*\n\s*if: always\(\)/);
    assert.match(workflow, /name: Upload refresh report\s*\n\s*if: always\(\)/);
    assert.match(workflow, /name: Commit updated data\s*\n\s*if: success\(\)/);
    assert.match(readFileSync("scripts/update-all.mjs", "utf8"), /::group::\$\{script\}/);
    assert.match(readFileSync("scripts/update-all.mjs", "utf8"), /::error::\$\{script\} failed with exit code \$\{status\}/);
});

test("local update-all warns when GitHub token is missing", () => {
    const warnings = [];

    assert.equal(warnIfMissingGitHubToken({}, (message) => warnings.push(message)), true);
    assert.equal(warnings.length, 1);
    assert.match(warnings[0], /GITHUB_TOKEN/);
    assert.match(warnings[0], /partial/);
    assert.match(warnings[0], /rateLimited/);
});

test("local update-all skips GitHub token warning when token exists", () => {
    const warnings = [];

    assert.equal(warnIfMissingGitHubToken({ GITHUB_TOKEN: "set" }, (message) => warnings.push(message)), false);
    assert.deepEqual(warnings, []);
});

test("PR CI validates without committing generated data", () => {
    assert.equal(existsSync(".github/workflows/ci.yml"), true);
    const ci = readFileSync(".github/workflows/ci.yml", "utf8");

    assert.match(ci, /^name: CI/m);
    assert.match(ci, /pull_request:/);
    assert.match(ci, /push:\s*\n\s*branches: \[main\]/);
    assert.match(ci, /contents: read/);
    assert.match(ci, /node-version: "22\.12\.0"/);
    assert.match(ci, /cache: npm/);
    assert.match(ci, /name: Install dependencies\s*\n\s*run: npm ci/);
    assert.match(ci, /npx playwright install --with-deps chromium/);
    assert.match(ci, /npm run check/);
    assert.match(ci, /actions\/upload-artifact@v4/);
    assert.match(ci, /playwright-report\//);
    assert.match(ci, /test-results\//);
    assert.match(ci, /git diff --check/);
    assert.doesNotMatch(ci, /git add|git commit|git push/);
    assert.doesNotMatch(ci, /node scripts\/update-all\.mjs/);
});

test("Pages workflow builds, validates, and deploys only the Astro artifact", () => {
    const pages = pagesWorkflow;

    assert.match(pages, /^name: Deploy Pages/m);
    assert.match(pages, /push:\s*\n\s*branches: \[main\]/);
    assert.match(pages, /workflow_dispatch:/);
    assert.match(pages, /workflow_run:[\s\S]*workflows: \["Update data"\][\s\S]*types: \[completed\][\s\S]*branches: \[main\]/);
    assert.match(pages, /github\.event\.workflow_run\.conclusion == 'success'/);
    assert.match(pages, /contents: read/);
    assert.match(pages, /pages: write/);
    assert.match(pages, /id-token: write/);
    assert.match(pages, /group: github-pages[\s\S]*cancel-in-progress: true/);
    assert.match(pages, /npm ci[\s\S]*npm run build[\s\S]*npm run check:dist[\s\S]*actions\/upload-pages-artifact@v4[\s\S]*path: dist/);
    assert.match(pages, /environment:\s*\n\s*name: github-pages/);
    assert.match(pages, /actions\/deploy-pages@v4/);
    assert.match(pages, /robots\.txt sitemap\.xml/);
    assert.match(pages, /\/_astro\//);
    assert.match(pages, /test "\$\{status\}" = "404"/);
    assert.doesNotMatch(pages, /git add|git commit|git push|personal access token|PAT/);
});

test("refresh validation and concurrency enforce update to commit to deploy order", () => {
    const commitIndex = workflow.indexOf("name: Commit updated data");
    const distIndex = workflow.indexOf("npm run check:dist");
    const uploadIndex = pagesWorkflow.indexOf("actions/upload-pages-artifact@v4");
    const deployIndex = pagesWorkflow.indexOf("actions/deploy-pages@v4");

    assert.ok(distIndex >= 0 && commitIndex > distIndex);
    assert.ok(uploadIndex >= 0 && deployIndex > uploadIndex);
    assert.match(pagesWorkflow, /workflow_run:[\s\S]*workflows: \["Update data"\]/);
    assert.match(pagesWorkflow, /github\.event\.workflow_run\.conclusion == 'success'/);
    assert.match(pagesWorkflow, /ref: \$\{\{ github\.event_name == 'workflow_run' && 'main' \|\| github\.sha \}\}/);
    assert.match(workflow, /group: update-data[\s\S]*cancel-in-progress: false/);
    assert.match(pagesWorkflow, /group: github-pages[\s\S]*cancel-in-progress: true/);
});
