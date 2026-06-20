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

const topicDefinitions = [
    {
        topic: "AI agents",
        route: "topics/ai-agents/index.html",
        exploreRoute: "explore/index.html?focus=AI%20agents",
        match: /\b(ai agents?|agentic|coding agent|codex|claude code|copilot|workflow automation|agent framework)\b/
    },
    {
        topic: "Agent skills",
        route: "topics/agent-skills/index.html",
        exploreRoute: "explore/index.html?focus=Agent%20skills",
        match: /\b(agent skills?|skills?|instructions?)\b/
    },
    {
        topic: "MCP",
        route: "topics/mcp/index.html",
        exploreRoute: "explore/index.html?focus=MCP",
        match: /\bmcp\b|\bmodelcontextprotocol\b|\bmodel context protocol\b/
    },
    {
        topic: "AI evals",
        route: "explore/index.html?focus=AI%20evals",
        exploreRoute: "explore/index.html?focus=AI%20evals",
        match: /\b(eval|evals|evaluation|observability|braintrust|evalite)\b/
    },
    {
        topic: "AI engineering",
        route: "explore/index.html?focus=AI%20engineering",
        exploreRoute: "explore/index.html?focus=AI%20engineering",
        match: /\b(ai engineering|gpt|llm|llama|training|inference|cuda|model)\b/
    },
    {
        topic: "Workflow automation",
        route: "explore/index.html?focus=Workflow%20automation",
        exploreRoute: "explore/index.html?focus=Workflow%20automation",
        match: /\b(workflow automation|automation|durable workflow|n8n|inngest|integration)\b/
    },
    {
        topic: "Developer tooling",
        route: "explore/index.html?focus=Developer%20tooling",
        exploreRoute: "explore/index.html?focus=Developer%20tooling",
        match: /\b(developer tools?|tooling|build tool|lint|format|testing|browser automation|vite|eslint|prettier|playwright)\b/
    }
];

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

function topicMatches(item, definition) {
    const category = String(item.category || "").toLowerCase();
    return category === definition.topic.toLowerCase() || definition.match.test(textBlob(item));
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

export function buildTopicMovements(dataByModule, limit = 4) {
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

export function renderDecisionActions({ startCount = 0, saved = 0, unread = 0, topTopic = null } = {}) {
    const topicLabel = topTopic?.topic || "Topic movement";
    const topicHref = topTopic?.route || "explore/index.html";
    const topicMeta = topTopic
        ? `${topTopic.count} signals / ${topTopic.modules} modules`
        : "Browse recurring themes";

    return `
        <a class="decision-card decision-primary" href="today/index.html">
            <span>Open first</span>
            <strong>Start with the generated priority brief</strong>
            <small>${escapeHtml(startCount)} priority picks from tracked signals</small>
        </a>
        <a class="decision-card" href="${safeHref(topicHref)}">
            <span>Browse topic movement</span>
            <strong>${escapeHtml(topicLabel)}</strong>
            <small>${escapeHtml(topicMeta)}</small>
        </a>
        <a class="decision-card" href="review/index.html">
            <span>Review saved</span>
            <strong>${escapeHtml(saved)} saved items</strong>
            <small>${escapeHtml(unread)} unread follow-ups in this browser</small>
        </a>
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

function applyTopicMovements(root, movements) {
    const slot = root.querySelector("[data-home-topic-movements]");
    if (slot) slot.innerHTML = renderTopicMovements(movements);
}

function readSavedSummary(storage) {
    let rawValue = "[]";

    try {
        rawValue = storage?.getItem(savedStorageKey) || "[]";
    } catch {
        rawValue = "[]";
    }

    return buildSavedSummary(rawValue);
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

function applyDecisionActions(root, today, savedSummary, movements) {
    const slot = root.querySelector("[data-home-decision-actions]");
    if (!slot) return;

    slot.innerHTML = renderDecisionActions({
        startCount: getTodaySection(today || {}, "start").length,
        saved: savedSummary.saved,
        unread: savedSummary.unread,
        topTopic: movements[0] || null
    });
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
        const savedSummary = readSavedSummary(globalThis.localStorage);
        const topicMovements = buildTopicMovements({ trends, packages, repos, links }, 4);

        if (manifest) {
            applyOverview(document, manifest);
            applyRoutes(document, manifest);
        }
        if (today) {
            applyToday(document, today);
        }
        applyTopicMovements(document, topicMovements);
        applyDecisionActions(document, today, savedSummary, topicMovements);
        applySavedSummary(document, savedSummary);
    } catch {
        // Static fallback remains useful when local file fetch is blocked.
        const savedSummary = readSavedSummary(globalThis.localStorage);
        applySavedSummary(document, savedSummary);
        applyDecisionActions(document, null, savedSummary, []);
    }
}

if (typeof document !== "undefined") {
    init();
}
