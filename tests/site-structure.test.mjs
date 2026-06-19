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
    ["trends/index.html", "Trends", "../"],
    ["packages/index.html", "Packages", "../"],
    ["repos/index.html", "Repos", "../"],
    ["links/index.html", "Links", "../"]
];

test("public pages expose shared primary navigation", () => {
    for (const [path, label, prefix] of pages) {
        const html = read(path);

        assert.match(html, /class="site-nav"/);
        assert.match(html, /aria-label="Primary"/);
        for (const href of [
            `${prefix}index.html`,
            `${prefix}today/index.html`,
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

test("mobile layout allows long titles and card text to wrap", () => {
    assert.match(styles, /@media \(max-width: 720px\)\s*{[\s\S]*\.topbar h1\s*{[^}]*white-space: normal/s);
    assert.match(styles, /\.signal-card strong,[\s\S]*\.trend-card h3[\s\S]*{[^}]*overflow-wrap: anywhere/s);
    assert.match(styles, /\.start-item strong,[\s\S]*\.module-route strong[\s\S]*{[^}]*overflow-wrap: anywhere/s);
    assert.match(styles, /@media \(max-width: 720px\)\s*{[\s\S]*\.command-center[\s\S]*grid-template-columns: 1fr/s);
    assert.match(styles, /\.signal-card div\s*{[^}]*min-width: 0/s);
    assert.match(styles, /\.source-health-card div\s*{[^}]*min-width: 0/s);
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
    assert.match(root, /href="trends\/index\.html"/);
    assert.match(root, /href="packages\/index\.html"/);
    assert.match(root, /href="repos\/index\.html"/);
    assert.match(root, /href="links\/index\.html"/);
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
    assert.match(today, /..\/js\/today\.js/);
    assert.match(today, /..\/data\/today\.json/);
    assert.match(today, /type="module" src="..\/js\/today\.js" data-source="..\/data\/today\.json"/);
    assert.match(today, /href="..\/index\.html"/);
    assert.match(today, /Today's priority brief\./);
    assert.match(today, /Thirteen generated picks from tracked signals\./);
});

test("root page avoids duplicate module entry cards below primary navigation", () => {
    const root = read("index.html");

    assert.match(root, /type="module" src="js\/home\.js" data-manifest="data\/manifest\.json" data-today="data\/today\.json"/);
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
        "data-home-start",
        "data-home-skim",
        "data-home-routes"
    ]) {
        assert.match(root, new RegExp(hook));
    }

    assert.match(root, /What is worth opening now\?/);
    assert.match(root, /Start here/);
    assert.match(root, /Worth skimming/);
    assert.match(root, /Data status/);
    assert.match(root, /Open priority brief/);
    assert.match(root, /class="command-center"/);
    assert.match(root, /class="start-list"/);
    assert.match(root, /class="skim-list"/);
    assert.match(root, /class="module-strip"/);
    assert.doesNotMatch(root, /class="today-grid"/);
    assert.doesNotMatch(root, /data-home-signals/);
});

test("home command center cards brighten on hover", () => {
    assert.match(styles, /\.start-item:hover/);
    assert.match(styles, /\.module-route:hover/);
    assert.match(styles, /\.start-item:hover\s*{[^}]*background: var\(--panel-strong\)/s);
    assert.match(styles, /\.module-route:hover\s*{[^}]*background: var\(--panel-strong\)/s);
});

test("packages page owns the package watchlist module", () => {
    const packages = read("packages/index.html");

    assert.match(packages, /data-package-list/);
    assert.match(packages, /..\/js\/package-watchlist\.js/);
});

test("public page copy states concrete page purpose", () => {
    assert.match(read("today/index.html"), /Today's priority brief\./);
    assert.match(read("today/index.html"), /Thirteen generated picks from tracked signals\./);
    assert.match(read("trends/index.html"), /What is moving across HN, GitHub, and npm\./);
    assert.match(read("trends/index.html"), /Ranked movement with origin, category, and momentum\./);
    assert.match(read("packages/index.html"), /npm packages worth watching\./);
    assert.match(read("packages/index.html"), /Weekly download movement for tools that may be useful later\./);
    assert.match(read("repos/index.html"), /GitHub projects with useful traction\./);
    assert.match(read("repos/index.html"), /Stars, recent activity, and why each project is on the list\./);
    assert.match(read("links/index.html"), /References worth keeping close\./);
    assert.match(read("links/index.html"), /Docs, APIs, and tools that support future work\./);
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
    const dashboardScript = read("js/dashboard.js");

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

test("links page owns the links queue module", () => {
    const links = read("links/index.html");

    assert.match(links, /data-link-list/);
    assert.match(links, /..\/js\/link-queue\.js/);
});

test("repos page owns the repo watchlist module", () => {
    const repos = read("repos/index.html");

    assert.match(repos, /data-repo-list/);
    assert.match(repos, /..\/js\/repo-watchlist\.js/);
});
