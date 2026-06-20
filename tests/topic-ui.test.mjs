import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

function loadTopics(extra = {}) {
    const context = { console, ...extra };
    vm.runInNewContext(readFileSync("js/topics.js", "utf8"), context);
    return context.TopicApp;
}

test("Topic pages normalize source data into focused items", () => {
    const app = loadTopics();
    const items = app.topicItems({
        trends: {
            updated: "2026-06-19",
            items: [
                { title: "Agent runtime", category: "AI agents", source: "GitHub", score: 91, velocity: "+20%", url: "https://example.com/agent", summary: "Agent workflow." },
                { title: "Zero-Touch OAuth for MCP", category: "MCP", source: "HN", score: 80, velocity: "80 points", url: "https://example.com/mcp", summary: "MCP auth." }
            ]
        },
        packages: {
            updated: "2026-06-18",
            packages: [
                { name: "mcp-server", category: "MCP", focus: "MCP server SDK", downloads: 3000, downloadsLabel: "3K/week", url: "https://example.com/pkg" }
            ]
        },
        repos: {
            updated: "2026-06-17",
            repos: [
                { name: "mattpocock/skills", category: "Agent skills", focus: "coding agent skills", stars: 12000, starsLabel: "12K", url: "https://example.com/skills", summary: "Reusable skills." }
            ]
        },
        links: {
            updated: "2026-06-16",
            links: [
                { title: "Agent Skills standard", category: "Agent skills", kind: "Spec", url: "https://example.com/skills-spec", summary: "Spec reference." }
            ]
        }
    }, "Agent skills");

    assert.deepEqual(JSON.parse(JSON.stringify(items.map((item) => item.title))), ["mattpocock/skills", "Agent Skills standard"]);
    assert.deepEqual(JSON.parse(JSON.stringify(items.map((item) => item.module))), ["Repos", "Links"]);
});

test("Topic pages summarize item count, module count, and latest update", () => {
    const app = loadTopics();
    const summary = app.topicSummary([
        { module: "Repos", updated: "2026-06-17" },
        { module: "Links", updated: "2026-06-19" },
        { module: "Links", updated: "2026-06-16" }
    ]);

    assert.deepEqual(JSON.parse(JSON.stringify(summary)), {
        total: 3,
        modules: 2,
        updated: "2026-06-19"
    });
});

test("Topic pages summarize source mix and highlight the top signal", () => {
    const app = loadTopics();
    const items = [
        { module: "Repos", title: "openai/codex", category: "AI agents", origin: "GitHub", metric: "92K stars", score: 96, updated: "2026-06-19" },
        { module: "Repos", title: "contains-studio/agents", category: "AI agents", origin: "GitHub", metric: "12K stars", score: 80, updated: "2026-06-18" },
        { module: "Packages", title: "mastra", category: "AI agents", origin: "npm", metric: "440K/week", score: 78, updated: "2026-06-19" }
    ];

    const insight = app.topicInsight(items, "AI agents");
    const mixHtml = app.renderSourceMix(insight.sourceMix);
    const actionHtml = app.renderTopicActions("AI agents");

    assert.equal(insight.lead, "2 source modules tracking 3 AI agent signals.");
    assert.equal(insight.topItem.title, "openai/codex");
    assert.deepEqual(JSON.parse(JSON.stringify(insight.sourceMix)), [
        { module: "Repos", count: 2 },
        { module: "Packages", count: 1 }
    ]);
    assert.match(mixHtml, /Repos/);
    assert.match(mixHtml, /2 items/);
    assert.match(actionHtml, /href="..\/..\/explore\/index\.html\?focus=AI%20agents"/);
    assert.match(actionHtml, /Open Review/);
});

test("Topic rendering escapes text and blocks unsafe links", () => {
    const app = loadTopics();
    const html = app.renderTopicCards([
        {
            title: "<script>alert(1)</script>",
            module: "Links",
            category: "Agent skills",
            origin: "Spec",
            metric: "Reference",
            summary: "Reusable \"skills\".",
            url: "javascript:alert(1)",
            updated: "2026-06-19"
        }
    ]);

    assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
    assert.match(html, /Reusable &quot;skills&quot;\./);
    assert.match(html, /href="#"/);
});

test("Topic browser init renders stats and cards", async () => {
    function createElement() {
        return {
            innerHTML: "",
            textContent: ""
        };
    }

    const elements = Object.fromEntries([
        "[data-topic-total]",
        "[data-topic-modules]",
        "[data-topic-updated]",
        "[data-topic-lead]",
        "[data-topic-source-mix]",
        "[data-topic-actions-dynamic]",
        "[data-topic-list]"
    ].map((selector) => [selector, createElement()]));

    const sources = {
        "../../data/trends.json": {
            updated: "2026-06-19",
            items: [{ title: "Agent runtime", category: "AI agents", source: "GitHub", score: 91, velocity: "+20%", url: "https://example.com/agent", summary: "Agent workflow." }]
        },
        "../../data/packages.json": { updated: "2026-06-18", packages: [] },
        "../../data/repos.json": { updated: "2026-06-17", repos: [] },
        "../../data/links.json": { updated: "2026-06-16", links: [] }
    };

    const context = {
        console,
        document: {
            currentScript: {
                dataset: {
                    topic: "AI agents",
                    trends: "../../data/trends.json",
                    packages: "../../data/packages.json",
                    repos: "../../data/repos.json",
                    links: "../../data/links.json"
                }
            },
            querySelector(selector) {
                return elements[selector] || null;
            }
        },
        fetch: async (path) => ({
            ok: true,
            json: async () => sources[path]
        }),
        setTimeout
    };

    vm.runInNewContext(readFileSync("js/topics.js", "utf8"), context);
    await new Promise((resolve) => setTimeout(resolve, 0));

    assert.equal(elements["[data-topic-total]"].textContent, "1");
    assert.equal(elements["[data-topic-modules]"].textContent, "1");
    assert.equal(elements["[data-topic-updated]"].textContent, "2026-06-19");
    assert.match(elements["[data-topic-lead]"].textContent, /1 source module tracking 1 AI agent signal\./);
    assert.match(elements["[data-topic-source-mix]"].innerHTML, /Trends/);
    assert.match(elements["[data-topic-actions-dynamic]"].innerHTML, /Open Review/);
    assert.match(elements["[data-topic-list]"].innerHTML, /Agent runtime/);
});
