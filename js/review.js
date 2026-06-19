(function attachReview(global) {
    const app = global.ExploreApp;
    const defaultPaths = {
        trends: "../data/trends.json",
        packages: "../data/packages.json",
        repos: "../data/repos.json",
        links: "../data/links.json"
    };
    const state = {
        items: [],
        savedIds: new Set(),
        selectedId: ""
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

    function matchSavedItems(items, savedIds = new Set()) {
        return (Array.isArray(items) ? items : []).filter((item) => savedIds.has(item.id));
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

    function exploreFocus(item) {
        const text = [item?.title, item?.module, item?.category, item?.origin, item?.summary, item?.sourceContext]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

        if (/\bmcp\b|\bmodelcontextprotocol\b/.test(text)) return "MCP";
        if (/\b(agent skills?|skills?)\b/.test(text)) return "Agent skills";
        if (/\b(security|oauth|auth|malware|vulnerability|supply chain)\b/.test(text)) return "Security";
        if (item?.module === "Packages") return "Packages";
        if (/\b(ai agents?|agentic|coding agent|codex|claude code|copilot|workflow automation)\b/.test(text)) return "AI agents";
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
                    <span class="quality-marker">Signal fit ${escapeHtml(score)}</span>
                </div>
                <div class="review-actions">
                    <a href="${safeHref(item.url)}">Open item</a>
                    <button type="button" data-review-remove-id="${escapeHtml(item.id)}">Remove</button>
                    <a href="${safeHref(similarExploreHref(item))}">Find similar in Explore</a>
                </div>
            </article>
        `;
    }

    function selectors() {
        return {
            total: document.querySelector("[data-review-total]"),
            focusCount: document.querySelector("[data-review-focus-count]"),
            sourceCount: document.querySelector("[data-review-source-count]"),
            queue: document.querySelector("[data-review-queue]"),
            detail: document.querySelector("[data-review-detail]")
        };
    }

    function selectedItem(savedItems) {
        return savedItems.find((item) => item.id === state.selectedId) || savedItems[0] || null;
    }

    function bindActions(els, store) {
        if (typeof document.querySelectorAll !== "function") return;

        document.querySelectorAll("[data-review-select-id]").forEach((button) => {
            button.addEventListener("click", () => {
                state.selectedId = button.dataset.reviewSelectId;
                render(els, store);
            });
        });

        document.querySelectorAll("[data-review-remove-id]").forEach((button) => {
            button.addEventListener("click", () => {
                state.savedIds = store.remove(button.dataset.reviewRemoveId);
                if (state.selectedId === button.dataset.reviewRemoveId) state.selectedId = "";
                render(els, store);
            });
        });
    }

    function render(els, store) {
        const saved = matchSavedItems(state.items, state.savedIds);
        const stats = reviewStats(saved);
        const selected = selectedItem(saved);

        if (els.total) els.total.textContent = String(stats.saved);
        if (els.focusCount) els.focusCount.textContent = String(stats.focusAreas);
        if (els.sourceCount) els.sourceCount.textContent = String(stats.sources);
        if (els.queue) els.queue.innerHTML = renderReviewQueue(saved, selected?.id || "");
        if (els.detail) els.detail.innerHTML = renderReviewDetail(selected);
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
        state.selectedId = "";
        render(els, store);
    }

    global.ReviewApp = {
        matchSavedItems,
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
