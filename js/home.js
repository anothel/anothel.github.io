const manifestUrl = typeof document === "undefined"
    ? "data/manifest.json"
    : document.currentScript?.dataset.manifest || "data/manifest.json";

const todayUrl = typeof document === "undefined"
    ? "data/today.json"
    : document.currentScript?.dataset.today || "data/today.json";
const savedStorageKey = "anothel.explore.saved.v1";

function escapeHtml(value) {
    return String(value)
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

const routePurpose = {
    explore: "Search and save across sources",
    status: "Refresh health across sources",
    trends: "Cross-source movement",
    packages: "npm package movement",
    repos: "GitHub project traction",
    links: "Reference shelf"
};

function statusCounts(modules) {
    return modules.reduce(
        (counts, module) => {
            const status = module.status || "unknown";
            if (status === "ok") counts.ok += 1;
            else if (status === "partial") counts.partial += 1;
            else if (status === "error") counts.error += 1;
            return counts;
        },
        { ok: 0, partial: 0, error: 0 }
    );
}

function healthLabel(counts) {
    return [
        counts.ok > 0 ? `${counts.ok} ok` : "",
        counts.partial > 0 ? `${counts.partial} partial` : "",
        counts.error > 0 ? `${counts.error} error` : ""
    ].filter(Boolean).join(" / ") || "0 ok";
}

function safeCount(value) {
    const count = Number(value);
    return Number.isFinite(count) && count > 0 ? Math.floor(count) : 0;
}

export function buildSavedSummary(rawValue) {
    try {
        const parsed = JSON.parse(rawValue || "[]");
        if (Array.isArray(parsed)) {
            const saved = parsed.filter((id) => typeof id === "string").length;
            return { saved, unread: saved };
        }
        if (parsed?.version === 2 && Array.isArray(parsed.items)) {
            const records = parsed.items.filter((item) => item && typeof item.id === "string");
            return {
                saved: records.length,
                unread: records.filter((item) => !item.status || item.status === "unread").length
            };
        }
    } catch {
        return { saved: 0, unread: 0 };
    }

    return { saved: 0, unread: 0 };
}

export function buildHomeOverview(manifest) {
    const modules = manifest.modules || [];
    const counts = statusCounts(modules);

    return {
        totalItems: modules.reduce((sum, module) => sum + module.count, 0),
        liveModules: counts.ok,
        partialModules: counts.partial,
        errorModules: counts.error,
        totalModules: modules.length,
        updated: modules.map((module) => module.updated).filter(Boolean).sort().at(-1) || "-",
        healthLabel: healthLabel(counts)
    };
}

export function getTodaySection(today, id) {
    return (today.sections || []).find((section) => section.id === id)?.items || [];
}

export function buildModuleRoutes(manifest) {
    const modules = manifest.modules || [];
    return withUtilityRoutes(modules.map((module) => ({
        id: module.id,
        title: module.title,
        route: module.route,
        source: module.source,
        count: module.count,
        updated: module.updated,
        status: module.status,
        purpose: routePurpose[module.id] || module.source || "Open module"
    })));
}

function withUtilityRoutes(routes) {
    const modules = routes || [];
    const updated = modules.map((module) => module.updated).filter(Boolean).sort().at(-1) || "-";
    const status = modules.some((module) => module.status === "error")
        ? "error"
        : modules.some((module) => module.status === "partial")
            ? "partial"
            : "ok";
    const exploreRoute = {
        id: "explore",
        title: "Explore workspace",
        route: "explore/index.html",
        source: "All tracked signals",
        count: modules.reduce((sum, module) => sum + module.count, 0),
        updated,
        status,
        purpose: routePurpose.explore
    };
    const statusRoute = {
        id: "status",
        title: "Source status",
        route: "status/index.html",
        source: "All source metadata",
        count: modules.reduce((sum, module) => sum + module.count, 0),
        updated,
        status,
        purpose: routePurpose.status
    };

    return [
        ...(routes.some((route) => route.id === "explore") ? [] : [exploreRoute]),
        ...(routes.some((route) => route.id === "status") ? [] : [statusRoute]),
        ...routes
    ];
}

export function renderStartItems(items) {
    return items.map((item, index) => {
        const context = [item.origin, item.category].filter(Boolean).join(" / ");

        return `
            <a class="start-item" href="${safeHref(item.url)}">
                <span>${index + 1}</span>
                <div>
                    <strong>${escapeHtml(item.title)}</strong>
                    <small>${escapeHtml(item.module)} / ${escapeHtml(context)}</small>
                    <p>${escapeHtml(item.reason)}</p>
                </div>
                <em>${escapeHtml(item.metric)}</em>
            </a>
        `;
    }).join("");
}

export function renderSkimList(items) {
    return items.map((item) => `
        <a class="skim-item" href="${safeHref(item.url)}">
            <strong>${escapeHtml(item.title)}</strong>
            <span>${escapeHtml(item.module)} / ${escapeHtml(item.metric)}</span>
        </a>
    `).join("");
}

export function renderModuleRoutes(routes) {
    return withUtilityRoutes(routes).map((route) => `
        <a class="module-route status-${escapeHtml(route.status)}" href="${safeHref(route.route)}">
            <span>${escapeHtml(route.title)}</span>
            <strong>${escapeHtml(route.purpose)}</strong>
            <small>${escapeHtml(route.count)} items / ${escapeHtml(route.updated)} / Status ${escapeHtml(route.status)}</small>
        </a>
    `).join("");
}

export function renderSavedSummary(summary) {
    const saved = safeCount(summary?.saved);
    const unread = safeCount(summary?.unread);

    return `
        <div class="review-summary-grid">
            <article>
                <span>Saved items</span>
                <strong data-home-review-saved>${saved}</strong>
            </article>
            <article>
                <span>Unread</span>
                <strong data-home-review-unread>${unread}</strong>
            </article>
        </div>
        <a href="review/index.html">Open Review</a>
    `;
}

function applyOverview(root, manifest) {
    const overview = buildHomeOverview(manifest);
    const total = root.querySelector("[data-home-total]");
    const live = root.querySelector("[data-home-live]");
    const updated = root.querySelector("[data-home-updated]");
    const freshness = root.querySelector("[data-home-freshness]");

    if (total) total.textContent = String(overview.totalItems);
    if (live) live.textContent = overview.healthLabel;
    if (updated) updated.textContent = overview.updated;
    if (freshness) freshness.textContent = overview.updated === "-" ? "unknown" : "fresh";
}

function applyRoutes(root, manifest) {
    const list = root.querySelector("[data-home-routes]");
    if (!list) return;

    const routes = buildModuleRoutes(manifest);
    if (routes.length > 0) {
        list.innerHTML = renderModuleRoutes(routes);
    }
}

function applyToday(root, today) {
    const startList = root.querySelector("[data-home-start]");
    const skimList = root.querySelector("[data-home-skim]");

    const startItems = getTodaySection(today, "start");
    const skimItems = getTodaySection(today, "skim");

    if (startList && startItems.length > 0) {
        startList.innerHTML = renderStartItems(startItems);
    }
    if (skimList && skimItems.length > 0) {
        skimList.innerHTML = renderSkimList(skimItems);
    }
}

function applySavedSummary(root, storage) {
    const summarySlot = root.querySelector("[data-home-review-summary]");
    let rawValue = "[]";

    try {
        rawValue = storage?.getItem(savedStorageKey) || "[]";
    } catch {
        rawValue = "[]";
    }

    const summary = buildSavedSummary(rawValue);
    if (summarySlot) {
        summarySlot.innerHTML = renderSavedSummary(summary);
        return;
    }

    const saved = root.querySelector("[data-home-review-saved]");
    const unread = root.querySelector("[data-home-review-unread]");
    if (saved) saved.textContent = String(summary.saved);
    if (unread) unread.textContent = String(summary.unread);
}

async function readJson(path) {
    const response = await fetch(path);
    if (!response.ok) return null;
    return response.json();
}

async function init() {
    try {
        const [manifest, today] = await Promise.all([
            readJson(manifestUrl).catch(() => null),
            readJson(todayUrl).catch(() => null)
        ]);

        if (manifest) {
            applyOverview(document, manifest);
            applyRoutes(document, manifest);
        }
        if (today) {
            applyToday(document, today);
        }
        applySavedSummary(document, globalThis.localStorage);
    } catch {
        // Static fallback remains useful when local file fetch is blocked.
        applySavedSummary(document, globalThis.localStorage);
    }
}

if (typeof document !== "undefined") {
    init();
}
