import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
    buildTodayBrief,
    normalizeCandidates,
    sectionCounts
} from "../scripts/update-today.mjs";

function readJson(path) {
    return JSON.parse(readFileSync(path, "utf8"));
}

function checkedInSources() {
    return {
        trends: readJson("data/trends.json"),
        repos: readJson("data/repos.json"),
        packages: readJson("data/packages.json"),
        links: readJson("data/links.json")
    };
}

test("sectionCounts defines Today brief slots", () => {
    assert.deepEqual(sectionCounts, { start: 3, skim: 6, reference: 4 });
});

test("normalizeCandidates maps source data into shared card shape", () => {
    const candidates = normalizeCandidates({
        trends: {
            items: [
                {
                    title: "Iroh 1.0",
                    source: "Hacker News",
                    category: "Developer tools",
                    score: 96,
                    velocity: "267 comments",
                    signal: "852 points",
                    url: "https://www.iroh.computer/blog/v1",
                    summary: "HN story by chadfowler with 267 comments."
                }
            ]
        },
        repos: {
            repos: [
                {
                    name: "react/react",
                    category: "UI",
                    focus: "frontend runtime",
                    starsLabel: "245.9K",
                    url: "https://github.com/react/react",
                    summary: "The library for web and native user interfaces."
                }
            ]
        },
        packages: {
            packages: [
                {
                    name: "typescript",
                    category: "Language",
                    focus: "typed JavaScript",
                    downloadsLabel: "217.3M/week",
                    url: "https://www.npmjs.com/package/typescript"
                }
            ]
        },
        links: {
            links: [
                {
                    title: "MDN Web Docs",
                    category: "Frontend",
                    kind: "Docs",
                    url: "https://developer.mozilla.org/",
                    summary: "Reference for web platform APIs."
                }
            ]
        }
    });

    assert.deepEqual(
        candidates.map((item) => ({
            title: item.title,
            module: item.module,
            origin: item.origin,
            category: item.category,
            metric: item.metric,
            reason: item.reason,
            url: item.url,
            score: item.score
        })),
        [
            {
                title: "Iroh 1.0",
                module: "Trends",
                origin: "Hacker News",
                category: "Developer tools",
                metric: "96 score",
                reason: "267 comments / 852 points",
                url: "https://www.iroh.computer/blog/v1",
                score: 96
            },
            {
                title: "react/react",
                module: "Repos",
                origin: "GitHub",
                category: "UI",
                metric: "245.9K stars",
                reason: "frontend runtime",
                url: "https://github.com/react/react",
                score: 80
            },
            {
                title: "typescript",
                module: "Packages",
                origin: "npm",
                category: "Language",
                metric: "217.3M/week",
                reason: "typed JavaScript",
                url: "https://www.npmjs.com/package/typescript",
                score: 70
            },
            {
                title: "MDN Web Docs",
                module: "Links",
                origin: "Docs",
                category: "Frontend",
                metric: "Docs",
                reason: "Reference for web platform APIs.",
                url: "https://developer.mozilla.org/",
                score: 60
            }
        ]
    );
});

test("buildTodayBrief creates fixed sections from checked-in data", () => {
    const brief = buildTodayBrief(checkedInSources(), "2026-06-15T00:00:00.000Z");
    const allItems = brief.sections.flatMap((section) => section.items);
    const urls = allItems.map((item) => item.url);

    assert.deepEqual(
        brief.sections.map((section) => [section.id, section.title, section.summary, section.items.length]),
        [
            ["start", "Start here", "Three signals worth opening first.", 3],
            ["skim", "Worth skimming", "Useful movement that does not need first attention.", 6],
            ["reference", "Reference shelf", "Stable references and projects worth keeping nearby.", 4]
        ]
    );
    assert.equal(allItems.length, 13);
    assert.equal(new Set(urls).size, urls.length);
});

