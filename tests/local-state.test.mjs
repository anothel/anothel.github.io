import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

function loadLocalState() {
    const context = {};
    vm.runInNewContext(readFileSync("js/local-state.js", "utf8"), context);
    return context.AnothelState;
}

function memoryStorage(initial = new Map()) {
    return {
        memory: initial,
        getItem(key) {
            return this.memory.get(key) || null;
        },
        setItem(key, value) {
            this.memory.set(key, value);
        },
        removeItem(key) {
            this.memory.delete(key);
        }
    };
}

function plain(value) {
    return JSON.parse(JSON.stringify(value));
}

test("LocalState exposes stable storage keys", () => {
    const state = loadLocalState();

    assert.deepEqual(plain(state.keys), {
        savedItems: "anothel.explore.saved.v1",
        pinnedTopics: "anothel.preferences.pinnedTopics.v1"
    });
});

test("saved item store migrates v1 ids and normalizes missing fields", () => {
    const state = loadLocalState();
    const storage = memoryStorage(new Map([
        [state.keys.savedItems, JSON.stringify(["repos:a", 7, "packages:b"])]
    ]));
    const store = state.createSavedItemStore(storage, { now: () => "2026-06-24T00:00:00.000Z" });

    assert.deepEqual(plain(store.readRecords()), [
        { id: "repos:a", savedAt: "2026-06-24T00:00:00.000Z", status: "unread" },
        { id: "packages:b", savedAt: "2026-06-24T00:00:00.000Z", status: "unread" }
    ]);

    storage.setItem(state.keys.savedItems, JSON.stringify({
        version: 2,
        items: [
            { id: "links:c", savedAt: "2026-06-20T00:00:00.000Z", status: "done" },
            { id: "links:d", status: "bad" },
            { id: 3 }
        ]
    }));

    assert.deepEqual(plain(store.readRecords()), [
        { id: "links:c", savedAt: "2026-06-20T00:00:00.000Z", status: "done" },
        { id: "links:d", savedAt: "2026-06-24T00:00:00.000Z", status: "unread" }
    ]);
});

test("saved item store toggles, removes, sets status, and ignores blocked storage", () => {
    const state = loadLocalState();
    const storage = memoryStorage();
    const store = state.createSavedItemStore(storage, { now: () => "2026-06-24T00:00:00.000Z" });

    assert.deepEqual([...store.toggle("repos:a")], ["repos:a"]);
    assert.deepEqual(plain(store.readRecords()), [{ id: "repos:a", savedAt: "2026-06-24T00:00:00.000Z", status: "unread" }]);
    assert.deepEqual([...store.setStatus("repos:a", "done")], ["repos:a"]);
    assert.equal(store.recordsById().get("repos:a").status, "done");
    assert.deepEqual([...store.remove("repos:a")], []);

    const blocked = state.createSavedItemStore({
        getItem() { throw new Error("blocked"); },
        setItem() { throw new Error("blocked"); }
    });
    assert.deepEqual(plain(blocked.readRecords()), []);
    assert.deepEqual([...blocked.toggle("repos:a")], ["repos:a"]);
});

test("saved item store imports new records without overwriting existing records", () => {
    const state = loadLocalState();
    const storage = memoryStorage();
    const store = state.createSavedItemStore(storage, { now: () => "2026-06-24T00:00:00.000Z" });

    store.toggle("repos:a");
    store.setStatus("repos:a", "done");
    const result = store.mergeRecords([
        { id: "repos:a", savedAt: "2026-06-20T00:00:00.000Z", status: "unread" },
        { id: "links:b", savedAt: "2026-06-21T00:00:00.000Z", status: "read" },
        { id: 7 }
    ]);

    assert.deepEqual(plain(result), { added: 1, skipped: 1, total: 2 });
    assert.deepEqual(plain(store.readRecords()), [
        { id: "repos:a", savedAt: "2026-06-24T00:00:00.000Z", status: "done" },
        { id: "links:b", savedAt: "2026-06-21T00:00:00.000Z", status: "read" }
    ]);
});

test("saved item store preserves optional review metadata", () => {
    const state = loadLocalState();
    const storage = memoryStorage(new Map([
        [state.keys.savedItems, JSON.stringify({
            version: 2,
            items: [
                {
                    id: "repos:a",
                    savedAt: "2026-06-20T00:00:00.000Z",
                    status: "read",
                    note: "Compare with MCP servers.",
                    tag: "agent",
                    reason: "Use for reusable workflow."
                },
                { id: "repos:b", note: 7, tag: "", reason: "  " }
            ]
        })]
    ]));
    const store = state.createSavedItemStore(storage, { now: () => "2026-06-24T00:00:00.000Z" });

    assert.deepEqual(plain(store.readRecords()), [
        {
            id: "repos:a",
            savedAt: "2026-06-20T00:00:00.000Z",
            status: "read",
            note: "Compare with MCP servers.",
            tag: "agent",
            reason: "Use for reusable workflow."
        },
        { id: "repos:b", savedAt: "2026-06-24T00:00:00.000Z", status: "unread" }
    ]);

    store.setMeta("repos:a", { note: "Keep", tag: "skills", reason: "" });

    assert.deepEqual(plain(store.recordsById().get("repos:a")), {
        id: "repos:a",
        savedAt: "2026-06-20T00:00:00.000Z",
        status: "read",
        note: "Keep",
        tag: "skills"
    });
});

test("saved summary filters stale ids and counts unread records", () => {
    const state = loadLocalState();
    const validIds = new Set(["repos:a", "links:c"]);

    assert.deepEqual(plain(state.savedSummaryFromRaw(JSON.stringify(["repos:a", "packages:b"]), validIds)), {
        saved: 1,
        unread: 1
    });
    assert.deepEqual(plain(state.savedSummaryFromRaw(JSON.stringify({
        version: 2,
        items: [
            { id: "repos:a", status: "read" },
            { id: "links:c", status: "unread" },
            { id: "packages:b", status: "unread" }
        ]
    }), validIds)), {
        saved: 2,
        unread: 1
    });
    assert.deepEqual(plain(state.savedSummaryFromRaw("broken")), { saved: 0, unread: 0 });
});

test("pinned topic store reads legacy arrays, caps values, and ignores invalid topics", () => {
    const state = loadLocalState();
    const storage = memoryStorage(new Map([
        [state.keys.pinnedTopics, JSON.stringify(["MCP", "Unknown", "AI agents", "Agent skills", "AI evals"])]
    ]));
    const store = state.createPinnedTopicStore(storage, ["AI agents", "Agent skills", "MCP", "AI evals"]);

    assert.deepEqual(plain(store.read()), ["MCP", "AI agents", "Agent skills"]);
    assert.deepEqual(plain(store.toggle("AI evals")), ["AI agents", "Agent skills", "AI evals"]);
    assert.deepEqual(plain(store.toggle("AI agents")), ["Agent skills", "AI evals"]);
    assert.deepEqual(plain(store.toggle("Unknown")), ["Agent skills", "AI evals"]);
});
