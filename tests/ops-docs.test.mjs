import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const readme = readFileSync("README.md", "utf8");
const ia = readFileSync("docs/IA.md", "utf8");

test("README explains data refresh automation for operators", () => {
    assert.match(readme, /## Data Refresh Automation/);
    assert.match(readme, /workflow_dispatch/);
    assert.match(readme, /schedule/);
    assert.match(readme, /17 21 \* \* \*/);
    assert.match(readme, /GITHUB_TOKEN/);
    assert.match(readme, /checked-in JSON/);
    assert.match(readme, /partial/);
    assert.match(readme, /refresh-report/);
    assert.match(readme, /GitHub Step Summary/);
    assert.match(readme, /node scripts\/validate-data\.mjs/);
    assert.match(readme, /stale but safe/);
    assert.match(readme, /fallbackUsed/);
    assert.match(readme, /rateLimited/);
    assert.match(readme, /\$env:GITHUB_TOKEN/);
});

test("README keeps local and scheduled data update command order aligned", () => {
    const commands = [
        "node scripts/update-all.mjs",
        "node scripts/validate-data.mjs",
        "node --check scripts/update-all.mjs",
        "node --check scripts/validate-data.mjs",
        "node --check scripts/report-refresh.mjs"
    ];

    let previousIndex = -1;
    for (const command of commands) {
        const index = readme.indexOf(command);
        assert.ok(index > previousIndex, `${command} should appear after previous update command`);
        previousIndex = index;
    }
});

test("IA documents current schema and freshness vocabulary", () => {
    assert.match(ia, /Signal Schema v2 is the current normalized item contract/);
    assert.match(ia, /Fresh.*0-1 days/s);
    assert.match(ia, /Aging.*2-3 days/s);
    assert.match(ia, /Stale.*more than 3 days/s);
    assert.match(ia, /Status attention.*Stale|Stale.*Status attention/s);
    assert.doesNotMatch(ia, /Signal schema v2[^.\n]*deferred/i);
    assert.doesNotMatch(ia, /Signal schema v2 should not replace/i);
});

test("IA documents topic governance decisions", () => {
    assert.match(ia, /Topic Governance/);
    assert.match(ia, /Promote/);
    assert.match(ia, /Keep lens-only/);
    assert.match(ia, /Retire/);
    assert.match(ia, /Notes stays a decision-support index/);
});

test("IA documents source governance decisions", () => {
    assert.match(ia, /Source Governance/);
    assert.match(ia, /data\/watchlists\.json/);
    assert.match(ia, /disabled: true/);
    assert.match(ia, /history.*date.*note/s);
    assert.match(ia, /Framework islands stay deferred/);
});
