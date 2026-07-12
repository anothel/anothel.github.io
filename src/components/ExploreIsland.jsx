import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    availableSearch,
    collectSourceMeta,
    compactText,
    focusDefinitions,
    focusValues,
    normalizeExploreData,
    safeExternalUrl,
    savedIdForItem,
    visibleItems
} from "../lib/explore-domain.js";
import { activeSummary, buildTopicLenses, dataModeText, sourceHealthModel } from "../lib/explore-model.js";
import {
    defaultExploreState,
    mergeSearches,
    readExploreDefault,
    readPinnedTopics,
    readSavedRecords,
    readSavedSearches,
    removeSavedItem,
    removeSearch,
    resetExploreDefault,
    saveExploreDefault,
    savedSearchExportPayload,
    savedSearchLabel,
    savedSearchesFromRaw,
    saveSearch,
    togglePinnedTopic,
    toggleSavedItem
} from "../lib/explore-storage.js";

const focusButtons = ["all", ...focusDefinitions.map(({ focus }) => focus), "Packages"];
const focusLabels = { all: "All", "Workflow automation": "Automation", "Developer tooling": "Tooling" };

function uniqueValues(items, key) {
    return [...new Set(items.map((item) => item[key]).filter(Boolean))].sort();
}

function savedIds(records) {
    return new Set(records.map(({ id }) => id));
}

function browserStorage() {
    try { return globalThis.localStorage; } catch { return undefined; }
}

function defaultStatus(state, prefix = "Default") {
    const focus = state.focus === "all" ? "All" : state.focus;
    const module = state.module === "all" ? "All modules" : state.module;
    const category = state.category === "all" ? "All categories" : state.category;
    const sort = state.sort === "saved" ? "saved first" : state.sort;
    return `${prefix}: ${focus} / ${module} / ${category} / ${sort}`;
}

function savedStatusText(status, search) {
    if (status === "saved") return "Search saved.";
    if (status === "applied") return `Applied: ${savedSearchLabel(search)}.`;
    if (status === "renamed") return "Saved search renamed.";
    if (status === "removed") return "Saved search removed.";
    if (status === "imported") return "Saved searches imported.";
    if (status === "not-imported") return "No new saved searches to import.";
    if (status === "full") return "Remove one to save another.";
    if (status === "blocked") return "Saved searches are unavailable in this browser.";
    return "Save reusable filter sets here.";
}

function ItemCard({ item, saved, onToggle }) {
    const href = safeExternalUrl(item.url);
    const summary = compactText(item.summary, 140);
    const reasons = item.scoreReasons?.slice(0, 2).map((reason) => compactText(reason, 96)) || [];
    return (
        <article className="explore-card" data-item-id={item.id} data-card-href={href === "#" ? undefined : href}>
            <div className="card-topline"><span>{item.module}</span><span>{item.category}</span></div>
            <h3>{href === "#" ? item.title : <a href={href} target="_blank" rel="noopener noreferrer">{item.title}</a>}</h3>
            <p className="why-copy"><strong>Why</strong> {summary}</p>
            <div className="card-meta">
                <span>{item.origin}</span><span>{item.metric}</span><span>{item.updated}</span>
                <span className="quality-marker" aria-label={`Signal fit score ${item.qualityScore || item.score || 0}`}>Signal fit {item.qualityScore || item.score || 0}</span>
            </div>
            {reasons.length > 0 && <ul className="score-reasons" aria-label="Why this item ranks highly"><li><strong>Why</strong> {reasons.join(" / ")}</li></ul>}
            {item.sourceContext && <p className="source-context">{item.sourceContext}</p>}
            <div className="explore-card-actions">
                <button type="button" data-save-id={savedIdForItem(item, saved) || item.id} aria-pressed={Boolean(savedIdForItem(item, saved))} onClick={() => onToggle(item)}>
                    {savedIdForItem(item, saved) ? "Saved" : "Save"}
                </button>
            </div>
        </article>
    );
}

