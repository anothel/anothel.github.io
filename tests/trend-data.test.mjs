import test from "node:test";
import assert from "node:assert/strict";

import {
    buildNpmDownloadsUrl,
    buildSourceMeta,
    classify,
    fetchGitHub,
    githubRepoQuality,
    githubQueries,
    scoreHackerNewsStory,
    MAX_ITEMS,
    npmPackages
} from "../scripts/update-trends.mjs";

test("buildSourceMeta records source status and item counts", () => {
    const generatedAt = "2026-06-14T00:00:00.000Z";
    const items = [
        { source: "GitHub", title: "repo" },
        { source: "GitHub", title: "repo 2" },
        { source: "npm", title: "package" }
    ];
    const results = [
        { name: "Hacker News", ok: false, error: "fetch failed" },
        { name: "GitHub", ok: true },
        { name: "npm", ok: true }
    ];

    assert.deepEqual(buildSourceMeta(items, results, generatedAt), [
        {
            name: "Hacker News",
            status: "error",
            count: 0,
            updatedAt: generatedAt,
            tracked: 1,
            emitted: 0,
            coverage: "0/1",
            error: "fetch failed"
        },
        {
            name: "GitHub",
            status: "ok",
            count: 2,
            updatedAt: generatedAt,
            tracked: 1,
            emitted: 2,
            coverage: "2/1"
        },
        {
            name: "npm",
            status: "ok",
            count: 1,
            updatedAt: generatedAt,
            tracked: 1,
            emitted: 1,
            coverage: "1/1"
        }
    ]);
});

test("default trend inputs leave room for AI agent signals", () => {
    assert.equal(MAX_ITEMS, 24);
    assert.ok(npmPackages.includes("ai"));
    assert.ok(npmPackages.includes("openai"));
    assert.ok(npmPackages.includes("@anthropic-ai/sdk"));
    assert.ok(npmPackages.includes("@modelcontextprotocol/sdk"));
    assert.ok(npmPackages.includes("mastra"));
    assert.ok(npmPackages.includes("@ai-sdk/openai"));
    assert.ok(githubQueries.some((item) => item.category === "AI agents"));
    assert.ok(githubQueries.some((item) => item.category === "Agent skills"));
    assert.ok(githubQueries.some((item) => item.category === "MCP"));
    assert.ok(githubQueries.some((item) => item.category === "AI evals"));
    assert.ok(githubQueries.some((item) => item.query.includes("opencode")));
    assert.ok(githubQueries.every((item) => item.category !== "Frontend"));
});

test("buildNpmDownloadsUrl supports scoped package names", () => {
    assert.equal(
        buildNpmDownloadsUrl("@anthropic-ai/sdk"),
        "https://api.npmjs.org/downloads/point/last-week/%40anthropic-ai%2Fsdk"
    );
});

test("classify matches AI as a real token, not inside unrelated package names", () => {
    assert.equal(classify("tailwindcss"), "Frontend");
    assert.equal(classify("ai"), "AI");
    assert.equal(classify("@anthropic-ai/sdk"), "AI");
    assert.equal(classify("claude code agents"), "AI");
});

test("fetchGitHub keeps successful query results when one query fails", async () => {
    let calls = 0;
    const rows = await fetchGitHub(async () => {
        calls += 1;
        if (calls === 2) {
            throw new Error("rate limit exceeded");
        }

        return {
            items: [
                {
                    full_name: `example/repo-${calls}`,
                    stargazers_count: 1000 + calls,
                    forks_count: 100 + calls,
                    html_url: `https://github.com/example/repo-${calls}`,
                    description: "AI agent skills, MCP eval benchmark, TypeScript developer tools workflow repository.",
                    topics: ["ai-agent", "mcp", "skills", "evals", "typescript"]
                }
            ]
        };
    });

    assert.equal(calls, githubQueries.length);
    assert.ok(rows.length >= githubQueries.length - 1);
    assert.ok(rows.every((row) => row.source === "GitHub"));
});

test("fetchGitHub strips non-ASCII mojibake from summaries", async () => {
    const rows = await fetchGitHub(async () => ({
        items: [
            {
                full_name: "example/agent",
                stargazers_count: 1200,
                forks_count: 120,
                html_url: "https://github.com/example/agent",
                description: "Claude Code agent harness ?\uBC47ike ?\uB61Egent workflow",
                topics: ["ai-agent", "claude-code"]
            }
        ]
    }));

    assert.ok(rows.length > 0);
    assert.doesNotMatch(rows[0].summary, /[^\x00-\x7F]/);
    assert.match(rows[0].summary, /Claude Code agent harness/);
});

test("githubRepoQuality promotes agent infrastructure over broad adjacent repos", () => {
    const agentRepo = {
        full_name: "mattpocock/skills",
        description: "Reusable agent skills for coding workflows",
        topics: ["agents", "skills"],
        stargazers_count: 1200
    };
    const adjacentRepo = {
        full_name: "thedaviddias/Front-End-Checklist",
        description: "The essential checklist for modern web development, for humans and AI agents",
        topics: ["frontend", "checklist"],
        stargazers_count: 73000
    };

    assert.ok(
        githubRepoQuality(agentRepo, "Agent skills") > githubRepoQuality(adjacentRepo, "Agent skills"),
        "agent skills repo should outrank broad frontend checklist despite fewer stars"
    );
    assert.equal(githubRepoQuality(adjacentRepo, "AI agents"), 0);
});

test("scoreHackerNewsStory downranks general news without technical intent", () => {
    assert.ok(
        scoreHackerNewsStory({ title: "Zero-Touch OAuth for MCP", score: 80, descendants: 10 }) >
        scoreHackerNewsStory({ title: "Swiss parliament lifts ban on new nuclear power plants", score: 638, descendants: 488 })
    );
});
