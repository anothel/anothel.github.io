import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

function loadExplore(extra = {}) {
    const context = { console, ...extra };
    vm.runInNewContext(readFileSync("js/data-health.js", "utf8"), context);
    vm.runInNewContext(readFileSync("js/explore.js", "utf8"), context);
    return context.ExploreApp;
}

test("Explore normalizes trends, packages, repos, and links into one item shape", () => {
    const app = loadExplore();
    const items = app.normalizeExploreData({
        trends: {
            updated: "2026-06-18",
            sourceMeta: [{ name: "GitHub", status: "ok", count: 1 }],
            items: [{
                rank: 1,
                title: "Agent trend",
                source: "GitHub",
                category: "AI",
                score: 98,
                velocity: "+12%",
                url: "https://example.com/trend",
                summary: "Trend summary"
            }]
        },
        packages: {
            updated: "2026-06-19",
            sourceMeta: { name: "npm", status: "ok", count: 1 },
            packages: [{
                rank: 1,
                name: "ai",
                category: "AI SDK",
                focus: "Vercel AI SDK",
                downloads: 15000000,
                downloadsLabel: "15M/week",
                url: "https://example.com/package"
            }]
        },
        repos: {
            updated: "2026-06-18",
            sourceMeta: { name: "GitHub", status: "ok", count: 1 },
            repos: [{
                rank: 1,
                name: "openai/codex",
                category: "AI agents",
                focus: "terminal coding agent",
                stars: 92000,
                starsLabel: "92K",
                url: "https://example.com/repo",
                summary: "Repo summary"
            }]
        },
        links: {
            updated: "2026-06-18",
            sourceMeta: { name: "manual", status: "ok", count: 1 },
            links: [{
                rank: 1,
                title: "Agent Skills standard",
                category: "Agent skills",
                kind: "Spec",
                url: "https://example.com/link",
                summary: "Link summary"
            }]
        }
    });

    assert.equal(items.length, 4);
    assert.deepEqual(JSON.parse(JSON.stringify(items.map((item) => [item.module, item.title, item.category, item.origin, item.metric]))), [
        ["Trends", "Agent trend", "AI", "GitHub", "+12%"],
        ["Packages", "ai", "AI SDK", "npm", "15M/week"],
        ["Repos", "openai/codex", "AI agents", "GitHub", "92K stars"],
        ["Links", "Agent Skills standard", "Agent skills", "Spec", "Spec"]
    ]);
    assert.equal(items[0].id, "trends:https://example.com/trend");
    assert.equal(items[1].updated, "2026-06-19");
});

test("Explore filters and sorts items with saved-first support", () => {
    const app = loadExplore();
    const items = [
        { id: "repos:a", module: "Repos", title: "Agent repo", category: "AI", origin: "GitHub", summary: "coding agent", score: 90 },
        { id: "packages:b", module: "Packages", title: "Runtime package", category: "Runtime", origin: "npm", summary: "node runtime", score: 95 },
        { id: "links:c", module: "Links", title: "Agent docs", category: "AI", origin: "Docs", summary: "reference", score: 20 }
    ];

    assert.deepEqual(
        JSON.parse(JSON.stringify(app.filterExploreItems(items, { module: "Repos", category: "AI", query: "agent" }, new Set()).map((item) => item.id))),
        ["repos:a"]
    );

    assert.deepEqual(
        JSON.parse(JSON.stringify(app.sortExploreItems(items, "saved", new Set(["links:c"])).map((item) => item.id))),
        ["links:c", "packages:b", "repos:a"]
    );
});

test("Explore saved store reads, toggles, removes, and ignores broken storage", () => {
    const app = loadExplore();
    const memory = new Map();
    const storage = {
        getItem(key) {
            return memory.get(key) || null;
        },
        setItem(key, value) {
            memory.set(key, value);
        }
    };
    const store = app.createExploreStore(storage);

    assert.deepEqual([...store.read()], []);
    store.toggle("repos:a");
    assert.deepEqual([...store.read()], ["repos:a"]);
    store.toggle("packages:b");
    assert.deepEqual([...store.read()].sort(), ["packages:b", "repos:a"]);
    store.remove("repos:a");
    assert.deepEqual([...store.read()], ["packages:b"]);

    const broken = app.createExploreStore({
        getItem() {
            throw new Error("blocked");
        },
        setItem() {
            throw new Error("blocked");
        }
    });
    assert.deepEqual([...broken.read()], []);
});

