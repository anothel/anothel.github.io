import test from "node:test";
import assert from "node:assert/strict";

import { buildRepoRows, collectRepos, repoDefinitions } from "../scripts/update-repos.mjs";

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

test("default repo watchlist tracks AI skills and agent projects", () => {
    const names = new Set(repoDefinitions.map((repo) => repo.fullName));
    const categories = new Set(repoDefinitions.map((repo) => repo.category));

    assert.ok(repoDefinitions.length >= 16);
    assert.ok(categories.has("Agent skills"));
    assert.ok(categories.has("AI agents"));
    assert.ok(categories.has("AI engineering"));
    assert.ok(names.has("anthropics/skills"));
    assert.ok(names.has("mattpocock/skills"));
    assert.ok(names.has("openai/codex"));
    assert.ok(names.has("github/awesome-copilot"));
    assert.ok(names.has("modelcontextprotocol/servers"));
    assert.ok(names.has("contains-studio/agents"));
    assert.ok(names.has("karpathy/nanoGPT"));
    assert.ok(names.has("karpathy/nanochat"));
    assert.ok(names.has("karpathy/llm.c"));
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
    assert.equal(data.sourceMeta.errors.length, 2);
    assert.deepEqual(data.repos, []);
});
