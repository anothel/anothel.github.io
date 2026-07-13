import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
    availableSearch,
    compactText,
    dedupeItems,
    filterItems,
    focusDefinitions,
    focusMatches,
    normalizeExploreData,
    safeExternalUrl,
    savedIdForItem,
    sortItems
} from "../src/lib/explore-domain.js";
import { activeSummary, buildTopicLenses, dataModeText, sourceHealthModel } from "../src/lib/explore-model.js";
import {
    defaultExploreState,
    mergeSearches,
    pinnedTopicsFromRaw,
    readExploreDefault,
    readPinnedTopics,
    readPinnedTopicsState,
    readSavedRecords,
    readSavedSearches,
    removeSearch,
    resetExploreDefault,
    saveExploreDefault,
    savedRecordsFromRaw,
    savedSearchExportPayload,
    savedSearchId,
    savedSearchLabel,
    savedSearchesFromRaw,
    saveSearch,
    storageKeys,
    togglePinnedTopic,
    togglePinnedTopicState,
    toggleSavedItem
} from "../src/lib/explore-storage.js";
import taxonomy, { trackedTopicLabels } from "../src/lib/topic-taxonomy.js";

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
        removeItem: (key) => values.delete(key),
        value: (key) => values.get(key)
    };
}

function fourModuleFixture() {
    return {
        trends: { updated: "2026-07-12", items: [{ rank: 1, title: "Agent trend", source: "GitHub", category: "AI agents", score: 98, velocity: "+12%", url: "https://example.com/trend", summary: "Agent workflow" }] },
        packages: { updated: "2026-07-11", packages: [{ rank: 1, name: "agent-sdk", category: "AI SDK", focus: "Agent SDK", downloads: 1000, downloadsLabel: "1K/week", url: "https://example.com/package" }] },
        repos: { updated: "2026-07-10", repos: [{ rank: 1, name: "org/agent", category: "AI agents", focus: "Coding agent", stars: 500, starsLabel: "500", url: "https://example.com/repo", summary: "Repo summary" }] },
        links: { updated: "2026-07-09", links: [{ rank: 1, title: "MCP spec", category: "MCP", kind: "Spec", url: "https://example.com/link", summary: "Protocol reference" }] }
    };
}

test("Explore ES normalization owns the stable four-module item contract", () => {
    const items = normalizeExploreData(fourModuleFixture(), { signalPolicy });
    assert.deepEqual(items.map(({ module, sourceModule, sourceKind }) => [module, sourceModule, sourceKind]), [
        ["Trends", "trends", "trend"], ["Packages", "packages", "package"], ["Repos", "repos", "repo"], ["Links", "links", "reference"]
    ]);
    assert.deepEqual(items.map(({ metric }) => metric), ["+12%", "1K/week", "500 stars", "Spec"]);
    assert.ok(items.every(({ schemaVersion, id, canonicalKey, score }) => schemaVersion === 2 && id === canonicalKey && score >= 0 && score <= 100));
    assert.equal(new Set(items.map(({ id }) => id)).size, items.length);
});

test("Explore ES ranking caps broad baselines and promotes agent signals", () => {
    const items = normalizeExploreData({
        trends: { items: [{ rank: 1, title: "typescript", source: "npm", category: "Language", score: 100, url: "https://example.com/typescript", summary: "typed JavaScript" }] },
        packages: { packages: [{ rank: 1, name: "typescript", category: "Language", downloads: 250000000, url: "https://www.npmjs.com/package/typescript" }, { rank: 2, name: "ai", category: "AI SDK", focus: "Agent workflows", downloads: 15000000, url: "https://www.npmjs.com/package/ai" }] },
        repos: { repos: [{ rank: 1, name: "openai/codex", category: "AI agents", focus: "Coding agent", stars: 92000, url: "https://github.com/openai/codex", summary: "Coding agent" }] },
        links: { links: [] }
    }, { signalPolicy });
    const byTitle = Object.fromEntries(items.map((item) => [item.title, item]));
    assert.ok(byTitle.typescript.score <= 76);
    assert.ok(byTitle.ai.score > byTitle.typescript.score);
    assert.equal(sortItems(items)[0].title, "openai/codex");
});

test("canonical ids, duplicate source context, and legacy saved ids remain compatible", () => {
    const [item] = normalizeExploreData({ repos: { repos: [{ name: "Org/Repo", category: "AI agents", stars: 1, url: "https://GitHub.com/Org/Repo.git/?tab=readme#top" }] } });
    assert.equal(item.id, "url:https://github.com/org/repo");
    assert.ok(item.legacyIds.includes("repos:https://GitHub.com/Org/Repo.git/?tab=readme#top"));
    assert.equal(savedIdForItem(item, new Set(item.legacyIds)), item.legacyIds[0]);

    const merged = dedupeItems([
        { id: "one", canonicalKey: "url:https://example.com/x", module: "Trends", sources: ["Trends"], score: 80, qualityScore: 80, legacyIds: [] },
        { id: "two", canonicalKey: "url:https://example.com/x", module: "Repos", sources: ["Repos"], score: 90, qualityScore: 90, legacyIds: [] }
    ]);
    assert.equal(merged.length, 1);
    assert.deepEqual(merged[0].sources, ["Repos", "Trends"]);
    assert.match(merged[0].sourceContext, /Trends/);
});