export default function ExploreIsland({ prefix = "../", fallback, dataPaths }) {
    const [items, setItems] = useState(fallback.items);
    const [sourceMeta, setSourceMeta] = useState(fallback.sourceMeta);
    const [updated, setUpdated] = useState(fallback.updated);
    const [loaded, setLoaded] = useState(false);
    const [filters, setFilters] = useState({ ...defaultExploreState });
    const [records, setRecords] = useState([]);
    const [pinned, setPinned] = useState([]);
    const [searches, setSearches] = useState([]);
    const [searchStatus, setSearchStatus] = useState("empty");
    const [defaultMessage, setDefaultMessage] = useState(defaultStatus(defaultExploreState));
    const [portabilityStatus, setPortabilityStatus] = useState("Saved searches stay local.");
    const [importText, setImportText] = useState("");
    const fileInput = useRef(null);

    useEffect(() => {
        const storage = browserStorage();
        const defaults = readExploreDefault(storage);
        let requested = "all";
        try { requested = new URLSearchParams(globalThis.location?.search || "").get("focus") || "all"; } catch { requested = "all"; }
        setFilters({ ...defaultExploreState, ...defaults, focus: focusValues.has(requested) && requested !== "all" ? requested : defaults.focus });
        setDefaultMessage(defaultStatus(defaults));
        setRecords(readSavedRecords(storage));
        setPinned(readPinnedTopics(storage, focusDefinitions.map(({ focus }) => focus)));
        setSearches(readSavedSearches(storage));

        let cancelled = false;
        Promise.all(Object.entries(dataPaths).map(async ([key, path]) => {
            const response = await fetch(path);
            if (!response.ok) throw new Error(`${key} failed`);
            return [key, await response.json()];
        })).then((entries) => {
            if (cancelled) return;
            const data = Object.fromEntries(entries);
            setItems(normalizeExploreData(data, { signalPolicy: data.signalPolicy }));
            setSourceMeta(collectSourceMeta(data));
            setUpdated(data.manifest?.updated || fallback.updated);
            setLoaded(true);
        }).catch(() => setLoaded(false));
        return () => { cancelled = true; };
    }, [dataPaths, fallback.updated]);

    const saved = useMemo(() => {
        const stored = savedIds(records);
        const valid = new Set(items.flatMap((item) => [item.id, ...(item.legacyIds || [])]));
        return new Set([...stored].filter((id) => valid.has(id)));
    }, [items, records]);
    const visible = useMemo(() => visibleItems(items, filters, saved), [items, filters, saved]);
    const modules = useMemo(() => uniqueValues(items, "module"), [items]);
    const categories = useMemo(() => uniqueValues(items, "category"), [items]);
    const visibleCategories = useMemo(() => uniqueValues(visible, "category").length, [visible]);
    const initialView = !loaded && filters.focus === "all" && filters.module === "all" && filters.category === "all" && !filters.query && filters.sort === "priority";
    const visibleCount = initialView ? fallback.total : visible.length;
    const categoryCount = initialView ? fallback.categories : visibleCategories;
    const lenses = useMemo(() => loaded ? buildTopicLenses(items, new Set(pinned)) : [...fallback.topicLenses].sort((a, b) => pinned.includes(a.focus) ? -1 : pinned.includes(b.focus) ? 1 : 0), [fallback.topicLenses, items, loaded, pinned]);
    const health = useMemo(() => loaded ? sourceHealthModel(sourceMeta) : fallback.sourceHealth, [fallback.sourceHealth, loaded, sourceMeta]);
    const savedItems = useMemo(() => items.filter((item) => savedIdForItem(item, saved)), [items, saved]);

    function updateFilter(key, value) {
        setFilters((current) => ({ ...current, [key]: value }));
    }

    function clearFilters() {
        setFilters((current) => ({ ...defaultExploreState, sort: current.sort === "saved" ? "saved" : "priority" }));
    }

    function toggleSaved(item) {
        setRecords(toggleSavedItem(browserStorage(), item));
    }

    function saveCurrentSearch() {
        const result = saveSearch(browserStorage(), filters);
        setSearches(result.items);
        setSearchStatus(result.status);
    }

    function applySearch(search) {
        setFilters({ ...defaultExploreState, ...availableSearch(search, items) });
        setSearchStatus("applied");
    }

    function renameSearch(search) {
        const label = globalThis.prompt?.("Edit saved search name:", search.label || savedSearchLabel(search));
        if (typeof label !== "string") return;
        const result = saveSearch(browserStorage(), { ...search, label }, search.id);
        setSearches(result.items);
        setSearchStatus(result.status);
    }

    function deleteSearch(id) {
        const result = removeSearch(browserStorage(), id);
        setSearches(result.items);
        setSearchStatus(result.status);
    }

    function importSearchText(text) {
        const incoming = savedSearchesFromRaw(text);
        const result = mergeSearches(browserStorage(), incoming);
        setSearches(result.items);
        setSearchStatus(result.status);
        setPortabilityStatus(savedStatusText(result.status));
        return result;
    }

    function exportSearches() {
        const url = URL.createObjectURL(new Blob([savedSearchExportPayload(searches)], { type: "application/json" }));
        const link = document.createElement("a");
        link.href = url;
        link.download = "anothel-saved-searches.json";
        link.click();
        URL.revokeObjectURL(url);
        setPortabilityStatus("Saved searches exported.");
    }

    return (
        <>
            <section className="explore-command-bar" aria-labelledby="explore-command-title">
                <div className="explore-command-header">
                    <div><h2 id="explore-command-title">Find signals</h2><p data-explore-summary>{activeSummary(filters, visibleCount, saved.size, sourceMeta, visible)}</p></div>
                    <div className="explore-command-actions"><button className="ghost-button" type="button" data-clear-filters onClick={clearFilters}>Clear filters</button><a href={`${prefix}review/index.html`}>Review later</a></div>
                </div>
                <details className="explore-filter-shell" data-explore-filter-shell open>
                    <summary className="explore-filter-toggle"><span>Filters and saved searches</span></summary>
                    <div className="explore-workbench">
                        <div className="explore-filter-board explore-control-rail">
                            <div className="explore-controls">
                                <label className="explore-search-field">Search<input data-explore-query type="search" placeholder="agent, skills, runtime" value={filters.query} onChange={(event) => updateFilter("query", event.target.value)} /></label>
                                <label>Module<select data-explore-module value={filters.module} onChange={(event) => updateFilter("module", event.target.value)}><option value="all">All modules</option>{modules.map((value) => <option key={value}>{value}</option>)}</select></label>
                                <label>Sort<select data-explore-sort value={filters.sort} onChange={(event) => updateFilter("sort", event.target.value)}><option value="priority">Priority</option><option value="saved">Saved first</option><option value="module">Module</option><option value="category">Category</option></select></label>
                            </div>
                            <div className="advanced-filter-grid" aria-label="Primary filters"><label>Category<select data-explore-category value={filters.category} onChange={(event) => updateFilter("category", event.target.value)}><option value="all">All categories</option>{categories.map((value) => <option key={value}>{value}</option>)}</select></label></div>
                            <div className="quick-filter-group explore-focus-chips" aria-label="Signal focus"><span>Signal focus</span>{focusButtons.map((focus) => <button key={focus} type="button" data-focus-filter={focus} aria-pressed={filters.focus === focus} onClick={() => updateFilter("focus", focus)}>{focusLabels[focus] || focus}</button>)}</div>
                        </div>
                        <aside className="explore-saved-tools" aria-label="Saved explore tools">
                            <div className="saved-searches" aria-label="Saved searches">
                                <div className="saved-searches-header"><strong>Saved searches</strong><button type="button" data-save-search onClick={saveCurrentSearch}>Save search</button></div>
                                <div data-saved-searches>{searches.length ? searches.map((search) => <article className="saved-search-item" key={search.id}><span className="saved-search-label">{savedSearchLabel(search)}</span><button type="button" data-apply-search-id={search.id} onClick={() => applySearch(search)}>Apply</button><button type="button" data-edit-search-id={search.id} onClick={() => renameSearch(search)}>Rename</button><button type="button" data-remove-search-id={search.id} onClick={() => deleteSearch(search.id)}>Delete</button></article>) : <p className="saved-search-empty">{savedStatusText(searchStatus)}</p>}</div>
                                <p className="saved-search-status" data-saved-search-status>{savedStatusText(searchStatus, searches[0])}</p>
                            </div>
                            <div className="explore-defaults">
                                <div className="preference-actions" aria-label="Explore defaults"><button type="button" data-save-explore-default onClick={() => { const savedDefault = saveExploreDefault(browserStorage(), filters); setDefaultMessage(defaultStatus(savedDefault, "Default saved")); }}>Set as default</button><button type="button" data-reset-explore-default onClick={() => { const reset = resetExploreDefault(browserStorage()); setFilters(reset); setDefaultMessage(defaultStatus(reset, "Default reset")); }}>Reset default</button></div>
                                <p className="preference-status" data-explore-default-status>{defaultMessage}</p>
                            </div>
                            <div className="explore-search-portability" aria-label="Saved search portability">
                                <div className="preference-actions"><button type="button" data-saved-search-export onClick={exportSearches}>Export JSON</button><button type="button" data-saved-search-import onClick={() => fileInput.current?.click()}>Import JSON</button></div>
                                <textarea className="search-portability-text" data-saved-search-import-text placeholder="Paste saved-search JSON" value={importText} onChange={(event) => setImportText(event.target.value)} />
                                <button type="button" data-saved-search-import-paste onClick={() => { if (!importText) return setPortabilityStatus("Paste Search JSON first."); importSearchText(importText); setImportText(""); }}>Import pasted JSON</button>
                                <input ref={fileInput} type="file" accept="application/json,.json" data-saved-search-import-file hidden onChange={async (event) => { const file = event.target.files?.[0]; if (file) importSearchText(await file.text()); event.target.value = ""; }} />
                                <p className="preference-status" data-saved-search-portability-status>{portabilityStatus}</p>
                            </div>
                        </aside>
                    </div>
                </details>
            </section>

            <section className="stats-grid" aria-label="Explore stats"><article className="stat-card"><span>Visible items</span><strong data-explore-total>{visibleCount}</strong></article><article className="stat-card"><span>Saved</span><strong data-explore-saved-count>{saved.size}</strong></article><article className="stat-card"><span>Categories</span><strong data-explore-categories>{categoryCount}</strong></article></section>

            <section className="health-panel topic-lens-panel" aria-labelledby="topic-lens-title"><div className="panel-heading"><h2 id="topic-lens-title">Topic lenses</h2><p>Apply a recurring theme, then open a focused page when it needs its own view.</p></div><div className="topic-lens-grid" data-topic-lenses>{lenses.map((lens) => <article className="topic-lens-card" key={lens.focus}><div><span>{lens.count} items / {lens.modules} modules</span><strong>{lens.label}</strong></div><p>{lens.description}</p><small>{lens.topItem ? `${lens.topItem.title} / ${lens.topItem.module}` : "No focused signal yet"}</small><div className="topic-lens-actions"><button type="button" data-focus-lens={lens.focus} aria-pressed={filters.focus === lens.focus} onClick={() => updateFilter("focus", lens.focus)}>Use lens</button><button className="pin-topic-button" type="button" data-pin-topic={lens.focus} aria-pressed={pinned.includes(lens.focus)} onClick={() => setPinned(togglePinnedTopic(browserStorage(), lens.focus, focusDefinitions.map(({ focus }) => focus)))}>{pinned.includes(lens.focus) ? "Pinned" : "Pin"}</button><a href={lens.route}>Open topic</a></div></article>)}</div></section>

            <section className="health-panel" aria-labelledby="explore-health-title"><div className="panel-heading"><h2 id="explore-health-title">Source health</h2><p data-data-mode>{loaded ? dataModeText(sourceMeta, updated) : fallback.dataMode}</p></div><div className="source-health-grid" data-source-health>{health.map((source, index) => <article className={`source-health-card status-${source.status}`} key={`${source.name}-${index}`}><div><strong>{source.name}</strong><span>{source.status}</span></div><p>{source.count} visible items</p><small>{source.detail}</small></article>)}</div></section>

            <section className="explore-workspace" aria-label="Explore workspace">
                <aside className="saved-panel" aria-labelledby="saved-title"><div className="panel-heading"><h2 id="saved-title">Review later</h2><p><a href={`${prefix}review/index.html`}>Open Review</a></p></div><div className="saved-list" data-explore-saved>{savedItems.length ? savedItems.map((item) => { const id = savedIdForItem(item, saved); return <article className="saved-item" key={item.id}><div><strong>{item.title}</strong><span>{[item.module, item.metric, item.sourceContext].filter(Boolean).join(" / ")}</span></div><button type="button" data-remove-id={id} onClick={() => setRecords(removeSavedItem(browserStorage(), id))}>Remove</button></article>; }) : <p className="saved-empty">Save items to review later in this browser.</p>}</div></aside>
                <section className="rank-panel" aria-labelledby="explore-results-title"><div className="panel-heading"><h2 id="explore-results-title">Results</h2></div><div className="explore-results" data-explore-results>{visible.length ? visible.map((item) => <ItemCard key={item.id} item={item} saved={saved} onToggle={toggleSaved} />) : <article className="explore-card empty-card"><h3>No matching items</h3><p>Broaden the search, switch module, or clear current filters.</p></article>}</div></section>
            </section>
        </>
    );
}
