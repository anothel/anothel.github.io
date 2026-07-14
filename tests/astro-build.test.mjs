import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { sourceMetaForDatasets, trustState } from "../src/lib/site-data.js";
import { topicNotes } from "../src/lib/topic-taxonomy.js";

const topicRoutes = [
    ["agent-skills", "Agent skills", "Agent skills signals."],
    ["ai-agents", "AI agents", "AI agent signals."],
    ["ai-engineering", "AI engineering", "AI engineering signals."],
    ["ai-evals", "AI evals", "AI eval signals."],
    ["mcp", "MCP", "MCP signals."],
    ["security", "Security", "Security signals."],
    ["workflow-automation", "Workflow automation", "Workflow automation signals."]
];
const retiredNotesGlobal = ["Notes", "App"].join("");

function read(path) {
    return readFileSync(path, "utf8");
}

function ensureDist() {
    if (!existsSync("dist/index.html")) {
        execFileSync(process.execPath, ["node_modules/astro/bin/astro.mjs", "build"], { encoding: "utf8" });
    }
}

test("Astro build output renders Today from checked-in data", () => {
    ensureDist();
    const html = read("dist/today/index.html");
    const today = JSON.parse(read("data/today.json"));

    assert.match(html, /<title>Today - anothel<\/title>/);
    assert.match(html, /href="\.\.\/css\/site\.css"/);
    assert.match(html, /Today&#39;s priority brief\./);
    assert.match(html, new RegExp(`<span data-today-updated>${today.updated}</span>`));
    assert.match(html, /anthropics\/skills/);
    assert.match(html, /Continue in Explore/);
    assert.match(html, /href="\.\.\/review\/index\.html"/);
});

test("Astro Home output uses shared trust data and an honest native-module saved summary", () => {
    ensureDist();
    const html = read("dist/index.html");
    const datasets = Object.fromEntries(["trends", "packages", "repos", "links"]
        .map((name) => [name, JSON.parse(read(`data/${name}.json`))]));
    const trust = trustState(sourceMetaForDatasets(datasets));

    assert.match(html, new RegExp(`data-home-freshness>${trust.freshness}<`));
    assert.match(html, new RegExp(`data-home-live>${trust.pipelineStatus}<`));
    assert.match(html, /data-home-review-saved>\?\?</);
    assert.match(html, /data-home-review-unread>\?\?</);
    assert.match(html, /Browser-local state loads when JavaScript is available\./);
    assert.match(html, /<script type="module" src="\/_astro\/index\.[^"]+\.js"><\/script>/);
    assert.doesNotMatch(html, /js\/local-state\.js|AnothelState/);
    assert.doesNotMatch(html, /<astro-island\b|\bcomponent-url=|\brenderer-url=/);
    assert.doesNotMatch(html, />\s*(?:undefined|null|NaN)\s*</i);
    assert.doesNotMatch(html, /data-home-freshness>Fresh</);
});

test("Astro Today output includes the shared shell and mobile density contract", () => {
    ensureDist();
    const html = read("dist/today/index.html");
    const styles = read("css/site.css");

    assert.match(html, /class="shell hub-shell today-shell"/);
    assert.match(html, /class="hero-header"/);
    assert.match(html, /class="route-nav primary-nav"/);
    assert.match(html, /class="route-nav secondary-nav"/);
    assert.match(html, /class="skip-link" href="#main-content"/);
    assert.match(html, /<main(?=[^>]*id="main-content")(?=[^>]*tabindex="-1")[^>]*>/);
    assert.doesNotMatch(html, /class="topbar"/);
    assert.match(html, /<section class="today-section" id="start" data-section-id="start">/);
    assert.match(html, /class="signal-card today-card today-card-compact"/);
    assert.match(html, /<h3 data-signal-title>/);
    const shellOrder = ["hero-header", "route-nav primary-nav", "route-nav secondary-nav", "id=\"main-content\""]
        .map((marker) => html.indexOf(marker));
    assert.ok(shellOrder.every((offset, index) => offset >= 0 && (index === 0 || offset > shellOrder[index - 1])), "hero, primary, secondary, and main should be siblings in document order");

    assert.match(styles, /html\s*{[^}]*scroll-padding-top:/s);
    assert.match(styles, /\.today-section\s*{[^}]*scroll-margin-top:/s);
    assert.match(styles, /\.today-card\s*{[^}]*scroll-margin-top:/s);
    assert.match(styles, /--type-hero-mobile: 1\.875rem/);
    assert.match(styles, /--type-section-mobile: 1\.25rem/);
    assert.match(styles, /--density-surface-padding: var\(--space-4\)/);
    assert.match(styles, /textarea:focus-visible/);
    assert.match(styles, /@media \(max-width: 720px\)\s*{[\s\S]*\.hero-header h1\s*{[^}]*font-size: var\(--type-hero-mobile\)/s);
    assert.doesNotMatch(styles, /\.today-card-compact \.score-reasons\s*{[^}]*display: none/s);
});

test("Astro build output renders migrated static routes including Notes", () => {
    ensureDist();
    const migratedRoutes = [
        ["dist/index.html", /What is worth opening now\?/],
        ["dist/explore/index.html", /Explore tracked signals\./],
        ["dist/review/index.html", /Review later\./],
        ["dist/status/index.html", /Source status\./],
        ["dist/trends/index.html", /What is moving across HN, GitHub, and npm\./],
        ["dist/packages/index.html", /npm packages worth watching\./],
        ["dist/repos/index.html", /Repos worth watching\./],
        ["dist/links/index.html", /References worth keeping close\./],
        ["dist/today/index.html", /Today&#39;s priority brief\./],
        ["dist/notes/index.html", /Judgment notes from focused topic pages\./]
    ];

    for (const [path, pattern] of migratedRoutes) {
        const html = read(path);
        assert.match(html, pattern, `${path} should render route content`);
        assert.match(html, /<html lang="en">/, `${path} should declare its English document language`);
        assert.match(html, /class="route-nav primary-nav"/, `${path} should use shared primary nav`);
        assert.match(html, /class="route-nav secondary-nav"/, `${path} should use shared secondary nav`);
        assert.match(html, /class="skip-link" href="#main-content"/, `${path} should provide a skip link`);
        assert.match(html, /<main(?=[^>]*id="main-content")(?=[^>]*tabindex="-1")[^>]*>/, `${path} should expose the skip target`);
    }

    assert.ok(existsSync("dist/css/site.css"), "Astro output should include shared CSS");
    assert.ok(existsSync("dist/data/today.json"), "Astro output should preserve data JSON URLs");
    const exploreHtml = read("dist/explore/index.html");
    assert.match(exploreHtml, /data-explore-results/);
    assert.match(exploreHtml, /astro-island/);
    assert.match(exploreHtml, /Browse current signals/);
    const exploreOrder = ["data-explore-results", "data-explore-filter-shell", '<aside class="saved-panel"', "data-topic-lenses", "data-source-health"]
        .map((marker) => exploreHtml.indexOf(marker));
    assert.ok(exploreOrder.every((offset, index) => offset >= 0 && (index === 0 || offset > exploreOrder[index - 1])), "Explore static output should put results before secondary tools");
    assert.doesNotMatch(read("src/lib/explore-static.js"), /node:vm|runInNewContext/);
    const reviewHtml = read("dist/review/index.html");
    assert.match(reviewHtml, /data-review-static-guidance/);
    assert.match(reviewHtml, /Review is browser-local/);
    assert.match(reviewHtml, /astro-island/);
    assert.match(read("dist/index.html"), /href="today\/index\.html"/);
    const statusHtml = read("dist/status/index.html");
    assert.match(statusHtml, /href="\.\.\/trends\/index\.html"/);
    assert.match(statusHtml, /Overall data health/);
    assert.match(statusHtml, /Generated at/);
    assert.match(statusHtml, /Data age/);
    assert.match(statusHtml, /Healthy sources/);
    assert.match(statusHtml, /Stale sources/);
    assert.match(statusHtml, /Failed \/ unavailable/);
    assert.match(statusHtml, /Latest successful generation/);
    assert.match(statusHtml, /<table class="source-health-table">/);
    assert.match(statusHtml, /<th scope="col">Last successful update<\/th>/);
    assert.match(statusHtml, /health-label health-stale/);
    assert.match(statusHtml, /health-label health-unknown/);
    assert.doesNotMatch(statusHtml, />\s*(?:undefined|null|NaN)\s*</);
});

test("Astro source routes render complete ordered records before secondary evidence without client JavaScript", () => {
    ensureDist();
    const escapeHtml = (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
    const routes = [
        ["trends", "items", "title", ["category", "source", "velocity", "signal", "summary"]],
        ["packages", "packages", "name", ["category", "downloadsLabel", "focus", "period"]],
        ["repos", "repos", "name", ["category", "starsLabel", "forksLabel", "focus", "pushedAt", "summary"]]
    ];

    for (const [route, collection, title, fields] of routes) {
        const html = read(`dist/${route}/index.html`);
        const data = JSON.parse(read(`data/${route}.json`));
        const items = data[collection];
        const summaryAt = html.indexOf("data-source-summary");
        const recordsAt = html.indexOf("data-source-record-list");
        const statsAt = html.indexOf(`${route === "trends" ? "Trend statistics" : route === "packages" ? "Package movement stats" : "Repo movement stats"}`);
        const healthAt = html.indexOf("data-source-health");

        assert.equal([...html.matchAll(/<th scope="row"/g)].length, items.length, `${route}: every record`);
        assert.ok(summaryAt >= 0 && summaryAt < recordsAt && recordsAt < statsAt && statsAt < healthAt, `${route}: summary, records, stats, health order`);
        assert.ok(html.indexOf(escapeHtml(items[0][title])) < html.indexOf(escapeHtml(items[1][title])), `${route}: source order`);
        for (const item of items) for (const field of [title, ...fields]) assert.ok(html.includes(escapeHtml(item[field])), `${route}: ${item[title]} ${field}`);
        assert.doesNotMatch(html, /<script\b|<astro-island\b|\b(?:component-url|renderer-url)=/i, `${route}: static HTML only`);
        assert.doesNotMatch(html, />\s*(?:undefined|null|NaN)\s*</i, `${route}: no invalid placeholders`);
    }
});

test("Astro Notes output contains every canonical note without client JavaScript", () => {
    ensureDist();
    const html = read("dist/notes/index.html");
    const notes = topicNotes("../");
    const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);

    assert.match(html, /<title>Topic notes - anothel<\/title>/);
    assert.match(html, /<link rel="canonical" href="https:\/\/anothel\.github\.io\/notes\/">/);
    assert.match(html, /<meta name="description" content="Judgment notes from focused topic pages\.">/);
    assert.match(html, /<meta property="og:url" content="https:\/\/anothel\.github\.io\/notes\/">/);
    assert.match(html, /<meta name="twitter:title" content="Topic notes - anothel">/);
    assert.match(html, /<span data-notes-count>7<\/span> notes/);
    assert.equal([...html.matchAll(/class="topic-note-card"/g)].length, 7);

    for (const item of notes) {
        assert.ok(html.includes(item.note.title), `${item.topic} title`);
        assert.ok(html.includes(item.note.body), `${item.topic} body`);
        assert.ok(html.includes(item.note.readWhen), `${item.topic} readWhen`);
        assert.ok(html.includes(`href="${item.route}"`), `${item.topic} topic route`);
        assert.ok(html.includes(`href="${item.exploreRoute}"`), `${item.topic} Explore route`);
    }

    assert.equal(new Set(ids).size, ids.length);
    assert.doesNotMatch(html, />\s*(?:undefined|null|NaN)\s*</i);
    assert.doesNotMatch(html, /<script\b|<astro-island\b|\b(?:component-url|renderer-url)=|js\/(?:notes|topic-taxonomy|safe-dom)\.js/i);
    assert.doesNotMatch(html, new RegExp(`\\b${retiredNotesGlobal}\\b`));
});

test("Astro builds every topic route as useful static HTML with only a native pin module", () => {
    ensureDist();

    for (const [slug, label, heading] of topicRoutes) {
        const path = `dist/topics/${slug}/index.html`;
        const html = read(path);
        const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
        const total = Number(html.match(/data-topic-total>(\d+)</)?.[1]);
        const signalCount = [...html.matchAll(/\sdata-topic-signal(?:\s|>)/g)].length;

        assert.match(html, new RegExp(`<title>${label} - anothel<\\/title>`), path);
        assert.match(html, new RegExp(`<link rel="canonical" href="https://anothel\\.github\\.io/topics/${slug}/">`), path);
        assert.match(html, new RegExp(`<meta property="og:url" content="https://anothel\\.github\\.io/topics/${slug}/">`), path);
        assert.match(html, /<meta name="twitter:card" content="summary">/, path);
        assert.match(html, new RegExp(`<meta name="twitter:title" content="${label} - anothel">`), path);
        assert.match(html, new RegExp(`<h1>${heading.replaceAll(/[.*+?^${}()|[\]\\]/g, "\\$&")}<\\/h1>`), path);
        assert.ok(total > 0, `${path} should contain focused signals`);
        assert.equal(signalCount, total, `${path} should render its complete focused signal list`);
        for (const marker of [
            "data-topic-note",
            "data-topic-guidance",
            "data-topic-top-movers",
            "data-topic-source-mix",
            "data-topic-related",
            "data-topic-cross-links",
            "data-topic-list",
            "Open Notes",
            "Open focused Explore"
        ]) assert.ok(html.includes(marker), `${path}: ${marker}`);
        assert.match(html, /Pinning is browser-local\. State loads when JavaScript is available\./, path);
        assert.match(html, /<script type="module" src="\/_astro\/[^"]+\.js"><\/script>/, path);
        assert.doesNotMatch(html, /js\/(?:topics|local-state)\.js|\bTopicApp\b|\bAnothelState\b|<astro-island\b|\bcomponent-url=|\brenderer-url=/i, path);
        assert.doesNotMatch(html, />\s*(?:undefined|null|NaN)\s*</i, path);
        assert.equal(new Set(ids).size, ids.length, `${path} should not contain duplicate ids`);
    }
});
