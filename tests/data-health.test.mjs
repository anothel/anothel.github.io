import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

function loadDataHealth() {
    const context = {};
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
    assert.match(html, /1 failed: @bad\/pkg/);
    assert.match(html, /bad &quot;timeout&quot;/);
});

test("DataHealth describes fallback and partial modes", () => {
    const DataHealth = loadDataHealth();

    assert.equal(
        DataHealth.dataModeText({ status: "fallback" }),
        "Showing fallback data because checked-in data was unavailable."
    );
    assert.equal(
        DataHealth.dataModeText({ status: "partial" }),
        "Checked-in data loaded with partial source failures."
    );
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
    assert.match(html, /fallback used \/ stale but safe \/ rate limited/);
    assert.match(html, /No repo rows fetched/);
    assert.match(html, /previous 2026-06-19/);
});
