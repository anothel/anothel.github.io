import test from "node:test";
import assert from "node:assert/strict";
import { buildStatusDashboard } from "../src/lib/status-data.mjs";

const now = "2026-06-24T00:00:00.000Z";

test("status dashboard distinguishes stale, failed, empty, fallback, and unknown sources", () => {
    const dashboard = buildStatusDashboard({
        now,
        manifest: { modules: [
            { id: "trends", title: "Trends", route: "trends/index.html", data: "data/trends.json" },
            { id: "packages", title: "Packages", route: "packages/index.html", data: "data/packages.json" },
            { id: "repos", title: "Repos", route: "repos/index.html", data: "data/repos.json" },
            { id: "links", title: "Links", route: "links/index.html", data: "data/links.json" }
        ] },
        datasets: {
            trends: { sourceMeta: { name: "HN", status: "ok", count: 2, updatedAt: "2026-06-19T00:00:00.000Z" } },
            packages: { sourceMeta: { name: "npm", status: "error", count: 0, error: "503 unavailable" } },
            repos: { sourceMeta: { name: "GitHub", status: "ok", count: 0, updatedAt: "2026-06-24T00:00:00.000Z" } },
            links: { sourceMeta: { name: "manual", status: "fallback", count: 3, previousUpdated: "2026-06-20T00:00:00.000Z", fallbackUsed: true } }
        },
        report: { generatedAt: now, totals: { status: "partial" } },
        validation: { errors: [], warnings: [] }
    });

    assert.deepEqual(dashboard.rows.map((row) => row.availability), ["available", "failed", "empty", "fallback"]);
    assert.deepEqual(dashboard.rows.map((row) => row.health), ["stale", "unavailable", "healthy", "degraded"]);
    assert.equal(dashboard.counts.empty, 1);
    assert.equal(dashboard.counts.failed, 1);
    assert.equal(dashboard.counts.unknown, 0);
    assert.equal(dashboard.counts.fallback, 1);
    assert.equal(dashboard.overall, "degraded");
    assert.equal(dashboard.latestSuccessfulGeneration, "unknown");
    assert.doesNotMatch(dashboard.overallSummary, /\d+ healthy/);
});

test("status dashboard uses safe unknowns for missing metadata and invalid data", () => {
    const dashboard = buildStatusDashboard({
        now,
        manifest: { modules: [{ id: "repos", data: "data/repos.json" }] },
        datasets: { repos: {} },
        report: {},
        validation: { errors: [{ file: "data/repos.json" }], warnings: [] }
    });

    assert.equal(dashboard.generatedAt, "unknown");
    assert.equal(dashboard.dataAgeDays, null);
    assert.equal(dashboard.validation, "invalid");
    assert.equal(dashboard.rows[0].name, "unknown");
    assert.equal(dashboard.rows[0].itemCount, null);
    assert.equal(dashboard.rows[0].pipelineStatus, "unknown");
    assert.equal(dashboard.rows[0].freshness, "unknown");
    assert.equal(dashboard.rows[0].lastSuccessfulUpdate, null);
    assert.equal(dashboard.rows[0].issue, "Required source metadata missing.");
    assert.equal(dashboard.overall, "degraded");
    assert.doesNotMatch(JSON.stringify(dashboard), /undefined|NaN/);
});

test("canonical trust keeps pipeline and freshness independent for Home, Today, and Status", () => {
    const dashboard = buildStatusDashboard({
        now,
        manifest: { modules: [{ id: "trends", data: "data/trends.json" }] },
        datasets: {
            trends: { sourceMeta: { name: "HN", status: "ok", count: 2, updatedAt: "2026-06-19T00:00:00.000Z" } }
        },
        report: { generatedAt: now, totals: { status: "ok" } },
        validation: { errors: [], warnings: [] }
    });
    assert.equal(dashboard.pipelineStatus, "ok");
    assert.equal(dashboard.freshness, "stale");
    assert.equal(dashboard.overall, "stale");
    assert.equal(dashboard.dataDate, "unknown");
    assert.match(dashboard.overallSummary, /stale/);
    assert.doesNotMatch(dashboard.overallSummary, /No recovery needed|current data/i);
});

test("canonical trust preserves partial, fallback, unavailable, unknown, and valid-empty meanings", () => {
    const cases = [
        ["partial", { status: "partial", count: 2, updatedAt: now }, ["partial", "fresh", "degraded", "available"]],
        ["fallback", { status: "fallback", count: 2, previousUpdated: now, fallbackUsed: true }, ["fallback", "fresh", "degraded", "fallback"]],
        ["unavailable", { status: "error", count: 0, error: "failed" }, ["error", "unavailable", "unavailable", "failed"]],
        ["unknown", { status: "ok", count: 2 }, ["ok", "unknown", "unknown", "available"]],
        ["valid empty", { status: "ok", count: 0, updatedAt: now }, ["ok", "fresh", "healthy", "empty"]]
    ];

    for (const [label, sourceMeta, expected] of cases) {
        const dashboard = buildStatusDashboard({
            now,
            manifest: { updated: "2026-06-24", modules: [{ id: "repos", data: "data/repos.json" }] },
            datasets: { repos: { sourceMeta } },
            report: { generatedAt: now, totals: { status: sourceMeta.status } },
            validation: { errors: [], warnings: [] }
        });
        assert.deepEqual(
            [dashboard.pipelineStatus, dashboard.freshness, dashboard.overall, dashboard.rows[0].availability],
            expected,
            label
        );
        assert.equal(dashboard.dataDate, "2026-06-24");
    }
});

test("Status keeps valid partial source output visible and degraded", () => {
    const dashboard = buildStatusDashboard({
        now,
        manifest: { modules: [{ id: "packages", title: "Packages", route: "packages/index.html", data: "data/packages.json" }] },
        datasets: {
            packages: {
                sourceMeta: {
                    name: "npm",
                    status: "partial",
                    count: 4,
                    updatedAt: now,
                    errors: [{ name: "one-package", error: "429 rate limited" }],
                    rateLimited: true
                }
            }
        },
        report: { generatedAt: now, totals: { status: "partial" } },
        validation: { errors: [], warnings: [] }
    });

    assert.equal(dashboard.pipelineStatus, "partial");
    assert.equal(dashboard.overall, "degraded");
    assert.equal(dashboard.rows[0].availability, "available");
    assert.equal(dashboard.rows[0].pipelineStatus, "partial");
    assert.equal(dashboard.rows[0].itemCount, 4);
    assert.match(dashboard.rows[0].issue, /429 rate limited/);
});
