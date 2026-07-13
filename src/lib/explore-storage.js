import { focusValues, sortValues } from "./explore-domain.js";
import { readStorage as get, removeStorage as remove, storageKeys, writeStorage as set } from "./storage-contract.js";

export * from "./storage-contract.js";

export const defaultExploreState = Object.freeze({ focus: "all", module: "all", category: "all", query: "", sort: "priority" });
const maxSavedSearches = 5;

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
