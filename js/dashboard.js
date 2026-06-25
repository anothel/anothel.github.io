const state = {
    items: [],
    sourceMeta: [],
    isFallback: false,
    updated: "",
    source: "all",
    category: "all",
    query: "",
    sort: "rank"
};

const trendDataUrl = document.currentScript?.dataset.source || "data/trends.json";
const dataHealth = globalThis.DataHealth;

const fallbackData = {
    updated: "2026-06-21",
    generatedAt: "2026-06-21T00:00:00.000Z",
    sourceMeta: [
        {
            name: "Hacker News",
            status: "fallback",
            count: 3,
            updatedAt: "2026-06-21T00:00:00.000Z"
        },
        {
            name: "GitHub",
            status: "fallback",
            count: 3,
            updatedAt: "2026-06-21T00:00:00.000Z"
        },
        {
            name: "npm",
            status: "fallback",
            count: 2,
            updatedAt: "2026-06-21T00:00:00.000Z"
        }
    ],
    items: [
        {
            rank: 1,
            title: "Agentic coding workflows",
            source: "GitHub",
            category: "AI",
            score: 98,
            velocity: "+24%",
            signal: "repos, issues, release notes",
            url: "https://github.com/topics/ai-agents",
            summary: "Tools and patterns around coding agents, task delegation, and repository automation."
        },
        {
            rank: 2,
            title: "Local-first apps",
            source: "Hacker News",
            category: "Architecture",
            score: 91,
            velocity: "+18%",
            signal: "discussion volume",
            url: "https://news.ycombinator.com/",
            summary: "Sync, offline-first data, CRDTs, and small personal software patterns."
        },
        {
            rank: 3,
            title: "Bun runtime",
            source: "npm",
            category: "JavaScript",
            score: 88,
            velocity: "+15%",
            signal: "package activity",
            url: "https://bun.sh/",
            summary: "Runtime and toolchain work around fast installs, bundling, and test execution."
        },
        {
            rank: 4,
            title: "SQLite at the edge",
            source: "Hacker News",
            category: "Database",
            score: 84,
            velocity: "+12%",
            signal: "docs, blog posts",
            url: "https://www.sqlite.org/",
            summary: "Embedded databases, edge deployments, and simple durable app storage."
        },
        {
            rank: 5,
            title: "Design systems without heavy frameworks",
            source: "GitHub",
            category: "Frontend",
            score: 79,
            velocity: "+9%",
            signal: "stars, demos",
            url: "https://github.com/topics/design-systems",
            summary: "Component libraries and CSS patterns that keep interface code small."
        },
        {
            rank: 6,
            title: "WebAssembly tooling",
            source: "Hacker News",
            category: "Runtime",
            score: 74,
            velocity: "+7%",
            signal: "launch threads",
            url: "https://webassembly.org/",
            summary: "WASM packaging, sandboxing, and browser/server runtime experiments."
        },
        {
            rank: 7,
            title: "Observability for small teams",
            source: "GitHub",
            category: "Ops",
            score: 69,
            velocity: "+5%",
            signal: "tool releases",
            url: "https://opentelemetry.io/",
            summary: "Tracing, logs, metrics, and lightweight incident visibility."
        },
        {
            rank: 8,
            title: "Type-safe API clients",
            source: "npm",
            category: "TypeScript",
            score: 64,
            velocity: "+3%",
            signal: "downloads",
            url: "https://www.npmjs.com/search?q=typescript%20api%20client",
            summary: "Generated clients, schema-driven APIs, and end-to-end types."
        }
    ]
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

const els = {
    grid: document.querySelector("[data-grid]"),
    table: document.querySelector("[data-table]"),
    source: document.querySelector("select[data-source]"),
    category: document.querySelector("[data-category]"),
    query: document.querySelector("[data-query]"),
    sort: document.querySelector("[data-sort]"),
    updated: document.querySelector("[data-updated]"),
    dataMode: document.querySelector("[data-data-mode]"),
    sourceHealth: document.querySelector("[data-source-health]"),
    total: document.querySelector("[data-total]"),
    topScore: document.querySelector("[data-top-score]"),
    topCategory: document.querySelector("[data-top-category]"),
    filterSummary: document.querySelector("[data-filter-summary]"),
    clearFilters: document.querySelector("[data-clear-filters]")
};

function uniqueValues(items, key) {
    return [...new Set(items.map((item) => item[key]))].sort();
}

function fillSelect(select, values, label) {
    select.innerHTML = `<option value="all">${label}</option>` + values
        .map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`)
        .join("");
}

function getFilteredItems() {
    const query = state.query.toLowerCase();

    return state.items
        .filter((item) => state.source === "all" || item.source === state.source)
        .filter((item) => state.category === "all" || item.category === state.category)
        .filter((item) => {
            if (!query) return true;
            return [item.title, item.source, item.category, item.summary].some((value) =>
                value.toLowerCase().includes(query)
            );
        })
        .sort((a, b) => {
            if (state.sort === "score") return b.score - a.score;
            if (state.sort === "velocity") return parseFloat(b.velocity) - parseFloat(a.velocity);
            return a.rank - b.rank;
        });
}

function activeFilterSummary() {
    const parts = [];
    if (state.source !== "all") parts.push(`Origin: ${state.source}`);
    if (state.category !== "all") parts.push(`Category: ${state.category}`);
    if (state.query) parts.push(`Search: ${state.query}`);
    if (state.sort !== "rank") parts.push(`Sort: ${state.sort}`);
    return parts.length > 0 ? parts.join(" / ") : "Showing all signals.";
}

function renderStats(items) {
    const top = items[0];
    els.total.textContent = String(items.length);
    els.topScore.textContent = top ? String(top.score) : "-";
    els.topCategory.textContent = top ? top.category : "-";
}

function renderFilterSummary() {
    els.filterSummary.textContent = activeFilterSummary();
}

function renderSourceHealth() {
    els.dataMode.textContent = state.isFallback
        ? dataHealth.dataModeText({ status: "fallback" })
        : dataHealth.dataModeText(state.sourceMeta, { updated: state.updated });

    els.sourceHealth.innerHTML = dataHealth.renderSourceHealth(state.sourceMeta);
}

function renderCards(items) {
    if (items.length === 0) {
        els.grid.innerHTML = `
        <article class="trend-card empty-card">
            <h3>No matching signals</h3>
            <p>Try a broader search, another origin, or clear the current filters.</p>
        </article>
    `;
        return;
    }

    els.grid.innerHTML = items.map((item) => `
        <a class="trend-card" href="${safeHref(item.url)}">
            <div class="card-topline">
                <span>#${escapeHtml(item.rank)}</span>
                <span>${escapeHtml(item.source)}</span>
            </div>
            <h3>${escapeHtml(item.title)}</h3>
            <p>${escapeHtml(item.summary)}</p>
            <div class="card-meta">
                <span>${escapeHtml(item.category)}</span>
                <span>${escapeHtml(item.score)}</span>
                <span>${escapeHtml(item.velocity)}</span>
            </div>
        </a>
    `).join("");
}

function renderTable(items) {
    if (items.length === 0) {
        els.table.innerHTML = '<div class="rank-empty">No rows match the current filters.</div>';
        return;
    }

    els.table.innerHTML = items.map((item) => `
        <a class="rank-row" href="${safeHref(item.url)}">
            <span>${escapeHtml(item.rank)}</span>
            <strong>${escapeHtml(item.title)}</strong>
            <span>${escapeHtml(item.category)}</span>
            <span>${escapeHtml(item.source)}</span>
            <span>${escapeHtml(item.score)}</span>
        </a>
    `).join("");
}

function render() {
    const items = getFilteredItems();
    renderStats(items);
    renderFilterSummary();
    renderSourceHealth();
    renderCards(items);
    renderTable(items);
}

function clearFilters() {
    state.source = "all";
    state.category = "all";
    state.query = "";
    state.sort = "rank";
    els.source.value = state.source;
    els.category.value = state.category;
    els.query.value = state.query;
    els.sort.value = state.sort;
    render();
}

function bindEvents() {
    els.source.addEventListener("change", (event) => {
        state.source = event.target.value;
        render();
    });

    els.category.addEventListener("change", (event) => {
        state.category = event.target.value;
        render();
    });

    els.query.addEventListener("input", (event) => {
        state.query = event.target.value;
        render();
    });

    els.sort.addEventListener("change", (event) => {
        state.sort = event.target.value;
        render();
    });

    els.clearFilters.addEventListener("click", clearFilters);
}

async function init() {
    let data = fallbackData;
    let isFallback = false;

    try {
        const response = await fetch(trendDataUrl);
        if (response.ok) {
            data = await response.json();
        } else {
            isFallback = true;
        }
    } catch {
        data = fallbackData;
        isFallback = true;
    }

    state.items = data.items;
    state.sourceMeta = data.sourceMeta || [];
    state.isFallback = isFallback;
    state.updated = data.updated;
    els.updated.textContent = data.updated;
    fillSelect(els.source, uniqueValues(data.items, "source"), "All origins");
    fillSelect(els.category, uniqueValues(data.items, "category"), "All categories");
    bindEvents();
    render();
}

init();
