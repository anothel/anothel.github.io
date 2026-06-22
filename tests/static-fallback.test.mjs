import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function read(path) {
    return readFileSync(path, "utf8");
}

function json(path) {
    return JSON.parse(read(path));
}

const manifest = json("data/manifest.json");
const today = json("data/today.json");
const pages = [
    "index.html",
    "today/index.html",
    "explore/index.html",
    "review/index.html",
    "status/index.html",
    "trends/index.html",
    "packages/index.html",
    "repos/index.html",
    "links/index.html"
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

function todayStatusText() {
    const total = today.sections.reduce((sum, section) => sum + section.items.length, 0);
    const status = today.sourceMeta?.status || "ok";

    if (status === "fallback") return `${total} generated picks. Using static fallback because live data could not be loaded.`;
    if (status === "partial") return `${total} generated picks from partial source data. Usable picks remain available.`;
    if (status === "error") return `${total} generated picks from failed source refresh. Check Status before trusting freshness.`;
    return `${total} generated picks. Latest checked-in data loaded.`;
}

function dataModeText() {
    const health = moduleHealth();
    if (health.includes("partial")) return "Latest checked-in data loaded with partial source failures.";
    if (health.includes("fallback")) return "Using static fallback because live data could not be loaded.";
    return "Latest checked-in data loaded.";
}

test("home static fallback matches current manifest summary", () => {
    const home = read("index.html");

    assert.match(home, new RegExp(`<strong data-home-total>${moduleTotal()}</strong>`));
    assert.match(home, new RegExp(`<strong data-home-live>${moduleHealth()}</strong>`));
    assert.match(home, new RegExp(`<strong data-home-updated>${manifest.updated}</strong>`));
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
    assert.match(html, new RegExp(`<strong data-status-health>${moduleHealth()}</strong>`));
    assert.match(html, new RegExp(`<strong data-status-updated>${manifest.updated}</strong>`));
    assert.match(html, new RegExp(dataModeText().replaceAll(".", "\\.")));
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
        ["topics/agent-skills/index.html", /reusable instructions/i]
    ];

    for (const [path, pattern] of expectations) {
        const html = read(path);
        assert.match(html, /data-topic-note/, path);
        assert.match(html, pattern, path);
        assert.match(html, /Supporting signals/i, path);
    }
});

test("checked-in fallback copy avoids stale internal implementation language", () => {
    for (const path of pages) {
        const html = read(path);
        assert.doesNotMatch(html, /2026-06-14|2026-06-15|2026-06-19/, path);
        assert.doesNotMatch(html, /Static fallback|fetch is available|checked-in JSON/, path);
    }
});