test("search, module, category, focus, and every sort mode compose", () => {
    const items = normalizeExploreData(datasets, { signalPolicy });
    const mcp = items.find((item) => focusMatches(item, "MCP"));
    const filtered = filterItems(items, { module: mcp.module, category: mcp.category, focus: "MCP", query: mcp.title.slice(0, 5) });
    assert.ok(filtered.some(({ id }) => id === mcp.id));
    assert.ok(filtered.every((item) => item.module === mcp.module && item.category === mcp.category));

    const sample = items.slice(0, 20);
    const saved = new Set([sample.at(-1).id]);
    assert.equal(sortItems(sample, "saved", saved)[0].id, sample.at(-1).id);
    for (const mode of ["priority", "module", "category"]) assert.equal(sortItems(sample, mode).length, sample.length);
});

test("Explore focus definitions stay in parity with the canonical topic taxonomy", () => {
    assert.deepEqual(focusDefinitions.map(({ focus }) => focus), trackedTopicLabels);
    for (const definition of focusDefinitions) {
        assert.equal(definition.route, taxonomy.routeForTopic(definition.focus, "../"), `${definition.focus} route`);
        assert.equal(
            definition.description,
            taxonomy.topicByLabel(definition.focus).guidance?.whenToOpen
                || taxonomy.topicByLabel(definition.focus).lensDescription
                || taxonomy.topicByLabel(definition.focus).description,
            `${definition.focus} description`
        );
    }
    for (const sample of [
        { title: "Claude Code coding agent", category: "AI agents" },
        { title: "mattpocock/skills", category: "Agent skills" },
        { title: "Model Context Protocol server", category: "MCP" },
        { title: "LLM evaluation harness", category: "AI evals" },
        { title: "nanoGPT model training", category: "AI engineering" },
        { title: "n8n durable workflow", category: "Workflow automation" },
        { title: "OAuth supply chain", category: "Security" },
        { title: "TypeScript build tool", category: "Developer tooling" },
        { title: "xmattpocock/skillsx", module: "Links", category: "x" },
        { title: "Merged source", sourceContext: "Also in Packages", sources: ["Repos", "Packages"], category: "x" }
    ]) {
        for (const topic of trackedTopicLabels) {
            assert.equal(focusMatches(sample, topic), taxonomy.matchesTopic(sample, topic), `${sample.title}: ${topic}`);
        }
    }
});

test("saved searches discard unavailable options without changing valid state", () => {
    const items = [{ module: "Trends", category: "MCP" }];
    assert.deepEqual(availableSearch({ focus: "MCP", module: "Old", category: "Old", query: "server", sort: "saved" }, items), { focus: "MCP", module: "all", category: "all", query: "server", sort: "saved" });
    assert.deepEqual(availableSearch({ focus: "MCP", module: "Trends", category: "MCP", query: "server", sort: "saved" }, items), { focus: "MCP", module: "Trends", category: "MCP", query: "server", sort: "saved" });
});

test("Explore text and external URL helpers keep card output compact and safe", () => {
    assert.match(compactText("x ".repeat(100), 96), /\.\.\.$/);
    assert.equal(safeExternalUrl("javascript:alert(1)"), "#");
    assert.equal(safeExternalUrl("not a URL"), "#");
    assert.equal(safeExternalUrl("https://example.com/x"), "https://example.com/x");
});

test("saved item storage accepts legacy arrays and version 2 records", () => {
    const now = () => "2026-07-12T00:00:00.000Z";
    assert.deepEqual(savedRecordsFromRaw('["legacy"]', { now }), [{ id: "legacy", savedAt: now(), status: "unread" }]);
    assert.deepEqual(savedRecordsFromRaw('{"version":2,"items":[{"id":"current","savedAt":"x","status":"read"}]}'), [{ id: "current", savedAt: "x", status: "read" }]);
    assert.deepEqual(savedRecordsFromRaw("{broken"), []);
    const storage = memoryStorage({ [storageKeys.savedItems]: '["legacy"]' });
    assert.deepEqual(toggleSavedItem(storage, { id: "current", legacyIds: ["legacy"] }, { now }), []);
    assert.equal(readSavedRecords(storage).length, 0);
});

test("Explore defaults normalize, omit query, and reset through the shared store", () => {
    const storage = memoryStorage();
    const preferred = saveExploreDefault(storage, { focus: "MCP", module: "Repos", category: "AI agents", query: "ignored", sort: "saved" });
    assert.deepEqual(readExploreDefault(storage), { ...preferred, query: "", label: "" });
    assert.deepEqual(resetExploreDefault(storage), { ...defaultExploreState });
    assert.equal(storage.value(storageKeys.exploreState), undefined);
});

