(function attachReview(global) {
    const app = global.ExploreApp;
    const topicTaxonomy = global.TopicTaxonomy;
    const defaultPaths = {
        trends: "../data/trends.json",
        packages: "../data/packages.json",
        repos: "../data/repos.json",
        links: "../data/links.json"
    };
    const state = {
        items: [],
        savedIds: new Set(),
        savedRecords: new Map(),
        selectedId: "",
        statusFilter: "all"
    };

    function escapeHtml(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;");
    }

    function safeHref(value) {
        const href = String(value || "").trim();
        if (!href || href.startsWith("//") || /[\u0000-\u001F\u007F]/.test(href)) {
            return "#";
        }

        try {
            const parsed = new URL(href, "https://anothel.github.io");
            const hasScheme = /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(href);
            if (hasScheme && parsed.protocol !== "http:" && parsed.protocol !== "https:") {
                return "#";
            }
            if (!hasScheme && parsed.origin !== "https://anothel.github.io") {
                return "#";
            }
            return escapeHtml(href);
        } catch {
            return "#";
        }
    }

    function statusLabel(status = "unread") {
        if (status === "done") return "Done";
        if (status === "read") return "Read";
        return "Unread";
    }

    function savedDateLabel(value) {
        return value ? `Saved ${String(value).slice(0, 10)}` : "Saved date unknown";
    }

    function statusRank(status = "unread") {
        if (status === "done") return 2;
        if (status === "read") return 1;
        return 0;
    }

    function sortReviewItems(items) {
        return (Array.isArray(items) ? items.slice() : []).sort((a, b) => (
            statusRank(a.savedStatus) - statusRank(b.savedStatus)
            || String(b.savedAt || "").localeCompare(String(a.savedAt || ""))
        ));
    }

    function filterReviewItems(items, filter = "all") {
        const sorted = sortReviewItems(Array.isArray(items) ? items : []);
        if (filter === "read" || filter === "done" || filter === "unread") {
            return sorted.filter((item) => (item.savedStatus || "unread") === filter);
        }
        return sorted;
    }

    function matchSavedItems(items, savedIds = new Set(), savedRecords = new Map()) {
        return sortReviewItems((Array.isArray(items) ? items : [])
            .filter((item) => savedIds.has(item.id))
            .map((item) => {
                const record = savedRecords.get(item.id) || {};
                return {
                    ...item,
                    savedAt: record.savedAt,
                    savedStatus: record.status || "unread"
                };
            }));
    }

    function itemSources(item) {
        return Array.isArray(item?.sources) && item.sources.length > 0 ? item.sources : [item?.module].filter(Boolean);
    }

    function reviewStats(items) {
        return {
            saved: items.length,
            focusAreas: new Set(items.map((item) => item.category).filter(Boolean)).size,
            sources: new Set(items.flatMap(itemSources)).size
        };
    }

    function workflowStats(items) {
        return {
            unread: items.filter((item) => (item.savedStatus || "unread") === "unread").length,
            read: items.filter((item) => item.savedStatus === "read").length,
            done: items.filter((item) => item.savedStatus === "done").length
        };
    }

    function exploreFocus(item) {
        const text = [item?.title, item?.module, item?.category, item?.origin, item?.summary, item?.sourceContext]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

        if (/\b(security|oauth|auth|malware|vulnerability|supply chain)\b/.test(text)) return "Security";
        for (const topic of topicTaxonomy.trackedTopicLabels) {
            if (topicTaxonomy.matchesTopic({ ...item, description: text }, topic)) return topic;
        }
        if (item?.module === "Packages") return "Packages";
        return "all";
    }

    function similarExploreHref(item) {
        const focus = exploreFocus(item);
        return focus === "all"
            ? "../explore/index.html"
            : `../explore/index.html?focus=${encodeURIComponent(focus)}`;
    }

    function renderReviewQueue(items, selectedId = "") {
        if (items.length === 0) {
            return '<p class="saved-empty">No saved items in current data.</p>';
        }

        const activeId = selectedId || items[0].id;
        return items.map((item) => `
            <button class="review-queue-item" type="button" data-review-select-id="${escapeHtml(item.id)}" aria-selected="${item.id === activeId ? "true" : "false"}">
                <strong>${escapeHtml(item.title)}</strong>
                <span>${escapeHtml([item.module, item.metric, item.category].filter(Boolean).join(" / "))}</span>
                <small>${escapeHtml(statusLabel(item.savedStatus))} / ${escapeHtml(savedDateLabel(item.savedAt))}</small>
            </button>
        `).join("");
    }

    function renderReviewEmpty() {
        return `
            <article class="review-empty">
                <h2>No saved items yet</h2>
                <p>Saved items are local to this browser. Open Explore and save useful signals to build this queue.</p>
                <a href="../explore/index.html">Open Explore</a>
            </article>
        `;
    }

    function renderReviewDetail(item) {
        if (!item) return renderReviewEmpty();

        const context = [
            item.module,
            item.origin,
            item.category,
            item.sourceContext
        ].filter(Boolean).join(" / ");
        const score = item.qualityScore || item.score || 0;
        const status = item.savedStatus || "unread";

        return `
            <article class="review-detail-card">
                <div class="card-topline">
                    <span>${escapeHtml(item.module)}</span>
                    <span>${escapeHtml(item.category)}</span>
                </div>
                <h2>${escapeHtml(item.title)}</h2>
                <p class="why-copy"><strong>Why this matters</strong> ${escapeHtml(item.summary)}</p>
                <p class="source-context"><strong>Source context</strong> ${escapeHtml(context)}</p>
                <div class="card-meta">
                    <span>${escapeHtml(item.metric)}</span>
                    <span>${escapeHtml(item.updated)}</span>
                    <span>${escapeHtml(savedDateLabel(item.savedAt))}</span>
                    <span class="status-pill status-${escapeHtml(status)}">${escapeHtml(statusLabel(status))}</span>
                    <span class="quality-marker">Signal fit ${escapeHtml(score)}</span>
                </div>
                <div class="review-actions">
                    <a href="${safeHref(item.url)}">Open item</a>
                    <button type="button" data-review-status-id="${escapeHtml(item.id)}" data-review-status="read">Mark read</button>
                    <button type="button" data-review-status-id="${escapeHtml(item.id)}" data-review-status="done">Mark done</button>
                    <button type="button" data-review-remove-id="${escapeHtml(item.id)}">Remove</button>
                    <a href="${safeHref(similarExploreHref(item))}">Find similar in Explore</a>
                </div>
            </article>
        `;
    }

    function selectors() {
        return {
            total: document.querySelector("[data-review-total]"),
            unread: document.querySelector("[data-review-unread]"),
            read: document.querySelector("[data-review-read]"),
            done: document.querySelector("[data-review-done]"),
            focusCount: document.querySelector("[data-review-focus-count]"),
            sourceCount: document.querySelector("[data-review-source-count]"),
            queue: document.querySelector("[data-review-queue]"),
            detail: document.querySelector("[data-review-detail]"),
            filterButtons: typeof document.querySelectorAll === "function"
                ? [...document.querySelectorAll("[data-review-filter]")]
                : []
        };
    }

    function selectedItem(savedItems) {
        return savedItems.find((item) => item.id === state.selectedId) || savedItems[0] || null;
    }

    function updateFilterButtons(els) {
        (els.filterButtons || []).forEach((button) => {
            const isCurrent = (button.dataset.reviewFilter || "all") === state.statusFilter;
            button.setAttribute("aria-pressed", String(isCurrent));
        });
    }

    function bindActions(els, store) {
        if (typeof document.querySelectorAll !== "function") return;

        (els.filterButtons || []).forEach((button) => {
            if (button.dataset.reviewFilterBound === "true") return;
            button.dataset.reviewFilterBound = "true";
            button.addEventListener("click", () => {
                state.statusFilter = button.dataset.reviewFilter || "all";
                state.selectedId = "";
                render(els, store);
            });
        });

        document.querySelectorAll("[data-review-select-id]").forEach((button) => {
            button.addEventListener("click", () => {
                state.selectedId = button.dataset.reviewSelectId;
                render(els, store);
            });
        });

        document.querySelectorAll("[data-review-remove-id]").forEach((button) => {
            button.addEventListener("click", () => {
                state.savedIds = store.remove(button.dataset.reviewRemoveId);
                state.savedRecords = store.recordsById();
                if (state.selectedId === button.dataset.reviewRemoveId) state.selectedId = "";
                render(els, store);
            });
        });

        document.querySelectorAll("[data-review-status-id]").forEach((button) => {
            button.addEventListener("click", () => {
                state.savedIds = store.setStatus(button.dataset.reviewStatusId, button.dataset.reviewStatus);
                state.savedRecords = store.recordsById();
                render(els, store);
            });
        });
    }

    function render(els, store) {
        const saved = matchSavedItems(state.items, state.savedIds, state.savedRecords);
        const visible = filterReviewItems(saved, state.statusFilter);
        const stats = reviewStats(visible);
        const workflow = workflowStats(saved);
        const selected = selectedItem(visible);

        if (els.total) els.total.textContent = String(visible.length);
        if (els.unread) els.unread.textContent = String(workflow.unread);
        if (els.read) els.read.textContent = String(workflow.read);
        if (els.done) els.done.textContent = String(workflow.done);
        if (els.focusCount) els.focusCount.textContent = String(stats.focusAreas);
        if (els.sourceCount) els.sourceCount.textContent = String(stats.sources);
        if (els.queue) els.queue.innerHTML = renderReviewQueue(visible, selected?.id || "");
        if (els.detail) els.detail.innerHTML = renderReviewDetail(selected);
        updateFilterButtons(els);
        bindActions(els, store);
    }

    async function readJson(path) {
        const response = await fetch(path);
        if (!response.ok) return null;
        return response.json();
    }

    async function init() {
        if (!app) return;

        const script = document.currentScript;
        const paths = {
            trends: script?.dataset.trends || defaultPaths.trends,
            packages: script?.dataset.packages || defaultPaths.packages,
            repos: script?.dataset.repos || defaultPaths.repos,
            links: script?.dataset.links || defaultPaths.links
        };
        const [trends, packages, repos, links] = await Promise.all([
            readJson(paths.trends).catch(() => null),
            readJson(paths.packages).catch(() => null),
            readJson(paths.repos).catch(() => null),
            readJson(paths.links).catch(() => null)
        ]);
        const els = selectors();
        const store = app.createExploreStore(global.localStorage);

        state.items = app.normalizeExploreData({ trends, packages, repos, links });
        state.savedIds = store.read();
        state.savedRecords = store.recordsById();
        state.selectedId = "";
        state.statusFilter = "all";
        render(els, store);
    }

    global.ReviewApp = {
        matchSavedItems,
        workflowStats,
        filterReviewItems,
        reviewStats,
        renderReviewQueue,
        renderReviewDetail,
        renderReviewEmpty,
        similarExploreHref
    };

    if (typeof document !== "undefined" && document.querySelector("[data-review-queue]")) {
        init();
    }
})(globalThis);
