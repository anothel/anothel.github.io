import test from "node:test";
import assert from "node:assert/strict";

import {
    buildNpmDownloadsUrl,
    buildSourceMeta,
    classify,
    fetchGitHub,
    githubQueries,
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
            error: "fetch failed"
        },
        {
            name: "GitHub",
            status: "ok",
            count: 2,
            updatedAt: generatedAt
        },
        {
            name: "npm",
            status: "ok",
            count: 1,
            updatedAt: generatedAt
        }
    ]);
});

test("default trend inputs leave room for AI agent signals", () => {
    assert.equal(MAX_ITEMS, 24);
    assert.ok(npmPackages.includes("ai"));
    assert.ok(npmPackages.includes("openai"));
    assert.ok(npmPackages.includes("@anthropic-ai/sdk"));
    assert.ok(npmPackages.includes("@modelcontextprotocol/sdk"));
    assert.ok(githubQueries.some((item) => item.category === "AI agents"));
    assert.ok(githubQueries.some((item) => item.category === "Agent skills"));
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
                    description: "Example repository."
                }
            ]
        };
    });

    assert.equal(calls, githubQueries.length);
    assert.ok(rows.length >= githubQueries.length - 1);
    assert.ok(rows.every((row) => row.source === "GitHub"));
});
