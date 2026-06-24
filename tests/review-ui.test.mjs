import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

function loadReview(extra = {}) {
    const context = { console, URL, ...extra };
    vm.runInNewContext(readFileSync("js/local-state.js", "utf8"), context);
    vm.runInNewContext(readFileSync("js/signal-schema.js", "utf8"), context);
    vm.runInNewContext(readFileSync("js/explore.js", "utf8"), context);
    vm.runInNewContext(readFileSync("js/review.js", "utf8"), context);
    return context.ReviewApp;
}

const items = [
    {
        id: "repos:https://example.com/skills",
        module: "Repos",
        title: "Skills repo",
        category: "Agent skills",
        origin: "GitHub",
        metric: "135K stars",
        summary: "Reusable agent instructions.",
        url: "https://example.com/skills",
        updated: "2026-06-20",
        sources: ["Repos", "Links"],
        sourceContext: "Also in Links",
        score: 96,
        qualityScore: 96
    },
    {
        id: "packages:https://example.com/mcp",
        module: "Packages",
        title: "@modelcontextprotocol/sdk",
        category: "MCP",
        origin: "npm",
        metric: "1M/week",
        summary: "SDK for MCP servers.",
        url: "https://example.com/mcp",
        updated: "2026-06-19",
        sources: ["Packages"],
        sourceContext: "",
        score: 88,
        qualityScore: 88
    }
];

test("Review matches saved ids against current normalized items", () => {
    const app = loadReview();
    const saved = app.matchSavedItems(items, new Set(["packages:https://example.com/mcp", "missing:id"]));

    assert.deepEqual(saved.map((item) => item.id), ["packages:https://example.com/mcp"]);
});

test("Review joins saved records and sorts newest first", () => {
    const app = loadReview();
    const saved = app.matchSavedItems(items, new Set(["repos:https://example.com/skills", "packages:https://example.com/mcp"]), new Map([
        ["repos:https://example.com/skills", { id: "repos:https://example.com/skills", savedAt: "2026-06-19T00:00:00.000Z", status: "done" }],
        ["packages:https://example.com/mcp", { id: "packages:https://example.com/mcp", savedAt: "2026-06-20T00:00:00.000Z", status: "read" }]
    ]));

    assert.deepEqual(saved.map((item) => [item.id, item.savedAt, item.savedStatus]), [
        ["packages:https://example.com/mcp", "2026-06-20T00:00:00.000Z", "read"],
        ["repos:https://example.com/skills", "2026-06-19T00:00:00.000Z", "done"]
    ]);
});

test("Review summarizes saved focus areas and sources", () => {
    const app = loadReview();

    assert.deepEqual(JSON.parse(JSON.stringify(app.reviewStats(items))), {
        saved: 2,
        focusAreas: 2,
        sources: 3
    });
});

test("Review workflow stats count statuses", () => {
    const app = loadReview();

    assert.deepEqual(JSON.parse(JSON.stringify(app.workflowStats([
        { savedStatus: "unread" },
        { savedStatus: "read" },
        { savedStatus: "done" },
        { savedStatus: "unread" }
    ]))), {
        unread: 2,
        read: 1,
        done: 1
    });
});

test("Review filters and sorts workflow items by status priority", () => {
    const app = loadReview();
    const saved = [
        { id: "done:new", savedAt: "2026-06-22T00:00:00.000Z", savedStatus: "done" },
        { id: "read:old", savedAt: "2026-06-19T00:00:00.000Z", savedStatus: "read" },
        { id: "unread:old", savedAt: "2026-06-18T00:00:00.000Z", savedStatus: "unread" },
        { id: "unread:new", savedAt: "2026-06-20T00:00:00.000Z", savedStatus: "unread" }
    ];

    assert.deepEqual(app.filterReviewItems(saved, "all").map((item) => item.id), [
        "unread:new",
        "unread:old",
        "read:old",
        "done:new"
    ]);
    assert.deepEqual(app.filterReviewItems(saved, "unread").map((item) => item.id), [
        "unread:new",
        "unread:old"
    ]);
    assert.deepEqual(app.filterReviewItems(saved, "done").map((item) => item.id), ["done:new"]);
});

test("Review renders queue and selected detail with actions", () => {
    const app = loadReview();
    const queue = app.renderReviewQueue(items, "packages:https://example.com/mcp");
    const detail = app.renderReviewDetail(items[1]);

    assert.match(queue, /data-review-select-id="repos:https:\/\/example\.com\/skills"/);
    assert.match(queue, /aria-selected="true"/);
    assert.match(queue, /@modelcontextprotocol\/sdk/);
    assert.match(detail, /Why this matters/);
    assert.match(detail, /Source context/);
    assert.match(detail, /Signal fit 88/);
    assert.match(detail, /href="https:\/\/example\.com\/mcp"/);
    assert.match(detail, /data-review-remove-id="packages:https:\/\/example\.com\/mcp"/);
    assert.match(detail, /href="..\/explore\/index\.html\?focus=MCP"/);
});

