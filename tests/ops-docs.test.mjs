import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const readme = readFileSync("README.md", "utf8");
const ia = readFileSync("docs/IA.md", "utf8");
const roadmap = readFileSync("docs/ROADMAP.md", "utf8");

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

test("IA records topic promotion review outcomes", () => {
    assert.match(ia, /Topic Promotion Review/);
    assert.match(ia, /Developer tooling stays lens-only.*broad baseline tooling/s);
    assert.match(ia, /Existing seven topic pages stay promoted/s);
    assert.match(ia, /No topic page is added from item count alone/s);
});

test("IA documents source governance decisions", () => {
    assert.match(ia, /Source Governance/);
    assert.match(ia, /data\/watchlists\.json/);
    assert.match(ia, /disabled: true/);
    assert.match(ia, /history.*date.*note/s);
    assert.match(ia, /Framework islands stay deferred/);
});

test("IA records source quality drift review outcomes", () => {
    assert.match(ia, /Source Quality Drift Review/);
    assert.match(ia, /Broad baseline trend inputs stay retired/s);
    assert.match(ia, /Broad package, repo, and reference entries use `disabled: true`/s);
});

test("IA records refresh stability follow-up outcomes", () => {
    assert.match(ia, /Refresh Stability Follow-up/);
    assert.match(ia, /Partial package and repo refreshes preserve prior active rows/s);
    assert.match(ia, /Trend source failures preserve prior rows for the failed source/s);
});

test("IA records review queue friction audit outcomes", () => {
    assert.match(ia, /Review Queue Friction Audit/);
    assert.match(ia, /keeps the existing localStorage key, saved item schema, canonical ids, and legacy saved id matching/s);
    assert.match(ia, /status-specific next action for unread, read, and done items/s);
    assert.match(ia, /not sync, account, backend, or route expansion/s);
});

test("docs explain checked-in signal policy ownership", () => {
    assert.match(readme, /data\/signal-policy\.json/);
    assert.match(ia, /Signal Policy/);
    assert.match(ia, /baseline titles/);
    assert.match(ia, /intent threshold/);
    assert.match(ia, /Today and Explore/);
    assert.match(readme, /Today and Explore scoring policy/);
});

test("IA records public scope triage outcomes", () => {
    assert.match(ia, /Public Scope Triage/);
    assert.match(ia, /Public worklog route stays out.*Notes already indexes durable topic judgment/s);
    assert.match(ia, /Portfolio, resume, and company-history content stay out/s);
    assert.match(ia, /Active navigation and sitemap should expose signal-dashboard routes/s);
});

test("roadmap keeps completed public scope triage out of next work", () => {
    assert.doesNotMatch(roadmap, /### P5 - Public Scope Triage/);
    assert.match(roadmap, /Public worklog route stays rejected/);
});

test("roadmap keeps completed explore policy parity out of next work", () => {
    assert.doesNotMatch(roadmap, /### P5 - Explore Score Policy Parity/);
    assert.match(roadmap, /### P0 - Signal Quality Regression Audit/);
    assert.doesNotMatch(roadmap, /Shared scoring data, only where tests prove policy duplication is risky/);
});

test("roadmap keeps completed topic promotion review out of next work", () => {
    assert.doesNotMatch(roadmap, /### P5 - Topic Promotion Review/);
    assert.match(roadmap, /### P0 - Signal Quality Regression Audit/);
});

test("roadmap keeps completed source quality drift review out of next work", () => {
    assert.doesNotMatch(roadmap, /### P0 - Source Quality Drift Review/);
    assert.match(roadmap, /### P0 - Signal Quality Regression Audit/);
});

test("roadmap keeps architecture PoC as a gate outside next work", () => {
    assert.doesNotMatch(roadmap, /### P0 - Architecture PoC Only On Measured Blocker/);
    assert.match(roadmap, /## Architecture Gate/);
    assert.match(roadmap, /Gate-only, not active queue work/);
    assert.match(roadmap, /measured vanilla JavaScript problem exceeds the budget/);
});

test("roadmap keeps completed refresh stability out of next work", () => {
    assert.doesNotMatch(roadmap, /### P0 - Refresh Stability Follow-up/);
    assert.match(roadmap, /### P0 - Signal Quality Regression Audit/);
});

test("roadmap keeps completed review queue friction out of next work", () => {
    assert.doesNotMatch(roadmap, /### P0 - Review Queue Friction Audit/);
    assert.match(roadmap, /### P0 - Signal Quality Regression Audit/);
});

test("roadmap promotes signal quality regression as the active P0", () => {
    assert.match(roadmap, /### P0 - Signal Quality Regression Audit/);
    assert.match(roadmap, /priority surfaces still prefer specific agent-workflow signals over broad baseline tooling/s);
    assert.match(roadmap, /No framework, backend, account, sync, or new public route/s);
});
