import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

import {
    collectSourceMeta,
    dedupeItems,
    filterItems,
    focusMatches,
    normalizeExploreData,
    sortItems
} from "../src/lib/explore-domain.js";
import { buildTopicLenses, dataModeText, sourceHealthModel } from "../src/lib/explore-model.js";
import {
    defaultExploreState,
    mergeSearches,
    readExploreDefault,
    readSavedRecords,
    readSavedSearches,
    savedRecordsFromRaw,
    savedSearchesFromRaw,
    saveExploreDefault,
    saveSearch,
    storageKeys,
    toggleSavedItem
} from "../src/lib/explore-storage.js";

const json = (path) => JSON.parse(readFileSync(path, "utf8"));
const datasets = {
    manifest: json("data/manifest.json"),
    trends: json("data/trends.json"),
    packages: json("data/packages.json"),
    repos: json("data/repos.json"),
    links: json("data/links.json")
};
const signalPolicy = json("data/signal-policy.json");

function memoryStorage(seed = {}) {
    const values = new Map(Object.entries(seed));
    return {
        getItem: (key) => values.get(key) ?? null,
        setItem: (key, value) => values.set(key, value),
        removeItem: (key) => values.delete(key)
    };
}

test("React Explore normalization preserves legacy ranking and deduplication", () => {
    const context = { console, URL, URLSearchParams };
    for (const path of ["js/safe-dom.js", "js/data-health.js", "js/local-state.js", "js/signal-schema.js", "js/topic-taxonomy.js", "js/explore.js"]) {
        vm.runInNewContext(readFileSync(path, "utf8"), context);
    }
    const next = normalizeExploreData(datasets, { signalPolicy });
    const legacy = context.ExploreApp.normalizeExploreData(datasets, { signalPolicy });

    assert.deepEqual(next.map(({ id, score }) => [id, score]), JSON.parse(JSON.stringify(legacy.map(({ id, score }) => [id, score]))));
    assert.deepEqual(sortItems(next).map(({ id }) => id), JSON.parse(JSON.stringify(context.ExploreApp.sortExploreItems(legacy, "priority", new Set()).map(({ id }) => id))));
    assert.equal(new Set(next.map(({ id }) => id)).size, next.length);
});

test("dedupe merges source context and legacy ids", () => {
    const items = dedupeItems([
        { id: "one", canonicalKey: "url:https://example.com/x", module: "Trends", sources: ["Trends"], score: 80, qualityScore: 80, legacyIds: [] },
        { id: "two", canonicalKey: "url:https://example.com/x", module: "Repos", sources: ["Repos"], score: 90, qualityScore: 90, legacyIds: [] }
    ]);
    assert.equal(items.length, 1);
    assert.deepEqual(items[0].sources, ["Repos", "Trends"]);
    assert.match(items[0].sourceContext, /Trends/);
});

test("search, module, category, and focus filters compose", () => {
    const items = normalizeExploreData(datasets, { signalPolicy });
    const mcp = items.find((item) => focusMatches(item, "MCP"));
    assert.ok(mcp);
    const filtered = filterItems(items, { module: mcp.module, category: mcp.category, focus: "MCP", query: mcp.title.slice(0, 5) });
    assert.ok(filtered.some(({ id }) => id === mcp.id));
    assert.ok(filtered.every((item) => item.module === mcp.module && item.category === mcp.category));
});

test("all Explore sort modes are deterministic", () => {
    const items = normalizeExploreData(datasets, { signalPolicy }).slice(0, 20);
    const saved = new Set([items.at(-1).id]);
    assert.equal(sortItems(items, "saved", saved)[0].id, items.at(-1).id);
    const byModule = sortItems(items, "module").map(({ module }) => module);
    const byCategory = sortItems(items, "category").map(({ category }) => category);
    assert.ok(byModule.every((value, index) => index === 0 || byModule[index - 1].localeCompare(value) <= 0));
    assert.ok(byCategory.every((value, index) => index === 0 || byCategory[index - 1].localeCompare(value) <= 0));
    assert.equal(sortItems(items, "priority").length, items.length);
});

test("saved item storage accepts legacy arrays and version 2 records", () => {
    const now = () => "2026-07-12T00:00:00.000Z";
    assert.deepEqual(savedRecordsFromRaw('["legacy"]', { now }), [{ id: "legacy", savedAt: now(), status: "unread" }]);
    assert.deepEqual(savedRecordsFromRaw('{"version":2,"items":[{"id":"current","savedAt":"x","status":"read"}]}'), [{ id: "current", savedAt: "x", status: "read" }]);
    assert.deepEqual(savedRecordsFromRaw("{broken"), []);

    const storage = memoryStorage({ [storageKeys.savedItems]: '["legacy"]' });
    const item = { id: "current", legacyIds: ["legacy"] };
    assert.deepEqual(toggleSavedItem(storage, item, { now }), []);
    assert.equal(readSavedRecords(storage).length, 0);
});

test("defaults and saved searches survive storage and reject invalid imports", () => {
    const storage = memoryStorage();
    const preferred = saveExploreDefault(storage, { focus: "MCP", module: "Repos", category: "AI agents", sort: "saved" });
    assert.deepEqual(readExploreDefault(storage), { ...preferred, query: "", label: "" });

    const saved = saveSearch(storage, { focus: "MCP", module: "Repos", category: "all", query: "server", sort: "saved", label: "MCP queue" });
    assert.equal(saved.status, "saved");
    assert.equal(readSavedSearches(storage)[0].label, "MCP queue");
    assert.deepEqual(savedSearchesFromRaw('{"version":1,"items":[{"bad":true},null,42]}'), []);
    assert.equal(mergeSearches(storage, savedSearchesFromRaw('{"version":1,"items":[{"query":"agents"},{"bad":true}]}')).added, 1);
});

test("source health and topic lens models remain structured data", () => {
    const items = normalizeExploreData(datasets, { signalPolicy });
    const sourceMeta = collectSourceMeta(datasets);
    const health = sourceHealthModel(sourceMeta, "2026-07-07");
    const lenses = buildTopicLenses(items);

    assert.ok(health.length > 0);
    assert.ok(health.every(({ name, status, detail }) => name && status && detail));
    assert.match(dataModeText(sourceMeta, datasets.manifest.updated, "2026-07-07"), /Source health/);
    assert.ok(lenses.some(({ focus, count }) => focus === "MCP" && count > 0));
});

test("malformed or unavailable storage falls back without throwing", () => {
    const blocked = { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); } };
    assert.deepEqual(readSavedRecords(blocked), []);
    assert.deepEqual(readSavedSearches(blocked), []);
    assert.deepEqual(readExploreDefault(blocked), { ...defaultExploreState });
});
