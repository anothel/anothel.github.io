import test from "node:test";
import assert from "node:assert/strict";
import { buildStatusSummary, collectSourceRows, renderRefreshRun, renderSourceRows, renderStatusSummary } from "../js/status.mjs";

const manifest = {
    updated: "2026-06-20",
    modules: [
        {
            id: "trends",
            title: "Tech trends",
            route: "trends/index.html",
            data: "data/trends.json",
            status: "partial",
            count: 9,
            updated: "2026-06-20"
        },
        {
            id: "packages",
            title: "Package watchlist",
            route: "packages/index.html",
            data: "data/packages.json",
            status: "ok",
            count: 4,
            updated: "2026-06-19"
        }
    ]
};

const datasets = {
    trends: {
        sourceMeta: [
            { name: "Hacker News", status: "ok", count: 6, updatedAt: "2026-06-20T00:00:00.000Z" },
            { name: "GitHub", status: "error", count: 0, error: "rate limited" }
        ]
    },
    packages: {
        sourceMeta: { name: "npm", status: "ok", count: 4, updatedAt: "2026-06-19T00:00:00.000Z" }
    }
};

test("collectSourceRows expands module source metadata into rows", () => {
    assert.deepEqual(collectSourceRows(manifest, datasets, { today: "2026-06-24" }), [
        {
            module: "Tech trends",
            moduleRoute: "trends/index.html",
            source: "Hacker News",
            status: "ok",
            count: 6,
            updated: "2026-06-20T00:00:00.000Z",
            detail: "Stale - 4 days old / retry data refresh"
        },
        {
            module: "Tech trends",
            moduleRoute: "trends/index.html",
            source: "GitHub",
            status: "error",
            count: 0,
            updated: "-",
            detail: "Error - no current timestamp / rate limited"
        },
        {
            module: "Package watchlist",
            moduleRoute: "packages/index.html",
            source: "npm",
            status: "ok",
            count: 4,
            updated: "2026-06-19T00:00:00.000Z",
            detail: "Stale - 5 days old / retry data refresh"
        }
    ]);
});

test("buildStatusSummary describes source health and freshness", () => {
    assert.deepEqual(buildStatusSummary(manifest, datasets), {
        totalItems: 13,
        totalModules: 2,
        totalSources: 3,
        healthLabel: "2 ok / 1 error",
        updated: "2026-06-20"
    });
});

test("status renderers escape text and block unsafe module links", () => {
    const html = renderSourceRows([
        {
            module: "<script>Bad</script>",
            moduleRoute: "javascript:alert(1)",
            source: "GitHub",
            status: "error",
            count: 0,
            updated: "-",
            detail: "bad \"token\""
        }
    ]);

    assert.match(html, /&lt;script&gt;Bad&lt;\/script&gt;/);
    assert.match(html, /href="#"/);
    assert.match(html, /bad &quot;token&quot;/);
    assert.match(renderStatusSummary({ totalItems: 13, totalSources: 3, healthLabel: "2 ok / 1 error", updated: "2026-06-20" }), /13/);
});

test("status rows and summary surface fallback safety detail", () => {
    const fallbackDatasets = {
        packages: {
            sourceMeta: {
                name: "npm",
                status: "fallback",
                count: 4,
                updatedAt: "2026-06-20T00:00:00.000Z",
                fallbackUsed: true,
                staleButSafe: true,
                fallbackReason: "No package rows fetched",
                previousUpdated: "2026-06-19",
                rateLimited: true
            }
        }
    };
    const fallbackManifest = {
        modules: [
            {
                id: "packages",
                title: "Package watchlist",
                route: "packages/index.html",
                status: "fallback",
                count: 4,
                updated: "2026-06-19"
            }
        ]
    };
    const rows = collectSourceRows(fallbackManifest, fallbackDatasets);

    assert.equal(rows[0].detail, "Fallback - using 2026-06-19 data / using fallback / previous data kept / rate limited / No package rows fetched / previous refresh 2026-06-19");
    assert.match(renderSourceRows(rows), /using fallback \/ previous data kept \/ rate limited/);
    assert.equal(buildStatusSummary(fallbackManifest, fallbackDatasets).healthLabel, "1 fallback");
});