test("pinned topics keep legacy and v1 formats, cap at three, and report unavailable storage", () => {
    const valid = trackedTopicLabels;
    assert.deepEqual(pinnedTopicsFromRaw('["MCP","MCP","Security","unknown"]', valid), ["MCP", "Security"]);
    assert.deepEqual(pinnedTopicsFromRaw('{"version":1,"topics":["AI agents","Developer tooling"]}', valid), ["AI agents", "Developer tooling"]);
    assert.deepEqual(pinnedTopicsFromRaw("{broken", valid), []);

    const storage = memoryStorage();
    for (const topic of valid.slice(0, 4)) togglePinnedTopic(storage, topic, valid);
    assert.deepEqual(readPinnedTopics(storage, valid), valid.slice(1, 4));

    const preserved = memoryStorage({
        [storageKeys.pinnedTopics]: JSON.stringify({ version: 1, topics: ["Developer tooling"] })
    });
    assert.deepEqual(togglePinnedTopicState(preserved, "MCP", valid), {
        available: true,
        topics: ["Developer tooling", "MCP"]
    });

    const blockedRead = { getItem() { throw new Error("blocked"); } };
    assert.deepEqual(readPinnedTopicsState(blockedRead, valid), { available: false, topics: [] });
    assert.deepEqual(readPinnedTopics(blockedRead, valid), []);

    const blockedWrite = {
        getItem() { return JSON.stringify({ version: 1, topics: ["MCP"] }); },
        setItem() { throw new Error("blocked"); }
    };
    assert.deepEqual(togglePinnedTopicState(blockedWrite, "Security", valid), {
        available: false,
        topics: ["MCP"]
    });
});

test("saved searches normalize, cap, remove, merge, label, and round-trip", () => {
    const storage = memoryStorage();
    const longQuery = "agent workflow automation evaluation benchmark orchestration";
    const first = { focus: "MCP", module: "Repos", category: "all", query: longQuery, sort: "saved", label: "" };
    assert.equal(saveSearch(storage, first).status, "saved");
    assert.equal(savedSearchId(first).includes(longQuery), true);
    assert.equal(savedSearchLabel(first), "MCP / Repos / agent workflow automation evaluation bench... / saved first");
    for (const query of ["a", "b", "c", "d"]) saveSearch(storage, { query });
    assert.equal(saveSearch(storage, { query: "overflow" }).status, "full");
    assert.equal(readSavedSearches(storage).length, 5);
    assert.equal(removeSearch(storage, savedSearchId(first)).status, "removed");

    const payload = savedSearchExportPayload([{ ...first, label: "MCP queue" }], () => "2026-07-12T00:00:00.000Z");
    assert.equal(savedSearchesFromRaw(payload)[0].label, "MCP queue");
    assert.equal(savedSearchesFromRaw('["legacy query"]')[0].query, "legacy query");
    assert.deepEqual(savedSearchesFromRaw('{"version":1,"items":[{"bad":true}]}'), []);
    assert.equal(mergeSearches(storage, savedSearchesFromRaw(payload)).added, 1);
});

test("source health, topic lenses, and active summaries remain structured", () => {
    const items = normalizeExploreData(datasets, { signalPolicy });
    const sourceMeta = [{ name: "npm", status: "partial", count: 0 }];
    assert.ok(sourceHealthModel(sourceMeta, "2026-07-12").length > 0);
    assert.match(dataModeText(sourceMeta, datasets.manifest.updated, "2026-07-12"), /partial/i);
    const lenses = buildTopicLenses(items, new Set(["MCP"]));
    assert.equal(lenses[0].focus, "MCP");
    assert.ok(lenses.some(({ focus, count, modules, route }) => focus === "AI agents" && count > 0 && modules > 0 && route.includes("topics")));

    const filters = { focus: "MCP", module: "Packages", category: "all", query: "agent workflow automation evaluation benchmark orchestration", sort: "saved" };
    assert.match(activeSummary(filters, 1, 2, sourceMeta, [{ module: "Packages", origin: "npm" }]), /Partial affects visible: npm/);
    assert.match(activeSummary({ ...filters, module: "Repos" }, 1, 0, sourceMeta, [{ module: "Repos", origin: "GitHub" }]), /Partial outside visible: npm/);
    assert.match(activeSummary(filters, 0, 0, sourceMeta), /Partial sources: npm/);
});

test("malformed or unavailable storage falls back without throwing", () => {
    const blocked = { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); } };
    assert.deepEqual(readSavedRecords(blocked), []);
    assert.deepEqual(readSavedSearches(blocked), []);
    assert.deepEqual(readExploreDefault(blocked), { ...defaultExploreState });
});
