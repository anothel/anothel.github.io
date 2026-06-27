import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
    buildNpmDownloadsUrl,
    buildSourceMeta,
    buildTrendFailureData,
    classify,
    fetchGitHub,
    githubRepoQuality,
    githubQueries,
    prepareTrendDataForWrite,
    scoreHackerNewsStory,
    selectTrendItems,
    MAX_ITEMS,
    npmPackages
} from "../scripts/update-trends.mjs";
import { activeItems, activeNames } from "../scripts/watchlist-governance.mjs";

function readJson(path) {
    return JSON.parse(readFileSync(path, "utf8"));
}

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
    const watchlists = readJson("data/watchlists.json");

    assert.deepEqual(npmPackages, activeNames(watchlists.trends.npmPackages));
    assert.deepEqual(githubQueries, activeItems(watchlists.trends.githubQueries));
    assert.equal(MAX_ITEMS, 24);
    assert.ok(npmPackages.includes("ai"));
    assert.ok(npmPackages.includes("openai"));
    assert.ok(npmPackages.includes("@anthropic-ai/sdk"));
    assert.ok(npmPackages.includes("@modelcontextprotocol/sdk"));
    assert.ok(npmPackages.includes("mastra"));
    assert.ok(npmPackages.includes("@ai-sdk/openai"));
    assert.ok(npmPackages.includes("promptfoo"));
    assert.ok(npmPackages.includes("@trigger.dev/sdk"));
    assert.ok(githubQueries.some((item) => item.category === "AI agents"));
    assert.ok(githubQueries.some((item) => item.category === "Agent skills"));
    assert.ok(githubQueries.some((item) => item.category === "MCP"));
    assert.ok(githubQueries.some((item) => item.category === "AI evals"));
    assert.ok(githubQueries.some((item) => item.category === "Workflow automation"));
    assert.ok(githubQueries.some((item) => item.query.includes("opencode")));
    assert.ok(githubQueries.every((item) => item.category !== "Frontend"));
});

test("selectTrendItems preserves expanded coverage before filling by score", () => {
    const items = [
        ...Array.from({ length: 12 }, (_, index) => ({
            title: `agent-${index}`,
            source: "GitHub",
            category: "AI agents",
            score: 100 - index,
            url: `https://example.com/agent-${index}`
        })),
        {
            title: "promptfoo",
            source: "npm",
            category: "AI evals",
            score: 54,
            url: "https://example.com/promptfoo"
        },
        {
            title: "trigger.dev",
            source: "GitHub",
            category: "Workflow automation",
            score: 53,
            url: "https://example.com/trigger"
        }
    ];
    const selected = selectTrendItems(items, 12);
    const categories = new Set(selected.map((item) => item.category));

    assert.equal(selected.length, 12);
    assert.ok(categories.has("AI evals"));
    assert.ok(categories.has("Workflow automation"));
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
    assert.equal(classify("promptfoo"), "AI evals");
    assert.equal(classify("@trigger.dev/sdk"), "Workflow automation");
});

test("checked-in trends include expanded coverage categories", () => {
    const data = readJson("data/trends.json");
    const categories = new Set(data.items.map((item) => item.category));

    assert.ok(categories.has("AI evals"));
    assert.ok(categories.has("Workflow automation"));
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
    assert.equal(rows.length, Math.min(12, githubQueries.length - 1));
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

test("prepareTrendDataForWrite falls back to previous trends on empty refresh", () => {
    const prepared = prepareTrendDataForWrite(
        {
            updated: "2026-06-20",
            generatedAt: "2026-06-20T00:00:00.000Z",
            sourceMeta: [
                { name: "GitHub", status: "error", count: 0, error: "403 rate limit exceeded" }
            ],
            items: []
        },
        {
            updated: "2026-06-19",
            generatedAt: "2026-06-19T00:00:00.000Z",
            sourceMeta: [
                { name: "GitHub", status: "ok", count: 1 }
            ],
            items: [{ title: "openai/codex" }]
        }
    );

    assert.equal(prepared.sourceMeta[0].status, "fallback");
    assert.equal(prepared.sourceMeta[0].fallbackUsed, true);
    assert.equal(prepared.sourceMeta[0].rateLimited, true);
    assert.deepEqual(prepared.items, [{ title: "openai/codex" }]);
});

test("prepareTrendDataForWrite preserves previous source rows for partial rate limits", () => {
    const prepared = prepareTrendDataForWrite(
        {
            updated: "2026-06-20",
            generatedAt: "2026-06-20T00:00:00.000Z",
            sourceMeta: [
                { name: "GitHub", status: "error", count: 0, tracked: 14, emitted: 0, coverage: "0/14", error: "403 rate limit exceeded" },
                { name: "npm", status: "ok", count: 1, tracked: 19, emitted: 1, coverage: "1/19" }
            ],
            items: [
                { rank: 1, title: "ai", source: "npm", score: 80, url: "https://www.npmjs.com/package/ai" }
            ]
        },
        {
            updated: "2026-06-19",
            generatedAt: "2026-06-19T00:00:00.000Z",
            sourceMeta: [
                { name: "GitHub", status: "ok", count: 1 },
                { name: "npm", status: "ok", count: 1 }
            ],
            items: [
                { rank: 1, title: "openai/codex", source: "GitHub", score: 95, url: "https://github.com/openai/codex" },
                { rank: 2, title: "ai", source: "npm", score: 80, url: "https://www.npmjs.com/package/ai" }
            ]
        }
    );

    assert.equal(prepared.sourceMeta[0].status, "fallback");
    assert.equal(prepared.sourceMeta[0].staleButSafe, true);
    assert.equal(prepared.sourceMeta[0].rateLimited, true);
    assert.equal(prepared.sourceMeta[0].count, 1);
    assert.deepEqual(prepared.items.map((item) => item.title), ["openai/codex", "ai"]);
});

test("buildTrendFailureData creates empty fallback candidate when collection throws", () => {
    assert.deepEqual(buildTrendFailureData(new Error("No trend items fetched"), "2026-06-20T00:00:00.000Z"), {
        updated: "2026-06-20",
        generatedAt: "2026-06-20T00:00:00.000Z",
        sources: ["Hacker News", "GitHub", "npm"],
        sourceMeta: [
            {
                name: "trends",
                status: "error",
                count: 0,
                error: "No trend items fetched",
                updatedAt: "2026-06-20T00:00:00.000Z"
            }
        ],
        items: []
    });
});
