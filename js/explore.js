(function attachExplore(global) {
    const preferredExploreStorageKey = "anothel.preferences.exploreState.v1";
    const savedSearchStorageKey = "anothel.preferences.savedSearches.v1";
    const dataHealth = global.DataHealth;
    const localState = global.AnothelState;
    const signalSchema = global.SignalSchema;
    const dom = global.AnothelDom;
    const topicTaxonomy = global.TopicTaxonomy;
    const defaultExploreState = { focus: "all", sort: "priority" };
    const maxSavedSearches = 5;

    const defaultPaths = {
        manifest: "../data/manifest.json",
        trends: "../data/trends.json",
        packages: "../data/packages.json",
        repos: "../data/repos.json",
        links: "../data/links.json",
        signalPolicy: "../data/signal-policy.json"
    };

    const state = {
        items: [],
        sourceMeta: [],
        updated: "",
        module: "all",
        category: "all",
        focus: "all",
        query: "",
        sort: "priority",
        savedIds: new Set(),
        pinnedTopics: new Set(),
        savedSearches: []
    };

    const topicLensDefinitions = topicTaxonomy.topicLensDefinitions("../");
    const knownTopicNames = topicLensDefinitions.map((definition) => definition.focus);
    const allowedFocusValues = new Set(["all", "Security", "Packages", ...knownTopicNames]);
    const allowedSortValues = new Set(["priority", "saved", "module", "category"]);
    const sortLabels = {
        priority: "priority",
        saved: "saved first",
        module: "module",
        category: "category"
    };

    const escapeHtml = dom.escapeHtml;
    const safeHref = dom.safeHref;

    function requireSignalSchema() {
        if (!signalSchema) {
            throw new Error("SignalSchema must load before explore.js");
        }
        return signalSchema;
    }

    function normalizeExploreData(dataByModule, options = {}) {
        return requireSignalSchema().normalizeSignalData(dataByModule, options);
    }

    function collectSourceMeta(dataByModule) {
        return requireSignalSchema().collectSourceMeta(dataByModule);
    }

    function qualityScoreForItem(moduleKey, item, options = {}) {
        return requireSignalSchema().qualityScoreForItem(moduleKey, item, options);
    }

    function dedupeExploreItems(items) {
        return requireSignalSchema().dedupeSignalItems(items);
    }

    function includesQuery(item, query) {
        if (!query) return true;
        const normalized = query.toLowerCase();
        return [item.title, item.module, item.category, item.origin, item.metric, item.summary, item.sourceContext, ...(item.sources || [])]
            .some((value) => String(value || "").toLowerCase().includes(normalized));
    }

    function focusMatches(item, focus = "all") {
        if (!focus || focus === "all") return true;

        const text = [item.title, item.module, item.category, item.origin, item.metric, item.summary, item.sourceContext, ...(item.sources || [])]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

        if (focus === "Packages") return item.module === "Packages";
        if (focus === "Security") return /\b(security|oauth|auth|malware|vulnerability|supply chain)\b/.test(text);
        if (knownTopicNames.includes(focus)) return topicTaxonomy.matchesTopic({ ...item, description: text }, focus);

        return true;
    }

    function topicRouteFor(definition) {
        return definition.route || topicTaxonomy.exploreRouteForTopic(definition.focus, "../");
    }

    function buildTopicLenses(items) {
        return topicLensDefinitions.map((definition) => {
            const matches = sortExploreItems(
                items.filter((item) => focusMatches(item, definition.focus)),
                "priority",
                new Set()
            );
            const modules = new Set(matches.map((item) => item.module).filter(Boolean));

            return {
                focus: definition.focus,
                label: definition.label,
                description: definition.description,
                route: topicRouteFor(definition),
                count: matches.length,
                modules: modules.size,
                topItem: matches[0] || null
            };
        });
    }

    function createPinnedTopicStore(storage) {
        return localState.createPinnedTopicStore(storage, knownTopicNames);
    }

    function createPreferredExploreStore(storage) {
        function normalize(value = {}) {
            return {
                focus: allowedFocusValues.has(value.focus) ? value.focus : defaultExploreState.focus,
                sort: allowedSortValues.has(value.sort) ? value.sort : defaultExploreState.sort
            };
        }

        function read() {
            try {
                const parsed = JSON.parse(storage?.getItem(preferredExploreStorageKey) || "{}");
                if (parsed?.version === 1) return normalize(parsed);
            } catch {
                return { ...defaultExploreState };
            }
            return { ...defaultExploreState };
        }

        function save(value) {
            const normalized = normalize(value);
            try {
                storage?.setItem(preferredExploreStorageKey, JSON.stringify({ version: 1, ...normalized }));
            } catch {
                // Storage can be disabled in private or local file contexts.
            }
            return normalized;
        }

        function reset() {
            try {
                storage?.removeItem?.(preferredExploreStorageKey);
            } catch {
                // Storage can be disabled in private or local file contexts.
            }
            return { ...defaultExploreState };
        }

        return { read, save, reset };
    }

    function normalizeSavedSearch(value = {}) {
        return {
            focus: allowedFocusValues.has(value.focus) ? value.focus : "all",
            module: typeof value.module === "string" && value.module ? value.module : "all",
            category: typeof value.category === "string" && value.category ? value.category : "all",
            query: String(value.query || "").trim(),
            sort: allowedSortValues.has(value.sort) ? value.sort : "priority"
        };
    }

    function savedSearchId(value) {
        const normalized = normalizeSavedSearch(value);
        return [
            ["focus", normalized.focus],
            ["module", normalized.module],
            ["category", normalized.category],
            ["query", normalized.query],
            ["sort", normalized.sort]
        ].map(([key, value]) => `${key}:${String(value).toLowerCase()}`).join("|");
    }

    function savedSearchLabel(value) {
        const normalized = normalizeSavedSearch(value);
        const parts = [];
        if (normalized.focus !== "all") parts.push(normalized.focus);
        if (normalized.module !== "all") parts.push(normalized.module);
        if (normalized.category !== "all") parts.push(normalized.category);
        if (normalized.query) parts.push(normalized.query);
        if (normalized.sort !== "priority") parts.push(sortLabels[normalized.sort] || normalized.sort);
        return parts.length > 0 ? parts.join(" / ") : "All signals";
    }

    function savedSearchStatusText(status) {
        if (status === "saved") return "Search saved.";
        if (status === "updated") return "Saved search moved to top.";
        if (status === "removed") return "Saved search removed.";
        if (status === "full") return "Remove one to save another.";
        if (status === "blocked") return "Saved searches are unavailable in this browser.";
        return "Save reusable filter sets here.";
    }

    function renderSavedSearches(searches = [], status = "empty") {
        if (!searches.length) {
            return `<p class="saved-search-empty">${escapeHtml(savedSearchStatusText(status))}</p>`;
        }

        return searches.map((search) => `
            <article class="saved-search-item">
                <button type="button" data-apply-search-id="${escapeHtml(search.id)}">${escapeHtml(savedSearchLabel(search))}</button>
                <button type="button" data-remove-search-id="${escapeHtml(search.id)}" aria-label="Remove ${escapeHtml(savedSearchLabel(search))}">Remove</button>
            </article>
        `).join("");
    }

    function createSavedSearchStore(storage) {
        function normalizeItems(items) {
            const seen = new Set();
            return (items || []).map((item) => {
                const normalized = normalizeSavedSearch(item);
                return { id: savedSearchId(normalized), ...normalized };
            }).filter((item) => {
                if (seen.has(item.id)) return false;
                seen.add(item.id);
                return true;
            }).slice(0, maxSavedSearches);
        }

        function read() {
            try {
                const parsed = JSON.parse(storage?.getItem(savedSearchStorageKey) || "{}");
                if (parsed?.version === 1 && Array.isArray(parsed.items)) return normalizeItems(parsed.items);
            } catch {
                return [];
            }
            return [];
        }

        function write(items) {
            const normalized = normalizeItems(items);
            try {
                storage?.setItem(savedSearchStorageKey, JSON.stringify({ version: 1, items: normalized }));
            } catch {
                return { status: "blocked", items: read() };
            }
            return { status: "saved", items: normalized };
        }

        return {
            read,
            save(value) {
                const item = { id: savedSearchId(value), ...normalizeSavedSearch(value) };
                const currentItems = read();
                const current = currentItems.filter((saved) => saved.id !== item.id);
                const existing = current.length !== currentItems.length;
                if (!existing && current.length >= maxSavedSearches) return { status: "full", items: currentItems };
                const written = write([item, ...current]);
                return { status: existing ? "updated" : written.status, items: written.items };
            },
            remove(id) {
                const written = write(read().filter((item) => item.id !== id));
                return { status: "removed", items: written.items };
            }
        };
    }

    function sortTopicLensesByPins(lenses, pinnedTopics = new Set()) {
        const pinRank = new Map([...pinnedTopics].map((topic, index) => [topic, index]));
        return [...lenses].sort((a, b) => {
            const aPinned = pinRank.has(a.focus);
            const bPinned = pinRank.has(b.focus);
            if (aPinned || bPinned) {
                if (aPinned && bPinned) return pinRank.get(a.focus) - pinRank.get(b.focus);
                return aPinned ? -1 : 1;
            }
            return 0;
        });
    }

    function itemSavedId(item, savedIds = new Set()) {
        return [item.id, ...(item.legacyIds || [])].find((id) => savedIds.has(id)) || "";
    }

    function isItemSaved(item, savedIds = new Set()) {
        return Boolean(itemSavedId(item, savedIds));
    }

    function filterExploreItems(items, filters) {
        return items
            .filter((item) => filters.module === "all" || item.module === filters.module)
            .filter((item) => filters.category === "all" || item.category === filters.category)
            .filter((item) => focusMatches(item, filters.focus || "all"))
            .filter((item) => includesQuery(item, filters.query || ""));
    }

    function sortExploreItems(items, sort, savedIds = new Set()) {
        return [...items].sort((a, b) => {
            if (sort === "saved") {
                const savedDiff = Number(isItemSaved(b, savedIds)) - Number(isItemSaved(a, savedIds));
                if (savedDiff !== 0) return savedDiff;
                return Number(b.score || 0) - Number(a.score || 0);
            }
            if (sort === "module") {
                return a.module.localeCompare(b.module) || Number(b.score || 0) - Number(a.score || 0);
            }
            if (sort === "category") {
                return a.category.localeCompare(b.category) || Number(b.score || 0) - Number(a.score || 0);
            }
            return Number(b.score || 0) - Number(a.score || 0);
        });
    }

    function visibleItems(items, filters, savedIds) {
        return sortExploreItems(filterExploreItems(items, filters), filters.sort || "priority", savedIds);
    }

    function filterSavedIds(items, savedIds = new Set()) {
        const validIds = new Set(items.flatMap((item) => [item.id, ...(item.legacyIds || [])]));
        return new Set([...savedIds].filter((id) => validIds.has(id)));
    }

    function activeExploreSummary(filters, savedCount = 0) {
        const parts = [];
        if (filters.focus && filters.focus !== "all") parts.push(`Focus: ${filters.focus}`);
        if (filters.module !== "all") parts.push(`Module: ${filters.module}`);
        if (filters.category !== "all") parts.push(`Category: ${filters.category}`);
        if (filters.query) parts.push(`Search: ${filters.query}`);
        if (filters.sort === "saved") parts.push("Sort: saved first");
        return parts.length > 0 ? parts.join(" / ") : "Showing all tracked items.";
    }

    function clearedExploreState(filters) {
        return {
            module: "all",
            category: "all",
            focus: "all",
            query: "",
            sort: filters.sort === "saved" ? "saved" : "priority"
        };
    }

    function renderExploreCards(items, savedIds = new Set()) {
        if (items.length === 0) {
            return `
                <article class="explore-card empty-card">
                    <h3>No matching items</h3>
                    <p>Broaden the search, switch module, or clear current filters.</p>
                </article>
            `;
        }

        return items.map((item) => {
            const savedId = itemSavedId(item, savedIds);
            const saved = Boolean(savedId);
            const buttonId = savedId || item.id;
            const scoreReasons = (item.scoreReasons || []).slice(0, 3);
            return `
                <article class="explore-card" data-item-id="${escapeHtml(item.id)}" data-card-href="${escapeHtml(safeHref(item.url))}" tabindex="0" aria-label="Open ${escapeHtml(item.title)}">
                    <div class="card-topline">
                        <span>${escapeHtml(item.module)}</span>
                        <span>${escapeHtml(item.category)}</span>
                    </div>
                    <h3>${escapeHtml(item.title)}</h3>
                    <p class="why-copy"><strong>Why this matters</strong> ${escapeHtml(item.summary)}</p>
                    <div class="card-meta">
                        <span>${escapeHtml(item.origin)}</span>
                        <span>${escapeHtml(item.metric)}</span>
                        <span>${escapeHtml(item.updated)}</span>
                        <span class="quality-marker" aria-label="Signal fit score ${escapeHtml(item.qualityScore || item.score || 0)}">Signal fit ${escapeHtml(item.qualityScore || item.score || 0)}</span>
                    </div>
                    ${scoreReasons.length ? `
                        <ul class="score-reasons" aria-label="Score reasons">
                            ${scoreReasons.map((reason) => `<li>${escapeHtml(reason)}</li>`).join("")}
                        </ul>
                    ` : ""}
                    ${item.sourceContext ? `<p class="source-context">${escapeHtml(item.sourceContext)}</p>` : ""}
                    <div class="explore-card-actions">
                        <button type="button" data-save-id="${escapeHtml(buttonId)}" aria-pressed="${saved ? "true" : "false"}" aria-label="${escapeHtml(saved ? `Saved ${item.title} for Review` : `Save ${item.title} for Review`)}">
                            ${saved ? "Saved" : "Save"}
                        </button>
                    </div>
                </article>
            `;
        }).join("");
    }

    function renderSavedQueue(items, savedIds = new Set()) {
        const saved = items.filter((item) => isItemSaved(item, savedIds));
        if (saved.length === 0) {
            return '<p class="saved-empty">Save items to review later in this browser.</p>';
        }

        return saved.map((item) => {
            const savedId = itemSavedId(item, savedIds) || item.id;
            return `
            <article class="saved-item">
                <div>
                    <strong>${escapeHtml(item.title)}</strong>
                    <span>${escapeHtml([item.module, item.metric, item.sourceContext].filter(Boolean).join(" / "))}</span>
                </div>
                <button type="button" data-remove-id="${escapeHtml(savedId)}" aria-label="Remove ${escapeHtml(item.title)} from saved queue">Remove</button>
            </article>
            `;
        }).join("");
    }

    function renderTopicLenses(lenses, activeFocus = "all", pinnedTopics = new Set()) {
        return lenses.map((lens) => {
            const pressed = lens.focus === activeFocus;
            const pinned = pinnedTopics.has(lens.focus);
            const top = lens.topItem ? `${lens.topItem.title} / ${lens.topItem.module}` : "No focused signal yet";

            return `
                <article class="topic-lens-card">
                    <div>
                        <span>${escapeHtml(lens.count)} items / ${escapeHtml(lens.modules)} modules</span>
                        <strong>${escapeHtml(lens.label)}</strong>
                    </div>
                    <p>${escapeHtml(lens.description)}</p>
                    <small>${escapeHtml(top)}</small>
                    <div class="topic-lens-actions">
                        <button type="button" data-focus-lens="${escapeHtml(lens.focus)}" aria-pressed="${pressed ? "true" : "false"}" aria-label="Use ${escapeHtml(lens.label)} lens">Use lens</button>
                        <button class="pin-topic-button" type="button" data-pin-topic="${escapeHtml(lens.focus)}" aria-pressed="${pinned ? "true" : "false"}" aria-label="${escapeHtml(pinned ? `Unpin ${lens.label} topic` : `Pin ${lens.label} topic`)}">${pinned ? "Pinned" : "Pin"}</button>
                        <a href="${safeHref(lens.route)}">Open topic</a>
                    </div>
                </article>
            `;
        }).join("");
    }

    function createExploreStore(storage) {
        return localState.createSavedItemStore(storage);
    }

    function uniqueValues(items, key) {
        return [...new Set(items.map((item) => item[key]).filter(Boolean))].sort();
    }

    function fillSelect(select, values, label) {
        if (!select) return;
        const current = select.value || "all";
        select.innerHTML = `<option value="all">${label}</option>` + values
            .map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`)
            .join("");
        select.value = values.includes(current) ? current : "all";
    }

    function selectors() {
        return {
            results: document.querySelector("[data-explore-results]"),
            saved: document.querySelector("[data-explore-saved]"),
            module: document.querySelector("[data-explore-module]"),
            category: document.querySelector("[data-explore-category]"),
            query: document.querySelector("[data-explore-query]"),
            sort: document.querySelector("[data-explore-sort]"),
            focusButtons: typeof document.querySelectorAll === "function"
                ? [...document.querySelectorAll("[data-focus-filter]")]
                : [],
            total: document.querySelector("[data-explore-total]"),
            savedCount: document.querySelector("[data-explore-saved-count]"),
            categories: document.querySelector("[data-explore-categories]"),
            summary: document.querySelector("[data-explore-summary]"),
            topicLenses: document.querySelector("[data-topic-lenses]"),
            dataMode: document.querySelector("[data-data-mode]"),
            sourceHealth: document.querySelector("[data-source-health]"),
            clearFilters: document.querySelector("[data-clear-filters]"),
            saveDefault: document.querySelector("[data-save-explore-default]"),
            resetDefault: document.querySelector("[data-reset-explore-default]"),
            defaultStatus: document.querySelector("[data-explore-default-status]"),
            saveSearch: document.querySelector("[data-save-search]"),
            savedSearches: document.querySelector("[data-saved-searches]"),
            savedSearchStatus: document.querySelector("[data-saved-search-status]"),
            filterShell: document.querySelector("[data-explore-filter-shell]")
        };
    }

    function collapseMobileFilterShell(els) {
        const shell = els.filterShell;
        const width = Number(global.innerWidth || 0);
        if (shell && width > 0 && width <= 720) shell.removeAttribute("open");
    }

    function currentSearchState() {
        return {
            focus: state.focus,
            module: state.module,
            category: state.category,
            query: state.query,
            sort: state.sort
        };
    }

    function applySearchState(els, search) {
        const normalized = normalizeSavedSearch(search);
        state.focus = normalized.focus;
        state.module = normalized.module;
        state.category = normalized.category;
        state.query = normalized.query;
        state.sort = normalized.sort;
        if (els.module) els.module.value = state.module;
        if (els.category) els.category.value = state.category;
        if (els.query) els.query.value = state.query;
        if (els.sort) els.sort.value = state.sort;
        updateFocusButtons(els);
    }

    function applySavedSearchById(els, savedSearchStore, id) {
        const search = state.savedSearches.find((item) => item.id === id)
            || savedSearchStore.read().find((item) => item.id === id);
        if (!search) return false;
        applySearchState(els, search);
        return true;
    }

    function renderSavedSearchPanel(els, status = "empty") {
        if (els.savedSearches) els.savedSearches.innerHTML = renderSavedSearches(state.savedSearches, status);
        if (els.savedSearchStatus) els.savedSearchStatus.textContent = savedSearchStatusText(status);
    }

    function render(els, store, pinnedStore, savedSearchStore) {
        const items = visibleItems(state.items, state, state.savedIds);
        const categoryCount = uniqueValues(items, "category").length;

        if (els.total) els.total.textContent = String(items.length);
        if (els.savedCount) els.savedCount.textContent = String(state.savedIds.size);
        if (els.categories) els.categories.textContent = String(categoryCount);
        if (els.summary) els.summary.textContent = activeExploreSummary(state, state.savedIds.size);
        if (els.topicLenses) els.topicLenses.innerHTML = renderTopicLenses(sortTopicLensesByPins(buildTopicLenses(state.items), state.pinnedTopics), state.focus, state.pinnedTopics);
        if (els.results) els.results.innerHTML = renderExploreCards(items, state.savedIds);
        if (els.saved) els.saved.innerHTML = renderSavedQueue(state.items, state.savedIds);
        renderSavedSearchPanel(els);
        bindDynamicActions(els, store, pinnedStore, savedSearchStore);
        if (savedSearchStore) bindSavedSearchActions(els, savedSearchStore, store, pinnedStore);
    }

    function updateFocusButtons(els) {
        for (const button of els.focusButtons || []) {
            button.setAttribute?.("aria-pressed", String(button.dataset.focusFilter === state.focus));
        }
    }

    function focusFromLocation(focusButtons = []) {
        try {
            const Params = global.URLSearchParams;
            if (!Params) return "all";
            const requested = new Params(global.location?.search || "").get("focus");
            const allowed = new Set(focusButtons.map((button) => button.dataset.focusFilter));
            return requested && allowed.has(requested) ? requested : "all";
        } catch {
            return "all";
        }
    }

    function initialFocus(focusButtons, preferredState) {
        const requested = focusFromLocation(focusButtons);
        if (requested !== "all") return requested;
        const allowed = new Set(focusButtons.map((button) => button.dataset.focusFilter));
        return allowed.has(preferredState.focus) ? preferredState.focus : "all";
    }

    function defaultStatusText(preferredState, prefix = "Default") {
        const focus = preferredState.focus === "all" ? "All" : preferredState.focus;
        return `${prefix}: ${focus} / ${sortLabels[preferredState.sort] || preferredState.sort}`;
    }

    function updateDefaultStatus(els, preferredState, prefix) {
        if (els.defaultStatus) els.defaultStatus.textContent = defaultStatusText(preferredState, prefix);
    }

    function renderHealth(els) {
        if (!dataHealth) return;
        if (els.dataMode) els.dataMode.textContent = dataHealth.dataModeText(state.sourceMeta, { updated: state.updated });
        if (els.sourceHealth) els.sourceHealth.innerHTML = dataHealth.renderSourceHealth(state.sourceMeta);
    }

    function bindDynamicActions(els, store, pinnedStore, savedSearchStore) {
        for (const button of [els.results, els.saved]) {
            if (!button?.innerHTML) continue;
        }

        if (typeof document.querySelectorAll !== "function") return;

        document.querySelectorAll("[data-save-id]").forEach((button) => {
            button.addEventListener("click", () => {
                state.savedIds = store.toggle(button.dataset.saveId);
                render(els, store, pinnedStore, savedSearchStore);
            });
        });

        document.querySelectorAll("[data-remove-id]").forEach((button) => {
            button.addEventListener("click", () => {
                state.savedIds = store.remove(button.dataset.removeId);
                render(els, store, pinnedStore, savedSearchStore);
            });
        });

        document.querySelectorAll("[data-card-href]").forEach((card) => {
            const open = () => {
                const href = card.dataset.cardHref;
                if (!href || href === "#") return;
                if (typeof global.location?.assign === "function") global.location.assign(href);
                else if (global.location) global.location.href = href;
            };

            card.addEventListener("click", (event) => {
                if (event.target?.closest?.("a, button, input, select, textarea")) return;
                open();
            });
            card.addEventListener("keydown", (event) => {
                if (event.key !== "Enter") return;
                event.preventDefault?.();
                open();
            });
        });

        document.querySelectorAll("[data-focus-lens]").forEach((button) => {
            button.addEventListener("click", () => {
                state.focus = button.dataset.focusLens || "all";
                updateFocusButtons(els);
                render(els, store, pinnedStore, savedSearchStore);
            });
        });

        document.querySelectorAll("[data-pin-topic]").forEach((button) => {
            button.addEventListener("click", () => {
                state.pinnedTopics = new Set(pinnedStore.toggle(button.dataset.pinTopic));
                render(els, store, pinnedStore, savedSearchStore);
            });
        });
    }

    function bindSavedSearchActions(els, savedSearchStore, store, pinnedStore) {
        if (typeof document.querySelectorAll !== "function") return;

        document.querySelectorAll("[data-apply-search-id], [data-remove-search-id]").forEach((button) => {
            button.addEventListener("click", () => {
                const applyId = button.dataset.applySearchId;
                const removeId = button.dataset.removeSearchId;

                if (applyId) {
                    if (applySavedSearchById(els, savedSearchStore, applyId)) {
                        render(els, store, pinnedStore, savedSearchStore);
                    }
                    return;
                }

                if (removeId) {
                    const result = savedSearchStore.remove(removeId);
                    state.savedSearches = result.items;
                    renderSavedSearchPanel(els, result.status);
                    bindSavedSearchActions(els, savedSearchStore, store, pinnedStore);
                }
            });
        });
    }

    function bindControls(els, store, pinnedStore, preferredStore, savedSearchStore) {
        els.module?.addEventListener("change", (event) => {
            state.module = event.target.value;
            render(els, store, pinnedStore, savedSearchStore);
        });
        els.category?.addEventListener("change", (event) => {
            state.category = event.target.value;
            render(els, store, pinnedStore, savedSearchStore);
        });
        els.query?.addEventListener("input", (event) => {
            state.query = event.target.value;
            render(els, store, pinnedStore, savedSearchStore);
        });
        els.sort?.addEventListener("change", (event) => {
            state.sort = event.target.value;
            render(els, store, pinnedStore, savedSearchStore);
        });
        for (const button of els.focusButtons || []) {
            button.addEventListener("click", () => {
                state.focus = button.dataset.focusFilter || "all";
                updateFocusButtons(els);
                render(els, store, pinnedStore, savedSearchStore);
            });
        }
        els.clearFilters?.addEventListener("click", () => {
            const cleared = clearedExploreState(state);
            state.module = cleared.module;
            state.category = cleared.category;
            state.focus = cleared.focus;
            state.query = cleared.query;
            state.sort = cleared.sort;
            if (els.module) els.module.value = state.module;
            if (els.category) els.category.value = state.category;
            if (els.query) els.query.value = state.query;
            if (els.sort) els.sort.value = state.sort;
            updateFocusButtons(els);
            render(els, store, pinnedStore, savedSearchStore);
        });
        els.saveSearch?.addEventListener("click", () => {
            const result = savedSearchStore.save(currentSearchState());
            state.savedSearches = result.items;
            renderSavedSearchPanel(els, result.status);
            bindSavedSearchActions(els, savedSearchStore, store, pinnedStore);
        });
        els.saveDefault?.addEventListener("click", () => {
            const preferredState = preferredStore.save({ focus: state.focus, sort: state.sort });
            updateDefaultStatus(els, preferredState, "Default saved");
        });
        els.resetDefault?.addEventListener("click", () => {
            const defaults = preferredStore.reset();
            state.focus = defaults.focus;
            state.sort = defaults.sort;
            if (els.sort) els.sort.value = state.sort;
            updateFocusButtons(els);
            updateDefaultStatus(els, defaults, "Default reset");
            render(els, store, pinnedStore, savedSearchStore);
        });
    }

    async function readJson(path) {
        const response = await fetch(path);
        if (!response.ok) return null;
        return response.json();
    }

    async function init() {
        const script = document.currentScript;
        const paths = {
            manifest: script?.dataset.manifest || defaultPaths.manifest,
            trends: script?.dataset.trends || defaultPaths.trends,
            packages: script?.dataset.packages || defaultPaths.packages,
            repos: script?.dataset.repos || defaultPaths.repos,
            links: script?.dataset.links || defaultPaths.links,
            signalPolicy: script?.dataset.signalPolicy || defaultPaths.signalPolicy
        };

        const [manifest, trends, packages, repos, links, signalPolicy] = await Promise.all([
            readJson(paths.manifest).catch(() => null),
            readJson(paths.trends).catch(() => null),
            readJson(paths.packages).catch(() => null),
            readJson(paths.repos).catch(() => null),
            readJson(paths.links).catch(() => null),
            readJson(paths.signalPolicy).catch(() => null)
        ]);

        const dataByModule = {
            manifest,
            trends,
            packages,
            repos,
            links
        };
        const els = selectors();
        const store = createExploreStore(global.localStorage);
        const pinnedStore = createPinnedTopicStore(global.localStorage);
        const preferredStore = createPreferredExploreStore(global.localStorage);
        const savedSearchStore = createSavedSearchStore(global.localStorage);
        const preferredState = preferredStore.read();
        collapseMobileFilterShell(els);

        state.items = normalizeExploreData(dataByModule, { signalPolicy });
        state.sourceMeta = collectSourceMeta(dataByModule);
        state.updated = manifest?.updated || state.items.map((item) => item.updated).filter(Boolean).sort().at(-1) || "";
        state.savedIds = filterSavedIds(state.items, store.read());
        state.pinnedTopics = new Set(pinnedStore.read());
        state.savedSearches = savedSearchStore.read();
        state.focus = initialFocus(els.focusButtons, preferredState);
        state.sort = preferredState.sort;

        fillSelect(els.module, uniqueValues(state.items, "module"), "All modules");
        fillSelect(els.category, uniqueValues(state.items, "category"), "All categories");
        if (els.sort) els.sort.value = state.sort;
        updateFocusButtons(els);
        updateDefaultStatus(els, preferredState);
        bindControls(els, store, pinnedStore, preferredStore, savedSearchStore);
        renderHealth(els);
        render(els, store, pinnedStore, savedSearchStore);
    }

    global.ExploreApp = {
        normalizeExploreData,
        collectSourceMeta,
        filterExploreItems,
        focusMatches,
        sortExploreItems,
        renderExploreCards,
        renderSavedQueue,
        buildTopicLenses,
        sortTopicLensesByPins,
        renderTopicLenses,
        createExploreStore,
        createPinnedTopicStore,
        createPreferredExploreStore,
        createSavedSearchStore,
        normalizeSavedSearch,
        savedSearchId,
        savedSearchLabel,
        savedSearchStatusText,
        renderSavedSearches,
        filterSavedIds,
        bindSavedSearchActions,
        applySearchState,
        applySavedSearchById,
        currentSearchState,
        qualityScoreForItem,
        dedupeExploreItems,
        activeExploreSummary,
        clearedExploreState,
        initialFocus,
        defaultStatusText
    };

    if (typeof document !== "undefined" && document.querySelector("[data-explore-results]")) {
        init();
    }
})(globalThis);
