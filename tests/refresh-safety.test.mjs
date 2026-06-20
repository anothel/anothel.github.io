import test from "node:test";
import assert from "node:assert/strict";

import {
    applyEmptyCollectionFallback,
    isRateLimitError,
    sourceSafetyFlags
} from "../scripts/refresh-safety.mjs";

test("isRateLimitError detects common API rate limit failures", () => {
    assert.equal(isRateLimitError("403 rate limit exceeded: https://api.github.com/search/repositories"), true);
    assert.equal(isRateLimitError("API rate limit exceeded for user"), true);
    assert.equal(isRateLimitError("npm timeout"), false);
});

test("sourceSafetyFlags summarizes source errors", () => {
    assert.deepEqual(sourceSafetyFlags([
        { name: "GitHub", error: "403 rate limit exceeded" },
        { name: "npm", error: "socket timeout" }
    ]), {
        errorCount: 2,
        rateLimited: true
    });
});

test("applyEmptyCollectionFallback keeps previous non-empty data and marks stale safe fallback", () => {
    const nextData = {
        updated: "2026-06-20",
        generatedAt: "2026-06-20T00:00:00.000Z",
        sourceMeta: {
            name: "GitHub",
            status: "error",
            count: 0,
            errors: [{ name: "openai/codex", error: "403 rate limit exceeded" }]
        },
        repos: []
    };
    const previousData = {
        updated: "2026-06-19",
        generatedAt: "2026-06-19T00:00:00.000Z",
        sourceMeta: {
            name: "GitHub",
            status: "ok",
            count: 1
        },
        repos: [{ name: "openai/codex" }]
    };

    assert.deepEqual(applyEmptyCollectionFallback(nextData, previousData, {
        collection: "repos",
        fallbackReason: "No repo rows fetched"
    }), {
        updated: "2026-06-19",
        generatedAt: "2026-06-20T00:00:00.000Z",
        sourceMeta: {
            name: "GitHub",
            status: "fallback",
            count: 1,
            fallbackUsed: true,
            staleButSafe: true,
            fallbackReason: "No repo rows fetched",
            previousUpdated: "2026-06-19",
            attemptedAt: "2026-06-20T00:00:00.000Z",
            rateLimited: true,
            errors: [{ name: "openai/codex", error: "403 rate limit exceeded" }]
        },
        repos: [{ name: "openai/codex" }]
    });
});

test("applyEmptyCollectionFallback keeps next data when it has rows", () => {
    const nextData = { sourceMeta: { status: "ok" }, packages: [{ name: "react" }] };
    const previousData = { sourceMeta: { status: "ok" }, packages: [{ name: "old" }] };

    assert.equal(applyEmptyCollectionFallback(nextData, previousData, {
        collection: "packages",
        fallbackReason: "No package rows fetched"
    }), nextData);
});
