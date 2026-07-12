import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { assertSizeBudgets, checkSize } from "../scripts/check-size.mjs";

test("current Explore and Review assets stay within reviewed raw-byte budgets", () => {
    const result = checkSize();
    assert.equal(result.measurement, "raw build bytes");
    assert.ok(result.actual.routes.explore.jsAssets.length > 1);
    assert.ok(result.actual.routes.review.jsAssets.length > 1);
    assert.match(result.actual.routes.explore.islandAsset, /^_astro\/ExploreIsland\.[^.]+\.js$/);
});

test("asset size gate identifies the route, asset, actual size, and budget", () => {
    const actual = checkSize().actual;
    const budgets = JSON.parse(readFileSync("asset-size-budgets.json", "utf8"));
    budgets.explore.html = actual.routes.explore.html - 1;
    assert.throws(() => assertSizeBudgets(actual, budgets), (error) => {
        assert.ok(error.message.includes(`explore HTML (${actual.routes.explore.htmlAsset}): ${actual.routes.explore.html} bytes exceeds ${budgets.explore.html} bytes`));
        return true;
    });
});
