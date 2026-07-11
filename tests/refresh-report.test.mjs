import test from "node:test";
import assert from "node:assert/strict";
import { buildRefreshReport, renderRefreshMarkdown } from "../scripts/report-refresh.mjs";

const manifest = {
    updated: "2026-06-19",
    modules: [
        {
            id: "packages",
            title: "Package watchlist",
            data: "data/packages.json",
            source: "npm",
            status: "partial",
            count: 1,
            updated: "2026-06-19"
        },
        {
            id: "trends",
            title: "Tech trends",
            data: "data/trends.json",
            source: "GitHub, npm",
            status: "ok",
            count: 2,
            updated: "2026-06-19"
        }
    ]
};

test("refresh report summarizes module and source health", () => {
    const report = buildRefreshReport(manifest, {
        __changedFiles: ["data/packages.json"],
        __runContext: {
            reason: "manual retry",
            eventName: "workflow_dispatch",
            runId: "123",
            refName: "main"
        },
        packages: {
            sourceMeta: {
                name: "npm",
                status: "partial",
                count: 1,
                tracked: 2,
                emitted: 1,
                coverage: "1/2",
                updatedAt: "2026-06-19T00:00:00.000Z",
                errors: [{ name: "vite", error: "503 Service Unavailable" }]
            }
        },
        trends: {
            sourceMeta: [
                { name: "GitHub", status: "ok", count: 1, updatedAt: "2026-06-19T00:00:00.000Z" },
                { name: "npm", status: "ok", count: 1, updatedAt: "2026-06-19T00:00:00.000Z" }
            ]
        }
    }, "2026-06-20T00:00:00.000Z");

    assert.equal(report.totals.modules, 2);
    assert.equal(report.totals.sources, 3);
    assert.equal(report.totals.items, 3);
    assert.equal(report.totals.status, "partial");
    assert.equal(report.totals.errors, 1);
    assert.equal(report.modules[0].changed, true);
    assert.deepEqual(report.changedModules, [{ id: "packages", title: "Package watchlist", count: 1, updated: "2026-06-19" }]);
    assert.deepEqual(report.runContext, {
        reason: "manual retry",
        eventName: "workflow_dispatch",
        runId: "123",
        refName: "main"
    });
    assert.equal(report.modules[0].sources[0].coverage, "1/2");
    assert.deepEqual(report.modules[0].sources[0].errors, ["vite: 503 Service Unavailable"]);
});

test("refresh report renders markdown for GitHub step summary", () => {
    const report = buildRefreshReport(manifest, {
        packages: {
            sourceMeta: {
                name: "npm",
                status: "error",
                count: 0,
                updatedAt: "2026-06-19T00:00:00.000Z",
                error: "timeout | retry later"
            }
        }
    }, "2026-06-20T00:00:00.000Z");
    const markdown = renderRefreshMarkdown(report, { reason: "manual retry" });

    assert.match(markdown, /# Data refresh report/);
    assert.match(markdown, /Reason: manual retry/);
    assert.match(markdown, /Changed modules: none recorded/);
    assert.match(markdown, /\| packages \| npm \| error \| 0 \| 2026-06-19T00:00:00.000Z \| timeout \\| retry later \|/);
    assert.match(markdown, /Non-ok sources: 2/);
});

test("refresh report markdown lists changed modules", () => {
    const report = buildRefreshReport(manifest, {
        __changedFiles: ["data/packages.json"],
        packages: { sourceMeta: { name: "npm", status: "ok", count: 1 } }
    }, "2026-06-20T00:00:00.000Z");
    const markdown = renderRefreshMarkdown(report);

    assert.match(markdown, /Changed modules: packages/);
});

test("refresh report renders optional source coverage", () => {
    const report = buildRefreshReport(manifest, {
        packages: {
            sourceMeta: {
                name: "npm",
                status: "partial",
                count: 1,
                tracked: 3,
                emitted: 1,
                coverage: "1/3",
                updatedAt: "2026-06-19T00:00:00.000Z"
            }
        }
    }, "2026-06-20T00:00:00.000Z");
    const markdown = renderRefreshMarkdown(report);

    assert.match(markdown, /\| packages \| npm \| partial \| 1 \| 2026-06-19T00:00:00.000Z \| 1\/3 \|/);
});

test("refresh report renders fallback safety flags", () => {
    const report = buildRefreshReport(manifest, {
        packages: {
            sourceMeta: {
                name: "npm",
                status: "fallback",
                count: 1,
                updatedAt: "2026-06-20T00:00:00.000Z",
                fallbackUsed: true,
                staleButSafe: true,
                fallbackReason: "No package rows fetched",
                previousUpdated: "2026-06-19T00:00:00.000Z",
                rateLimited: true
            }
        }
    }, "2026-06-20T00:00:00.000Z");
    const markdown = renderRefreshMarkdown(report);

    assert.equal(report.modules[0].sources[0].fallbackUsed, true);
    assert.match(markdown, /fallback used/);
    assert.match(markdown, /stale but safe/);
    assert.match(markdown, /rate limited/);
    assert.match(markdown, /No package rows fetched/);
});

test("refresh report carries consecutive npm 429 partial run counts from prior report", () => {
    const priorReport = {
        modules: [
            {
                id: "packages",
                sources: [
                    {
                        source: "npm",
                        status: "partial",
                        consecutiveRateLimitedRuns: 2,
                        errors: ["n8n-workflow: 429 Too Many Requests: https://api.npmjs.org/downloads/point/last-week/n8n-workflow"]
                    }
                ]
            }
        ]
    };
    const report = buildRefreshReport(manifest, {
        packages: {
            sourceMeta: {
                name: "npm",
                status: "partial",
                count: 25,
                updatedAt: "2026-06-30T00:00:00.000Z",
                errors: [{ name: "n8n-workflow", error: "429 Too Many Requests: https://api.npmjs.org/downloads/point/last-week/n8n-workflow" }],
                rateLimited: true
            }
        }
    }, "2026-06-30T00:00:00.000Z", priorReport);

    assert.equal(report.modules[0].sources[0].consecutiveRateLimitedRuns, 3);
    assert.equal(report.modules[0].sources[0].safetyDetails.at(-1), "consecutive 429 x3");
});

test("refresh report resets consecutive 429 tracking when current run is not the same 429 partial", () => {
    const priorReport = {
        modules: [
            {
                id: "packages",
                sources: [
                    {
                        source: "npm",
                        status: "partial",
                        consecutiveRateLimitedRuns: 4,
                        errors: ["n8n-workflow: 429 Too Many Requests: https://api.npmjs.org/downloads/point/last-week/n8n-workflow"]
                    }
                ]
            }
        ]
    };
    const report = buildRefreshReport(manifest, {
        packages: {
            sourceMeta: {
                name: "npm",
                status: "partial",
                count: 25,
                updatedAt: "2026-06-30T00:00:00.000Z",
                errors: [{ name: "n8n-workflow", error: "503 Service Unavailable" }],
                rateLimited: true
            }
        }
    }, "2026-06-30T00:00:00.000Z", priorReport);

    assert.equal(report.modules[0].sources[0].consecutiveRateLimitedRuns, 0);
    assert.equal(report.modules[0].sources[0].safetyDetails.includes("consecutive 429"), false);
});