test("refresh run renderer surfaces checked-in report context safely", () => {
    const html = renderRefreshRun({
        generatedAt: "2026-06-24T11:39:53.728Z",
        manifestUpdated: "2026-06-24",
        runContext: {
            reason: "manual <retry>",
            eventName: "workflow_dispatch",
            runId: "123",
            refName: "main"
        },
        changedModules: [{ id: "packages", title: "Package <watchlist>", count: 33, updated: "2026-06-22" }],
        totals: { status: "partial", items: 126, errors: 1, sources: 6 },
        modules: [
            {
                id: "packages",
                title: "Package <watchlist>",
                status: "partial",
                count: 33,
                updated: "2026-06-22",
                sources: [{ source: "npm", status: "partial", count: 22, errors: ["rate <limit>"] }]
            }
        ]
    });

    assert.match(html, /Last run/);
    assert.match(html, /Result/);
    assert.match(html, /Changed/);
    assert.match(html, /Attention/);
    assert.match(html, /Package &lt;watchlist&gt;/);
    assert.match(html, /manifest 2026-06-24/);
    assert.match(html, /1 changed/);
    assert.match(html, /npm partial/);
    assert.match(html, /manual &lt;retry&gt; \/ workflow_dispatch \/ run 123 \/ main/);
    assert.doesNotMatch(html, /Package <watchlist>/);
    assert.doesNotMatch(html, /manual <retry>/);
});

test("refresh run partial attention reuses source detail recovery copy", () => {
    const html = renderRefreshRun({
        generatedAt: "2026-06-29T09:47:12.791Z",
        manifestUpdated: "2026-06-29",
        changedModules: [],
        totals: { status: "partial", items: 25, errors: 1, sources: 1 },
        modules: [
            {
                id: "packages",
                title: "Package watchlist",
                status: "partial",
                count: 25,
                sources: [{
                    source: "npm",
                    status: "partial",
                    count: 25,
                    updatedAt: "2026-06-29T09:47:12.791Z",
                    previousUpdated: "2026-06-29",
                    rateLimited: true,
                    errors: ["n8n-workflow: 429 Too Many Requests: https://api.npmjs.org/downloads/point/last-week/n8n-workflow"]
                }]
            }
        ]
    });

    assert.match(html, /Package watchlist: npm partial/);
    assert.match(html, /1 failed: n8n-workflow - 429 Too Many Requests/);
    assert.match(html, /retry data refresh/);
    assert.doesNotMatch(html, /api\.npmjs\.org/);
});

test("refresh run treats stale ok sources as attention", () => {
    const html = renderRefreshRun({
        generatedAt: "2026-06-24T00:00:00.000Z",
        manifestUpdated: "2026-06-24",
        changedModules: [],
        totals: { status: "ok", items: 1, sources: 1 },
        modules: [
            {
                id: "repos",
                title: "Repo watchlist",
                status: "ok",
                count: 1,
                sources: [{ source: "GitHub", status: "ok", count: 1, updatedAt: "2026-06-20T00:00:00.000Z" }]
            }
        ]
    });

    assert.match(html, /1 source/);
    assert.match(html, /Repo watchlist: GitHub stale/);
    assert.match(html, /Stale - 4 days old/);
});

test("refresh run fallback attention keeps previous data context", () => {
    const html = renderRefreshRun({
        generatedAt: "2026-06-24T00:00:00.000Z",
        manifestUpdated: "2026-06-24",
        changedModules: [],
        totals: { status: "fallback", items: 4, sources: 1 },
        modules: [
            {
                id: "packages",
                title: "Package watchlist",
                status: "fallback",
                count: 4,
                sources: [{
                    source: "npm",
                    status: "fallback",
                    count: 4,
                    fallbackUsed: true,
                    staleButSafe: true,
                    rateLimited: true,
                    fallbackReason: "No package rows fetched",
                    previousUpdated: "2026-06-19"
                }]
            }
        ]
    });

    assert.match(html, /Package watchlist: npm fallback/);
    assert.match(html, /npm Fallback - using 2026-06-19 data \/ using fallback \/ previous data kept \/ rate limited \/ No package rows fetched \/ previous refresh 2026-06-19/);
});
