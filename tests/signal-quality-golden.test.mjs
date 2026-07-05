import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

import { buildTodayBrief } from "../scripts/update-today.mjs";

const require = createRequire(import.meta.url);
const signalSchema = require("../js/signal-schema.js");

function fixtureSources() {
    return {
        trends: {
            updated: "2026-06-20",
            sourceMeta: [],
            items: [
                { title: "typescript", source: "npm", category: "JavaScript", score: 100, velocity: "250M/week", signal: "last week", url: "https://example.com/typescript", summary: "Broad package movement." },
                { title: "vite", source: "npm", category: "Frontend", score: 99, velocity: "90M/week", signal: "last week", url: "https://example.com/vite", summary: "Broad package movement." },
                { title: "Zero-Touch OAuth for MCP", source: "Hacker News", category: "MCP", score: 74, velocity: "120 comments", signal: "420 points", url: "https://example.com/mcp-oauth", summary: "MCP auth flow for agent tools." },
                { title: "promptfoo eval workflow", source: "GitHub", category: "AI evals", score: 73, velocity: "8K stars", signal: "1K forks", url: "https://example.com/promptfoo", summary: "LLM evals and prompt testing." },
                { title: "trigger.dev durable workflow", source: "GitHub", category: "Workflow automation", score: 72, velocity: "10K stars", signal: "900 forks", url: "https://example.com/trigger", summary: "Durable workflow automation for agents." }
            ]
        },
        repos: {
            updated: "2026-06-20",
            sourceMeta: { status: "ok" },
            repos: [
                { rank: 1, name: "react/react", category: "Frontend", focus: "frontend runtime", stars: 250000, starsLabel: "250K", url: "https://example.com/react-repo", summary: "UI library." },
                { rank: 2, name: "openai/codex", category: "AI agents", focus: "terminal coding agent", stars: 92000, starsLabel: "92K", url: "https://example.com/codex", summary: "Coding agent." },
                { rank: 3, name: "mattpocock/skills", category: "Agent skills", focus: "coding agent skills", stars: 12000, starsLabel: "12K", url: "https://example.com/skills", summary: "Reusable skills." },
                { rank: 4, name: "langfuse/langfuse", category: "AI evals", focus: "LLM observability and evals", stars: 15000, starsLabel: "15K", url: "https://example.com/langfuse", summary: "LLM observability." }
            ]
        },
        packages: {
            updated: "2026-06-20",
            sourceMeta: { status: "ok" },
            packages: [
                { rank: 1, name: "typescript", category: "Language", focus: "typed JavaScript", downloads: 250000000, downloadsLabel: "250M/week", url: "https://example.com/typescript-npm" },
                { rank: 2, name: "react", category: "Frontend", focus: "frontend runtime", downloads: 120000000, downloadsLabel: "120M/week", url: "https://example.com/react-npm" },
                { rank: 3, name: "mastra", category: "AI agents", focus: "TypeScript agent framework", downloads: 500000, downloadsLabel: "500K/week", url: "https://example.com/mastra" },
                { rank: 4, name: "@modelcontextprotocol/sdk", category: "MCP", focus: "MCP TypeScript SDK", downloads: 700000, downloadsLabel: "700K/week", url: "https://example.com/mcp-sdk" },
                { rank: 5, name: "promptfoo", category: "AI evals", focus: "LLM evals and prompt testing", downloads: 450000, downloadsLabel: "450K/week", url: "https://example.com/promptfoo-npm" },
                { rank: 6, name: "@trigger.dev/sdk", category: "Workflow automation", focus: "durable workflow SDK", downloads: 200000, downloadsLabel: "200K/week", url: "https://example.com/trigger-npm" }
            ]
        },
        links: {
            updated: "2026-06-20",
            sourceMeta: { status: "ok" },
            links: [
                { rank: 1, title: "Agents SDK docs", category: "AI agents", kind: "Docs", url: "https://example.com/agents-docs", summary: "Agent workflow reference." },
                { rank: 2, title: "MCP TypeScript SDK", category: "MCP", kind: "Docs", url: "https://example.com/mcp-docs", summary: "Protocol SDK reference." },
                { rank: 3, title: "Evalite docs", category: "AI evals", kind: "Docs", url: "https://example.com/evalite", summary: "Evaluation workflow docs." }
            ]
        }
    };
}

function actualGolden() {
    const sources = fixtureSources();
    const explore = signalSchema.normalizeSignalData(sources)
        .sort(signalSchema.compareSignalPriority)
        .slice(0, 8)
        .map((item) => ({
            title: item.title,
            module: item.module,
            category: item.category,
            score: item.score,
            reasons: item.scoreReasons
        }));
    const todayStart = buildTodayBrief(sources, "2026-06-20T00:00:00.000Z")
        .sections.find((section) => section.id === "start").items
        .map((item) => ({
            title: item.title,
            module: item.module,
            category: item.category,
            reasons: item.scoreReasons
        }));

    return { explore, todayStart };
}

