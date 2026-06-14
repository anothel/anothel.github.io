const fallbackLinks = {
    updated: "2026-06-14",
    sourceMeta: {
        name: "manual",
        status: "fallback",
        count: 3,
        updatedAt: "2026-06-14T00:00:00.000Z"
    },
    links: [
        {
            rank: 1,
            title: "GitHub REST API",
            category: "API",
            kind: "Docs",
            url: "https://docs.github.com/en/rest",
            summary: "Reference for GitHub REST endpoints used by repo data scripts."
        },
        {
            rank: 2,
            title: "MDN Web Docs",
            category: "Frontend",
            kind: "Docs",
            url: "https://developer.mozilla.org/",
            summary: "Reference for web platform APIs, CSS, HTML, and JavaScript."
        },
        {
            rank: 3,
            title: "Node.js API",
            category: "Runtime",
            kind: "Docs",
            url: "https://nodejs.org/api/",
            summary: "Node.js runtime API documentation for scripts and tooling."
        }
    ]
};

const state = {
    links: [],
    category: "all",
    query: ""
};

const els = {
    updated: document.querySelector("[data-updated]"),
    total: document.querySelector("[data-total]"),
    topCategory: document.querySelector("[data-top-category]"),
    sourceStatus: document.querySelector("[data-source-status]"),
    category: document.querySelector("[data-category]"),
    query: document.querySelector("[data-query]"),
    list: document.querySelector("[data-link-list]")
};

function uniqueValues(items, key) {
    return [...new Set(items.map((item) => item[key]))].sort();
}

function fillCategorySelect(links) {
    els.category.innerHTML = `<option value="all">All categories</option>` + uniqueValues(links, "category")
        .map((category) => `<option value="${category}">${category}</option>`)
        .join("");
}

async function loadLinks() {
    try {
        const response = await fetch("../data/links.json");
        if (response.ok) {
            return await response.json();
        }
    } catch {
        return fallbackLinks;
    }

    return fallbackLinks;
}

function filteredLinks() {
    const query = state.query.toLowerCase();
    return state.links
        .filter((link) => state.category === "all" || link.category === state.category)
        .filter((link) => {
            if (!query) return true;
            return [link.title, link.category, link.kind, link.summary].some((value) =>
                value.toLowerCase().includes(query)
            );
        });
}

function render() {
    const links = filteredLinks();
    const top = links[0];
    els.total.textContent = String(links.length);
    els.topCategory.textContent = top ? top.category : "-";
    els.list.innerHTML = links.map((link) => `
        <a class="link-card" href="${link.url}">
            <div>
                <span>${link.category}</span>
                <span>${link.kind}</span>
            </div>
            <h2>${link.title}</h2>
            <p>${link.summary}</p>
        </a>
    `).join("");
}

function bindEvents() {
    els.category.addEventListener("change", (event) => {
        state.category = event.target.value;
        render();
    });

    els.query.addEventListener("input", (event) => {
        state.query = event.target.value;
        render();
    });
}

async function init() {
    const data = await loadLinks();
    state.links = data.links;
    els.updated.textContent = data.updated;
    els.sourceStatus.textContent = data.sourceMeta.status;
    fillCategorySelect(data.links);
    bindEvents();
    render();
}

init();
