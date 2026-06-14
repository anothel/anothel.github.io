const state = {
    items: [],
    source: "all",
    category: "all",
    query: "",
    sort: "rank"
};

const fallbackData = {
    updated: "2026-06-14",
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
            source: "Developer tools",
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
            source: "Developer tools",
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

const els = {
    grid: document.querySelector("[data-grid]"),
    table: document.querySelector("[data-table]"),
    source: document.querySelector("[data-source]"),
    category: document.querySelector("[data-category]"),
    query: document.querySelector("[data-query]"),
    sort: document.querySelector("[data-sort]"),
    updated: document.querySelector("[data-updated]"),
    total: document.querySelector("[data-total]"),
    topScore: document.querySelector("[data-top-score]"),
    topCategory: document.querySelector("[data-top-category]")
};

function uniqueValues(items, key) {
    return [...new Set(items.map((item) => item[key]))].sort();
}

function fillSelect(select, values, label) {
    select.innerHTML = `<option value="all">${label}</option>` + values
        .map((value) => `<option value="${value}">${value}</option>`)
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

function renderStats(items) {
    const top = items[0];
    els.total.textContent = String(items.length);
    els.topScore.textContent = top ? String(top.score) : "-";
    els.topCategory.textContent = top ? top.category : "-";
}

function renderCards(items) {
    els.grid.innerHTML = items.map((item) => `
        <article class="trend-card">
            <div class="card-topline">
                <span>#${item.rank}</span>
                <span>${item.source}</span>
            </div>
            <h3>${item.title}</h3>
            <p>${item.summary}</p>
            <div class="card-meta">
                <span>${item.category}</span>
                <span>${item.score}</span>
                <span>${item.velocity}</span>
            </div>
            <a href="${item.url}">Open source</a>
        </article>
    `).join("");
}

function renderTable(items) {
    els.table.innerHTML = items.map((item) => `
        <a class="rank-row" href="${item.url}">
            <span>${item.rank}</span>
            <strong>${item.title}</strong>
            <span>${item.category}</span>
            <span>${item.source}</span>
            <span>${item.score}</span>
        </a>
    `).join("");
}

function render() {
    const items = getFilteredItems();
    renderStats(items);
    renderCards(items);
    renderTable(items);
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
}

async function init() {
    let data = fallbackData;

    try {
        const response = await fetch("data/trends.json");
        if (response.ok) {
            data = await response.json();
        }
    } catch {
        data = fallbackData;
    }

    state.items = data.items;
    els.updated.textContent = data.updated;
    fillSelect(els.source, uniqueValues(data.items, "source"), "All sources");
    fillSelect(els.category, uniqueValues(data.items, "category"), "All categories");
    bindEvents();
    render();
}

init();