function checkedInSources() {
    return {
        trends: JSON.parse(readFileSync("data/trends.json", "utf8")),
        packages: JSON.parse(readFileSync("data/packages.json", "utf8")),
        repos: JSON.parse(readFileSync("data/repos.json", "utf8")),
        links: JSON.parse(readFileSync("data/links.json", "utf8"))
    };
}

test("signal quality golden fixture keeps agent workflow signals above broad baseline tooling", () => {
    const expected = JSON.parse(readFileSync("tests/fixtures/signal-quality-golden.json", "utf8"));
    const actual = actualGolden();
    const todayBaseline = actual.todayStart.filter((item) => ["typescript", "react", "vite"].includes(item.title));
    const exploreBaseline = actual.explore.filter((item) => ["typescript", "react", "react/react", "vite"].includes(item.title));

    assert.deepEqual(actual, expected);
    assert.deepEqual(exploreBaseline, []);
    assert.ok(todayBaseline.length <= 1);
    assert.ok(actual.todayStart.some((item) => ["MCP", "Agent skills", "AI evals", "Workflow automation", "AI agents"].includes(item.category)));
});

test("checked-in top signals stay within supported topics", () => {
    const sources = checkedInSources();
    const allowed = new Set(["MCP", "Agent skills", "AI evals", "Workflow automation", "AI agents"]);
    const baselineTitles = new Set(JSON.parse(readFileSync("data/signal-policy.json", "utf8")).baselineTitles);
    const exploreTop = signalSchema.normalizeSignalData(sources)
        .sort(signalSchema.compareSignalPriority)
        .slice(0, 10);
    const todayStart = buildTodayBrief(sources, sources.trends.generatedAt)
        .sections.find((section) => section.id === "start").items;

    assert.equal(exploreTop.filter((item) => allowed.has(item.category)).length, exploreTop.length);
    assert.equal(todayStart.filter((item) => allowed.has(item.category)).length, todayStart.length);
    assert.deepEqual(exploreTop.filter((item) => baselineTitles.has(item.title.toLowerCase())).map((item) => item.title), []);
});

test("signal priority uses source rank before title when scores saturate", () => {
    const sources = {
        trends: {
            updated: "2026-07-03",
            sourceMeta: [],
            items: [
                { rank: 1, title: "activepieces/activepieces", source: "GitHub", category: "Workflow automation", score: 100, velocity: "23K stars", signal: "3K forks", url: "https://example.com/activepieces", summary: "AI workflow automation." },
                { rank: 14, title: "@ai-sdk/provider", source: "npm", category: "AI", score: 89, velocity: "25M/week", signal: "last week", url: "https://example.com/provider", summary: "AI SDK provider." }
            ]
        },
        packages: {
            updated: "2026-07-03",
            sourceMeta: [],
            packages: [
                { rank: 1, name: "@ai-sdk/provider", category: "AI SDK", focus: "AI SDK provider interface", downloads: 25000000, downloadsLabel: "25M/week", url: "https://example.com/provider" }
            ]
        },
        repos: { updated: "2026-07-03", sourceMeta: [], repos: [] },
        links: { updated: "2026-07-03", sourceMeta: [], links: [] }
    };

    const sorted = signalSchema.normalizeSignalData(sources).sort(signalSchema.compareSignalPriority);

    assert.equal(sorted[0].title, "activepieces/activepieces");
    assert.equal(sorted[1].title, "@ai-sdk/provider");
    assert.equal(sorted[0].score, sorted[1].score);
});

test("shared signal normalization caps broad repo short names", () => {
    const sources = {
        trends: { updated: "2026-07-03", sourceMeta: [], items: [] },
        packages: { updated: "2026-07-03", sourceMeta: [], packages: [] },
        repos: {
            updated: "2026-07-03",
            sourceMeta: [],
            repos: [
                {
                    rank: 1,
                    name: "facebook/react",
                    category: "Frontend",
                    focus: "frontend runtime",
                    stars: 1000000000,
                    starsLabel: "1B",
                    url: "https://example.com/react",
                    summary: "UI runtime."
                },
                {
                    rank: 2,
                    name: "openai/codex",
                    category: "AI agents",
                    focus: "terminal coding agent",
                    stars: 92000,
                    starsLabel: "92K",
                    url: "https://example.com/codex",
                    summary: "Coding agent."
                }
            ]
        },
        links: { updated: "2026-07-03", sourceMeta: [], links: [] }
    };

    const sorted = signalSchema.normalizeSignalData(sources).sort(signalSchema.compareSignalPriority);
    const byTitle = Object.fromEntries(sorted.map((item) => [item.title, item]));

    assert.equal(sorted[0].title, "openai/codex");
    assert.ok(byTitle["facebook/react"].score <= 76);
});
