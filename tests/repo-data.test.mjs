import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { buildRepoRows, collectRepos, prepareRepoDataForWrite, repoDefinitions } from "../scripts/update-repos.mjs";

function readJson(path) {
    return JSON.parse(readFileSync(path, "utf8"));
}

test("default repo definitions come from checked-in watchlist data", () => {
    assert.deepEqual(repoDefinitions, readJson("data/watchlists.json").repos);
});

test("buildRepoRows sorts repos by stars and formats rows", () => {
    const rows = buildRepoRows(
        [
            {
                full_name: "vitejs/vite",
                html_url: "https://github.com/vitejs/vite",
                description: "Next generation frontend tooling.",
                stargazers_count: 75000,
                forks_count: 6800,
                pushed_at: "2026-06-01T12:00:00Z",
                topics: ["frontend", "tooling"]
            },
            {
                full_name: "react/react",
                html_url: "https://github.com/react/react",
                description: "The library for web and native user interfaces.",
                stargazers_count: 240000,
                forks_count: 48000,
                pushed_at: "2026-06-03T12:00:00Z",
                topics: ["javascript", "ui"]
            }
        ],
        [
            { fullName: "react/react", category: "UI", focus: "frontend runtime" },
            { fullName: "vitejs/vite", category: "Tooling", focus: "build tool" }
        ]
    );

    assert.deepEqual(rows, [
        {
            rank: 1,
            name: "react/react",
            category: "UI",
            focus: "frontend runtime",
            stars: 240000,
            starsLabel: "240K",
            forksLabel: "48K",
            pushedAt: "2026-06-03",
            url: "https://github.com/react/react",
            summary: "The library for web and native user interfaces.",
            topics: ["javascript", "ui"]
        },
        {
            rank: 2,
            name: "vitejs/vite",
            category: "Tooling",
            focus: "build tool",
            stars: 75000,
            starsLabel: "75K",
            forksLabel: "6.8K",
            pushedAt: "2026-06-01",
            url: "https://github.com/vitejs/vite",
            summary: "Next generation frontend tooling.",
            topics: ["frontend", "tooling"]
        }
    ]);
});

test("buildRepoRows matches redirected or differently cased repo full names", () => {
    const rows = buildRepoRows(
        [
            {
                full_name: "PipedreamHQ/pipedream",
                html_url: "https://github.com/PipedreamHQ/pipedream",
                description: "Connect APIs and AI.",
                stargazers_count: 12000,
                forks_count: 1000,
                pushed_at: "2026-06-03T12:00:00Z",
                topics: ["automation"]
            }
        ],
        [
            {
                fullName: "pipedreamhq/pipedream",
                category: "Workflow automation",
                focus: "integration and workflow automation"
            }
        ]
    );

    assert.equal(rows.length, 1);
    assert.equal(rows[0].name, "pipedreamhq/pipedream");
    assert.equal(rows[0].category, "Workflow automation");
});

test("default repo watchlist tracks AI skills and agent projects", () => {
    const names = new Set(repoDefinitions.map((repo) => repo.fullName));
    const categories = new Set(repoDefinitions.map((repo) => repo.category));
    const categoryByName = new Map(repoDefinitions.map((repo) => [repo.fullName, repo.category]));

    assert.ok(repoDefinitions.length >= 28);
    assert.ok(categories.has("Agent skills"));
    assert.ok(categories.has("AI agents"));
    assert.ok(categories.has("MCP"));
    assert.ok(categories.has("AI engineering"));
    assert.ok(names.has("anthropics/skills"));
    assert.ok(names.has("mattpocock/skills"));
    assert.ok(names.has("openai/codex"));
    assert.ok(names.has("github/awesome-copilot"));
    assert.ok(names.has("modelcontextprotocol/servers"));
    assert.ok(names.has("modelcontextprotocol/typescript-sdk"));
    assert.ok(names.has("modelcontextprotocol/inspector"));
    assert.ok(names.has("contains-studio/agents"));
    assert.ok(names.has("karpathy/nanoGPT"));
    assert.ok(names.has("karpathy/nanochat"));
    assert.ok(names.has("karpathy/llm.c"));
    assert.ok(names.has("anomalyco/opencode"));
    assert.ok(names.has("aaif-goose/goose"));
    assert.ok(names.has("Aider-AI/aider"));
    assert.ok(names.has("google-gemini/gemini-cli"));
    assert.ok(names.has("openai/openai-agents-js"));
    assert.ok(names.has("openai/openai-agents-python"));
    assert.ok(names.has("modelcontextprotocol/python-sdk"));
    assert.ok(names.has("modelcontextprotocol/registry"));
    assert.ok(names.has("lastmile-ai/mcp-agent"));
    assert.ok(names.has("punkpeye/awesome-mcp-servers"));
    assert.equal(categoryByName.get("modelcontextprotocol/servers"), "MCP");
});

