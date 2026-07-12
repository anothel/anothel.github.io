import test from "node:test";
import assert from "node:assert/strict";

import {
    readSavedSummary,
    savedRecordsFromRaw,
    savedSummary,
    storageKeys
} from "../src/lib/explore-storage.js";
import { initHomeSavedSummary, updateHomeSavedSummary } from "../src/scripts/home-saved-summary.js";

const fixedNow = () => "2026-07-12T00:00:00.000Z";
const storageWith = (raw) => ({
    getItem(key) {
        assert.equal(key, storageKeys.savedItems);
        return raw;
    }
});

function homeDocument() {
    const nodes = Object.fromEntries([
        "[data-home-review-saved]",
        "[data-home-review-unread]",
        "[data-home-review-status]"
    ].map((selector) => [selector, { textContent: "initial" }]));
    const region = {
        dataset: {},
        querySelector(selector) { return nodes[selector] || null; }
    };
    return {
        document: { querySelector: (selector) => selector === "[data-home-review-summary]" ? region : null },
        nodes,
        region
    };
}

test("Home saved summary accepts empty and legacy string-array storage", () => {
    assert.deepEqual(readSavedSummary(storageWith(null), { now: fixedNow }), { available: true, saved: 0, unread: 0 });
    assert.deepEqual(readSavedSummary(storageWith('["repos:a","links:b"]'), { now: fixedNow }), { available: true, saved: 2, unread: 2 });
    assert.deepEqual(savedRecordsFromRaw('["repos:a"]', { now: fixedNow }), [
        { id: "repos:a", savedAt: fixedNow(), status: "unread" }
    ]);
});

test("Home saved summary uses the version 2 status normalization contract", () => {
    const raw = JSON.stringify({
        version: 2,
        items: [
            { id: "a", savedAt: "2026-01-01", status: "unread" },
            { id: "b", savedAt: "2026-01-01", status: "read" },
            { id: "c", savedAt: "2026-01-01", status: "done" },
            { id: "d", status: "unknown" },
            { id: "", status: "unread" },
            { status: "unread" }
        ]
    });
    const records = savedRecordsFromRaw(raw, { now: fixedNow });

    assert.equal(records.find(({ id }) => id === "d").savedAt, fixedNow());
    assert.deepEqual(savedSummary(records), { saved: 4, unread: 2 });
    assert.deepEqual(readSavedSummary(storageWith(raw), { now: fixedNow }), { available: true, saved: 4, unread: 2 });
});

test("Home saved summary treats malformed data as empty but readable storage", () => {
    assert.deepEqual(readSavedSummary(storageWith("{malformed"), { now: fixedNow }), { available: true, saved: 0, unread: 0 });
});

test("Home saved summary identifies missing or blocked storage as unavailable", () => {
    assert.deepEqual(readSavedSummary(undefined), { available: false, saved: null, unread: null });
    assert.deepEqual(readSavedSummary({ getItem() { throw new Error("blocked"); } }), { available: false, saved: null, unread: null });
    assert.deepEqual(readSavedSummary({ get getItem() { throw new Error("blocked"); } }), { available: false, saved: null, unread: null });
});

test("Home client module writes counts or a readable unavailable state without a DOM dependency", () => {
    const available = homeDocument();
    updateHomeSavedSummary(available.document, storageWith('["a","b"]'));
    assert.equal(available.nodes["[data-home-review-saved]"].textContent, "2");
    assert.equal(available.nodes["[data-home-review-unread]"].textContent, "2");
    assert.match(available.nodes["[data-home-review-status]"].textContent, /loaded from this browser/i);
    assert.equal(available.region.dataset.storageState, "available");

    const unavailable = homeDocument();
    initHomeSavedSummary({
        document: unavailable.document,
        get localStorage() { throw new Error("blocked"); }
    });
    assert.equal(unavailable.nodes["[data-home-review-saved]"].textContent, "??");
    assert.equal(unavailable.nodes["[data-home-review-unread]"].textContent, "??");
    assert.match(unavailable.nodes["[data-home-review-status]"].textContent, /unavailable/i);
    assert.equal(unavailable.region.dataset.storageState, "unavailable");
    assert.equal(updateHomeSavedSummary(undefined, undefined), null);
});
