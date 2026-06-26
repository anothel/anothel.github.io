import "./safe-dom.js";
import "./local-state.js";
import "./topic-taxonomy.js";

const manifestUrl = typeof document === "undefined"
    ? "data/manifest.json"
    : document.currentScript?.dataset.manifest || "data/manifest.json";

const todayUrl = typeof document === "undefined"
    ? "data/today.json"
    : document.currentScript?.dataset.today || "data/today.json";
const trendsUrl = typeof document === "undefined"
    ? "data/trends.json"
    : document.currentScript?.dataset.trends || "data/trends.json";
const packagesUrl = typeof document === "undefined"
    ? "data/packages.json"
    : document.currentScript?.dataset.packages || "data/packages.json";
const reposUrl = typeof document === "undefined"
    ? "data/repos.json"
    : document.currentScript?.dataset.repos || "data/repos.json";
const linksUrl = typeof document === "undefined"
    ? "data/links.json"
    : document.currentScript?.dataset.links || "data/links.json";
const { escapeHtml, safeHref } = globalThis.AnothelDom;

const routePurpose = {
    explore: "Search and save across sources",
    status: "Refresh health across sources",
    trends: "Cross-source movement",
    packages: "npm package movement",
    repos: "GitHub project traction",
    links: "Reference shelf"
};

const topicTaxonomy = globalThis.TopicTaxonomy;
const topicDefinitions = topicTaxonomy.topicDefinitions.filter((topic) => topic.routePath).map((topic) => ({
    topic: topic.label,
    route: topicTaxonomy.routeForTopic(topic.label),
    exploreRoute: topicTaxonomy.exploreRouteForTopic(topic.label)
}));
const knownTopicNames = topicTaxonomy.trackedTopicLabels;

export function createPinnedTopicStore(storage) {
    return globalThis.AnothelState.createPinnedTopicStore(storage, knownTopicNames);
}

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

function ageDays(updated, today = new Date()) {
    const updatedDate = String(updated || "").match(/^\d{4}-\d{2}-\d{2}/)?.[0];
    const todayDate = (today instanceof Date ? today.toISOString() : String(today || "")).match(/^\d{4}-\d{2}-\d{2}/)?.[0];
    if (!updatedDate || !todayDate) return null;

    const diff = Date.parse(`${todayDate}T00:00:00.000Z`) - Date.parse(`${updatedDate}T00:00:00.000Z`);
    if (!Number.isFinite(diff)) return null;
    return Math.max(0, Math.floor(diff / 86400000));
}

function dataState(updated, today) {
    const age = ageDays(updated, today);
    if (age === null) return "unknown";
    if (age <= 1) return "Fresh";
    if (age <= 3) return "Aging";
    return "Stale";
}

function safeCount(value) {
    const count = Number(value);
    return Number.isFinite(count) && count > 0 ? Math.floor(count) : 0;
}

function textBlob(item) {
    return [
        item.title,
        item.name,
        item.category,
        item.focus,
        item.summary,
        item.source,
        item.kind,
        item.url
    ].filter(Boolean).join(" ").toLowerCase();
}

function logScore(value, maxLog) {
    const number = Math.max(0, Number(value || 0));
    return Math.min(100, Math.round((Math.log10(number + 1) / maxLog) * 100));
}

function normalizeHomeSignals(dataByModule) {
    const trends = (dataByModule.trends?.items || []).map((item) => ({
        module: "Trends",
        title: item.title,
        category: item.category,
        origin: item.source || "Tracked source",
        metric: item.velocity || item.signal || `${item.score || 0} score`,
        summary: item.summary || item.signal || "",
        url: item.url,
        updated: dataByModule.trends?.updated || "-",
        score: Number(item.score || 0)
    }));
    const packages = (dataByModule.packages?.packages || []).map((item) => ({
        module: "Packages",
        title: item.name,
        category: item.category,
        origin: "npm",
        metric: item.downloadsLabel || `${item.downloads || 0} downloads`,
        summary: item.focus || item.period || "",
        url: item.url,
        updated: dataByModule.packages?.updated || "-",
        score: logScore(item.downloads, 9)
    }));
    const repos = (dataByModule.repos?.repos || []).map((item) => ({
        module: "Repos",
        title: item.name,
        category: item.category,
        origin: "GitHub",
        metric: item.starsLabel ? `${item.starsLabel} stars` : `${item.stars || 0} stars`,
        summary: item.summary || item.focus || "",
        url: item.url,
        updated: dataByModule.repos?.updated || "-",
        score: logScore(item.stars, 6)
    }));
    const links = (dataByModule.links?.links || []).map((item) => ({
        module: "Links",
        title: item.title,
        category: item.category,
        origin: item.kind || "Reference",
        metric: item.kind || "Reference",
        summary: item.summary || "",
        url: item.url,
        updated: dataByModule.links?.updated || "-",
        score: Math.max(35, 80 - Number(item.rank || 0) * 2)
    }));

    return [...trends, ...packages, ...repos, ...links];
}

function itemId(moduleKey, item) {
    return `${moduleKey}:${item.url || item.name || item.title || item.rank}`;
}

function buildValidSavedIds(dataByModule) {
    const ids = [
        ...(dataByModule.trends?.items || []).map((item) => itemId("trends", item)),
        ...(dataByModule.packages?.packages || []).map((item) => itemId("packages", item)),
        ...(dataByModule.repos?.repos || []).map((item) => itemId("repos", item)),
        ...(dataByModule.links?.links || []).map((item) => itemId("links", item))
    ];

    return new Set(ids);
}

