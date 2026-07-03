import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const refreshReport = JSON.parse(readFileSync("data/refresh-report.json", "utf8"));
const readme = readFileSync("README.md", "utf8");
const ia = readFileSync("docs/IA.md", "utf8");
const roadmap = readFileSync("docs/ROADMAP.md", "utf8");
const license = readFileSync("LICENSE", "utf8");
const security = readFileSync("SECURITY.md", "utf8");
const contributing = readFileSync("CONTRIBUTING.md", "utf8");
const changelog = readFileSync("CHANGELOG.md", "utf8");
const signalSchema = readFileSync("docs/SIGNAL_SCHEMA.md", "utf8");
const sourceGovernance = readFileSync("docs/SOURCE_GOVERNANCE.md", "utf8");
const threatModel = readFileSync("docs/THREAT_MODEL.md", "utf8");
const releaseChecklist = readFileSync("docs/RELEASE_CHECKLIST.md", "utf8");
const roadmapQueueHeadings = [
    "P0 - Publish Health Refresh",
    "P1 - Signal Quality Watchlist",
    "P1 - Explore Repeat-Use Tightening",
    "P1 - Security and Release Hardening",
    "P2 - Status and Source Trust",
    "P2 - Formatting and Generator Maintainability",
];

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
    assert.match(readme, /warns when it is missing/);
});

