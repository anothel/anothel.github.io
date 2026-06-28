import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const readme = readFileSync("README.md", "utf8");
const ia = readFileSync("docs/IA.md", "utf8");
const roadmap = readFileSync("docs/ROADMAP.md", "utf8");
const security = readFileSync("SECURITY.md", "utf8");
const contributing = readFileSync("CONTRIBUTING.md", "utf8");
const changelog = readFileSync("CHANGELOG.md", "utf8");
const signalSchema = readFileSync("docs/SIGNAL_SCHEMA.md", "utf8");
const sourceGovernance = readFileSync("docs/SOURCE_GOVERNANCE.md", "utf8");
const threatModel = readFileSync("docs/THREAT_MODEL.md", "utf8");
const releaseChecklist = readFileSync("docs/RELEASE_CHECKLIST.md", "utf8");
const activeRoadmapP0 = /### P0 - Next Refresh Health Watch/;

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

test("IA records review queue friction audit outcomes", () => {
    assert.match(ia, /Review Queue Friction Audit/);
    assert.match(ia, /keeps the existing localStorage key, saved item schema, canonical ids, and legacy saved id matching/s);
    assert.match(ia, /status-specific next action for unread, read, and done items/s);
    assert.match(ia, /not sync, account, backend, or route expansion/s);
});

test("IA records signal quality regression audit outcomes", () => {
    assert.match(ia, /Signal Quality Regression Audit/);
    assert.match(ia, /golden fixture still keeps agent-workflow signals above broad baseline tooling/s);
    assert.match(ia, /No signal policy or watchlist change was needed/s);
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
    assert.match(roadmap, activeRoadmapP0);
    assert.doesNotMatch(roadmap, /Shared scoring data, only where tests prove policy duplication is risky/);
});

