import test from "node:test";
import assert from "node:assert/strict";

import { buildSourceMeta } from "../scripts/update-trends.mjs";

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
