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
        packages: {
            sourceMeta: {
                name: "npm",
                status: "partial",
                count: 1,
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
    assert.match(markdown, /\| packages \| npm \| error \| 0 \| 2026-06-19T00:00:00.000Z \| timeout \\| retry later \|/);
    assert.match(markdown, /Non-ok sources: 2/);
});
