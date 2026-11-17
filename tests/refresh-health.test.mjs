import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { pipelineFreshness } from "../src/lib/refresh-health.mjs";
import { assessRefresh } from "../scripts/check-refresh.mjs";
import { buildStatusDashboard } from "../src/lib/status-data.mjs";

const fixture = JSON.parse(readFileSync(new URL("./fixtures/refresh-health.json", import.meta.url)));
const now = fixture.now;
for (const item of fixture.timestamps) {
    test(`pipeline clock: ${item.label}`, () => {
        assert.equal(pipelineFreshness(item.value, now).state, item.state);
    });
}
for (const item of fixture.sources) {
    test(`refresh assessment: ${item.label}`, () => {
        const input = {
            manifest: { generatedAt: "2026-11-16T06:00:00.000Z", modules: ["repos", "trends", "packages", "links"].map((id) => ({ id, data: `data/${id}.json` })) },
            datasets: {
                repos: { sourceMeta: item.source },
                ...Object.fromEntries(["trends", "packages", "links"].map((id) => [id, { sourceMeta: { name: "manual", status: "ok", count: 1, reviewedAt: now } }]))
            },
            report: { generatedAt: "2026-11-16T06:00:00.100Z", totals: { status: item.source.status } }
        };
        const result = assessRefresh(input, now);
        assert.equal(result.pipeline.state, "current");
        assert.equal(result.sources[0].health, item.health);
        assert.equal(result.sources[0].availability, item.availability);
        assert.equal(result.ok, item.health === "healthy");
    });
}
test("recreating a report after a failed refresh cannot reset the manifest clock", () => {
    const result = assessRefresh({ manifest: { generatedAt: "2026-07-07T22:21:45.936Z" }, report: { generatedAt: now, totals: { status: "ok" } } }, now);
    assert.equal(result.pipeline.state, "overdue");
    assert.equal(result.ok, false);
});
test("missing reports and source metadata cannot produce a healthy monitor result", () => {
    assert.equal(assessRefresh({ manifest: { generatedAt: now, modules: [] } }, now).ok, false);
});
test("Status exposes pipeline age independently of source freshness", () => {
    const result = buildStatusDashboard({ manifest: { generatedAt: "2026-07-07T22:21:45.936Z" }, report: { generatedAt: now }, now });
    assert.equal(result.refresh.state, "overdue");
    assert.equal(result.assessedAt, now);
});

test("omitting a module cannot hide unhealthy source evidence", () => {
    const source = { name: "GitHub", status: "ok", count: 1, updatedAt: now };
    const input = {
        manifest: { generatedAt: now, modules: ["trends", "packages", "repos"].map((id) => ({ id, data: `data/${id}.json` })) },
        datasets: Object.fromEntries(["trends", "packages", "repos"].map((id) => [id, { sourceMeta: source }])),
        report: { generatedAt: now, totals: { status: "ok" } }
    };
    assert.equal(assessRefresh(input, now).sources.every(row => row.health === "healthy"), true);
    assert.equal(assessRefresh(input, now).ok, false);
});

test("impossible generation dates cannot appear current after Date.parse normalization", () => {
    assert.equal(pipelineFreshness("2026-02-30T00:00:00Z", "2026-03-02T01:00:00Z").state, "unknown");
});
