import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
    buildPackageDownloadUrl,
    buildPackageRows,
    collectPackages,
    packageDefinitions,
    preparePackageDataForWrite
} from "../scripts/update-packages.mjs";

function readJson(path) {
    return JSON.parse(readFileSync(path, "utf8"));
}

test("buildPackageRows sorts packages by downloads and formats rows", () => {
    const rows = buildPackageRows(
        [
            { package: "vite", downloads: 1200, start: "2026-06-01", end: "2026-06-07" },
            { package: "react", downloads: 9000, start: "2026-06-01", end: "2026-06-07" }
        ],
        [
            { name: "react", category: "UI", focus: "frontend runtime" },
            { name: "vite", category: "Tooling", focus: "build tool" }
        ]
    );

    assert.deepEqual(rows, [
        {
            rank: 1,
            name: "react",
            category: "UI",
            focus: "frontend runtime",
            downloads: 9000,
            downloadsLabel: "9K/week",
            period: "2026-06-01 to 2026-06-07",
            url: "https://www.npmjs.com/package/react"
        },
        {
            rank: 2,
            name: "vite",
            category: "Tooling",
            focus: "build tool",
            downloads: 1200,
            downloadsLabel: "1.2K/week",
            period: "2026-06-01 to 2026-06-07",
            url: "https://www.npmjs.com/package/vite"
        }
    ]);
});

test("buildPackageDownloadUrl encodes scoped package names", () => {
    assert.equal(
        buildPackageDownloadUrl("@modelcontextprotocol/sdk"),
        "https://api.npmjs.org/downloads/point/last-week/%40modelcontextprotocol%2Fsdk"
    );
});

test("default package watchlist tracks AI and agent SDK packages", () => {
    const names = new Set(packageDefinitions.map((item) => item.name));
    const categories = new Set(packageDefinitions.map((item) => item.category));

    for (const name of [
        "ai",
        "@ai-sdk/openai",
        "openai",
        "@anthropic-ai/sdk",
        "langchain",
        "@langchain/core",
        "@modelcontextprotocol/sdk",
        "mastra",
        "fastmcp",
        "opencode-ai",
        "@openai/agents",
        "@modelcontextprotocol/server-filesystem",
        "@modelcontextprotocol/server-github",
        "mcp-agent",
        "evalite",
        "braintrust"
    ]) {
        assert.ok(names.has(name), `${name} should be tracked`);
    }

    assert.ok(packageDefinitions.length >= 26);
    assert.ok(categories.has("AI SDK"));
    assert.ok(categories.has("AI agents"));
    assert.ok(categories.has("MCP"));
    assert.ok(categories.has("AI evals"));
});

test("default package watchlist expands AI evals and workflow automation", () => {
    const expanded = packageDefinitions.filter((item) =>
        ["AI evals", "Workflow automation"].includes(item.category)
    );
    const names = new Set(expanded.map((item) => item.name));

    assert.ok(expanded.length >= 8);
    assert.ok(names.has("promptfoo"));
    assert.ok(names.has("autoevals"));
    assert.ok(names.has("langfuse"));
    assert.ok(names.has("@trigger.dev/sdk"));
    assert.ok(names.has("@temporalio/workflow"));
    assert.ok(names.has("@temporalio/client"));
    assert.ok(names.has("n8n-workflow"));
});

test("checked-in packages include baseline and AI agent coverage", () => {
    const data = readJson("data/packages.json");
    const names = new Set(data.packages.map((item) => item.name));
    const categories = new Set(data.packages.map((item) => item.category));

    for (const name of [
        "react",
        "typescript",
        "playwright",
        "ai",
        "openai",
        "@modelcontextprotocol/sdk",
        "mastra",
        "opencode-ai",
        "@openai/agents",
        "@modelcontextprotocol/server-filesystem",
        "@modelcontextprotocol/server-github"
    ]) {
        assert.ok(names.has(name), `${name} should be present in generated packages`);
    }

    for (const name of [
        "promptfoo",
        "autoevals",
        "langfuse",
        "@trigger.dev/sdk",
        "@temporalio/workflow",
        "@temporalio/client"
    ]) {
        assert.ok(names.has(name), `${name} should be present in generated packages`);
    }

    assert.ok(categories.has("AI evals"));
    assert.ok(categories.has("Workflow automation"));
    assert.ok(data.packages.length >= 23);
    assert.equal(data.sourceMeta.count, data.packages.length);
});