function topicMatches(item, definition) {
    return topicTaxonomy.matchesTopic({ ...item, description: textBlob(item) }, definition.topic);
}

export function buildSavedSummary(rawValue, validIds = null) {
    return globalThis.AnothelState.savedSummaryFromRaw(rawValue, validIds);
}

export function buildHomeOverview(manifest, options = {}) {
    const modules = manifest.modules || [];
    const counts = statusCounts(modules);
    const updated = modules.map((module) => module.updated).filter(Boolean).sort().at(-1) || "-";

    return {
        totalItems: modules.reduce((sum, module) => sum + module.count, 0),
        liveModules: counts.ok,
        partialModules: counts.partial,
        errorModules: counts.error,
        totalModules: modules.length,
        updated,
        healthLabel: healthLabel(counts),
        dataState: dataState(updated, options.today)
    };
}

export function getTodaySection(today, id) {
    return (today.sections || []).find((section) => section.id === id)?.items || [];
}

export function buildTopicMovements(dataByModule, limit = 3) {
    const items = normalizeHomeSignals(dataByModule);
    return topicDefinitions
        .map((definition, index) => {
            const matches = items
                .filter((item) => topicMatches(item, definition))
                .sort((a, b) => Number(b.score || 0) - Number(a.score || 0));
            const modules = new Set(matches.map((item) => item.module));

            return {
                topic: definition.topic,
                route: definition.route,
                exploreRoute: definition.exploreRoute,
                count: matches.length,
                modules: modules.size,
                updated: matches.map((item) => item.updated).filter(Boolean).sort().at(-1) || "-",
                topItem: matches[0] || null,
                order: index
            };
        })
        .filter((movement) => movement.count > 0)
        .sort((a, b) => Number(b.count) - Number(a.count) || Number(b.modules) - Number(a.modules) || a.order - b.order)
        .slice(0, limit)
        .map(({ order, ...movement }) => movement);
}

export function sortTopicMovementsByPins(movements, pinnedTopics = []) {
    const pinRank = new Map(pinnedTopics.map((topic, index) => [topic, index]));
    return [...movements].sort((a, b) => {
        const aPinned = pinRank.has(a.topic);
        const bPinned = pinRank.has(b.topic);
        if (aPinned || bPinned) {
            if (aPinned && bPinned) return pinRank.get(a.topic) - pinRank.get(b.topic);
            return aPinned ? -1 : 1;
        }
        return 0;
    });
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
        <p class="review-summary-note">Local to this browser. Stale saved ids are ignored when current data loads.</p>
        <a href="review/index.html">Open Review</a>
    `;
}

export function renderTopicMovements(movements) {
    if (!movements.length) {
        return `
            <article class="topic-movement-card empty-card">
                <span>Topic movement</span>
                <h3>No focused movement yet</h3>
                <p>Open Explore to browse all tracked signals.</p>
                <a href="explore/index.html">Open Explore</a>
            </article>
        `;
    }

    return movements.map((movement) => `
        <article class="topic-movement-card">
            <div>
                <span>${escapeHtml(movement.count)} signals / ${escapeHtml(movement.modules)} modules</span>
                <strong>${escapeHtml(movement.topic)}</strong>
            </div>
            <h3>${escapeHtml(movement.topItem?.title || "Open topic")}</h3>
            <p>${escapeHtml([movement.topItem?.module, movement.topItem?.metric, movement.updated].filter(Boolean).join(" / "))}</p>
            <div class="topic-movement-actions">
                <a href="${safeHref(movement.route)}">Open topic</a>
                <a href="${safeHref(movement.exploreRoute)}">Explore lens</a>
            </div>
        </article>
    `).join("");
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
    if (freshness) freshness.textContent = overview.dataState;
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

function applyTopicMovements(root, movements) {
    const slot = root.querySelector("[data-home-topic-movements]");
    if (slot) slot.innerHTML = renderTopicMovements(movements);
}

function readSavedSummary(storage, validIds = null) {
    let rawValue = "[]";

    try {
        rawValue = storage?.getItem(globalThis.AnothelState.keys.savedItems) || "[]";
    } catch {
        rawValue = "[]";
    }

    return buildSavedSummary(rawValue, validIds);
}

function applySavedSummary(root, summary) {
    const summarySlot = root.querySelector("[data-home-review-summary]");
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
        const [manifest, today, trends, packages, repos, links] = await Promise.all([
            readJson(manifestUrl).catch(() => null),
            readJson(todayUrl).catch(() => null),
            readJson(trendsUrl).catch(() => null),
            readJson(packagesUrl).catch(() => null),
            readJson(reposUrl).catch(() => null),
            readJson(linksUrl).catch(() => null)
        ]);
        const dataByModule = { trends, packages, repos, links };
        const savedSummary = readSavedSummary(globalThis.localStorage, buildValidSavedIds(dataByModule));
        const pinnedTopics = createPinnedTopicStore(globalThis.localStorage).read();
        const topicMovements = sortTopicMovementsByPins(buildTopicMovements(dataByModule), pinnedTopics);

        if (manifest) {
            applyOverview(document, manifest);
            applyRoutes(document, manifest);
        }
        if (today) {
            applyToday(document, today);
        }
        applyTopicMovements(document, topicMovements);
        applySavedSummary(document, savedSummary);
    } catch {
        // Keep local review counts usable when checked-in data cannot be read.
        const savedSummary = readSavedSummary(globalThis.localStorage);
        applySavedSummary(document, savedSummary);
    }
}

if (typeof document !== "undefined") {
    init();
}
