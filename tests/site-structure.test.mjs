import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function read(path) {
    return readFileSync(path, "utf8");
}

const styles = read("css/site.css");
const pages = [
    ["index.html", "Home", ""],
    ["today/index.html", "Today", "../"],
    ["explore/index.html", "Explore", "../"],
    ["review/index.html", "Review", "../"],
    ["status/index.html", "Status", "../"],
    ["trends/index.html", "Trends", "../"],
    ["packages/index.html", "Packages", "../"],
    ["repos/index.html", "Repos", "../"],
    ["links/index.html", "Reference shelf", "../"]
];

const topicPages = [
    ["topics/ai-agents/index.html", "AI agents", "../../", "AI agent signals."],
    ["topics/mcp/index.html", "MCP", "../../", "MCP signals."],
    ["topics/agent-skills/index.html", "Agent skills", "../../", "Agent skills signals."],
    ["topics/ai-evals/index.html", "AI evals", "../../", "AI eval signals."],
    ["topics/ai-engineering/index.html", "AI engineering", "../../", "AI engineering signals."],
    ["topics/workflow-automation/index.html", "Workflow automation", "../../", "Workflow automation signals."],
    ["topics/security/index.html", "Security", "../../", "Security signals."]
];

test("public pages expose shared primary navigation", () => {
    for (const [path, label, prefix] of pages) {
        const html = read(path);

        assert.match(html, /class="site-nav"/);
        assert.match(html, /aria-label="Primary"/);
        for (const href of [
            `${prefix}index.html`,
            `${prefix}today/index.html`,
            `${prefix}explore/index.html`,
            `${prefix}review/index.html`,
            `${prefix}status/index.html`,
            `${prefix}trends/index.html`,
            `${prefix}packages/index.html`,
            `${prefix}repos/index.html`,
            `${prefix}links/index.html`
        ]) {
            assert.match(html, new RegExp(`href="${href.replaceAll("/", "\\/")}"`));
        }
        assert.match(html, new RegExp(`aria-current="page">${label}</a>`));
    }
});

