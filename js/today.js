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
    ["Trends", "../trends/index.html", "Ranked movement"],
    ["Repos", "../repos/index.html", "GitHub traction"],
    ["Packages", "../packages/index.html", "npm movement"],
    ["Links", "../links/index.html", "Reference queue"]
];

const els = typeof document === "undefined" ? {} : {
    updated: document.querySelector("[data-today-updated]"),
    status: document.querySelector("[data-today-status]"),
    sections: document.querySelector("[data-today-sections]"),
    explore: document.querySelector("[data-today-explore]")
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

    return `
        <a class="signal-card today-card" href="${safeHref(item.url)}">
            <div>
                <span>${escapeHtml(item.module)}</span>
                <em>${escapeHtml(item.metric)}</em>
            </div>
            <strong>${escapeHtml(item.title)}</strong>
            <small>${escapeHtml(context)}</small>
            <p>${escapeHtml(item.reason)}</p>
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

export function renderExploreLinks() {
    return `
        <div>
            <h2>Continue in Explore</h2>
            <p>Search all tracked signals, then save useful items locally.</p>
        </div>
        <nav aria-label="Explore and full module pages">
            ${exploreLinks.map(([label, href, meta]) => `
                <a href="${escapeHtml(href)}">
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

    if (status === "fallback") return `${total} generated picks. Showing fallback data.`;
    if (status === "partial") return `${total} generated picks from partial source data.`;
    if (status === "error") return `${total} generated picks from failed source refresh.`;
    return `${total} generated picks. Data status: ${status}.`;
}

function renderToday(data) {
    if (els.updated) els.updated.textContent = updatedLabel(data);
    if (els.status) els.status.textContent = renderTodayStatus(data);
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
