import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { appendFile, cp, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { assertSizeBudgets, checkSize } from "../scripts/check-size.mjs";

test("current Home, Notes, topic, Explore, and Review assets stay within reviewed raw-byte budgets", () => {
    const result = checkSize();
    assert.equal(result.measurement, "raw build bytes");
    assert.equal(result.actual.routes.home.routeAssets.length, 1);
    assert.ok(result.actual.routes.home.jsAssets.length > 1);
    assert.match(result.actual.routes.home.routeAssets[0], /^_astro\/index\.astro_astro_type_script_[^.]+\.[^.]+\.js$/);
    assert.ok(!result.actual.routes.home.jsAssets.includes(result.actual.routes.explore.clientAsset));
    assert.equal(result.actual.routes.notes.routeJs, 0);
    assert.equal(result.actual.routes.notes.totalJs, 0);
    assert.deepEqual(result.actual.routes.notes.routeAssets, []);
    assert.deepEqual(result.actual.routes.notes.jsAssets, []);
    assert.equal(result.actual.routes.notes.reactClientPresent, false);
    assert.equal(Object.keys(result.actual.topics).length, 7);
    assert.equal(result.actual.topicMaximums.html.route, "ai-agents");
    assert.match(result.actual.topicMaximums.routeJs.sizes.routeAssets[0], /^_astro\/_slug_\.astro_astro_type_script_[^.]+\.[^.]+\.js$/);
    for (const topic of Object.values(result.actual.topics)) {
        assert.ok(!topic.jsAssets.includes(result.actual.routes.explore.clientAsset));
        assert.ok(topic.jsAssets.every((asset) => !/(?:Explore|Review)Island|(?:^|\/)client\.[^/]+\.js$/.test(asset)));
    }
    assert.ok(result.actual.routes.explore.jsAssets.length > 1);
    assert.ok(result.actual.routes.review.jsAssets.length > 1);
    assert.match(result.actual.routes.explore.islandAsset, /^_astro\/ExploreIsland\.[^.]+\.js$/);
});

test("Notes size gate counts classic script sources", async () => {
    const root = await mkdtemp(join(tmpdir(), "anothel-size-"));
    try {
        await cp("dist", root, { recursive: true });
        await writeFile(join(root, "notes", "classic.js"), "console.log('notes');\n", "utf8");
        await appendFile(join(root, "notes", "index.html"), '<script src="classic.js"></script>', "utf8");

        assert.throws(() => checkSize(root), /notes route JS \(notes\/classic\.js\): \d+ bytes exceeds 0 bytes/);
    } finally {
        await rm(root, { recursive: true, force: true });
    }
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