test("public page headers use stable single-line titles without a brand button", () => {
    for (const [path] of pages) {
        const html = read(path);

        assert.doesNotMatch(html, /class="brand"/);
    }
    assert.doesNotMatch(styles, /\.brand\s*{/);
    assert.match(styles, /\.topbar\s*{[^}]*grid-template-columns: minmax\(0, 1fr\) auto/s);
    assert.match(styles, /\.topbar h1\s*{[^}]*white-space: nowrap/s);
    assert.match(styles, /\.topbar h1\s*{[^}]*text-overflow: ellipsis/s);
});

test("primary navigation remains reachable while scrolling", () => {
    assert.match(styles, /\.topbar\s*{[^}]*position: sticky/s);
    assert.match(styles, /\.topbar\s*{[^}]*top: 0/s);
    assert.match(styles, /\.topbar\s*{[^}]*z-index:/s);
    assert.match(styles, /\.site-nav\s*{[^}]*overflow-x: auto/s);
});

test("keyboard focus styles cover interactive disclosure controls", () => {
    assert.match(styles, /a:focus-visible,[\s\S]*summary:focus-visible,[\s\S]*button:focus-visible\s*{[^}]*outline: 3px solid var\(--accent\)/s);
});

test("legacy sidebar filters avoid overlapping the sticky navigation", () => {
    assert.match(styles, /\.sidebar \.panel\s*{[^}]*top: 148px/s);
    assert.match(styles, /\.sidebar \.panel\s*{[^}]*max-height: calc\(100vh - 172px\)/s);
    assert.match(styles, /\.sidebar \.panel\s*{[^}]*overflow-y: auto/s);
    assert.match(styles, /@media \(max-width: 1040px\)\s*{[\s\S]*\.panel\s*{[^}]*top: auto/s);
});

test("module pages share the source-detail shell", () => {
    const modulePages = ["trends/index.html", "packages/index.html", "repos/index.html", "links/index.html"];

    for (const path of modulePages) {
        const html = read(path);

        assert.match(html, /class="shell module-shell"/);
        assert.match(html, /class="module-main"/);
        assert.match(html, /class="module-overview-grid"/);
        assert.match(html, /class="[^"]*module-primary-panel/);
        assert.match(html, /data-data-mode/);
        assert.match(html, /data-source-health/);
    }

    const trends = read("trends/index.html");
    const links = read("links/index.html");

    assert.match(trends, /class="module-filter-bar module-filter-bar-wide" aria-label="Dashboard filters"/);
    for (const hook of ["data-source", "data-category", "data-query", "data-sort", "data-clear-filters", "data-filter-summary"]) {
        assert.match(trends, new RegExp(hook));
    }

    assert.match(links, /class="module-filter-bar module-filter-bar-compact" aria-label="Link filters"/);
    for (const hook of ["data-category", "data-query", "data-link-list"]) {
        assert.match(links, new RegExp(hook));
    }

    assert.doesNotMatch(trends, /<aside class="sidebar"/);
    assert.doesNotMatch(links, /<aside class="sidebar"/);
    assert.match(styles, /\.module-shell\s*{[^}]*grid-template-columns: 1fr/s);
    assert.match(styles, /\.module-overview-grid\s*{[^}]*grid-template-columns: minmax\(0, 0\.42fr\) minmax\(0, 0\.58fr\)/s);
    assert.match(styles, /\.module-filter-bar \.panel\s*{[^}]*position: static/s);
    assert.match(styles, /@media \(max-width: 720px\)\s*{[\s\S]*\.module-filter-bar \.panel,[\s\S]*grid-template-columns: 1fr/s);
});

test("desktop layout uses a wider workbench instead of stretched mobile stacks", () => {
    const explore = read("explore/index.html");

    assert.match(explore, /<div class="explore-workbench">/);
    assert.match(styles, /\.shell\s*{[^}]*grid-template-columns: 300px minmax\(0, 1fr\)/s);
    assert.match(styles, /\.shell\s*{[^}]*width: min\(100% - 56px, 1440px\)/s);
    assert.match(styles, /\.explore-command-bar\s*{[^}]*background: color-mix\(in srgb, var\(--panel\) 86%, var\(--bg\)\)/s);
    assert.match(styles, /\.explore-filter-board\s*{[^}]*grid-template-columns: minmax\(220px, 0\.32fr\) minmax\(0, 1fr\)/s);
    assert.match(styles, /\.explore-saved-tools\s*{[^}]*align-content: start/s);
    assert.match(styles, /@media \(max-width: 1040px\)\s*{[\s\S]*\.explore-workbench,[\s\S]*\.advanced-filter-grid\s*{[^}]*grid-template-columns: 1fr/s);
});

test("mobile layout allows long titles and card text to wrap", () => {
    assert.match(styles, /@media \(max-width: 720px\)\s*{[\s\S]*\.topbar h1\s*{[^}]*white-space: normal/s);
    assert.match(styles, /\.signal-card strong,[\s\S]*\.trend-card h3[\s\S]*{[^}]*overflow-wrap: anywhere/s);
    assert.match(styles, /\.start-item strong,[\s\S]*\.module-route strong[\s\S]*{[^}]*overflow-wrap: anywhere/s);
    assert.match(styles, /@media \(max-width: 720px\)\s*{[\s\S]*\.home-command-board[\s\S]*grid-template-columns: 1fr/s);
    assert.match(styles, /\.signal-card div\s*{[^}]*min-width: 0/s);
    assert.match(styles, /\.source-health-card div\s*{[^}]*min-width: 0/s);
    assert.match(styles, /\.score-reasons\s*{[^}]*overflow-wrap: anywhere/s);
});

test("public pages avoid indefinite loading placeholders in checked-in HTML", () => {
    for (const [path] of pages) {
        const html = read(path);

        assert.doesNotMatch(html, />\s*loading\s*</i);
        assert.doesNotMatch(html, />\s*Loading data\s*</);
        assert.doesNotMatch(html, /Loading data status/);
    }
});

test("root page is a hub and trends page owns the dashboard", () => {
    const root = read("index.html");
    const trends = read("trends/index.html");

    assert.match(root, /href="today\/index\.html"/);
    assert.match(root, /href="review\/index\.html"/);
    assert.match(root, /href="status\/index\.html"/);
    assert.match(root, /href="trends\/index\.html"/);
    assert.match(root, /href="packages\/index\.html"/);
    assert.match(root, /href="repos\/index\.html"/);
    assert.match(root, /href="links\/index\.html"/);
    assert.match(root, /href="notes\/index\.html"/);
    assert.doesNotMatch(root, /ROADMAP\.md/);
    assert.doesNotMatch(root, /data-grid/);
    assert.doesNotMatch(root, /dashboard\.js/);

    assert.match(trends, /data-grid/);
    assert.match(trends, /data-filter-summary/);
    assert.match(trends, /data-clear-filters/);
    assert.match(trends, /href="..\/index\.html"/);
    assert.match(trends, /..\/js\/dashboard\.js/);
    assert.match(trends, /..\/data\/trends\.json/);
});

test("today page owns the generated priority brief", () => {
    const today = read("today/index.html");

    for (const hook of [
        "data-today-updated",
        "data-today-status",
        "data-today-stats",
        "data-today-sections",
        "data-today-explore"
    ]) {
        assert.match(today, new RegExp(hook));
    }
    for (const oldHook of [
        "data-today-query",
        "data-today-module",
        "data-today-list"
    ]) {
        assert.doesNotMatch(today, new RegExp(oldHook));
    }
    assert.match(today, /..\/js\/today\.mjs/);
    assert.match(today, /..\/data\/today\.json/);
    assert.match(today, /type="module" src="..\/js\/today\.mjs" data-source="..\/data\/today\.json"/);
    assert.match(today, /href="..\/index\.html"/);
    assert.match(today, /Today's priority brief\./);
    assert.match(today, /Thirteen generated picks from tracked signals\./);
    assert.match(today, /Open first/);
    assert.match(today, /Explore AI agents/);
    assert.match(styles, /\.today-stats/);
    assert.match(styles, /\.today-card-context/);
});

test("explore page owns the cross-module search surface", () => {
    const explore = read("explore/index.html");
    const sitemap = read("sitemap.xml");

    for (const hook of [
        "data-explore-results",
        "data-explore-saved",
        "data-explore-module",
        "data-explore-category",
        "data-explore-query",
        "data-explore-sort",
        "data-focus-filter",
        "data-explore-total",
        "data-explore-saved-count",
        "data-explore-categories",
        "data-explore-summary",
        "data-topic-lenses",
        "data-data-mode",
        "data-source-health",
        "data-clear-filters",
        "data-save-explore-default",
        "data-reset-explore-default",
        "data-explore-default-status",
        "data-save-search",
        "data-saved-searches",
        "data-saved-search-status"
    ]) {
        assert.match(explore, new RegExp(hook));
    }

    assert.match(explore, /Explore tracked signals\./);
    assert.match(explore, /Signal focus/);
    assert.match(explore, /Find signals/);
    assert.match(explore, /Primary filters/);
    assert.match(explore, /Topic lenses/);
    assert.match(explore, /Review later/);
    assert.match(explore, /class="explore-command-bar"/);
    assert.match(explore, /<details class="explore-filter-shell" data-explore-filter-shell open>/);
    assert.match(explore, /<summary class="explore-filter-toggle">/);
    assert.match(explore, /class="explore-workbench"/);
    assert.match(explore, /class="explore-filter-board explore-control-rail"/);
    assert.match(explore, /class="explore-saved-tools"/);
    assert.match(explore, /class="explore-controls"/);
    assert.doesNotMatch(explore, /class="sidebar"/);
    assert.doesNotMatch(explore, /Refine explore/);
    assert.match(explore, /href="..\/review\/index\.html"/);
    assert.match(explore, /..\/js\/data-health\.js/);
    assert.match(explore, /..\/js\/signal-schema\.js/);
    assert.match(explore, /..\/js\/safe-dom\.js/);
    assert.match(explore, /..\/js\/topic-taxonomy\.js/);
    assert.match(explore, /..\/js\/explore\.js/);
    assert.match(explore, /<script defer src="..\/js\/local-state\.js"><\/script>\s*<script defer src="..\/js\/safe-dom\.js"><\/script>\s*<script defer src="..\/js\/data-health\.js"><\/script>\s*<script defer src="..\/js\/signal-schema\.js"><\/script>\s*<script defer src="..\/js\/topic-taxonomy\.js"><\/script>\s*<script defer src="..\/js\/explore\.js"/s);
    assert.match(explore, /..\/data\/trends\.json/);
    assert.match(explore, /..\/data\/packages\.json/);
    assert.match(explore, /..\/data\/repos\.json/);
    assert.match(explore, /..\/data\/links\.json/);
    assert.match(sitemap, /https:\/\/anothel\.github\.io\/explore\//);
    assert.match(styles, /\.explore-results/);
    assert.match(styles, /\.topic-lens-grid/);
    assert.match(styles, /\.preference-actions/);
    assert.match(styles, /\.preference-status/);
    assert.match(styles, /\.saved-searches/);
    assert.match(styles, /\.saved-search-item/);
    assert.match(styles, /\.saved-panel/);
    assert.match(styles, /\.explore-shell\s*{[^}]*grid-template-columns: 1fr/s);
    assert.match(styles, /\.explore-command-bar/);
    assert.match(styles, /\.explore-results\s*{[^}]*grid-template-columns: repeat\(auto-fit, minmax\(280px, 1fr\)\)/s);
    assert.match(styles, /\.explore-card\s*{[^}]*min-height: 220px/s);
    assert.match(styles, /\.explore-filter-shell\s*{[^}]*display: grid/s);
    assert.match(styles, /\.explore-filter-toggle\s*{[^}]*display: none/s);
    assert.match(styles, /\.explore-filter-toggle::after\s*{[^}]*content: "Open"/s);
    assert.match(styles, /\.explore-filter-shell\[open\] \.explore-filter-toggle::after\s*{[^}]*content: "Close"/s);
    assert.match(styles, /\.explore-workbench\s*{[^}]*grid-template-columns: minmax\(0, 1fr\) minmax\(280px, 0\.35fr\)/s);
    assert.match(styles, /\.explore-filter-board\s*{[^}]*display: grid/s);
    assert.match(styles, /\.explore-control-rail\s*{[^}]*display: grid/s);
    assert.match(styles, /\.explore-saved-tools\s*{[^}]*display: grid/s);
    assert.match(styles, /\.explore-controls\s*{[^}]*display: grid/s);
    assert.match(styles, /\.advanced-filter-grid\s*{[^}]*grid-template-columns:/s);
    assert.match(styles, /\.saved-searches \[data-saved-searches\]\s*{[^}]*display: flex/s);
    assert.match(styles, /@media \(max-width: 1040px\)\s*{[\s\S]*\.explore-workbench[\s\S]*grid-template-columns: 1fr/s);
    assert.match(styles, /@media \(max-width: 720px\)\s*{[\s\S]*\.explore-filter-toggle\s*{[^}]*display: flex/s);
    assert.match(styles, /@media \(max-width: 720px\)\s*{[\s\S]*\.explore-filter-shell:not\(\[open\]\) \.explore-workbench\s*{[^}]*display: none/s);
    assert.match(read("js/explore.js"), /collapseMobileFilterShell/);
    assert.match(styles, /@media \(max-width: 720px\)\s*{[\s\S]*\.explore-results[\s\S]*grid-template-columns: 1fr/s);
});

test("review page owns the saved follow-up surface", () => {
    const review = read("review/index.html");
    const sitemap = read("sitemap.xml");

    for (const hook of [
        "data-review-total",
        "data-review-unread",
        "data-review-read",
        "data-review-done",
        "data-review-focus-count",
        "data-review-source-count",
        "data-review-filter",
        "data-review-export",
        "data-review-export-markdown",
        "data-review-import",
        "data-review-import-file",
        "data-review-portability-status",
        "data-review-queue",
        "data-review-detail"
    ]) {
        assert.match(review, new RegExp(hook));
    }

    assert.match(review, /Review later\./);
    assert.match(review, /Saved locally in this browser\./);
    assert.match(review, /All/);
    assert.match(review, /Unread/);
    assert.match(review, /Read/);
    assert.match(review, /Done/);
    assert.match(review, /Queue/);
    assert.match(review, /Selected item/);
    assert.match(review, /Unread first/);
    assert.match(review, /Next action changes with status/);
    assert.match(review, /..\/js\/signal-schema\.js/);
    assert.match(review, /..\/js\/safe-dom\.js/);
    assert.match(review, /..\/js\/topic-taxonomy\.js/);
    assert.match(review, /..\/js\/explore\.js/);
    assert.match(review, /<script defer src="..\/js\/signal-schema\.js"><\/script>\s*<script defer src="..\/js\/safe-dom\.js"><\/script>\s*<script defer src="..\/js\/topic-taxonomy\.js"><\/script>\s*<script defer src="..\/js\/explore\.js"><\/script>\s*<script defer src="..\/js\/review\.js"/s);
    assert.match(review, /..\/js\/review\.js/);
    assert.match(review, /..\/data\/trends\.json/);
    assert.match(review, /..\/data\/packages\.json/);
    assert.match(review, /..\/data\/repos\.json/);
    assert.match(review, /..\/data\/links\.json/);
    assert.match(review, /href="..\/explore\/index\.html"/);
    assert.match(sitemap, /https:\/\/anothel\.github\.io\/review\//);
    assert.match(styles, /\.review-workspace/);
    assert.match(styles, /\.review-filters/);
    assert.match(styles, /\.review-detail/);
    assert.match(styles, /@media \(max-width: 720px\)\s*{[\s\S]*\.review-workspace[\s\S]*grid-template-columns: 1fr/s);
});

test("topic focus pages expose focused landing pages", () => {
    const sitemap = read("sitemap.xml");

    for (const [path, label, prefix, title] of topicPages) {
        const html = read(path);

        assert.match(html, /class="site-nav"/);
        assert.match(html, /aria-label="Primary"/);
        for (const href of [
            `${prefix}index.html`,
            `${prefix}today/index.html`,
            `${prefix}explore/index.html`,
            `${prefix}review/index.html`,
            `${prefix}status/index.html`,
            `${prefix}trends/index.html`,
            `${prefix}packages/index.html`,
            `${prefix}repos/index.html`,
            `${prefix}links/index.html`
        ]) {
            assert.match(html, new RegExp(`href="${href.replaceAll("/", "\\/")}"`));
        }

        assert.match(html, new RegExp(title.replaceAll(".", "\\.")));
        assert.match(html, new RegExp(`data-topic="${label}"`));
        assert.match(html, /data-topic-total/);
        assert.match(html, /data-topic-modules/);
        assert.match(html, /data-topic-updated/);
        assert.match(html, /data-topic-lead/);
        assert.match(html, /data-topic-note/);
        assert.match(html, /data-topic-guidance/);
        assert.match(html, /data-topic-why/);
        assert.match(html, /data-topic-top-movers/);
        assert.match(html, /data-topic-related/);
        assert.match(html, /data-topic-cross-links/);
        assert.match(html, /data-topic-source-mix/);
        assert.match(html, /data-topic-pin/);
        assert.match(html, /data-topic-actions-dynamic/);
        assert.match(html, /data-topic-list/);
        assert.match(html, /..\/..\/js\/safe-dom\.js/);
        assert.match(html, /..\/..\/js\/topics\.js/);
        assert.match(html, /..\/..\/js\/topic-taxonomy\.js/);
        assert.match(html, /<script defer src="..\/..\/js\/local-state\.js"><\/script>\s*<script defer src="..\/..\/js\/safe-dom\.js"><\/script>\s*<script defer src="..\/..\/js\/topic-taxonomy\.js"><\/script>\s*<script defer src="..\/..\/js\/topics\.js"/s);
        assert.match(html, /..\/..\/data\/trends\.json/);
        assert.match(html, /..\/..\/data\/packages\.json/);
        assert.match(html, /..\/..\/data\/repos\.json/);
        assert.match(html, /..\/..\/data\/links\.json/);
        assert.match(html, /..\/..\/data\/today\.json/);
        assert.match(html, /Open focused Explore/);
        assert.match(sitemap, new RegExp(`https:\\/\\/anothel\\.github\\.io\\/${path.replace("/index.html", "\\/")}`));
    }

    assert.match(styles, /\.topic-actions/);
    assert.match(styles, /\.pin-topic-button/);
    assert.match(styles, /\.topic-guidance-grid/);
    assert.match(styles, /\.topic-guidance-card/);
    assert.match(styles, /\.topic-note-card/);
    assert.match(styles, /\.topic-support-list/);
    assert.match(styles, /\.topic-note-card\s*{[\s\S]*background: color-mix\(in srgb, var\(--panel\) 72%, var\(--bg\)\)/);
    assert.match(styles, /\.topic-dashboard-grid/);
    assert.match(styles, /\.topic-related-grid/);
    assert.match(styles, /\.topic-cross-link-grid/);
    assert.match(styles, /\.topic-grid/);
    assert.match(styles, /@media \(max-width: 720px\)\s*{[\s\S]*\.topic-dashboard-grid[\s\S]*grid-template-columns: 1fr/s);
    assert.match(styles, /@media \(max-width: 720px\)\s*{[\s\S]*\.topic-guidance-grid[\s\S]*grid-template-columns: 1fr/s);
    assert.match(styles, /@media \(max-width: 720px\)\s*{[\s\S]*\.topic-grid[\s\S]*grid-template-columns: 1fr/s);
});

test("notes page indexes durable topic notes", () => {
    const notes = read("notes/index.html");
    const sitemap = read("sitemap.xml");

    assert.match(notes, /Topic notes\./);
    assert.match(notes, /Judgment notes from focused topic pages\./);
    assert.match(notes, /data-notes-count/);
    assert.match(notes, /data-notes-list/);
    assert.match(notes, /..\/js\/safe-dom\.js/);
    assert.match(notes, /..\/js\/topic-taxonomy\.js/);
    assert.match(notes, /..\/js\/notes\.js/);
    assert.match(notes, /<script defer src="..\/js\/safe-dom\.js"><\/script>\s*<script defer src="..\/js\/topic-taxonomy\.js"><\/script>\s*<script defer src="..\/js\/notes\.js"><\/script>/s);
    for (const topic of ["AI agents", "MCP", "Agent skills", "AI evals", "AI engineering", "Workflow automation", "Security"]) {
        assert.match(notes, new RegExp(topic.replaceAll(" ", "\\s+")));
    }
    assert.match(notes, /href="..\/topics\/ai-evals\/index\.html"/);
    assert.match(notes, /href="..\/topics\/ai-engineering\/index\.html"/);
    assert.match(notes, /href="..\/topics\/workflow-automation\/index\.html"/);
    assert.match(notes, /href="..\/topics\/security\/index\.html"/);
    assert.match(notes, /href="..\/index\.html"/);
    assert.match(sitemap, /https:\/\/anothel\.github\.io\/notes\//);
});

test("public scope excludes profile and worklog routes", () => {
    const sitemap = read("sitemap.xml");
    const publicHtml = [
        "index.html",
        "today/index.html",
        "explore/index.html",
        "review/index.html",
        "status/index.html",
        "trends/index.html",
        "packages/index.html",
        "repos/index.html",
        "links/index.html",
        "notes/index.html",
        ...topicPages.map(([path]) => path)
    ].map(read).join("\n");

    for (const route of ["about", "projects", "worklog", "resume", "company-history"]) {
        assert.doesNotMatch(sitemap, new RegExp(`https:\\/\\/anothel\\.github\\.io\\/${route}\\/`), route);
        assert.doesNotMatch(publicHtml, new RegExp(`href="(?:\\.\\.\\/|\\.\\.\\/\\.\\.\\/)?${route}\\/index\\.html"`), route);
    }

    assert.match(read("notes/index.html"), /Judgment notes from focused topic pages\./);
});

test("home and today pages link into topic focus pages", () => {
    const home = read("index.html");
    const today = read("today/index.html");

    for (const href of [
        "topics/ai-agents/index.html",
        "topics/mcp/index.html",
        "topics/agent-skills/index.html"
    ]) {
        assert.match(home, new RegExp(`href="${href.replaceAll("/", "\\/")}"`));
        assert.match(today, new RegExp(`href="\\.\\.\\/${href.replaceAll("/", "\\/")}"`));
    }
});

test("root page avoids duplicate module entry cards below primary navigation", () => {
    const root = read("index.html");

    assert.match(root, /type="module" src="js\/home\.mjs" data-manifest="data\/manifest\.json" data-today="data\/today\.json"/);
    assert.doesNotMatch(root, /Entry points/);
    assert.doesNotMatch(root, /class="hub-intro"/);
    assert.doesNotMatch(root, /class="module-grid"/);
    assert.doesNotMatch(root, /class="module-card"/);
    assert.doesNotMatch(root, /data-module-/);
    assert.doesNotMatch(styles, /\.module-grid/);
    assert.doesNotMatch(styles, /\.module-card/);
    assert.doesNotMatch(styles, /\.module-meta/);
});

test("root page exposes command center slots", () => {
    const root = read("index.html");

    for (const hook of [
        "data-home-total",
        "data-home-live",
        "data-home-updated",
        "data-home-freshness",
        "data-home-recovery",
        "data-home-review-saved",
        "data-home-review-unread",
        "data-home-topic-movements",
        "data-home-start",
        "data-home-skim",
        "data-home-routes"
    ]) {
        assert.match(root, new RegExp(hook));
    }

    assert.match(root, /What is worth opening now\?/);
    assert.match(root, /class="home-command-board"/);
    assert.match(root, /class="home-priority-panel"/);
    assert.match(root, /class="home-utility-strip"/);
    assert.match(root, /Open first/);
    assert.match(root, /Trust state/);
    assert.match(root, /Topic lenses/);
    assert.match(root, /Browse modules/);
    assert.match(root, /Worth skimming/);
    assert.match(root, /Local state/);
    assert.match(root, /Open priority brief/);
    assert.match(root, /Explore workspace/);
    assert.match(root, /Search all tracked signals/);
    assert.match(root, /href="explore\/index\.html"/);
    assert.match(root, /href="review\/index\.html"/);
    assert.match(root, /Saved queue/);
    assert.match(root, /Unread/);
    assert.match(root, /href="status\/index\.html"/);
    assert.doesNotMatch(root, /Dataset health/);
    assert.doesNotMatch(root, /Data state/);
    assert.doesNotMatch(root, /data-home-decision-actions/);
    assert.doesNotMatch(root, /class="decision-layer"/);
    assert.doesNotMatch(root, />Decision layer</);
    assert.match(root, /class="topic-movement-grid"/);
    assert.match(root, /class="[^"]*\bstart-list\b/);
    assert.match(root, /class="skim-list"/);
    assert.match(root, /class="[^"]*\bmodule-strip\b/);
    assert.doesNotMatch(root, /aria-label="Topic focus pages"/);
    assert.doesNotMatch(root, />Topic focus</);
    assert.doesNotMatch(root, /class="today-grid"/);
    assert.doesNotMatch(root, /data-home-signals/);
    assert.match(root, /data-trends="data\/trends\.json"/);
    assert.match(root, /data-packages="data\/packages\.json"/);
    assert.match(root, /data-repos="data\/repos\.json"/);
    assert.match(root, /data-links="data\/links\.json"/);
    assert.match(styles, /\.home-command-board\s*{[^}]*grid-template-columns: 1fr/s);
    assert.match(styles, /\.home-utility-strip\s*{[^}]*grid-template-columns: repeat\(6, minmax\(0, 1fr\)\)/s);
    assert.match(styles, /\.utility-card-wide\s*{[^}]*grid-column: span 2/s);
    assert.match(styles, /\.home-priority-list\s*{[^}]*grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/s);
    assert.match(styles, /\.home-module-board\s*{[^}]*grid-template-columns: repeat\(4, minmax\(0, 1fr\)\)/s);
    assert.match(styles, /\.home-priority-panel \.section-heading\s*{[^}]*align-items: start/s);
    assert.match(styles, /\.home-priority-panel \.section-heading > a\s*{[^}]*border: 1px solid var\(--line\)/s);
});

test("module pages expose data health strips", () => {
    for (const path of ["trends/index.html", "packages/index.html", "repos/index.html", "links/index.html"]) {
        const html = read(path);

        assert.match(html, /data-data-mode/);
        assert.match(html, /data-source-health/);
        assert.match(html, /js\/data-health\.js/);
    }
    assert.match(styles, /\.source-health-card\.status-partial/);
    assert.match(styles, /\.source-health-card\.status-fallback/);
});

test("home command center cards brighten on hover", () => {
    assert.match(styles, /\.start-item:hover/);
    assert.match(styles, /\.module-route:hover/);
    assert.match(styles, /\.explore-card:hover/);
    assert.match(styles, /\.link-card:hover/);
    assert.match(styles, /\.start-item:hover\s*{[^}]*background: var\(--panel-strong\)/s);
    assert.match(styles, /\.module-route:hover\s*{[^}]*background: var\(--panel-strong\)/s);
    assert.match(styles, /\.explore-card:hover:not\(:has\(\.explore-card-actions button:is\(:hover, :focus-visible\)\)\),[\s\S]*\.link-card:focus-visible\s*{[^}]*background: var\(--panel-strong\)/s);
    assert.match(styles, /\.explore-card-actions button\s*{[^}]*background: var\(--accent-soft\)/s);
    assert.match(styles, /\.explore-card-actions button:hover,[\s\S]*\.explore-card-actions button:focus-visible\s*{[^}]*background: var\(--panel-strong\)/s);
    assert.doesNotMatch(styles, /\.decision-card/);
    assert.match(styles, /\.topic-movement-grid\s*{[^}]*grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/s);
});

test("interactive card states keep nested actions and selection distinct", () => {
    assert.match(styles, /\.topic-movement-card:hover:not\(:has\(\.topic-movement-actions a:is\(:hover, :focus-visible\)\)\)\s*{/);
    assert.match(styles, /\.topic-movement-actions a:hover,[\s\S]*\.topic-movement-actions a:focus-visible\s*{[^}]*background: var\(--accent-soft\)/s);
    assert.match(styles, /\.review-queue-item:hover:not\(\[aria-selected="true"\]\)\s*{[^}]*background: var\(--panel-strong\)/s);
    assert.match(styles, /\.review-queue-item\[aria-selected="true"\]\s*{[^}]*box-shadow: inset 4px 0 0 var\(--accent\)/s);
    assert.match(styles, /\.saved-item button:hover,[\s\S]*\.saved-item button:focus-visible\s*{[^}]*background: var\(--panel-strong\)/s);
});

test("packages page owns the package watchlist module", () => {
    const packages = read("packages/index.html");

    assert.match(packages, /data-package-list/);
    assert.match(packages, /..\/js\/package-watchlist\.js/);
});

test("public page copy states concrete page purpose", () => {
    assert.match(read("today/index.html"), /Today's priority brief\./);
    assert.match(read("today/index.html"), /Thirteen generated picks from tracked signals\./);
    assert.match(read("today/index.html"), /Continue in Explore/);
    assert.match(read("index.html"), /Search all tracked signals/);
    assert.match(read("review/index.html"), /Review later\./);
    assert.match(read("review/index.html"), /Saved locally in this browser\./);
    assert.match(read("status/index.html"), /Source status\./);
    assert.match(read("status/index.html"), /Refresh health across tracked data sources\./);
    assert.match(read("trends/index.html"), /What is moving across HN, GitHub, and npm\./);
    assert.match(read("trends/index.html"), /Ranked movement with origin, category, and momentum\./);
    assert.match(read("packages/index.html"), /npm packages worth watching\./);
    assert.match(read("packages/index.html"), /Weekly download movement for tools that may be useful later\./);
    assert.match(read("repos/index.html"), /GitHub projects with useful traction\./);
    assert.match(read("repos/index.html"), /Stars, recent activity, and why each project is on the list\./);
    assert.match(read("links/index.html"), /References worth keeping close\./);
    assert.match(read("links/index.html"), /Curated reference shelf for docs, APIs, and durable tools\./);
});

test("status page owns the source health overview", () => {
    const status = read("status/index.html");
    const sitemap = read("sitemap.xml");

    for (const hook of [
        "data-status-total",
        "data-status-sources",
        "data-status-health",
        "data-status-updated",
        "data-status-rows",
        "data-source-health",
        "data-refresh-run",
        "data-data-mode"
    ]) {
        assert.match(status, new RegExp(hook));
    }

    assert.match(status, /..\/js\/status\.mjs/);
    assert.doesNotMatch(status, /<script defer src="..\/js\/safe-dom\.js"><\/script>/);
    assert.doesNotMatch(status, /<script defer src="..\/js\/data-health\.js"><\/script>/);
    assert.match(status, /..\/data\/manifest\.json/);
    assert.match(status, /data-report="..\/data\/refresh-report\.json"/);
    assert.match(status, /Last refresh run/);
    assert.match(sitemap, /https:\/\/anothel\.github\.io\/status\//);
    assert.match(styles, /\.status-table/);
});

test("public page copy avoids implementation-first labels", () => {
    for (const [path] of pages) {
        const html = read(path);

        assert.doesNotMatch(html, /Live module/);
        assert.doesNotMatch(html, /Static JSON status/);
        assert.doesNotMatch(html, /Small dashboards for things worth watching/);
        assert.doesNotMatch(html, /Top items from the dashboards/);
        assert.doesNotMatch(html, />[^<]*watchlist\.[^<]*</i);
    }
});

test("source wording distinguishes origin filters from data status", () => {
    const trends = read("trends/index.html");
    const status = read("status/index.html");
    const dashboardScript = read("js/dashboard.js");

    assert.match(trends, /<script defer src="..\/js\/safe-dom\.js"><\/script>\s*<script defer src="..\/js\/data-health\.js"><\/script>\s*<script defer src="..\/js\/dashboard\.js"/s);
    assert.match(status, /<script type="module" src="..\/js\/status\.mjs"/);
    assert.match(trends, /Origin\s*<select data-source>/);
    assert.match(trends, /All origins/);
    assert.match(dashboardScript, /document\.querySelector\("select\[data-source\]"\)/);
    assert.match(trends, /<span>Origin<\/span>/);
    assert.doesNotMatch(trends, /<span>Source<\/span>/);
    for (const path of ["packages/index.html", "repos/index.html", "links/index.html"]) {
        const html = read(path);

        assert.match(html, /<span>Data status<\/span>/);
        assert.doesNotMatch(html, /<span>Source<\/span>/);
    }
});

test("freshness vocabulary uses data date, generated at, and source health", () => {
    assert.match(read("index.html"), /<span>Data date<\/span>/);
    assert.doesNotMatch(read("index.html"), /Freshness/);
    assert.match(read("today/index.html"), /Generated at <span data-today-updated>/);
    assert.match(read("status/index.html"), /<span>Data date<\/span>/);
    assert.match(read("status/index.html"), /Source health/);

    for (const path of ["trends/index.html", "packages/index.html", "repos/index.html", "links/index.html"]) {
        assert.match(read(path), /Data date <span data-updated>/, path);
        assert.match(read(path), /Source health/, path);
    }

    for (const [path] of topicPages) {
        assert.match(read(path), /<span>Data date<\/span>/, path);
        assert.doesNotMatch(read(path), /Last refresh/, path);
    }
});

test("links page owns the reference shelf module", () => {
    const links = read("links/index.html");

    assert.match(links, /data-link-list/);
    assert.match(links, /..\/js\/link-queue\.js/);
    assert.match(links, /Reference shelf - anothel/);
});

test("public copy uses reference shelf terminology for curated links", () => {
    for (const [path] of [...pages, ...topicPages]) {
        const html = read(path);

        assert.doesNotMatch(html, /Links queue|saved references/i, path);
        assert.doesNotMatch(html, />Links<\/a>/, path);
        assert.match(html, /href="(?:\.\.\/|\.\.\/\.\.\/)?links\/index\.html"[^>]*>Reference shelf<\/a>/, path);
    }
});

test("repos page owns the repo watchlist module", () => {
    const repos = read("repos/index.html");

    assert.match(repos, /data-repo-list/);
    assert.match(repos, /..\/js\/repo-watchlist\.js/);
});