test("Explore rendering escapes generated text and blocks unsafe links", () => {
    const app = loadExplore();
    const html = app.renderExploreCards([
        {
            id: "repos:bad",
            module: "Repos",
            title: "<script>alert(\"x\")</script>",
            category: "AI",
            origin: "GitHub",
            metric: "bad \"metric\"",
            summary: "bad \"summary\"",
            url: "javascript:alert(1)"
        }
    ], new Set(["repos:bad"]));

    assert.doesNotMatch(html, /javascript:alert/);
    assert.match(html, /href="#"/);
    assert.match(html, /&lt;script&gt;alert\(&quot;x&quot;\)&lt;\/script&gt;/);
    assert.match(html, /bad &quot;summary&quot;/);
    assert.match(html, /aria-pressed="true"/);
});

test("Explore browser init renders stats, health, filters, and saved queue", async () => {
    function createElement() {
        return {
            innerHTML: "",
            textContent: "",
            value: "all",
            listeners: {},
            addEventListener(type, listener) {
                this.listeners[type] = listener;
            },
            dispatch(type, value = this.value) {
                this.value = value;
                this.listeners[type]?.({ target: this });
            }
        };
    }

    const elements = Object.fromEntries([
        "[data-explore-results]",
        "[data-explore-saved]",
        "[data-explore-module]",
        "[data-explore-category]",
        "[data-explore-query]",
        "[data-explore-sort]",
        "[data-explore-total]",
        "[data-explore-saved-count]",
        "[data-explore-categories]",
        "[data-explore-summary]",
        "[data-data-mode]",
        "[data-source-health]",
        "[data-clear-filters]"
    ].map((selector) => [selector, createElement()]));

    const sources = {
        "../data/manifest.json": { modules: [] },
        "../data/trends.json": {
            updated: "2026-06-18",
            sourceMeta: [{ name: "GitHub", status: "partial", count: 1, errors: [{ name: "GitHub", error: "rate limit" }] }],
            items: [{ rank: 1, title: "Agent trend", source: "GitHub", category: "AI", score: 90, velocity: "+5%", url: "https://example.com/trend", summary: "Trend" }]
        },
        "../data/packages.json": { updated: "2026-06-19", sourceMeta: { name: "npm", status: "ok", count: 0 }, packages: [] },
        "../data/repos.json": { updated: "2026-06-18", sourceMeta: { name: "GitHub", status: "ok", count: 0 }, repos: [] },
        "../data/links.json": { updated: "2026-06-18", sourceMeta: { name: "manual", status: "ok", count: 0 }, links: [] }
    };

    const context = {
        console,
        document: {
            currentScript: { dataset: {} },
            querySelector(selector) {
                return elements[selector] || null;
            }
        },
        localStorage: {
            getItem() {
                return "[\"trends:https://example.com/trend\"]";
            },
            setItem() {}
        },
        fetch: async (path) => ({
            ok: true,
            json: async () => sources[path]
        })
    };

    vm.runInNewContext(readFileSync("js/data-health.js", "utf8"), context);
    vm.runInNewContext(readFileSync("js/explore.js", "utf8"), context);
    await new Promise((resolve) => setTimeout(resolve, 0));

    assert.equal(elements["[data-explore-total]"].textContent, "1");
    assert.equal(elements["[data-explore-saved-count]"].textContent, "1");
    assert.match(elements["[data-explore-results]"].innerHTML, /Agent trend/);
    assert.match(elements["[data-explore-saved]"].innerHTML, /Agent trend/);
    assert.match(elements["[data-source-health]"].innerHTML, /status-partial/);

    elements["[data-explore-query]"].dispatch("input", "missing");
    assert.equal(elements["[data-explore-total]"].textContent, "0");
    assert.match(elements["[data-explore-results]"].innerHTML, /No matching items/);
});
