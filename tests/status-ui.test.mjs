import test from "node:test";
import assert from "node:assert/strict";
import { buildStatusSummary, collectSourceRows, renderSourceRows, renderStatusSummary } from "../js/status.js";

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
    assert.deepEqual(collectSourceRows(manifest, datasets), [
        {
            module: "Tech trends",
            moduleRoute: "trends/index.html",
            source: "Hacker News",
            status: "ok",
            count: 6,
            updated: "2026-06-20T00:00:00.000Z",
            detail: "2026-06-20T00:00:00.000Z"
        },
        {
            module: "Tech trends",
            moduleRoute: "trends/index.html",
            source: "GitHub",
            status: "error",
            count: 0,
            updated: "-",
            detail: "rate limited"
        },
        {
            module: "Package watchlist",
            moduleRoute: "packages/index.html",
            source: "npm",
            status: "ok",
            count: 4,
            updated: "2026-06-19T00:00:00.000Z",
            detail: "2026-06-19T00:00:00.000Z"
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

    assert.equal(rows[0].detail, "using fallback / previous data kept / rate limited / No package rows fetched / previous refresh 2026-06-19");
    assert.match(renderSourceRows(rows), /using fallback \/ previous data kept \/ rate limited/);
    assert.equal(buildStatusSummary(fallbackManifest, fallbackDatasets).healthLabel, "1 fallback");
});
