import test from "node:test";
import assert from "node:assert/strict";
import { filterSignals, moduleOptions } from "../js/today.js";

const signals = [
    { module: "Trends", title: "Agent workflow", meta: "HN / AI", metric: "96 score", reason: "Ranked trend signal" },
    { module: "Packages", title: "typescript", meta: "Language", metric: "216.8M/week", reason: "Weekly npm demand" },
    { module: "Repos", title: "react/react", meta: "UI", metric: "245.8K stars", reason: "Repository traction" }
];

test("moduleOptions returns stable module choices", () => {
    assert.deepEqual(moduleOptions(signals), ["Packages", "Repos", "Trends"]);
});

test("filterSignals filters by module and query", () => {
    assert.deepEqual(
        filterSignals(signals, { module: "Packages", query: "type" }).map((signal) => signal.title),
        ["typescript"]
    );
});

test("filterSignals searches signal metadata", () => {
    assert.deepEqual(
        filterSignals(signals, { module: "all", query: "stars" }).map((signal) => signal.title),
        ["react/react"]
    );
});
