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
    assert.match(trends, /href="..\/index\.html"/);
    assert.match(trends, /..\/js\/dashboard\.js/);
    assert.match(trends, /..\/data\/trends\.json/);
});

test("today page owns the full digest module", () => {
    const today = read("today/index.html");

    assert.match(today, /data-today-total/);
    assert.match(today, /data-today-list/);
    assert.match(today, /data-today-query/);
    assert.match(today, /data-today-module/);
    assert.match(today, /..\/js\/today\.js/);
    assert.match(today, /..\/data\/manifest\.json/);
    assert.match(today, /href="..\/index\.html"/);
});

test("root module cards use the same base-card styling", () => {
    const root = read("index.html");
    const moduleCards = root.match(/class="module-card"/g) || [];

    assert.equal(moduleCards.length, 5);
    assert.doesNotMatch(root, /module-card-live/);
});

test("root module cards can load manifest metadata", () => {
    const root = read("index.html");

    assert.match(root, /type="module" src="js\/home\.js" data-source="data\/manifest\.json"/);
    for (const id of ["today", "trends", "packages", "repos", "links"]) {
        assert.match(root, new RegExp(`data-module-id="${id}"`));
    }
    assert.equal((root.match(/data-module-meta/g) || []).length, 5);
});

test("root page exposes data overview and current signal slots", () => {
    const root = read("index.html");

    for (const hook of ["data-home-total", "data-home-live", "data-home-updated", "data-home-signals"]) {
        assert.match(root, new RegExp(hook));
    }
    assert.match(root, /Today/);
    assert.match(root, /Data overview/);
    assert.match(root, /class="today-grid"/);
    assert.match(root, /class="signal-card"/);
    assert.doesNotMatch(root, /class="signal-row"/);
    assert.match(styles, /\.today-grid/);
    assert.match(styles, /\.signal-card/);
});

test("home module cards only brighten on hover", () => {
    assert.match(styles, /\.module-card:hover/);
    assert.match(styles, /\.module-card:hover\s*{[^}]*background: var\(--panel-strong\)/s);
    assert.doesNotMatch(styles, /module-card-live/);
});

test("packages page owns the package watchlist module", () => {
    const packages = read("packages/index.html");

    assert.match(packages, /data-package-list/);
    assert.match(packages, /..\/js\/package-watchlist\.js/);
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
