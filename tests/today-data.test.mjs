import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildTodayBrief, sectionCounts } from "../scripts/update-today.mjs";
import {
    renderExploreLinks,
    renderTodaySections,
    renderTodayStats,
    renderTodayStatus,
    totalSectionItems
} from "../js/today.js";

const todayData = JSON.parse(readFileSync("data/today.json", "utf8"));
const expectedSectionCounts = [
    sectionCounts.start,
    sectionCounts.skim,
    sectionCounts.reference
];
const expectedItemFields = [
    "schemaVersion",
    "id",
    "sourceModule",
    "sourceKind",
    "title",
    "module",
    "origin",
    "category",
    "metric",
    "reason",
    "scoreReasons",
    "action",
    "url",
    "rawScore",
    "qualityScore",
    "score",
    "sources",
    "sourceContext",
    "canonicalKey",
    "updated"
];

function buildQualityFixture() {
    return {
        trends: {
            updated: "2026-06-19",
            sourceMeta: { status: "ok" },
            items: [
                {
                    title: "tailwindcss",
                    source: "npm",
                    category: "AI",
                    score: 101,
                    velocity: "150M/week",
                    signal: "misclassified baseline demand",
                    url: "https://www.npmjs.com/package/tailwindcss"
                },
                {
                    title: "typescript",
                    source: "npm",
                    category: "JavaScript",
                    score: 100,
                    velocity: "220M/week",
                    signal: "baseline demand",
                    url: "https://www.npmjs.com/package/typescript"
                },
                {
                    title: "eslint",
                    source: "npm",
                    category: "Developer tools",
                    score: 99,
                    velocity: "140M/week",
                    signal: "baseline demand",
                    url: "https://www.npmjs.com/package/eslint"
                },
                {
                    title: "react",
                    source: "npm",
                    category: "UI",
                    score: 98,
                    velocity: "147M/week",
                    signal: "baseline demand",
                    url: "https://www.npmjs.com/package/react"
                }
            ]
        },
        repos: {
            updated: "2026-06-19",
            sourceMeta: { status: "ok" },
            repos: [
                {
                    name: "anthropics/skills",
                    category: "Agent skills",
                    starsLabel: "8K",
                    focus: "official agent skills examples",
                    url: "https://github.com/anthropics/skills",
                    score: 72
                },
                {
                    name: "modelcontextprotocol/servers",
                    category: "MCP",
                    starsLabel: "15K",
                    focus: "MCP server ecosystem",
                    url: "https://github.com/modelcontextprotocol/servers",
                    score: 71
                },
                {
                    name: "openai/codex",
                    category: "Coding agents",
                    starsLabel: "30K",
                    focus: "coding agent tooling",
                    url: "https://github.com/openai/codex",
                    score: 70
                }
            ]
        },
        packages: {
            updated: "2026-06-19",
            sourceMeta: { status: "ok" },
            packages: [
                {
                    name: "zod",
                    category: "Developer tools",
                    downloadsLabel: "200M/week",
                    focus: "schema validation",
                    url: "https://www.npmjs.com/package/zod",
                    score: 97
                },
                {
                    name: "@modelcontextprotocol/sdk",
                    category: "MCP",
                    downloadsLabel: "1M/week",
                    focus: "MCP SDK",
                    url: "https://www.npmjs.com/package/@modelcontextprotocol/sdk",
                    score: 69
                }
            ]
        },
        links: {
            updated: "2026-06-19",
            sourceMeta: { status: "ok" },
            links: [
                {
                    title: "Agent Skills standard",
                    kind: "Spec",
                    category: "Agent skills",
                    summary: "Reusable instructions, scripts, and resources for agents.",
                    url: "https://agentskills.io/",
                    score: 65
                }
            ]
        }
    };
}

test("totalSectionItems counts generated brief items", () => {
    assert.equal(totalSectionItems([{ items: [{}, {}] }, { items: [{}] }]), 3);
    assert.equal(totalSectionItems([]), 0);
});

test("renderTodaySections emits section cards and item links", () => {
    const sections = [
        {
            id: "start",
            title: "Start here",
            summary: "Open these first.",
            items: [
                {
                    title: "Synthetic trend",
                    module: "Trends",
                    origin: "Example source",
                    category: "Developer tools",
                    metric: "91 score",
                    reason: "Synthetic reason",
                    scoreReasons: ["91 score from Example source", "Synthetic <reason>", "Signal fit 91/100"],
                    url: "https://example.test/trend",
                    score: 91
                }
            ]
        }
    ];
    const html = renderTodaySections(sections);

    assert.match(html, /class="today-section"/);
    assert.match(html, /class="section-heading"/);
    assert.match(html, /class="today-grid"/);
    assert.match(html, /class="signal-card today-card"/);
    assert.match(html, /Start here/);
    assert.match(html, /Open these first\./);
    assert.match(html, /href="https:\/\/example\.test\/trend"/);
    assert.match(html, /Synthetic trend/);
    assert.match(html, /Trends/);
    assert.match(html, /Example source \/ Developer tools/);
    assert.match(html, /91 score/);
    assert.match(html, /Why now/);
    assert.match(html, /Synthetic reason/);
    assert.match(html, /Score reasons/);
    assert.match(html, /91 score from Example source/);
    assert.match(html, /Synthetic &lt;reason&gt;/);
    assert.match(html, /Next action/);
    assert.match(html, /Source context/);
});