test("Review renders status and saved date metadata", () => {
    const app = loadReview();
    const item = {
        ...items[1],
        savedAt: "2026-06-20T01:02:03.000Z",
        savedStatus: "read"
    };
    const queue = app.renderReviewQueue([item], item.id);
    const detail = app.renderReviewDetail(item);

    assert.match(queue, /Read/);
    assert.match(queue, /Saved 2026-06-20/);
    assert.match(detail, /Read/);
    assert.match(detail, /Saved 2026-06-20/);
    assert.match(detail, /data-review-status-id="packages:https:\/\/example\.com\/mcp" data-review-status="read"/);
    assert.match(detail, /data-review-status-id="packages:https:\/\/example\.com\/mcp" data-review-status="done"/);
});

test("Review renders useful empty state", () => {
    const app = loadReview();
    const html = app.renderReviewEmpty();

    assert.match(html, /No saved items yet/);
    assert.match(html, /local to this browser/);
    assert.match(html, /href="..\/explore\/index\.html"/);
});

test("Review rendering escapes generated text and blocks unsafe item links", () => {
    const app = loadReview();
    const detail = app.renderReviewDetail({
        id: "repos:bad",
        module: "Repos",
        title: "<script>alert(\"x\")</script>",
        category: "AI",
        origin: "GitHub",
        metric: "bad \"metric\"",
        summary: "bad \"summary\"",
        url: "javascript:alert(1)",
        updated: "2026-06-20",
        qualityScore: 40
    });

    assert.doesNotMatch(detail, /javascript:alert/);
    assert.match(detail, /href="#"/);
    assert.match(detail, /&lt;script&gt;alert\(&quot;x&quot;\)&lt;\/script&gt;/);
    assert.match(detail, /bad &quot;summary&quot;/);
});

test("Review browser init renders saved queue and removes items", async () => {
    function createElement() {
        return {
            innerHTML: "",
            textContent: "",
            listeners: {},
            addEventListener(type, listener) {
                this.listeners[type] = listener;
            }
        };
    }

    const elements = Object.fromEntries([
        "[data-review-total]",
        "[data-review-focus-count]",
        "[data-review-source-count]",
        "[data-review-queue]",
        "[data-review-detail]"
    ].map((selector) => [selector, createElement()]));
    let savedValue = "[\"trends:https://example.com/trend\"]";
    const clickHandlers = {};
    const sources = {
        "../data/trends.json": {
            updated: "2026-06-20",
            sourceMeta: [{ name: "GitHub", status: "ok", count: 1 }],
            items: [{
                rank: 1,
                title: "Agent trend",
                source: "GitHub",
                category: "AI agents",
                score: 90,
                velocity: "+5%",
                url: "https://example.com/trend",
                summary: "Saved agent trend."
            }]
        },
        "../data/packages.json": { updated: "2026-06-20", sourceMeta: { name: "npm", status: "ok", count: 0 }, packages: [] },
        "../data/repos.json": { updated: "2026-06-20", sourceMeta: { name: "GitHub", status: "ok", count: 0 }, repos: [] },
        "../data/links.json": { updated: "2026-06-20", sourceMeta: { name: "manual", status: "ok", count: 0 }, links: [] }
    };
    const context = {
        console,
        document: {
            currentScript: { dataset: {} },
            querySelector(selector) {
                return elements[selector] || null;
            },
            querySelectorAll(selector) {
                if (selector === "[data-review-remove-id]") {
                    return [{
                        dataset: { reviewRemoveId: "trends:https://example.com/trend" },
                        addEventListener(type, listener) {
                            clickHandlers.remove = listener;
                        }
                    }];
                }
                if (selector === "[data-review-status-id]") {
                    return [
                        {
                            dataset: { reviewStatusId: "trends:https://example.com/trend", reviewStatus: "read" },
                            addEventListener(type, listener) {
                                clickHandlers.read = listener;
                            }
                        },
                        {
                            dataset: { reviewStatusId: "trends:https://example.com/trend", reviewStatus: "done" },
                            addEventListener(type, listener) {
                                clickHandlers.done = listener;
                            }
                        }
                    ];
                }
                return [];
            }
        },
        localStorage: {
            getItem() {
                return savedValue;
            },
            setItem(_key, value) {
                savedValue = value;
            }
        },
        fetch: async (path) => ({
            ok: true,
            json: async () => sources[path]
        })
    };

    vm.runInNewContext(readFileSync("js/local-state.js", "utf8"), context);
    vm.runInNewContext(readFileSync("js/signal-schema.js", "utf8"), context);
    vm.runInNewContext(readFileSync("js/explore.js", "utf8"), context);
    vm.runInNewContext(readFileSync("js/review.js", "utf8"), context);
    await new Promise((resolve) => setTimeout(resolve, 0));

    assert.equal(elements["[data-review-total]"].textContent, "1");
    assert.equal(elements["[data-review-focus-count]"].textContent, "1");
    assert.equal(elements["[data-review-source-count]"].textContent, "1");
    assert.match(elements["[data-review-queue]"].innerHTML, /Agent trend/);
    assert.match(elements["[data-review-detail]"].innerHTML, /Saved agent trend/);
    assert.match(elements["[data-review-detail]"].innerHTML, /Unread/);

    clickHandlers.done();
    assert.equal(JSON.parse(savedValue).items[0].status, "done");
    assert.match(elements["[data-review-detail]"].innerHTML, /Done/);

    clickHandlers.remove();
    assert.deepEqual(JSON.parse(savedValue), { version: 2, items: [] });
    assert.equal(elements["[data-review-total]"].textContent, "0");
    assert.match(elements["[data-review-detail]"].innerHTML, /No saved items yet/);
});