test("collectPackages keeps successful packages when one package fetch fails", async () => {
    const data = await collectPackages(
        [
            { name: "react", category: "UI", focus: "frontend runtime" },
            { name: "openai", category: "AI SDK", focus: "OpenAI API SDK" }
        ],
        async (url) => {
            if (url.includes("openai")) {
                throw new Error("npm timeout");
            }

            return {
                package: "react",
                downloads: 9000,
                start: "2026-06-01",
                end: "2026-06-07"
            };
        },
        "2026-06-19T00:00:00.000Z"
    );

    assert.equal(data.sourceMeta.status, "partial");
    assert.equal(data.sourceMeta.count, 1);
    assert.equal(data.sourceMeta.tracked, 2);
    assert.equal(data.sourceMeta.emitted, 1);
    assert.equal(data.sourceMeta.coverage, "1/2");
    assert.deepEqual(data.sourceMeta.errors, [
        { name: "openai", error: "npm timeout" }
    ]);
    assert.deepEqual(data.packages.map((item) => item.name), ["react"]);
});

test("collectPackages retries transient package fetch failures before marking partial", async () => {
    const attempts = new Map();
    const data = await collectPackages(
        [
            { name: "react", category: "UI", focus: "frontend runtime" },
            { name: "braintrust", category: "AI evals", focus: "AI evals and observability" }
        ],
        async (url, definition) => {
            const count = (attempts.get(definition.name) || 0) + 1;
            attempts.set(definition.name, count);

            if (definition.name === "braintrust" && count === 1) {
                throw new Error("429 Too Many Requests");
            }

            return {
                package: definition.name,
                downloads: definition.name === "react" ? 9000 : 1200,
                start: "2026-06-01",
                end: "2026-06-07"
            };
        },
        "2026-06-19T00:00:00.000Z"
    );

    assert.equal(attempts.get("braintrust"), 2);
    assert.equal(data.sourceMeta.status, "ok");
    assert.equal(data.sourceMeta.coverage, "2/2");
    assert.deepEqual(data.packages.map((item) => item.name), ["react", "braintrust"]);
});

test("collectPackages reports error when every package fetch fails", async () => {
    const data = await collectPackages(
        [
            { name: "react", category: "UI", focus: "frontend runtime" },
            { name: "openai", category: "AI SDK", focus: "OpenAI API SDK" }
        ],
        async () => {
            throw new Error("npm unavailable");
        },
        "2026-06-19T00:00:00.000Z"
    );

    assert.equal(data.sourceMeta.status, "error");
    assert.equal(data.sourceMeta.count, 0);
    assert.equal(data.sourceMeta.tracked, 2);
    assert.equal(data.sourceMeta.emitted, 0);
    assert.equal(data.sourceMeta.coverage, "0/2");
    assert.equal(data.sourceMeta.errors.length, 2);
    assert.deepEqual(data.packages, []);
});

test("preparePackageDataForWrite falls back to previous packages on empty refresh", () => {
    const prepared = preparePackageDataForWrite(
        {
            updated: "2026-06-20",
            generatedAt: "2026-06-20T00:00:00.000Z",
            sourceMeta: {
                name: "npm",
                status: "error",
                count: 0,
                errors: [{ name: "react", error: "429 too many requests" }]
            },
            packages: []
        },
        {
            updated: "2026-06-19",
            generatedAt: "2026-06-19T00:00:00.000Z",
            sourceMeta: {
                name: "npm",
                status: "ok",
                count: 1
            },
            packages: [{ name: "react" }]
        }
    );

    assert.equal(prepared.sourceMeta.status, "fallback");
    assert.equal(prepared.sourceMeta.fallbackUsed, true);
    assert.equal(prepared.sourceMeta.staleButSafe, true);
    assert.equal(prepared.sourceMeta.rateLimited, true);
    assert.deepEqual(prepared.packages, [{ name: "react" }]);
});
