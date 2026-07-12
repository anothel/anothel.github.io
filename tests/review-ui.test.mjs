import test from "node:test";
import assert from "node:assert/strict";
import {
    clearSavedItems,
    mergeSavedRecords,
    readSavedRecords,
    savedRecordsFromRaw,
    setSavedItemMeta,
    setSavedItemStatus,
    storageKeys,
    writeSavedRecords
} from "../src/lib/explore-storage.js";
import {
    filterReviewItems,
    matchSavedItems,
    reviewImportPreview,
    reviewImportRecords,
    reviewJsonPayload,
    reviewMarkdownPayload,
    reviewStats,
    selectedReviewItem,
    similarExploreHref,
    sortReviewItems,
    topicNotesHref,
    workflowStats
} from "../src/lib/review-domain.js";

const now = () => "2026-07-12T00:00:00.000Z";
const items = [
    { id: "url:https://example.com/agents", legacyIds: ["trends:https://example.com/agents"], title: "Agent trend", module: "Trends", category: "AI agents", origin: "HN", metric: "Fast", summary: "Agent workflow", url: "https://example.com/agents", sources: ["Trends", "Links"], score: 90, updated: "2026-07-12" },
    { id: "url:https://example.com/mcp", legacyIds: ["packages:https://example.com/mcp"], title: "MCP package", module: "Packages", category: "MCP", origin: "npm", metric: "1m downloads", summary: "MCP server", url: "https://example.com/mcp", sources: ["Packages"], score: 80, updated: "2026-07-11" },
    { id: "url:https://example.com/tool", legacyIds: [], title: "Plain formatter", module: "Repos", category: "Developer tooling", origin: "GitHub", metric: "100 stars", summary: "Formatting tool", url: "https://example.com/tool", sources: ["Repos"], score: 60, updated: "2026-07-10" }
];

function memoryStorage(raw = "[]") {
    const values = new Map([[storageKeys.savedItems, raw]]);
    return {
        getItem: (key) => values.get(key) ?? null,
        setItem: (key, value) => values.set(key, value),
        value: () => JSON.parse(values.get(storageKeys.savedItems))
    };
}

test("Review matches current and legacy ids and reports mixed stale records", () => {
    const records = [
        { id: items[0].id, savedAt: "2026-07-10", status: "read" },
        { id: items[1].legacyIds[0], savedAt: "2026-07-11", status: "unread", reason: "Try it" },
        { id: "missing:item", savedAt: "2026-07-09", status: "done" }
    ];
    const result = matchSavedItems(items, records);
    assert.deepEqual(result.items.map(({ savedRecordId }) => savedRecordId), [items[1].legacyIds[0], items[0].id]);
    assert.deepEqual(result.staleRecords.map(({ id }) => id), ["missing:item"]);
    assert.equal(result.items[0].savedReason, "Try it");
});

test("Review queue sorts unread, read, done then metadata and newest saved date", () => {
    const sorted = sortReviewItems([
        { id: "done", savedStatus: "done", savedAt: "2026-07-12" },
        { id: "plain", savedStatus: "unread", savedAt: "2026-07-12" },
        { id: "meta-old", savedStatus: "unread", savedAt: "2026-07-10", savedNote: "note" },
        { id: "meta-new", savedStatus: "unread", savedAt: "2026-07-11", savedTag: "tag" },
        { id: "read", savedStatus: "read", savedAt: "2026-07-12" }
    ]);
    assert.deepEqual(sorted.map(({ id }) => id), ["meta-new", "meta-old", "plain", "read", "done"]);
});

test("Review status filters preserve all four workflows", () => {
    const queue = ["unread", "read", "done"].map((savedStatus) => ({ id: savedStatus, savedStatus }));
    assert.deepEqual(filterReviewItems(queue, "all").map(({ id }) => id), ["unread", "read", "done"]);
    for (const status of ["unread", "read", "done"]) assert.deepEqual(filterReviewItems(queue, status).map(({ id }) => id), [status]);
});

test("Review stats count visible focus areas, sources, and every workflow status", () => {
    const matched = matchSavedItems(items, items.map((item, index) => ({ id: item.id, savedAt: `2026-07-1${index}`, status: ["unread", "read", "done"][index] }))).items;
    assert.deepEqual(reviewStats(matched), { visible: 3, focusAreas: 3, sources: 4 });
    assert.deepEqual(workflowStats(matched), { unread: 1, read: 1, done: 1 });
});

