export const storageKeys = Object.freeze({
    savedItems: "anothel.explore.saved.v1",
    pinnedTopics: "anothel.preferences.pinnedTopics.v1",
    exploreState: "anothel.preferences.exploreState.v1",
    savedSearches: "anothel.preferences.savedSearches.v1"
});

const validStatuses = new Set(["unread", "read", "done"]);

export function readStorage(storage, key, fallback = "") {
    try { return storage?.getItem(key) ?? fallback; } catch { return fallback; }
}

export function writeStorage(storage, key, value) {
    try {
        if (!storage || typeof storage.setItem !== "function") return false;
        storage.setItem(key, value);
        return true;
    } catch {
        return false;
    }
}

export function removeStorage(storage, key) {
    try {
        if (!storage || typeof storage.removeItem !== "function") return false;
        storage.removeItem(key);
        return true;
    } catch {
        return false;
    }
}

function normalizeRecord(record, now = () => new Date().toISOString()) {
    if (!record || typeof record.id !== "string" || !record.id.trim()) return null;
    const normalized = {
        id: record.id,
        savedAt: typeof record.savedAt === "string" ? record.savedAt : now(),
        status: validStatuses.has(record.status) ? record.status : "unread"
    };
    for (const field of ["note", "tag", "reason"]) {
        if (typeof record[field] === "string" && record[field].trim()) normalized[field] = record[field].trim();
    }
    return normalized;
}

export function savedRecordsFromRaw(raw, options = {}) {
    const now = options.now || (() => new Date().toISOString());
    try {
        const parsed = JSON.parse(raw || "[]");
        if (Array.isArray(parsed)) return parsed.filter((id) => typeof id === "string").map((id) => normalizeRecord({ id }, now)).filter(Boolean);
        if (parsed?.version === 2 && Array.isArray(parsed.items)) return parsed.items.map((item) => normalizeRecord(item, now)).filter(Boolean);
    } catch { return []; }
    return [];
}

export function readSavedRecords(storage, options) {
    return savedRecordsFromRaw(readStorage(storage, storageKeys.savedItems, "[]"), options);
}

export function savedSummary(records = []) {
    return {
        saved: records.length,
        unread: records.filter((record) => record.status === "unread").length
    };
}

export function readSavedSummary(storage, options) {
    try {
        if (!storage || typeof storage.getItem !== "function") {
            return { available: false, saved: null, unread: null };
        }
        const records = savedRecordsFromRaw(storage.getItem(storageKeys.savedItems) ?? "[]", options);
        return { available: true, ...savedSummary(records) };
    } catch {
        return { available: false, saved: null, unread: null };
    }
}

export function writeSavedRecords(storage, records, options = {}) {
    const now = options.now || (() => new Date().toISOString());
    const items = records.map((record) => normalizeRecord(record, now)).filter(Boolean);
    writeStorage(storage, storageKeys.savedItems, JSON.stringify({ version: 2, items }));
    return items;
}

export function toggleSavedItem(storage, item, options) {
    const records = readSavedRecords(storage, options);
    const ids = new Set([item.id, ...(item.legacyIds || [])]);
    const existing = records.find((record) => ids.has(record.id));
    return writeSavedRecords(storage, existing ? records.filter((record) => record !== existing) : [...records, { id: item.id }], options);
}

export function removeSavedItem(storage, id, options) {
    return writeSavedRecords(storage, readSavedRecords(storage, options).filter((record) => record.id !== id), options);
}

export function clearSavedItems(storage, options) {
    return writeSavedRecords(storage, [], options);
}

export function setSavedItemStatus(storage, id, status, options) {
    if (!validStatuses.has(status)) return readSavedRecords(storage, options);
    return writeSavedRecords(storage, readSavedRecords(storage, options).map((record) => (
        record.id === id ? { ...record, status } : record
    )), options);
}

export function setSavedItemMeta(storage, id, fields = {}, options) {
    return writeSavedRecords(storage, readSavedRecords(storage, options).map((record) => {
        if (record.id !== id) return record;
        const next = { ...record };
        for (const field of ["note", "tag", "reason"]) {
            const value = typeof fields[field] === "string" ? fields[field].trim() : "";
            if (value) next[field] = value;
            else delete next[field];
        }
        return next;
    }), options);
}

export function mergeSavedRecords(storage, incomingRecords = [], options) {
    const records = readSavedRecords(storage, options);
    const normalized = savedRecordsFromRaw(JSON.stringify({ version: 2, items: incomingRecords }), options);
    const ids = new Set(records.map(({ id }) => id));
    const added = normalized.filter(({ id }) => !ids.has(id) && ids.add(id));
    return {
        records: writeSavedRecords(storage, [...records, ...added], options),
        added: added.length,
        skipped: normalized.length - added.length
    };
}

export function pinnedTopicsFromRaw(raw, validTopics) {
    try {
        const parsed = JSON.parse(raw || "[]");
        const topics = Array.isArray(parsed) ? parsed : parsed?.version === 1 ? parsed.topics : [];
        return [...new Set((topics || []).filter((topic) => validTopics.includes(topic)))].slice(0, 3);
    } catch { return []; }
}

export function readPinnedTopicsState(storage, validTopics) {
    try {
        if (!storage || typeof storage.getItem !== "function") return { available: false, topics: [] };
        return { available: true, topics: pinnedTopicsFromRaw(storage.getItem(storageKeys.pinnedTopics), validTopics) };
    } catch {
        return { available: false, topics: [] };
    }
}

export function readPinnedTopics(storage, validTopics) {
    return readPinnedTopicsState(storage, validTopics).topics;
}

export function togglePinnedTopicState(storage, topic, validTopics) {
    const state = readPinnedTopicsState(storage, validTopics);
    if (!state.available || !validTopics.includes(topic)) return state;
    const current = state.topics;
    const next = current.includes(topic) ? current.filter((item) => item !== topic) : [...current, topic].slice(-3);
    return writeStorage(storage, storageKeys.pinnedTopics, JSON.stringify({ version: 1, topics: next }))
        ? { available: true, topics: next }
        : { available: false, topics: current };
}

export function togglePinnedTopic(storage, topic, validTopics) {
    return togglePinnedTopicState(storage, topic, validTopics).topics;
}