test("renderTodaySections escapes text and blocks unsafe item links", () => {
    const sections = [
        {
            id: "start",
            title: "<script>bad()</script>",
            summary: "Open \"carefully\".",
            items: [
                {
                    title: "<script>alert(\"x\")</script>",
                    module: "Trends",
                    origin: "Example source",
                    category: "Developer tools",
                    metric: "91 score",
                    reason: "bad \"quote\"",
                    scoreReasons: ["bad <reason>"],
                    url: "javascript:alert(1)",
                    score: 91
                }
            ]
        }
    ];
    const html = renderTodaySections(sections);

    assert.match(html, /href="#"/);
    assert.doesNotMatch(html, /javascript:alert/);
    assert.match(html, /&lt;script&gt;bad\(\)&lt;\/script&gt;/);
    assert.match(html, /Open &quot;carefully&quot;\./);
    assert.match(html, /&lt;script&gt;alert\(&quot;x&quot;\)&lt;\/script&gt;/);
    assert.match(html, /bad &quot;quote&quot;/);
    assert.match(html, /bad &lt;reason&gt;/);
});

test("renderExploreLinks links to all full module pages", () => {
    const html = renderExploreLinks();

    for (const href of [
        "../explore/index.html",
        "../trends/index.html",
        "../repos/index.html",
        "../packages/index.html",
        "../links/index.html"
    ]) {
        assert.match(html, new RegExp(`href="${href.replaceAll("/", "\\/")}"`));
    }
    assert.ok(html.indexOf("../explore/index.html") < html.indexOf("../trends/index.html"));
    assert.match(html, /Continue in Explore/);
    assert.match(html, /Search all tracked signals/);
    assert.match(html, /Explore AI agents/);
    assert.match(html, /\.\.\/explore\/index\.html\?focus=AI%20agents/);
    assert.match(html, /Explore MCP/);
    assert.match(html, /\.\.\/explore\/index\.html\?focus=MCP/);
    assert.match(html, /Explore skills/);
    assert.match(html, /\.\.\/explore\/index\.html\?focus=Agent%20skills/);
});

test("renderTodayStats summarizes section counts", () => {
    const html = renderTodayStats([
        { id: "start", title: "Start here", items: [{}, {}, {}] },
        { id: "skim", title: "Worth skimming", items: [{}, {}] },
        { id: "reference", title: "Reference shelf", items: [{}] }
    ]);

    assert.match(html, /Start/);
    assert.match(html, /3/);
    assert.match(html, /Skim/);
    assert.match(html, /2/);
    assert.match(html, /Reference/);
    assert.match(html, /1/);
    assert.match(html, /Open first/);
});

test("renderTodayStatus explains partial and fallback generated data", () => {
    assert.equal(
        renderTodayStatus({
            updated: "2026-06-22",
            sourceMeta: { status: "ok" },
            sections: [{ items: [{}, {}] }]
        }),
        "2 generated picks. Source health ok. Data date 2026-06-22."
    );
    assert.equal(
        renderTodayStatus({
            sourceMeta: { status: "partial" },
            sections: [{ items: [{}, {}] }]
        }),
        "2 generated picks. Source health partial. Usable data remains available."
    );
    assert.equal(
        renderTodayStatus({
            sourceMeta: { status: "fallback" },
            sections: []
        }),
        "0 generated picks. Source health fallback. Previous data remains available."
    );
});

test("buildTodayBrief promotes personal AI and agent workflow signals", () => {
    const today = buildTodayBrief(buildQualityFixture(), "2026-06-19T00:00:00.000Z");
    const startItems = today.sections.find((section) => section.id === "start").items;
    const startTitles = startItems.map((item) => item.title);
    const baselineTitles = new Set(["tailwindcss", "typescript", "eslint", "react", "zod"]);
    const intentPattern = /skills|mcp|codex|agent/i;
    const firstIntentIndex = startItems.findIndex((item) => intentPattern.test(item.title));
    const eslintIndex = startItems.findIndex((item) => item.title === "eslint");

    assert.notEqual(firstIntentIndex, -1, startTitles.join(", "));
    assert.equal(startTitles.includes("tailwindcss"), false, startTitles.join(", "));
    assert.ok(
        startItems.filter((item) => baselineTitles.has(item.title)).length <= 1,
        startTitles.join(", ")
    );
    assert.ok(eslintIndex === -1 || firstIntentIndex < eslintIndex, startTitles.join(", "));
});

test("buildTodayBrief strips internal quality fields from output items", () => {
    const today = buildTodayBrief(buildQualityFixture(), "2026-06-19T00:00:00.000Z");
    const items = today.sections.flatMap((section) => section.items);

    for (const item of items) {
        assert.deepEqual(Object.keys(item), expectedItemFields);
        assert.equal(Object.hasOwn(item, "priority"), false);
        assert.equal(Object.hasOwn(item, "isIntentMatch"), false);
        assert.equal(Object.hasOwn(item, "isBaseline"), false);
    }
});

test("checked-in today data has stable section contract", () => {
    assert.deepEqual(todayData.sections.map((section) => section.id), ["start", "skim", "reference"]);
    assert.ok(todayData.sections.every((section) => section.summary));
    assert.deepEqual(todayData.sections.map((section) => section.items.length), expectedSectionCounts);
    assert.equal(totalSectionItems(todayData.sections), todayData.sourceMeta.count);

    for (const section of todayData.sections) {
        for (const item of section.items) {
            for (const field of expectedItemFields) {
                assert.ok(Object.hasOwn(item, field), `${section.id} item missing ${field}`);
            }
        }
    }
});