test("Review selection keeps a valid id and falls back safely", () => {
    assert.equal(selectedReviewItem(items, items[1].id).id, items[1].id);
    assert.equal(selectedReviewItem(items, "missing").id, items[0].id);
    assert.equal(selectedReviewItem([], "missing"), null);
});

test("Review similar and topic-note links keep Explore focus semantics", () => {
    assert.equal(similarExploreHref(items[1]), "../explore/index.html?focus=MCP");
    assert.equal(topicNotesHref(items[1]), "../notes/index.html");
    assert.equal(topicNotesHref(items[2]), "");
    assert.equal(similarExploreHref({ module: "Packages", title: "Neutral package" }), "../explore/index.html?focus=Packages");
});

test("Review JSON export emits only compatible version 2 record fields", () => {
    const payload = JSON.parse(reviewJsonPayload([{ id: "one", status: "read", savedAt: "2026-07-12", note: " note ", unsupported: "drop" }], now));
    assert.deepEqual(payload, { version: 2, exportedAt: now(), items: [{ id: "one", savedAt: "2026-07-12", status: "read", note: "note" }] });
});

test("Review Markdown export includes metadata and neutralizes unsafe URLs", () => {
    const markdown = reviewMarkdownPayload([{ id: "one", title: "[Unsafe]", url: "javascript:alert(1)", module: "Links", category: "Security", metric: "Reference", savedStatus: "unread", savedReason: "Why\nnow", savedTag: "tag", savedNote: "note", summary: "summary", savedAt: "2026-07-12" }], now);
    assert.match(markdown, /- \[unread\] Unsafe - Links \/ Security \/ Reference/);
    assert.match(markdown, /Reason: Why now/);
    assert.doesNotMatch(markdown, /javascript:|\]\(javascript/);
});

test("Review import rejects malformed entries and previews duplicates", () => {
    assert.deepEqual(reviewImportRecords("{broken"), []);
    const incoming = reviewImportRecords(JSON.stringify({ version: 2, items: [{ id: "one" }, { id: "one" }, { nope: true }] }), { now });
    assert.equal(incoming.length, 2);
    assert.deepEqual(reviewImportPreview(incoming, [{ id: "one" }]), { added: 0, skipped: 2 });
});

test("Explore storage accepts legacy arrays and normalizes version 2 records", () => {
    assert.deepEqual(savedRecordsFromRaw('["legacy"]', { now }), [{ id: "legacy", savedAt: now(), status: "unread" }]);
    assert.deepEqual(savedRecordsFromRaw(JSON.stringify({ version: 2, items: [{ id: "two", status: "unknown", reason: "", tag: " x " }] }), { now }), [{ id: "two", savedAt: now(), status: "unread", tag: "x" }]);
});

test("Review status and metadata writes remain Home and Explore compatible", () => {
    const storage = memoryStorage(JSON.stringify({ version: 2, items: [{ id: "one", savedAt: "2026-07-12", status: "unread", note: "old" }] }));
    setSavedItemStatus(storage, "one", "done", { now });
    setSavedItemMeta(storage, "one", { reason: " why ", tag: "", note: "" }, { now });
    assert.deepEqual(storage.value(), { version: 2, items: [{ id: "one", savedAt: "2026-07-12", status: "done", reason: "why" }] });
});

test("Review merge adds unique valid ids without replacing existing records", () => {
    const storage = memoryStorage(JSON.stringify({ version: 2, items: [{ id: "one", savedAt: "2026-07-10", status: "read" }] }));
    const result = mergeSavedRecords(storage, [{ id: "one", status: "done" }, { id: "two", status: "unread" }, { id: "two", status: "done" }, { bad: true }], { now });
    assert.equal(result.added, 1);
    assert.equal(result.skipped, 2);
    assert.deepEqual(result.records, [{ id: "one", savedAt: "2026-07-10", status: "read" }, { id: "two", savedAt: now(), status: "unread" }]);
});

test("Review clear writes an empty compatible version 2 queue", () => {
    const storage = memoryStorage('["one"]');
    assert.deepEqual(clearSavedItems(storage, { now }), []);
    assert.deepEqual(storage.value(), { version: 2, items: [] });
});

test("Unavailable localStorage never crashes Review storage operations", () => {
    const blocked = { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); } };
    assert.deepEqual(readSavedRecords(blocked, { now }), []);
    assert.doesNotThrow(() => writeSavedRecords(blocked, [{ id: "one" }], { now }));
    assert.doesNotThrow(() => setSavedItemStatus(blocked, "one", "done", { now }));
});