test("buildTodayBrief removes URL and title collisions from output", () => {
    const brief = buildTodayBrief({
        trends: {
            items: [
                { title: "Shared URL A", source: "Hacker News", category: "AI", score: 100, velocity: "100 comments", signal: "500 points", url: "https://example.com/shared-url", summary: "Moving now." },
                { title: "Shared URL B", source: "GitHub", category: "AI", score: 99, velocity: "90K stars", signal: "9K forks", url: "https://example.com/shared-url", summary: "Same URL." },
                { title: "Shared Title", source: "npm", category: "Tooling", score: 98, velocity: "80M/week", signal: "last week", url: "https://example.com/shared-title-a", summary: "First title." },
                { title: "shared title", source: "Hacker News", category: "Tooling", score: 97, velocity: "70 comments", signal: "400 points", url: "https://example.com/shared-title-b", summary: "Same title." },
                { title: "Trend Unique A", source: "Hacker News", category: "AI", score: 96, velocity: "60 comments", signal: "300 points", url: "https://example.com/trend-unique-a", summary: "Unique." },
                { title: "Trend Unique B", source: "GitHub", category: "AI", score: 95, velocity: "50K stars", signal: "5K forks", url: "https://example.com/trend-unique-b", summary: "Unique." }
            ]
        },
        repos: {
            repos: [
                { name: "repo/unique-a", category: "AI", focus: "reference repo", starsLabel: "10K", url: "https://example.com/repo-unique-a", summary: "Unique." },
                { name: "repo/unique-b", category: "AI", focus: "reference repo", starsLabel: "9K", url: "https://example.com/repo-unique-b", summary: "Unique." },
                { name: "repo/unique-c", category: "AI", focus: "reference repo", starsLabel: "8K", url: "https://example.com/repo-unique-c", summary: "Unique." },
                { name: "repo/unique-d", category: "AI", focus: "reference repo", starsLabel: "7K", url: "https://example.com/repo-unique-d", summary: "Unique." }
            ]
        },
        packages: {
            packages: [
                { name: "package-unique-a", category: "Tooling", focus: "build tool", downloadsLabel: "10M/week", url: "https://example.com/package-unique-a" },
                { name: "package-unique-b", category: "Tooling", focus: "linting", downloadsLabel: "9M/week", url: "https://example.com/package-unique-b" },
                { name: "package-unique-c", category: "Tooling", focus: "formatting", downloadsLabel: "8M/week", url: "https://example.com/package-unique-c" },
                { name: "package-unique-d", category: "Tooling", focus: "testing", downloadsLabel: "7M/week", url: "https://example.com/package-unique-d" }
            ]
        },
        links: {
            links: [
                { title: "Reference Unique A", category: "Docs", kind: "Docs", url: "https://example.com/reference-unique-a", summary: "Durable reference." },
                { title: "Reference Unique B", category: "Docs", kind: "Docs", url: "https://example.com/reference-unique-b", summary: "Durable reference." },
                { title: "Reference Unique C", category: "Docs", kind: "Docs", url: "https://example.com/reference-unique-c", summary: "Durable reference." },
                { title: "Reference Unique D", category: "Docs", kind: "Docs", url: "https://example.com/reference-unique-d", summary: "Durable reference." },
                { title: "Reference Unique E", category: "Docs", kind: "Docs", url: "https://example.com/reference-unique-e", summary: "Durable reference." }
            ]
        }
    }, "2026-06-15T00:00:00.000Z");
    const allItems = brief.sections.flatMap((section) => section.items);
    const urls = allItems.map((item) => item.url.toLowerCase());
    const titles = allItems.map((item) => item.title.toLowerCase());

    assert.equal(allItems.length, 13);
    assert.equal(new Set(urls).size, urls.length);
    assert.equal(new Set(titles).size, titles.length);
});

