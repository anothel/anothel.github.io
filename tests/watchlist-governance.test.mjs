import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
    activeItems,
    activeNames,
    validateWatchlistGovernance
} from "../scripts/watchlist-governance.mjs";

function json(path) {
    return JSON.parse(readFileSync(path, "utf8"));
}

test("watchlist governance filters disabled entries without deleting history", () => {
    const items = [
        { name: "active", history: [{ date: "2026-06-27", note: "Still useful." }] },
        { name: "retired", disabled: true, history: [{ date: "2026-06-01", note: "Retired from current signals." }] },
        { name: "also-active" }
    ];

    assert.deepEqual(activeItems(items).map((item) => item.name), ["active", "also-active"]);
    assert.deepEqual(activeNames(["ai", { name: "retired", disabled: true }, { name: "openai" }]), ["ai", "openai"]);
    assert.deepEqual(items[1].history, [{ date: "2026-06-01", note: "Retired from current signals." }]);
});

test("checked-in watchlists keep optional disabled and history fields valid", () => {
    assert.deepEqual(validateWatchlistGovernance(json("data/watchlists.json")), []);
});
