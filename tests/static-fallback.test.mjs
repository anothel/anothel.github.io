import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { buildHomeOverview } from "../js/home.js";

function read(path) {
    return readFileSync(path, "utf8");
}

function json(path) {
    return JSON.parse(read(path));
}

const manifest = json("data/manifest.json");
const today = json("data/today.json");
const refreshReport = json("data/refresh-report.json");
const pages = [
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
    "topics/ai-agents/index.html",
    "topics/mcp/index.html",
    "topics/agent-skills/index.html",
    "topics/ai-evals/index.html",
    "topics/workflow-automation/index.html"
];
const topicPages = [
    ["topics/ai-agents/index.html", "AI agents"],
    ["topics/mcp/index.html", "MCP"],
    ["topics/agent-skills/index.html", "Agent skills"],
    ["topics/ai-evals/index.html", "AI evals"],
    ["topics/workflow-automation/index.html", "Workflow automation"]
];

function moduleTotal() {
    return manifest.modules.reduce((total, module) => total + module.count, 0);
}

function moduleHealth() {
    const counts = manifest.modules.reduce((summary, module) => {
        summary[module.status] = (summary[module.status] || 0) + 1;
        return summary;
    }, {});
    return ["ok", "partial", "error", "fallback"]
        .filter((status) => counts[status] > 0)
        .map((status) => `${counts[status]} ${status}`)
        .join(" / ");
}

function sourceHealth() {
    const sources = manifest.modules.flatMap((module) => {
        const sourceMeta = json(module.data).sourceMeta;
        return Array.isArray(sourceMeta) ? sourceMeta : [sourceMeta];
    });
    const counts = sources.reduce((summary, source) => {
        summary[source.status] = (summary[source.status] || 0) + 1;
        return summary;
    }, {});
    return ["ok", "partial", "error", "fallback"]
        .filter((status) => counts[status] > 0)
        .map((status) => `${counts[status]} ${status}`)
        .join(" / ");
}

function todayStatusText() {
    const total = today.sections.reduce((sum, section) => sum + section.items.length, 0);
    const status = today.sourceMeta?.status || "ok";

    if (status === "fallback") return `${total} generated picks. Source health fallback. Previous data remains available.`;
    if (status === "partial") return `${total} generated picks. Source health partial. Usable data remains available.`;
    if (status === "error") return `${total} generated picks from failed source refresh. Check Status before trusting freshness.`;
    return `${total} generated picks. Source health ok. Data date ${today.updated}.`;
}

function dataModeText() {
    const health = moduleHealth();
    if (health.includes("partial")) return "Source health partial. Usable data remains available.";
    if (health.includes("fallback")) return "Source health fallback. Previous data remains available.";
    return `Source health ok. Data date ${manifest.updated}.`;
}

function topicApp() {
    const context = { console, URL };
    vm.runInNewContext(read("js/safe-dom.js"), context);
    vm.runInNewContext(read("js/topic-taxonomy.js"), context);
    vm.runInNewContext(read("js/topics.js"), context);
    return context.TopicApp;
}

function topicSummary(topic) {
    const app = topicApp();
    const sources = {
        trends: json("data/trends.json"),
        packages: json("data/packages.json"),
        repos: json("data/repos.json"),
        links: json("data/links.json")
    };
    return app.topicSummary(app.topicItems(sources, topic));
}

test("home static fallback matches current manifest summary", () => {
    const home = read("index.html");
    const overview = buildHomeOverview(manifest, { today: refreshReport.generatedAt || manifest.generatedAt });

    assert.match(home, new RegExp(`<strong data-home-total>${moduleTotal()}</strong>`));
    assert.match(home, new RegExp(`<strong data-home-live>${moduleHealth()}</strong>`));
    assert.match(home, new RegExp(`<strong data-home-updated>${manifest.updated}</strong>`));
    assert.match(home, new RegExp(`<strong data-home-freshness>${overview.dataState}</strong>`));
    assert.match(home, /A personal radar for AI engineering signals/);
    assert.doesNotMatch(home, /Static fallback|fetch is available|local file fetch is blocked/);
});

test("today static fallback matches current generated brief", () => {
    const html = read("today/index.html");

    assert.match(html, new RegExp(`<span data-today-updated>${today.updated}</span>`));
    assert.match(html, new RegExp(todayStatusText().replaceAll(".", "\\.")));
    assert.match(html, /<strong>anthropics\/skills<\/strong>/);
    assert.match(html, /<strong>Next action<\/strong>/);
});

test("status static fallback matches current manifest summary", () => {
    const html = read("status/index.html");

    assert.match(html, new RegExp(`<strong data-status-total>${moduleTotal()}</strong>`));
    assert.match(html, new RegExp(`<strong data-status-health>${sourceHealth()}</strong>`));
    assert.match(html, new RegExp(`<strong data-status-updated>${manifest.updated}</strong>`));
    assert.match(html, new RegExp(dataModeText().replaceAll(".", "\\.")));
    assert.match(html, new RegExp(`<strong>${refreshReport.generatedAt}</strong>`));
    assert.match(html, /No failed, partial, or fallback sources\./);
    assert.match(html, /<small>(Fresh|Aging|Stale|Partial|Fallback|Error|Unknown) - /);
});

test("module page stamps do not drift behind checked-in manifest", () => {
    for (const module of manifest.modules) {
        const html = read(module.route);
        assert.match(html, new RegExp(`<span data-updated>${module.updated}</span>`), module.route);
    }
});

test("topic pages keep checked-in judgment notes without JavaScript", () => {
    const expectations = [
        ["topics/ai-agents/index.html", /agent workflow/i],
        ["topics/mcp/index.html", /protocol layer/i],
        ["topics/agent-skills/index.html", /reusable instructions/i],
        ["topics/ai-evals/index.html", /measurement/i],
        ["topics/workflow-automation/index.html", /durable workflows/i]
    ];

    for (const [path, pattern] of expectations) {
        const html = read(path);
        assert.match(html, /data-topic-note/, path);
        assert.match(html, pattern, path);
        assert.match(html, /Supporting signals/i, path);
    }
});

test("notes index keeps checked-in topic notes without JavaScript", () => {
    const html = read("notes/index.html");

    assert.match(html, /data-notes-list/);
    assert.match(html, /Measurement decides which AI changes are safe to keep\./);
    assert.match(html, /Durable workflows matter when agents need repeatable execution\./);
    assert.match(html, /href="..\/topics\/ai-evals\/index\.html"/);
    assert.match(html, /href="..\/topics\/workflow-automation\/index\.html"/);
});

test("topic page static fallback summaries match current topic data", () => {
    for (const [path, topic] of topicPages) {
        const html = read(path);
        const summary = topicSummary(topic);

        assert.match(html, new RegExp(`<strong data-topic-total>${summary.total}</strong>`), path);
        assert.match(html, new RegExp(`<strong data-topic-modules>${summary.modules}</strong>`), path);
        assert.match(html, new RegExp(`<strong data-topic-updated>${summary.updated}</strong>`), path);
    }
});

test("checked-in fallback copy avoids stale internal implementation language", () => {
    for (const path of pages) {
        const html = read(path);
        assert.doesNotMatch(html, /2026-06-14|2026-06-15|2026-06-19/, path);
        assert.doesNotMatch(html, /Static fallback|fetch is available|checked-in JSON|checked-in data/i, path);
        assert.doesNotMatch(html, /Data date is current/, path);
    }
});