test("README keeps local and scheduled data update command order aligned", () => {
    const dataUpdates = readme.slice(readme.indexOf("## Data Updates"), readme.indexOf("## Data Refresh Automation"));
    const verification = readme.slice(readme.indexOf("## Verification"));

    assert.ok(dataUpdates.indexOf("node scripts/update-all.mjs") < dataUpdates.indexOf("node scripts/validate-data.mjs"));
    assert.match(verification, /node --check scripts\/update-all\.mjs/);
    assert.match(verification, /node --check scripts\/validate-data\.mjs/);
    assert.match(verification, /node --check scripts\/report-refresh\.mjs/);
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

test("IA records review queue workflow audit outcomes", () => {
    assert.match(ia, /Review Queue Workflow Audit/);
    assert.match(ia, /keeps the existing localStorage key, saved item schema, canonical ids, and legacy saved id matching/s);
    assert.match(ia, /status-specific next action for unread, read, and done items/s);
    assert.match(ia, /not sync, account, backend, or route expansion/s);
});

test("IA records signal quality regression audit outcomes", () => {
    assert.match(ia, /Signal Quality Regression Audit/);
    assert.match(ia, /golden fixture now excludes broad baseline tooling from the top Explore priority set/s);
    assert.match(ia, /Shared signal normalization now applies baseline caps to broad repos/s);
    assert.match(ia, /source health and fallback copy stayed consistent/s);
});

test("IA records home visit speed audit outcomes", () => {
    assert.match(ia, /Home Visit Speed Audit/);
    assert.match(ia, /Home utility choices are reduced to items tracked, one trust state, and the saved queue/s);
    assert.match(ia, /Open first still points to Today as the priority brief/s);
    assert.match(ia, /No route, localStorage schema, refresh script, framework, backend, or account scope changed/s);
});

test("IA records status recovery clarity audit outcomes", () => {
    assert.match(ia, /Status Recovery Clarity Audit/);
    assert.match(ia, /share recovery copy for ok, partial, fallback, stale, and error states/s);
    assert.match(ia, /retry data refresh as the recovery action/s);
    assert.match(ia, /Stale source details name retry data refresh/s);
});

test("IA records interaction state visual audit outcomes", () => {
    assert.match(ia, /Interaction State Visual Audit/);
    assert.match(ia, /Nested actions now get their own hover\/focus target/s);
    assert.match(ia, /Review queue hover and selected states are visually distinct/s);
    assert.match(ia, /Saved queue remove buttons gain the same hover\/focus affordance/s);
});

test("IA records static snapshot drift audit outcomes", () => {
    assert.match(ia, /Static Snapshot Drift Audit/);
    assert.match(ia, /regenerated Home, Today, Explore, Status, module, topic, and Notes snapshots without producing drift/s);
    assert.match(ia, /already matched shared renderer output/s);
    assert.match(ia, /Static fallback copy stayed user-facing and aligned/s);
});

test("IA records notes return path audit outcomes", () => {
    assert.match(ia, /Notes Return Path Audit/);
    assert.match(ia, /Topic note panels now link back to Notes/s);
    assert.match(ia, /Review details add a topic notes return path/s);
    assert.match(ia, /Home keeps one Notes entry from topic movement/s);
});

test("IA records end-to-end workflow consolidation outcomes", () => {
    assert.match(ia, /End-to-End Workflow Consolidation/);
    assert.match(ia, /Today now links to Review later/s);
    assert.match(ia, /Home -> Today\/Explore -> Review -> Notes\/Status/s);
    assert.match(ia, /No route, localStorage schema, source data, signal policy, framework, backend, account, or sync scope changed/s);
});

test("IA records refresh recovery drill outcomes", () => {
    assert.match(ia, /Refresh Recovery Drill/);
    assert.match(ia, /Status refresh-run fallback attention keeps previous data context/s);
    assert.match(ia, /update-all dry-run and static fallback regeneration stayed local/s);
    assert.match(ia, /Live source refresh stayed separate because it requires network approval/s);
});

test("IA records live source refresh probe outcomes", () => {
    assert.match(ia, /Live Source Refresh Probe/);
    assert.match(ia, /refreshed live HN, GitHub, npm, repo, package, link, Today, manifest, report, and static fallback data/s);
    assert.match(ia, /live refresh report covered 4 modules, 6 sources, and 111 generated items/s);
    assert.match(ia, /fallback-only `staleButSafe` metadata/s);
    assert.match(ia, /fallback-only markers reserved for true fallback states/s);
});

test("IA records refresh cadence governance outcomes", () => {
    assert.match(ia, /Refresh Cadence Governance Audit/);
    assert.match(ia, /Scheduled refresh stays once daily at `17 21 \* \* \*` UTC/s);
    assert.match(ia, /Trend GitHub query-level skips now mark the GitHub trend source `partial`/s);
    assert.match(ia, /Query-level error copy drops long API URLs/s);
    assert.match(ia, /set `GITHUB_TOKEN` before live refresh/s);
});

test("IA records signal surface prune outcomes", () => {
    assert.match(ia, /Signal Surface Prune Pass/);
    assert.match(ia, /Current routes remain justified by distinct jobs/s);
    assert.match(ia, /Home -> Today\/Explore -> Review -> Notes\/Status remains the core workflow/s);
    assert.match(ia, /Future Roadmap work should stay bundled by workflow/s);
    assert.match(ia, /No route, localStorage schema, source family, framework, backend, account, or sync scope changed/s);
});

test("IA records source governance prune outcomes", () => {
    assert.match(ia, /Source Governance Prune Pass/);
    assert.match(ia, /`react`, `typescript`, and `playwright` are retired/s);
    assert.match(ia, /Baseline scoring policy stays in `data\/signal-policy\.json`/s);
});

test("IA records live refresh confirmation outcomes", () => {
    assert.match(ia, /Live Refresh Confirmation Pass/);
    assert.match(ia, /108 generated items/s);
    assert.match(ia, /Retired direct watchlist entries `react`, `typescript`, and `playwright` stayed absent/s);
    assert.match(ia, /use `GITHUB_TOKEN` for the next confirmation pass/s);
});

test("IA records refresh auth preflight outcomes", () => {
    assert.match(ia, /Refresh Auth Preflight Pass/);
    assert.match(ia, /warns local operators when `GITHUB_TOKEN` is missing/s);
    assert.match(ia, /may remain `partial` or `rateLimited`/s);
    assert.match(ia, /authenticated confirmation itself remains gated on a real `GITHUB_TOKEN`/s);
});

test("IA records authenticated GitHub refresh outcomes", () => {
    assert.match(ia, /Authenticated GitHub Refresh Pass/);
    assert.match(ia, /GitHub trend source recovered to `ok`/s);
    assert.match(ia, /No GitHub rate-limit or skipped-query errors remained/s);
    assert.match(ia, /remaining refresh `partial` status came from npm `n8n-workflow` 429/s);
});

test("IA records roadmap analysis P0 corrections", () => {
    assert.match(ia, /Roadmap Analysis P0 Corrections/);
    assert.match(ia, /rejects `history.date` values after the current data date/s);
    assert.match(ia, /baseline penalty from `data\/signal-policy\.json`/s);
    assert.match(ia, /static pages now keep top source rows/s);
    assert.match(ia, /remaining active data issue is npm `n8n-workflow` 429 partial state/s);
});

test("IA records renderer safety audit outcomes", () => {
    assert.match(ia, /Renderer Safety Audit/);
    assert.match(ia, /Shared `safe-dom\.js` owns text escaping, href blocking, and link attribute rendering/s);
    assert.match(ia, /External item links rendered from generated data and static fallbacks carry `rel="noopener noreferrer"`/s);
    assert.match(ia, /no sanitizer, framework, backend, route, account, or sync scope changed/s);
});

test("IA records contract and release discipline outcomes", () => {
    assert.match(ia, /Data Contract Enforcement/);
    assert.match(ia, /`node scripts\/validate-data\.mjs` remains the single data contract gate/s);
    assert.match(ia, /JSON Schema files stay deferred until current tests miss real drift/s);
    assert.match(ia, /Release Discipline Pass/);
    assert.match(ia, /dated changelog entries and normal GitHub Pages publishes/s);
    assert.match(ia, /No Git tag, provenance, SLSA, framework, backend, account, or sync scope changed/s);
});

test("IA records generated data publish drill outcomes", () => {
    assert.match(ia, /Generated Data Publish Drill/);
    assert.match(ia, /Current checked-in data is publishable from local checks/s);
    assert.match(ia, /npm `n8n-workflow` 429 remains accepted visible partial source health with `rateLimited` metadata/s);
    assert.match(ia, /No live network refresh, route, source family, release policy, package dependency, lockfile, framework, backend, account, or sync scope changed/s);
});

test("IA records module type warning cleanup outcomes", () => {
    assert.match(ia, /Module Type Warning Cleanup/);
    assert.match(ia, /Home, Today, and Status browser modules now use `.mjs`/s);
    assert.match(ia, /CommonJS-compatible `signal-schema\.js` and `topic-taxonomy\.js` stay `.js`/s);
    assert.match(ia, /No package-wide `"type": "module"`, dependency, bundler, transpiler, framework, backend, account, or sync scope changed/s);
});

test("IA records npm partial recovery confirmation outcomes", () => {
    assert.match(ia, /npm Partial Recovery Confirmation/);
    assert.match(ia, /Network-approved refresh still returned npm `n8n-workflow` 429/s);
    assert.match(ia, /25 package rows stayed preserved with `rateLimited` metadata/s);
    assert.match(ia, /The same local run lacked `GITHUB_TOKEN`, so GitHub trend refresh became `partial` again/s);
});

test("IA records authenticated refresh publish confirmation outcomes", () => {
    assert.match(ia, /Authenticated Refresh Publish Confirmation/);
    assert.match(ia, /`gh auth token` supplied `GITHUB_TOKEN` to the existing refresh path/s);
    assert.match(ia, /GitHub trend source recovered to `ok`/s);
    assert.match(ia, /Only npm `n8n-workflow` 429 remains non-ok/s);
    assert.match(ia, /No route, source family, release policy, package dependency, lockfile, framework, backend, account, or sync scope changed/s);
});

test("IA records current signal diff triage outcomes", () => {
    assert.match(ia, /Current Signal Diff Triage/);
    assert.match(ia, /refreshed Home, Today, Explore, topic, and module snapshots stayed publishable/s);
    assert.match(ia, /agent-workflow signals still lead the priority surfaces/s);
    assert.match(ia, /No watchlist, signal policy, route, source family, release policy, package dependency, lockfile, framework, backend, account, or sync scope changed/s);
});

test("IA records publish readiness diff review outcomes", () => {
    assert.match(ia, /Publish Readiness Diff Review/);
    assert.match(ia, /generated data, static snapshots, docs, and release notes matched the release checklist/s);
    assert.match(ia, /route count, navigation, source health copy, dated changelog entry, and known npm partial state stayed publishable/s);
    assert.match(ia, /User-owned staging, commit, push, and GitHub Pages publish remain outside repository automation/s);
});

test("IA records post-publish smoke outcomes", () => {
    assert.match(ia, /Post-Publish Smoke Pass/);
    assert.match(ia, /live Home, Today, Explore, Review, Status, source detail, and topic routes returned 200/s);
    assert.match(ia, /live data JSON still showed GitHub trends `ok` and npm packages `partial` with one rate-limited source/s);
    assert.match(ia, /No checked-in data, route, source family, package dependency, lockfile, framework, backend, account, or sync scope changed/s);
});

test("IA records next refresh health watch outcomes", () => {
    assert.match(ia, /Next Refresh Health Watch/);
    assert.match(ia, /token-backed manual refresh kept GitHub trend health `ok`/s);
    assert.match(ia, /npm `n8n-workflow` stayed the only non-ok source with preserved package rows/s);
    assert.match(ia, /Refresh report, manifest, Today, static fallbacks, and source-health copy stayed consistent/s);
});

test("IA records repeated npm partial decision outcomes", () => {
    assert.match(ia, /Repeated npm Partial Decision/);
    assert.match(ia, /`n8n-workflow` stays active/s);
    assert.match(ia, /preserves workflow-automation package coverage/s);
    assert.match(ia, /visible `partial` source health with `rateLimited` metadata/s);
    assert.match(ia, /No watchlist, route, source family, release policy, package dependency, lockfile, framework, backend, account, or sync scope changed/s);
});

test("IA records unauthenticated publish health refresh outcomes", () => {
    assert.match(ia, /Unauthenticated Publish Health Refresh/);
    assert.match(ia, /`GITHUB_TOKEN` was not set/s);
    assert.match(ia, /GitHub trend source became `partial` with 403 rate limits/s);
    assert.match(ia, /npm `n8n-workflow` stayed `partial` with 429/s);
    assert.match(ia, /108 generated items stayed publishable/s);
});

test("IA records token-backed publish health rerun outcomes", () => {
    assert.match(ia, /Token-backed Publish Health Rerun/);
    assert.match(ia, /`gh auth token` supplied `GITHUB_TOKEN`/s);
    assert.match(ia, /all 6 sources reported `ok`/s);
    assert.match(ia, /refresh report totals stayed at 108 generated items/s);
    assert.match(ia, /errors dropped to 0/s);
});

test("docs record the public trust baseline", () => {
    assert.match(readme, /docs\/SIGNAL_SCHEMA\.md/);
    assert.match(readme, /docs\/SOURCE_GOVERNANCE\.md/);
    assert.match(readme, /docs\/THREAT_MODEL\.md/);
    assert.match(readme, /docs\/RELEASE_CHECKLIST\.md/);
    assert.match(readme, /SECURITY\.md/);
    assert.match(readme, /CONTRIBUTING\.md/);
    assert.match(readme, /CHANGELOG\.md/);
    assert.match(ia, /Documentation Trust Baseline/);
    assert.match(ia, /Package entry point and PR CI are established without dependencies/s);
});

test("security and threat docs preserve the static-site trust model", () => {
    assert.match(security, /static GitHub Pages signal dashboard/s);
    assert.match(security, /Do not open a public issue for a suspected vulnerability/s);
    assert.match(security, /GITHUB_TOKEN/s);
    assert.match(threatModel, /There is no backend, account system, sync service, or database/s);
    assert.match(threatModel, /Remote sources: Hacker News, GitHub, npm/s);
    assert.match(threatModel, /Shared safe DOM helpers escape HTML and restrict hrefs/s);
    assert.match(threatModel, /Explore card activation uses `noopener,noreferrer`/s);
    assert.match(threatModel, /Referrer policy decision: external item links rely on `rel="noopener noreferrer"`/s);
    assert.match(threatModel, /GitHub Actions pinning decision: major-version actions remain accepted/s);
    assert.match(threatModel, /stricter SHA pinning is deferred while workflows use only GitHub-owned actions and local scripts/s);
    assert.doesNotMatch(threatModel, /deferred until CI basics are in place/s);
    assert.match(threatModel, /Dependabot decision: no dependency update automation is enabled while the repo has no package dependencies or lockfile/s);
    assert.match(releaseChecklist, /Referrer policy still matches the external-link `noreferrer` decision/s);
    assert.match(releaseChecklist, /GitHub Actions pinning and Dependabot decisions still match the current dependency-free workflow posture/s);
});

test("data contract docs describe schema and source governance", () => {
    assert.match(signalSchema, /Signal Schema v2 is the normalized item contract/s);
    assert.match(signalSchema, /data\/signal-policy\.json/);
    assert.match(signalSchema, /fallbackUsed/);
    assert.match(signalSchema, /## Contract Gate/);
    assert.match(signalSchema, /`node scripts\/validate-data\.mjs` is the data contract gate/s);
    assert.match(signalSchema, /Manifest contract.*`data\/manifest\.json`/s);
    assert.match(signalSchema, /Refresh report contract.*`data\/refresh-report\.json`/s);
    assert.match(signalSchema, /Signal policy contract.*`data\/signal-policy\.json`/s);
    assert.match(signalSchema, /Normalized item example/);
    assert.match(signalSchema, /JSON Schema files stay deferred/s);
    assert.match(sourceGovernance, /data\/watchlists\.json/);
    assert.match(sourceGovernance, /Governance validation rejects future `history.date` values/s);
    assert.match(sourceGovernance, /npm `n8n-workflow` returned 429/s);
    assert.match(sourceGovernance, /visible `partial` source health with `rateLimited: true`/s);
    assert.match(sourceGovernance, /Status refresh-run detail uses the same sanitized recovery copy/s);
});

test("contribution and release docs name the runnable checks", () => {
    assert.match(contributing, /npm run check/);
    assert.match(contributing, /git diff --check/);
    assert.match(readme, /This repo uses dated changelog entries and normal GitHub Pages publishes, not release tags yet/s);
    assert.match(releaseChecklist, /node scripts\/validate-data\.mjs/);
    assert.match(releaseChecklist, /npm run check/);
    assert.match(releaseChecklist, /GitHub Pages publish/);
    assert.match(releaseChecklist, /No Git tag is required/);
    assert.match(releaseChecklist, /dated `CHANGELOG\.md` entry/s);
    assert.match(releaseChecklist, /data\/manifest\.json/);
    assert.match(releaseChecklist, /Roadmap contains only future work/s);
    assert.match(changelog, /Unreleased/);
    assert.match(changelog, /2026-06-28/);
});

test("root docs state the source-available reuse boundary", () => {
    assert.match(license, /All rights reserved unless otherwise noted/);
    assert.match(readme, /source-available with all rights reserved/s);
    assert.match(readme, /not an open-source license/s);
    assert.match(contributing, /Do not assume public reuse rights beyond `LICENSE`/s);
    assert.match(releaseChecklist, /reuse boundary still matches `LICENSE`/s);
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

test("roadmap is a future work queue, not a completed-work ledger", () => {
    assert.match(roadmap, /## Next Work Queue/);
    assert.match(roadmap, /## Later Queue/);
    assert.match(roadmap, /Keep shipped outcomes in `CHANGELOG\.md`/);
    assert.doesNotMatch(roadmap, /## Current Surface/);
    assert.doesNotMatch(roadmap, /## Product Direction/);
    assert.doesNotMatch(roadmap, /Post-publish smoke:/);
    assert.doesNotMatch(roadmap, /Publish readiness:/);
});

test("roadmap names concrete next work bundles in priority order", () => {
    const headings = [...roadmap.matchAll(/^### (P\d - .+)$/gm)].map((match) => match[1]);

    assert.deepEqual(headings, roadmapQueueHeadings);
});

test("roadmap P0 current state matches the checked-in refresh report", () => {
    const start = roadmap.indexOf("### P0 - Publish Health Refresh");
    const next = roadmap.indexOf("\n### ", start + 1);
    const section = roadmap.slice(start, next);
    const partialSource = refreshReport.modules
        .flatMap((module) => module.sources || [])
        .find((source) => source.status === "partial");

    assert.match(section, new RegExp(refreshReport.manifestUpdated));
    assert.match(section, new RegExp(refreshReport.runContext.eventName));
    assert.match(section, new RegExp(String(refreshReport.totals.items)));
    assert.match(section, new RegExp(refreshReport.totals.status));
    assert.match(section, new RegExp(partialSource.source));
    assert.match(section, /n8n-workflow/);
});

test("roadmap work bundles define trigger, scope, verification, and exit", () => {
    for (const heading of roadmapQueueHeadings) {
        const start = roadmap.indexOf(`### ${heading}`);
        const next = roadmap.indexOf("\n### ", start + 1);
        const section = roadmap.slice(start, next === -1 ? undefined : next);

        assert.match(section, /Trigger:/);
        assert.match(section, /Scope:/);
        assert.match(section, /Verification:/);
        assert.match(section, /Exit:/);
    }
});

test("roadmap keeps architecture as a trigger gate, not active work", () => {
    assert.match(roadmap, /## Trigger Gates/);
    assert.match(roadmap, /### Architecture Gate/);
    assert.match(roadmap, /Gate trigger: a measured vanilla JavaScript blocker/);
    assert.doesNotMatch(roadmap, /^### P3 - Architecture Gate$/m);
});

test("roadmap keeps product boundaries explicit for future work", () => {
    assert.match(roadmap, /No backend, account, sync, database, framework, bundler, package dependency, or lockfile/);
    assert.match(roadmap, /Do not run live refresh unless the selected bundle needs fresh source evidence/);
    assert.match(roadmap, /Keep npm `n8n-workflow` active while preserved rows remain useful/);
    assert.match(roadmap, /If `GITHUB_TOKEN` is missing, keep GitHub 403 as known partial state and queue a token-backed rerun/);
    assert.match(roadmap, /Framework PoC waits for a measured vanilla JavaScript blocker/);
});

test("roadmap folds repo analysis work into baselines, bundles, and deferrals", () => {
    assert.match(roadmap, /## Current Baseline/);
    assert.match(roadmap, /Absorbs analysis items:/);
    assert.match(roadmap, /## Later Queue/);
    assert.match(roadmap, /Why later:/);
    assert.match(roadmap, /Pull forward when:/);
    assert.doesNotMatch(roadmap, /C:\/Users\/anoth\/Downloads\/anothel_repo_analysis_2026-06-28\.md/);
    assert.doesNotMatch(roadmap, /Report item \| Decision \| Reason/);

    for (const label of [
        "SECURITY.md",
        "package.json",
        "PR CI",
        "Roadmap P0",
        "Signal Schema v2",
        "renderer XSS",
        "GitHub 403",
        "CONTRIBUTING.md",
        "CHANGELOG.md",
        "source governance",
        "external link policy",
        "update-trends.yml",
        "Status partial copy",
        "accessibility",
        "Astro/React",
        "visual regression",
        "provenance",
        "advanced ranking",
        "export/import",
        "Native file chooser import smoke",
        "source expansion",
        "README product purpose",
        "JSON Schema",
        "route/link checker",
        "Actions pinning",
        "Dependabot",
        "release checklist",
    ]) {
        assert.match(roadmap, new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
    }

    assert.match(roadmap, /already part of the current repo/);
    assert.match(roadmap, /not re-added/);
    assert.match(roadmap, /queued with lower priority/);
    assert.match(roadmap, /Pull forward when:/);
    assert.match(roadmap, /source-available reuse boundary/);
    assert.doesNotMatch(roadmap, /^### P1 - License and Public Reuse Boundary$/m);
});
