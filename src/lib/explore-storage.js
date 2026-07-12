import { focusValues, sortValues } from "./explore-domain.js";

export const storageKeys = Object.freeze({
    savedItems: "anothel.explore.saved.v1",
    pinnedTopics: "anothel.preferences.pinnedTopics.v1",
    exploreState: "anothel.preferences.exploreState.v1",
    savedSearches: "anothel.preferences.savedSearches.v1"
});
export const defaultExploreState = Object.freeze({ focus: "all", module: "all", category: "all", query: "", sort: "priority" });
const validStatuses = new Set(["unread", "read", "done"]);
const maxSavedSearches = 5;

function get(storage, key, fallback = "") {
    try { return storage?.getItem(key) ?? fallback; } catch { return fallback; }
}

function set(storage, key, value) {
    try { storage?.setItem(key, value); return true; } catch { return false; }
}

function remove(storage, key) {
    try { storage?.removeItem?.(key); return true; } catch { return false; }
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
    return savedRecordsFromRaw(get(storage, storageKeys.savedItems, "[]"), options);
}

export function writeSavedRecords(storage, records, options = {}) {
    const now = options.now || (() => new Date().toISOString());
    const items = records.map((record) => normalizeRecord(record, now)).filter(Boolean);
    set(storage, storageKeys.savedItems, JSON.stringify({ version: 2, items }));
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

export function readPinnedTopics(storage, validTopics) {
    try {
        const parsed = JSON.parse(get(storage, storageKeys.pinnedTopics, "[]"));
        const topics = Array.isArray(parsed) ? parsed : parsed?.version === 1 ? parsed.topics : [];
        return [...new Set((topics || []).filter((topic) => validTopics.includes(topic)))].slice(0, 3);
    } catch { return []; }
}

export function togglePinnedTopic(storage, topic, validTopics) {
    const current = readPinnedTopics(storage, validTopics);
    const next = current.includes(topic) ? current.filter((item) => item !== topic) : [...current, topic].slice(-3);
    set(storage, storageKeys.pinnedTopics, JSON.stringify({ version: 1, topics: next }));
    return next;
}

export function normalizeSearch(value = {}) {
    if (typeof value === "string") value = { query: value };
    return {
        focus: focusValues.has(value.focus) ? value.focus : "all",
        module: typeof value.module === "string" && value.module ? value.module : "all",
        category: typeof value.category === "string" && value.category ? value.category : "all",
        query: typeof value.query === "string" ? value.query.trim() : "",
        sort: sortValues.has(value.sort) ? value.sort : "priority",
        label: typeof value.label === "string" ? value.label.trim() : ""
    };
}

export function savedSearchId(value) {
    const search = normalizeSearch(value);
    return ["focus", "module", "category", "query", "sort"].map((key) => `${key}:${search[key].toLowerCase()}`).join("|");
}

function validImportEntry(value) {
    if (typeof value === "string") return Boolean(value.trim());
    return value && typeof value === "object" && ["focus", "module", "category", "query", "sort", "label"].some((key) => typeof value[key] === "string");
}

function normalizeSearches(items) {
    const seen = new Set();
    return (items || []).filter(validImportEntry).map((value) => {
        const search = normalizeSearch(value);
        return { id: savedSearchId(search), ...search };
    }).filter((search) => !seen.has(search.id) && seen.add(search.id)).slice(0, maxSavedSearches);
}

export function savedSearchesFromRaw(raw) {
    try {
        const parsed = JSON.parse(raw || "[]");
        if (Array.isArray(parsed)) return normalizeSearches(parsed);
        if (parsed?.version === 1 && Array.isArray(parsed.items)) return normalizeSearches(parsed.items);
    } catch { return []; }
    return [];
}

export function readSavedSearches(storage) {
    return savedSearchesFromRaw(get(storage, storageKeys.savedSearches, "{}"));
}

function writeSavedSearches(storage, searches) {
    const items = normalizeSearches(searches);
    return { ok: set(storage, storageKeys.savedSearches, JSON.stringify({ version: 1, items })), items };
}

export function saveSearch(storage, value, existingId = "") {
    const item = { id: savedSearchId(value), ...normalizeSearch(value) };
    const current = readSavedSearches(storage);
    const rest = current.filter((search) => search.id !== existingId && search.id !== item.id);
    if (!existingId && !current.some((search) => search.id === item.id) && rest.length >= maxSavedSearches) return { status: "full", items: current };
    const written = writeSavedSearches(storage, [item, ...rest]);
    return { status: written.ok ? (existingId ? "renamed" : "saved") : "blocked", items: written.items };
}

export function removeSearch(storage, id) {
    const written = writeSavedSearches(storage, readSavedSearches(storage).filter((search) => search.id !== id));
    return { status: written.ok ? "removed" : "blocked", items: written.items };
}

export function mergeSearches(storage, incoming) {
    const current = readSavedSearches(storage);
    const ids = new Set(current.map(({ id }) => id));
    const added = normalizeSearches(incoming).filter(({ id }) => !ids.has(id));
    const written = writeSavedSearches(storage, [...current, ...added]);
    return { status: written.ok ? (added.length ? "imported" : "not-imported") : "blocked", items: written.items, added: added.length };
}

export function savedSearchLabel(value) {
    const search = normalizeSearch(value);
    if (search.label) return search.label;
    const query = search.query.length > 42 ? `${search.query.slice(0, 42)}...` : search.query;
    const parts = [search.focus !== "all" && search.focus, search.module !== "all" && search.module, search.category !== "all" && search.category, query, search.sort !== "priority" && (search.sort === "saved" ? "saved first" : search.sort)].filter(Boolean);
    return parts.join(" / ") || "All signals";
}

export function savedSearchExportPayload(searches, now = () => new Date().toISOString()) {
    return JSON.stringify({ version: 1, exportedAt: now(), items: searches.map(normalizeSearch) }, null, 2);
}

export function readExploreDefault(storage) {
    try {
        const parsed = JSON.parse(get(storage, storageKeys.exploreState, "{}"));
        return parsed?.version === 1 ? normalizeSearch(parsed) : { ...defaultExploreState };
    } catch { return { ...defaultExploreState }; }
}

export function saveExploreDefault(storage, state) {
    const normalized = normalizeSearch(state);
    const value = { focus: normalized.focus, module: normalized.module, category: normalized.category, sort: normalized.sort };
    set(storage, storageKeys.exploreState, JSON.stringify({ version: 1, ...value }));
    return value;
}

export function resetExploreDefault(storage) {
    remove(storage, storageKeys.exploreState);
    return { ...defaultExploreState };
}