test("roadmap keeps completed topic promotion review out of next work", () => {
    assert.doesNotMatch(roadmap, /### P5 - Topic Promotion Review/);
    assert.match(roadmap, activeRoadmapP0);
});

test("roadmap keeps completed source quality drift review out of next work", () => {
    assert.doesNotMatch(roadmap, /### P0 - Source Quality Drift Review/);
    assert.match(roadmap, activeRoadmapP0);
});

test("roadmap keeps architecture PoC as a gate outside next work", () => {
    assert.doesNotMatch(roadmap, /### P0 - Architecture PoC Only On Measured Blocker/);
    assert.match(roadmap, /## Architecture Gate/);
    assert.match(roadmap, /Gate-only, not active queue work/);
    assert.match(roadmap, /measured vanilla JavaScript problem exceeds the budget/);
});

test("roadmap keeps completed refresh stability out of next work", () => {
    assert.doesNotMatch(roadmap, /### P0 - Refresh Stability Follow-up/);
    assert.match(roadmap, activeRoadmapP0);
});

test("roadmap keeps completed review queue friction out of next work", () => {
    assert.doesNotMatch(roadmap, /### P0 - Review Queue Friction Audit/);
    assert.match(roadmap, activeRoadmapP0);
});

test("roadmap keeps completed signal quality regression out of next work", () => {
    assert.doesNotMatch(roadmap, /### P0 - Signal Quality Regression Audit/);
    assert.match(roadmap, activeRoadmapP0);
});

test("roadmap keeps completed home visit speed out of next work", () => {
    assert.doesNotMatch(roadmap, /### P0 - Home Visit Speed Audit/);
    assert.match(roadmap, activeRoadmapP0);
});

test("roadmap keeps completed status recovery clarity out of next work", () => {
    assert.doesNotMatch(roadmap, /### P0 - Status Recovery Clarity Audit/);
    assert.match(roadmap, activeRoadmapP0);
});

test("roadmap keeps completed interaction state visual audit out of next work", () => {
    assert.doesNotMatch(roadmap, /### P0 - Interaction State Visual Audit/);
    assert.match(roadmap, activeRoadmapP0);
});

test("roadmap keeps completed static snapshot drift audit out of next work", () => {
    assert.doesNotMatch(roadmap, /### P0 - Static Snapshot Drift Audit/);
    assert.match(roadmap, activeRoadmapP0);
});

test("roadmap keeps completed notes return path audit out of next work", () => {
    assert.doesNotMatch(roadmap, /### P0 - Notes Return Path Audit/);
    assert.match(roadmap, activeRoadmapP0);
});

test("roadmap keeps completed end-to-end workflow consolidation out of next work", () => {
    assert.doesNotMatch(roadmap, /### P0 - End-to-End Workflow Consolidation/);
    assert.match(roadmap, activeRoadmapP0);
});

test("roadmap keeps completed refresh recovery drill out of next work", () => {
    assert.doesNotMatch(roadmap, /### P0 - Refresh Recovery Drill/);
    assert.match(roadmap, activeRoadmapP0);
});

test("roadmap keeps completed live source refresh probe out of next work", () => {
    assert.doesNotMatch(roadmap, /### P0 - Live Source Refresh Probe/);
    assert.match(roadmap, activeRoadmapP0);
});

test("roadmap keeps completed refresh cadence governance out of next work", () => {
    assert.doesNotMatch(roadmap, /### P0 - Refresh Cadence Governance Audit/);
    assert.match(roadmap, activeRoadmapP0);
});

test("roadmap keeps completed signal surface prune pass out of next work", () => {
    assert.doesNotMatch(roadmap, /### P0 - Signal Surface Prune Pass/);
    assert.match(roadmap, activeRoadmapP0);
});

test("roadmap keeps completed source governance prune out of next work", () => {
    assert.doesNotMatch(roadmap, /### P0 - Source Governance Prune Pass/);
    assert.match(roadmap, activeRoadmapP0);
});

test("roadmap keeps completed live refresh confirmation out of next work", () => {
    assert.doesNotMatch(roadmap, /### P0 - Live Refresh Confirmation Pass/);
    assert.match(roadmap, activeRoadmapP0);
});

test("roadmap keeps completed authenticated GitHub refresh out of next work", () => {
    assert.doesNotMatch(roadmap, /### P0 - Authenticated GitHub Refresh Pass/);
    assert.match(roadmap, activeRoadmapP0);
});

test("roadmap keeps completed npm rate limit follow-up out of next work", () => {
    assert.doesNotMatch(roadmap, /### P0 - npm Rate Limit Partial Follow-up/);
    assert.match(roadmap, /Source detail pages: Trends, Packages, Repos, and Links keep checked-in top rows/s);
    assert.match(roadmap, /npm `n8n-workflow` 429 is accepted as visible partial source health/s);
    assert.match(roadmap, /explicit `rateLimited` metadata/s);
});

test("roadmap keeps completed verification entry points out of next work", () => {
    assert.doesNotMatch(roadmap, /### P0 - Verification Entry Point Baseline/);
    assert.match(roadmap, /package entry point and PR CI are established/s);
    assert.match(roadmap, /No package dependencies, package manager lockfile, framework tooling, backend, account, sync, or build output exists/s);
    assert.match(readme, /npm run check/);
    assert.match(contributing, /npm run check/);
});

test("roadmap keeps completed renderer safety audit out of next work", () => {
    assert.doesNotMatch(roadmap, /### P0 - Renderer Safety Audit/);
    assert.match(roadmap, /shared `safe-dom\.js` owns text escaping, href blocking, and external item link attributes/s);
    assert.match(threatModel, /External item links rendered from data use `rel="noopener noreferrer"`/s);
});

test("roadmap keeps completed contract and release discipline out of next work", () => {
    assert.doesNotMatch(roadmap, /### P0 - Data Contract Enforcement/);
    assert.doesNotMatch(roadmap, /### P1 - Release Discipline Pass/);
    assert.match(roadmap, /Data contract gate: `node scripts\/validate-data\.mjs` owns manifest, refresh-report, signal-policy, and normalized item contract checks/s);
    assert.match(roadmap, /Release policy: dated changelog entries and normal GitHub Pages publishes; no Git tag is required yet/s);
});

test("roadmap keeps completed generated data publish drill out of next work", () => {
    assert.doesNotMatch(roadmap, /### P0 - Generated Data Publish Drill/);
    assert.match(roadmap, /Publish drill: current checked-in data is publishable from local checks while npm `n8n-workflow` 429 remains visible `partial` source health/s);
});

test("roadmap keeps completed module type warning cleanup out of next work", () => {
    assert.doesNotMatch(roadmap, /### P0 - Module Type Warning Cleanup/);
    assert.match(roadmap, /Module syntax: Home, Today, and Status ESM browser modules use `.mjs` while global helper scripts stay `.js`/s);
});

test("roadmap keeps completed npm partial recovery confirmation out of next work", () => {
    assert.doesNotMatch(roadmap, /### P0 - npm Partial Recovery Confirmation/);
    assert.match(roadmap, /npm partial confirmation: npm `n8n-workflow` 429 remains accepted with preserved package rows and visible `rateLimited` metadata/s);
});

test("roadmap keeps completed authenticated refresh publish confirmation out of next work", () => {
    assert.doesNotMatch(roadmap, /### P0 - Authenticated Refresh Publish Confirmation/);
    assert.match(roadmap, /Authenticated refresh: GitHub trend source is `ok`; npm `n8n-workflow` 429 is the only accepted non-ok source/s);
});

test("roadmap keeps completed current signal diff triage out of next work", () => {
    assert.doesNotMatch(roadmap, /### P0 - Current Signal Diff Triage/);
    assert.match(roadmap, /Current signal diff: refreshed priority, topic, and module snapshots remain publishable without policy or watchlist changes/s);
});

test("roadmap keeps completed publish readiness diff review out of next work", () => {
    assert.doesNotMatch(roadmap, /### P0 - Publish Readiness Diff Review/);
    assert.match(roadmap, /Publish readiness: generated data, static snapshots, docs, and release notes are ready for user-owned staging and commit/s);
});

test("roadmap keeps completed post-publish smoke pass out of next work", () => {
    assert.doesNotMatch(roadmap, /### P0 - Post-Publish Smoke Pass/);
    assert.match(roadmap, /Post-publish smoke: live decision, review, status, source detail, topic, and data JSON routes matched checked-in source health/s);
});

test("roadmap promotes next refresh health watch as the active P0", () => {
    assert.match(roadmap, activeRoadmapP0);
    assert.match(roadmap, /next scheduled or manual data refresh changes checked-in data after the post-publish smoke pass/s);
    assert.match(roadmap, /Refresh report, manifest, Today, static fallbacks, and source-health copy stay consistent after the next data update/s);
});