test("buildTodayBrief reports actual emitted item count for sparse input", () => {
    const brief = buildTodayBrief({
        trends: { updated: "2026-06-15", sourceMeta: [], items: [] },
        repos: { updated: "2026-06-15", sourceMeta: { status: "ok" }, repos: [] },
        packages: { updated: "2026-06-15", sourceMeta: { status: "ok" }, packages: [] },
        links: { updated: "2026-06-15", sourceMeta: { status: "ok" }, links: [] }
    }, "2026-06-15T00:00:00.000Z");

    assert.deepEqual(
        brief.sections.map((section) => section.items.length),
        [0, 0, 0]
    );
    assert.equal(brief.sourceMeta.count, 0);
    assert.equal(brief.sourceMeta.status, "partial");
});

test("Start here prefers trend movement over static references", () => {
    const brief = buildTodayBrief({
        trends: {
            items: [
                { title: "Fast trend", source: "Hacker News", category: "AI", score: 72, velocity: "20 comments", signal: "300 points", url: "https://example.com/trend-a", summary: "Moving now." },
                { title: "Repo trend", source: "GitHub", category: "AI", score: 71, velocity: "10K stars", signal: "1K forks", url: "https://example.com/trend-b", summary: "Moving now." },
                { title: "Package trend", source: "npm", category: "Tooling", score: 70, velocity: "5M/week", signal: "last week", url: "https://example.com/trend-c", summary: "Moving now." }
            ]
        },
        repos: { repos: [] },
        packages: { packages: [] },
        links: {
            links: [
                { title: "Reference A", category: "Docs", kind: "Docs", url: "https://example.com/reference-a", summary: "Durable reference." },
                { title: "Reference B", category: "Docs", kind: "Docs", url: "https://example.com/reference-b", summary: "Durable reference." },
                { title: "Reference C", category: "Docs", kind: "Docs", url: "https://example.com/reference-c", summary: "Durable reference." },
                { title: "Reference D", category: "Docs", kind: "Docs", url: "https://example.com/reference-d", summary: "Durable reference." }
            ]
        }
    }, "2026-06-15T00:00:00.000Z");

    assert.deepEqual(
        brief.sections.find((section) => section.id === "start").items.map((item) => item.module),
        ["Trends", "Trends", "Trends"]
    );
});

test("Reference shelf includes Links and excludes Hacker News trends", () => {
    const brief = buildTodayBrief(checkedInSources(), "2026-06-15T00:00:00.000Z");
    const referenceItems = brief.sections.find((section) => section.id === "reference").items;

    assert.ok(referenceItems.some((item) => item.module === "Links"));
    assert.ok(referenceItems.every((item) => !(item.module === "Trends" && item.origin === "Hacker News")));
});

test("Start here limits generic baseline packages when agent signals exist", () => {
    const brief = buildTodayBrief({
        trends: {
            items: [
                { title: "typescript", source: "npm", category: "JavaScript", score: 100, velocity: "250M/week", signal: "last week", url: "https://example.com/typescript", summary: "Broad package movement." },
                { title: "react", source: "npm", category: "JavaScript", score: 99, velocity: "150M/week", signal: "last week", url: "https://example.com/react", summary: "Broad package movement." },
                { title: "MCP agent runtime", source: "GitHub", category: "MCP", score: 70, velocity: "2K stars", signal: "200 forks", url: "https://example.com/mcp-runtime", summary: "Runtime for MCP agents." }
            ]
        },
        repos: {
            repos: [
                { name: "mattpocock/skills", category: "Agent skills", focus: "coding agent skills", starsLabel: "12K", url: "https://example.com/skills", summary: "Skills for coding agents." },
                { name: "openai/codex", category: "AI agents", focus: "terminal coding agent", starsLabel: "90K", url: "https://example.com/codex", summary: "Coding agent." }
            ]
        },
        packages: {
            packages: [
                { name: "mastra", category: "AI agents", focus: "TypeScript agent framework", downloadsLabel: "1M/week", url: "https://example.com/mastra" }
            ]
        },
        links: { links: [] }
    }, "2026-06-20T00:00:00.000Z");

    const startItems = brief.sections.find((section) => section.id === "start").items;

    assert.ok(startItems.filter((item) => ["typescript", "react"].includes(item.title)).length <= 1);
    assert.ok(startItems.some((item) => /skills|codex|MCP|mastra/i.test(item.title)));
});