test("default repo watchlist expands AI evals and workflow automation", () => {
    const expanded = repoDefinitions.filter((item) =>
        ["AI evals", "Workflow automation"].includes(item.category)
    );
    const names = new Set(expanded.map((item) => item.fullName));

    assert.ok(expanded.length >= 8);
    assert.ok(names.has("promptfoo/promptfoo"));
    assert.ok(names.has("confident-ai/deepeval"));
    assert.ok(names.has("langfuse/langfuse"));
    assert.ok(names.has("microsoft/promptflow"));
    assert.ok(names.has("temporalio/sdk-typescript"));
    assert.ok(names.has("triggerdotdev/trigger.dev"));
    assert.ok(names.has("pipedreamhq/pipedream"));
});

test("checked-in repos include expanded AI agent and MCP coverage", () => {
    const data = readJson("data/repos.json");
    const names = new Set(data.repos.map((item) => item.name));
    const categories = new Set(data.repos.map((item) => item.category));
    const categoryByName = new Map(data.repos.map((item) => [item.name, item.category]));

    for (const name of [
        "anomalyco/opencode",
        "aaif-goose/goose",
        "Aider-AI/aider",
        "google-gemini/gemini-cli",
        "openai/openai-agents-js",
        "openai/openai-agents-python",
        "modelcontextprotocol/python-sdk",
        "modelcontextprotocol/registry",
        "lastmile-ai/mcp-agent",
        "punkpeye/awesome-mcp-servers"
    ]) {
        assert.ok(names.has(name), `${name} should be present in generated repos`);
    }

    for (const name of [
        "promptfoo/promptfoo",
        "langfuse/langfuse",
        "triggerdotdev/trigger.dev",
        "temporalio/sdk-typescript"
    ]) {
        assert.ok(names.has(name), `${name} should be present in generated repos`);
    }

    assert.equal(categoryByName.get("modelcontextprotocol/servers"), "MCP");
    assert.ok(categories.has("AI evals"));
    assert.ok(categories.has("Workflow automation"));
    assert.equal(data.sourceMeta.count, data.repos.length);
});

test("collectRepos keeps successful repos when one repo fetch fails", async () => {
    const data = await collectRepos(
        [
            { fullName: "react/react", category: "UI", focus: "frontend runtime" },
            { fullName: "openai/codex", category: "AI agents", focus: "terminal coding agent" }
        ],
        async (url) => {
            if (url.includes("openai/codex")) {
                throw new Error("GitHub rate limit");
            }

            return {
                full_name: "react/react",
                html_url: "https://github.com/react/react",
                description: "The library for web and native user interfaces.",
                stargazers_count: 240000,
                forks_count: 48000,
                pushed_at: "2026-06-03T12:00:00Z",
                topics: ["javascript", "ui"]
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
        { name: "openai/codex", error: "GitHub rate limit" }
    ]);
    assert.deepEqual(data.repos.map((item) => item.name), ["react/react"]);
});

test("collectRepos reports error when every repo fetch fails", async () => {
    const data = await collectRepos(
        [
            { fullName: "react/react", category: "UI", focus: "frontend runtime" },
            { fullName: "openai/codex", category: "AI agents", focus: "terminal coding agent" }
        ],
        async () => {
            throw new Error("GitHub unavailable");
        },
        "2026-06-19T00:00:00.000Z"
    );

    assert.equal(data.sourceMeta.status, "error");
    assert.equal(data.sourceMeta.count, 0);
    assert.equal(data.sourceMeta.tracked, 2);
    assert.equal(data.sourceMeta.emitted, 0);
    assert.equal(data.sourceMeta.coverage, "0/2");
    assert.equal(data.sourceMeta.errors.length, 2);
    assert.deepEqual(data.repos, []);
});

test("prepareRepoDataForWrite falls back to previous repos on empty refresh", () => {
    const prepared = prepareRepoDataForWrite(
        {
            updated: "2026-06-20",
            generatedAt: "2026-06-20T00:00:00.000Z",
            sourceMeta: {
                name: "GitHub",
                status: "error",
                count: 0,
                errors: [{ name: "openai/codex", error: "403 rate limit exceeded" }]
            },
            repos: []
        },
        {
            updated: "2026-06-19",
            generatedAt: "2026-06-19T00:00:00.000Z",
            sourceMeta: {
                name: "GitHub",
                status: "ok",
                count: 1
            },
            repos: [{ name: "openai/codex" }]
        }
    );

    assert.equal(prepared.sourceMeta.status, "fallback");
    assert.equal(prepared.sourceMeta.fallbackReason, "No repo rows fetched");
    assert.equal(prepared.sourceMeta.rateLimited, true);
    assert.deepEqual(prepared.repos, [{ name: "openai/codex" }]);
});