test("Review browser filters workflow status", async () => {
    function createElement() {
        return {
            innerHTML: "",
            textContent: "",
            ariaPressed: "",
            listeners: {},
            addEventListener(type, listener) {
                this.listeners[type] = listener;
            },
            setAttribute(name, value) {
                if (name === "aria-pressed") this.ariaPressed = value;
            }
        };
    }

    const elements = Object.fromEntries([
        "[data-review-total]",
        "[data-review-unread]",
        "[data-review-read]",
        "[data-review-done]",
        "[data-review-focus-count]",
        "[data-review-source-count]",
        "[data-review-queue]",
        "[data-review-detail]"
    ].map((selector) => [selector, createElement()]));
    const filterButtons = [
        { dataset: { reviewFilter: "all" }, ariaPressed: "", listeners: {}, addEventListener(type, listener) { this.listeners[type] = listener; }, setAttribute(name, value) { if (name === "aria-pressed") this.ariaPressed = value; } },
        { dataset: { reviewFilter: "done" }, ariaPressed: "", listeners: {}, addEventListener(type, listener) { this.listeners[type] = listener; }, setAttribute(name, value) { if (name === "aria-pressed") this.ariaPressed = value; } }
    ];
    const sources = {
        "../data/trends.json": {
            updated: "2026-06-20",
            sourceMeta: [],
            items: [
                { rank: 1, title: "Unread item", source: "GitHub", category: "AI agents", score: 90, velocity: "+5%", url: "https://example.com/unread", summary: "Unread summary." },
                { rank: 2, title: "Done item", source: "GitHub", category: "AI agents", score: 80, velocity: "+3%", url: "https://example.com/done", summary: "Done summary." }
            ]
        },
        "../data/packages.json": { updated: "2026-06-20", sourceMeta: { name: "npm", status: "ok", count: 0 }, packages: [] },
        "../data/repos.json": { updated: "2026-06-20", sourceMeta: { name: "GitHub", status: "ok", count: 0 }, repos: [] },
        "../data/links.json": { updated: "2026-06-20", sourceMeta: { name: "manual", status: "ok", count: 0 }, links: [] }
    };
    const context = {
        console,
        document: {
            currentScript: { dataset: {} },
            querySelector(selector) {
                return elements[selector] || null;
            },
            querySelectorAll(selector) {
                if (selector === "[data-review-filter]") return filterButtons;
                return [];
            }
        },
        localStorage: {
            getItem() {
                return JSON.stringify({
                    version: 2,
                    items: [
                        { id: "trends:https://example.com/unread", savedAt: "2026-06-20T00:00:00.000Z", status: "unread" },
                        { id: "trends:https://example.com/done", savedAt: "2026-06-21T00:00:00.000Z", status: "done" }
                    ]
                });
            },
            setItem() {}
        },
        fetch: async (path) => ({
            ok: true,
            json: async () => sources[path]
        })
    };

    vm.runInNewContext(readFileSync("js/local-state.js", "utf8"), context);
    vm.runInNewContext(readFileSync("js/signal-schema.js", "utf8"), context);
    vm.runInNewContext(readFileSync("js/explore.js", "utf8"), context);
    vm.runInNewContext(readFileSync("js/review.js", "utf8"), context);
    await new Promise((resolve) => setTimeout(resolve, 0));

    assert.equal(elements["[data-review-total]"].textContent, "2");
    assert.equal(elements["[data-review-unread]"].textContent, "1");
    assert.equal(elements["[data-review-done]"].textContent, "1");
    assert.match(elements["[data-review-queue]"].innerHTML, /Unread item/);
    assert.match(elements["[data-review-queue]"].innerHTML, /Done item/);

    filterButtons[1].listeners.click();
    assert.equal(filterButtons[1].ariaPressed, "true");
    assert.equal(elements["[data-review-total]"].textContent, "1");
    assert.doesNotMatch(elements["[data-review-queue]"].innerHTML, /Unread item/);
    assert.match(elements["[data-review-queue]"].innerHTML, /Done item/);
});
