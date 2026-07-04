import "./safe-dom.js";

const todayUrl = typeof document === "undefined"
    ? "../data/today.json"
    : document.currentScript?.dataset.source || "../data/today.json";

const fallbackData = {
    updated: "unavailable",
    sourceMeta: {
        status: "fallback",
        count: 0
    },
    sections: [
        { id: "start", title: "Start here", summary: "Three signals worth opening first.", items: [] },
        { id: "skim", title: "Worth skimming", summary: "Useful movement that does not need first attention.", items: [] },
        { id: "reference", title: "Reference shelf", summary: "Stable references and projects worth keeping nearby.", items: [] }
    ]
};

const exploreLinks = [
    ["Explore", "../explore/index.html", "Search all tracked signals"],
    ["Review later", "../review/index.html", "Return to saved items"],
    ["Explore AI agents", "../explore/index.html?focus=AI%20agents", "Agent workflow signals"],
    ["Explore MCP", "../explore/index.html?focus=MCP", "Protocol and server references"],
    ["Explore skills", "../explore/index.html?focus=Agent%20skills", "Reusable agent instructions"],
    ["AI agents", "../topics/ai-agents/index.html", "Focused landing page"],
    ["MCP", "../topics/mcp/index.html", "Focused landing page"],
    ["Agent skills", "../topics/agent-skills/index.html", "Focused landing page"],
    ["Trends", "../trends/index.html", "Ranked movement"],
    ["Repos", "../repos/index.html", "GitHub traction"],
    ["Packages", "../packages/index.html", "npm movement"],
    ["Reference shelf", "../links/index.html", "Curated references"]
];

const sectionStats = {
    start: ["Start", "Open first"],
    skim: ["Skim", "Scan next"],
    reference: ["Reference", "Keep nearby"]
};

const els = typeof document === "undefined" ? {} : {
    updated: document.querySelector("[data-today-updated]"),
    status: document.querySelector("[data-today-status]"),
    stats: document.querySelector("[data-today-stats]"),
    sections: document.querySelector("[data-today-sections]"),
    explore: document.querySelector("[data-today-explore]")
};

const { escapeHtml, safeLinkAttrs } = globalThis.AnothelDom;

function sectionItems(section) {
    return Array.isArray(section?.items) ? section.items : [];
}

export function totalSectionItems(sections) {
    return (Array.isArray(sections) ? sections : []).reduce(
        (total, section) => total + sectionItems(section).length,
        0
    );
}

function renderTodayCard(item) {
    const context = [item.origin, item.category].filter(Boolean).join(" / ");
    const action = item.action || "Open the source and decide whether it belongs in the saved queue.";
    const scoreReasons = (item.scoreReasons || []).slice(0, 3);

    return `
        <a class="signal-card today-card" ${safeLinkAttrs(item.url)}>
            <div>
                <span>${escapeHtml(item.module)}</span>
                <em>${escapeHtml(item.metric)}</em>
            </div>
            <strong>${escapeHtml(item.title)}</strong>
            <small class="today-card-context">
                <strong>Source context</strong>
                ${escapeHtml(context)}
            </small>
            <p class="why-copy"><strong>Why now</strong> ${escapeHtml(item.reason)}</p>
            ${scoreReasons.length ? `
                <ul class="score-reasons" aria-label="Score reasons">
                    ${scoreReasons.map((reason) => `<li>${escapeHtml(reason)}</li>`).join("")}
                </ul>
            ` : ""}
            <p class="action-copy"><strong>Next action</strong> ${escapeHtml(action)}</p>
        </a>
    `;
}

export function renderTodaySections(sections) {
    return (Array.isArray(sections) ? sections : []).map((section) => {
        const items = sectionItems(section);

        return `
            <section class="today-section" data-section-id="${escapeHtml(section.id)}">
                <div class="section-heading">
                    <div>
                        <h2>${escapeHtml(section.title)}</h2>
                        <p>${escapeHtml(section.summary || `${items.length} generated picks`)}</p>
                    </div>
                </div>
                <div class="today-grid">
                    ${items.map(renderTodayCard).join("")}
                </div>
            </section>
        `;
    }).join("");
}

export function renderTodayStats(sections) {
    return (Array.isArray(sections) ? sections : []).map((section) => {
        const [label, purpose] = sectionStats[section.id] || [section.title || "Section", "Generated picks"];

        return `
            <article class="stat-card">
                <span>${escapeHtml(label)}</span>
                <strong>${sectionItems(section).length}</strong>
                <p>${escapeHtml(purpose)}</p>
            </article>
        `;
    }).join("");
}

export function renderExploreLinks() {
    return `
        <div>
            <h2>Continue in Explore</h2>
            <p>Search all tracked signals, then save useful items locally.</p>
        </div>
        <nav aria-label="Explore and full module pages">
            ${exploreLinks.map(([label, href, meta]) => `
                <a ${safeLinkAttrs(href)}>
                    <strong>${escapeHtml(label)}</strong>
                    <span>${escapeHtml(meta)}</span>
                </a>
            `).join("")}
        </nav>
    `;
}

function updatedLabel(data) {
    if (data.updated) return data.updated;
    if (data.generatedAt) return data.generatedAt.slice(0, 10);
    return "unavailable";
}

export function renderTodayStatus(data) {
    const total = totalSectionItems(data.sections);
    const status = data.sourceMeta?.status || "ok";

    if (status === "fallback") return `${total} generated picks. Source health fallback. Previous data remains available; retry data refresh.`;
    if (status === "partial") return `${total} generated picks. Source health partial. Usable data remains available; source details name missing sources and retry data refresh.`;
    if (status === "error") return `${total} generated picks from failed source refresh. Retry data refresh before trusting freshness.`;
    return `${total} generated picks. Source health ok. Data date ${updatedLabel(data)}. No recovery needed.`;
}

function renderToday(data) {
    if (els.updated) els.updated.textContent = updatedLabel(data);
    if (els.status) els.status.textContent = renderTodayStatus(data);
    if (els.stats) els.stats.innerHTML = renderTodayStats(data.sections);
    if (els.sections) els.sections.innerHTML = renderTodaySections(data.sections);
    if (els.explore) els.explore.innerHTML = renderExploreLinks();
}

async function readToday(path) {
    const response = await fetch(path);
    if (!response.ok) return fallbackData;
    return response.json();
}

async function init() {
    try {
        renderToday(await readToday(todayUrl));
    } catch {
        renderToday(fallbackData);
    }
}

if (typeof document !== "undefined") {
    init();
}
