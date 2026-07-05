import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

function loadDataHealth() {
    const context = { URL };
    vm.runInNewContext(readFileSync("js/safe-dom.js", "utf8"), context);
    vm.runInNewContext(readFileSync("js/data-health.js", "utf8"), context);
    return context.DataHealth;
}

test("DataHealth summarizes module statuses", () => {
    const DataHealth = loadDataHealth();
    const summary = JSON.parse(JSON.stringify(DataHealth.summarizeModules([
        { status: "ok", count: 10, updated: "2026-06-18" },
        { status: "partial", count: 5, updated: "2026-06-19" },
        { status: "error", count: 0, updated: "2026-06-17" }
    ])));

    assert.deepEqual(summary, {
        totalItems: 15,
        totalModules: 3,
        ok: 1,
        partial: 1,
        error: 1,
        fallback: 0,
        unknown: 0,
        updated: "2026-06-19",
        label: "1 ok / 1 partial / 1 error"
    });
});

test("DataHealth renders source health cards with escaped errors", () => {
    const DataHealth = loadDataHealth();
    const html = DataHealth.renderSourceHealth({
        name: "<script>npm()</script>",
        status: "partial",
        count: 13,
        updatedAt: "2026-06-19T00:00:00.000Z",
        errors: [
            { name: "@bad/pkg", error: "bad \"timeout\"" }
        ]
    });

    assert.match(html, /source-health-card status-partial/);
    assert.match(html, /&lt;script&gt;npm\(\)&lt;\/script&gt;/);
    assert.match(html, /13 visible items/);
    assert.match(html, /Partial - updated 2026-06-19/);
    assert.match(html, /1 failed: @bad\/pkg/);
    assert.match(html, /bad &quot;timeout&quot;/);
});

test("DataHealth describes fallback and partial modes", () => {
    const DataHealth = loadDataHealth();

    assert.equal(
        DataHealth.dataModeText({ status: "fallback" }),
        "Source health fallback. Previous data remains available; retry data refresh."
    );
    assert.equal(
        DataHealth.dataModeText({ status: "partial" }),
        "Source health partial. Some data is stale but still usable; some sources may be missing. Retry data refresh to recover freshness."
    );
    assert.equal(
        DataHealth.dataModeText({ status: "ok" }),
        "Source health ok. Use the displayed data date for freshness. No recovery needed."
    );
    assert.equal(
        DataHealth.dataModeText({ status: "ok" }, { updated: "2026-06-22" }),
        "Source health ok. Data date 2026-06-22. No recovery needed."
    );
    assert.equal(
        DataHealth.dataModeText({ status: "error" }),
        "Source health failed. Retry data refresh before trusting freshness."
    );
});

test("DataHealth labels source freshness by age and status", () => {
    const DataHealth = loadDataHealth();

    assert.equal(
        DataHealth.freshnessText({ status: "ok", updatedAt: "2026-06-24T00:00:00.000Z" }, "2026-06-24"),
        "Fresh - updated 2026-06-24"
    );
    assert.equal(
        DataHealth.freshnessText({ status: "ok", updated: "2026-06-22" }, "2026-06-24"),
        "Aging - 2 days old"
    );
    assert.equal(
        DataHealth.freshnessText({ status: "ok", updated: "2026-06-19" }, "2026-06-24"),
        "Stale - 5 days old"
    );
    assert.equal(
        DataHealth.freshnessText({ status: "fallback", previousUpdated: "2026-06-21" }, "2026-06-24"),
        "Fallback - using 2026-06-21 data"
    );
    assert.equal(
        DataHealth.freshnessText({ status: "partial", updated: "2026-06-23" }, "2026-06-24"),
        "Partial - updated 2026-06-23"
    );
    assert.equal(
        DataHealth.freshnessText({ status: "error" }, "2026-06-24"),
        "Error - no current timestamp"
    );
});

test("DataHealth source cards include freshness detail", () => {
    const DataHealth = loadDataHealth();
    const html = DataHealth.renderSourceHealth({
        name: "npm",
        status: "ok",
        count: 4,
        updatedAt: "2026-06-22T00:00:00.000Z"
    }, { today: "2026-06-24" });

    assert.match(html, /Aging - 2 days old/);
});

test("DataHealth renders fallback safety detail", () => {
    const DataHealth = loadDataHealth();
    const html = DataHealth.renderSourceHealth({
        name: "GitHub",
        status: "fallback",
        count: 16,
        fallbackUsed: true,
        staleButSafe: true,
        fallbackReason: "No repo rows fetched",
        previousUpdated: "2026-06-19",
        rateLimited: true
    });

    assert.match(html, /source-health-card status-fallback/);
    assert.match(html, /Fallback - using 2026-06-19 data/);
    assert.match(html, /using fallback \/ previous data kept \/ rate limited/);
    assert.match(html, /No repo rows fetched/);
    assert.match(html, /previous refresh 2026-06-19/);
});

test("DataHealth exposes shared source detail text", () => {
    const DataHealth = loadDataHealth();

    assert.equal(
        DataHealth.sourceDetail({
            status: "fallback",
            previousUpdated: "2026-06-19",
            fallbackUsed: true,
            staleButSafe: true
        }),
        "Fallback - using 2026-06-19 data / using fallback / previous data kept / previous refresh 2026-06-19"
    );
    assert.equal(
        DataHealth.sourceDetail({ status: "ok", updated: "2026-06-19" }, "2026-06-24"),
        "Stale - 5 days old / retry data refresh"
    );
});

test("DataHealth partial detail names failing source and recovery action", () => {
    const DataHealth = loadDataHealth();

    const detail = DataHealth.sourceDetail({
        status: "partial",
        updatedAt: "2026-06-29T09:47:12.791Z",
        errors: [{
            name: "n8n-workflow",
            error: "429 Too Many Requests: https://api.npmjs.org/downloads/point/last-week/n8n-workflow"
        }],
        rateLimited: true,
        previousUpdated: "2026-06-29"
    });

    assert.equal(
        detail,
        "Partial - updated 2026-06-29 / rate limited / previous refresh 2026-06-29 / 1 failed: n8n-workflow - 429 Too Many Requests / retry data refresh"
    );
    assert.doesNotMatch(detail, /api\.npmjs\.org/);
});

test("DataHealth error detail names recovery action and strips long URLs", () => {
    const DataHealth = loadDataHealth();

    const detail = DataHealth.sourceDetail({
        status: "error",
        error: "403 rate limit exceeded: https://api.github.com/search/repositories?q=agent"
    });

    assert.equal(
        detail,
        "Error - no current timestamp / 403 rate limit exceeded / retry data refresh"
    );
    assert.doesNotMatch(detail, /api\.github\.com/);
});
