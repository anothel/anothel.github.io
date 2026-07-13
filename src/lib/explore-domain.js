import taxonomy from "./topic-taxonomy.js";

export const sortValues = new Set(["priority", "saved", "module", "category"]);

export const focusDefinitions = taxonomy.topicLensDefinitions("../");

export const focusValues = new Set(["all", "Packages", ...focusDefinitions.map(({ focus }) => focus)]);

export function compactText(value, limit = 120) {
    const text = String(value || "").replace(/\s+/g, " ").trim();
    return text.length <= limit ? text : `${text.slice(0, limit - 1)}...`;
}

const fallbackSignalPolicy = {
    baselineTitles: ["typescript", "eslint", "prettier", "react", "react/react", "zod", "tailwindcss", "vite", "vitejs/vite", "next", "next.js", "vercel/next.js"]
};
const moduleLabels = { trends: "Trends", packages: "Packages", repos: "Repos", links: "Links" };
const sourceKinds = { trends: "trend", packages: "package", repos: "repo", links: "reference" };

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function logScore(value, maxLog) {
    return clamp((Math.log10(Math.max(0, Number(value || 0)) + 1) / maxLog) * 100, 0, 100);
}

function textBlob(item) {
    return [item.title, item.name, item.category, item.focus, item.summary, item.source, item.kind, item.url]
        .filter(Boolean).join(" ").toLowerCase();
}

function textBoost(text) {
    let boost = 0;
    if (/\b(ai|llm|agent|agents|agentic)\b/.test(text)) boost += 12;
    if (/\b(skill|skills|mcp|codex|openai|anthropic|langchain)\b/.test(text)) boost += 8;
    if (/\b(coding|developer|workflow|automation)\b/.test(text)) boost += 4;
    return Math.min(boost, 20);
}

function qualityScore(moduleKey, item, signalPolicy = fallbackSignalPolicy) {
    const text = textBlob(item);
    let score = 0;
    if (moduleKey === "trends") score = Number(item.score || 0);
    if (moduleKey === "packages") score = logScore(item.downloads, 9);
    if (moduleKey === "repos") score = logScore(item.stars, 6);
    if (moduleKey === "links") score = Math.max(35, 92 - Number(item.rank || 0) * 3);
    score += textBoost(text);

    const name = String(item.name || item.title || "").toLowerCase();
    const repoName = name.includes("/") ? name.split("/").at(-1) : name;
    const baselines = new Set((signalPolicy || fallbackSignalPolicy).baselineTitles || []);
    const npmTrend = moduleKey === "trends" && String(item.source || "").toLowerCase() === "npm";
    if ((moduleKey === "packages" || moduleKey === "repos" || npmTrend) && (baselines.has(name) || baselines.has(repoName)) && textBoost(text) < 8) {
        score = Math.min(score, 76);
    }
    return Math.round(clamp(score, 0, 100));
}

function canonicalUrl(value) {
    const href = String(value || "").trim();
    if (!href) return "";
    try {
        const parsed = new URL(href);
        parsed.hash = "";
        parsed.search = "";
        const pathname = parsed.pathname.replace(/\/$/, "").replace(/\.git$/, "");
        return `${parsed.protocol}//${parsed.hostname.toLowerCase()}${pathname.toLowerCase()}`;
    } catch {
        return href.toLowerCase().replace(/\/$/, "");
    }
}

function duplicateKey(item) {
    const url = canonicalUrl(item.url);
    return url ? `url:${url}` : `title:${String(item.title || "").toLowerCase().replace(/[^a-z0-9/]+/g, " ").trim()}`;
}

function rankValue(item) {
    const rank = Number(item?.sourceRank || item?.rank || 0);
    return Number.isFinite(rank) && rank > 0 ? rank : Number.MAX_SAFE_INTEGER;
}

export function comparePriority(a, b) {
    const modulePriority = { Trends: 0, Repos: 1, Links: 2, Packages: 3 };
    return Number(b?.score || 0) - Number(a?.score || 0)
        || (modulePriority[a?.module] ?? 4) - (modulePriority[b?.module] ?? 4)
        || rankValue(a) - rankValue(b)
        || String(a?.title || "").localeCompare(String(b?.title || ""));
}

function scoreReasons(fields, score) {
    return [...new Set([
        fields.metric && fields.origin ? `${fields.metric} from ${fields.origin}` : fields.metric,
        fields.reason && fields.reason !== fields.metric ? fields.reason : "",
        score >= 80 ? `Signal fit ${score}/100` : ""
    ].filter(Boolean))].slice(0, 3);
}

function signalItem(moduleKey, item, data, fields, signalPolicy) {
    const score = qualityScore(moduleKey, item, signalPolicy);
    const module = moduleLabels[moduleKey];
    const id = duplicateKey(fields) || `${moduleKey}:${item.url || item.name || item.title || item.rank}`;
    const legacyId = `${moduleKey}:${item.url || item.name || item.title || item.rank}`;
    return {
        schemaVersion: 2,
        id,
        legacyIds: legacyId !== id ? [legacyId] : [],
        sourceModule: moduleKey,
        sourceKind: sourceKinds[moduleKey],
        module,
        title: String(fields.title || ""),
        category: String(fields.category || `${module} signal`),
        origin: String(fields.origin || module),
        metric: String(fields.metric || ""),
        summary: String(fields.summary || ""),
        reason: String(fields.reason || fields.summary || ""),
        url: String(fields.url || ""),
        sourceRank: Number(item.rank || 0),
        qualityScore: score,
        score,
        scoreReasons: scoreReasons(fields, score),
        sources: [module],
        sourceContext: "",
        canonicalKey: id,
        updated: data?.updated || "-"
    };
}

export function dedupeItems(items) {
    const merged = new Map();
    for (const item of items) {
        const key = item.canonicalKey || duplicateKey(item);
        if (!merged.has(key)) {
            merged.set(key, { ...item });
            continue;
        }
        const previous = merged.get(key);
        const winner = (item.score || 0) > (previous.score || 0) ? item : previous;
        const loser = winner === item ? previous : item;
        const sources = [...new Set([...(winner.sources || [winner.module]), ...(loser.sources || [loser.module])])];
        merged.set(key, {
            ...winner,
            sources,
            legacyIds: [...new Set([...(winner.legacyIds || []), ...(loser.legacyIds || []), loser.id])].filter((id) => id && id !== winner.id),
            sourceContext: sources.filter((source) => source !== winner.module).length ? `Also in ${sources.filter((source) => source !== winner.module).join(" / ")}` : "",
            score: Math.max(winner.score || 0, loser.score || 0),
            qualityScore: Math.max(winner.qualityScore || 0, loser.qualityScore || 0),
            scoreReasons: [...new Set([...(winner.scoreReasons || []), ...(loser.scoreReasons || [])])].slice(0, 3),
            updated: [winner.updated, loser.updated].filter(Boolean).sort().at(-1) || "-"
        });
    }
    return [...merged.values()];
}

export function normalizeExploreData(data = {}, options = {}) {
    const policy = options.signalPolicy || fallbackSignalPolicy;
    const trends = (data.trends?.items || []).map((item) => signalItem("trends", item, data.trends, {
        title: item.title, category: item.category, origin: item.source || "Tracked source",
        metric: item.velocity || item.signal || `${item.score || 0} score`, summary: item.summary || item.signal || "",
        reason: [item.velocity, item.signal].filter(Boolean).join(" / ") || item.summary || "Ranked trend signal", url: item.url
    }, policy));
    const packages = (data.packages?.packages || []).map((item) => signalItem("packages", item, data.packages, {
        title: item.name, category: item.category, origin: "npm", metric: item.downloadsLabel || `${item.downloads || 0} downloads`,
        summary: item.focus || item.period || "", reason: item.focus || "Weekly npm demand", url: item.url
    }, policy));
    const repos = (data.repos?.repos || []).map((item) => signalItem("repos", item, data.repos, {
        title: item.name, category: item.category, origin: "GitHub", metric: item.starsLabel ? `${item.starsLabel} stars` : `${item.stars || 0} stars`,
        summary: item.summary || item.focus || "", reason: item.focus || item.summary || "Repository traction", url: item.url
    }, policy));
    const links = (data.links?.links || []).map((item) => signalItem("links", item, data.links, {
        title: item.title, category: item.category, origin: item.kind || "Reference", metric: item.kind || "Reference",
        summary: item.summary || "", reason: item.summary || "Reference shelf item", url: item.url
    }, policy));
    return dedupeItems([...trends, ...packages, ...repos, ...links].filter((item) => item.title && item.url));
}

export function collectSourceMeta(data = {}) {
    return [
        ...(Array.isArray(data.trends?.sourceMeta) ? data.trends.sourceMeta : [data.trends?.sourceMeta]),
        data.packages?.sourceMeta, data.repos?.sourceMeta, data.links?.sourceMeta
    ].filter(Boolean);
}

function searchableText(item) {
    return [item.title, item.module, item.category, item.origin, item.metric, item.summary, item.sourceContext, ...(item.sources || [])]
        .filter(Boolean).join(" ").toLowerCase();
}

export function focusMatches(item, focus = "all") {
    if (!focus || focus === "all") return true;
    if (focus === "Packages") return item.module === "Packages";
    return focusDefinitions.some((entry) => entry.focus === focus)
        ? taxonomy.matchesTopic(item, focus)
        : true;
}

export function filterItems(items, filters) {
    const query = String(filters.query || "").toLowerCase();
    return items
        .filter((item) => filters.module === "all" || item.module === filters.module)
        .filter((item) => filters.category === "all" || item.category === filters.category)
        .filter((item) => focusMatches(item, filters.focus))
        .filter((item) => !query || searchableText(item).includes(query));
}

export function savedIdForItem(item, savedIds = new Set()) {
    return [item.id, ...(item.legacyIds || [])].find((id) => savedIds.has(id)) || "";
}

export function sortItems(items, sort = "priority", savedIds = new Set()) {
    return [...items].sort((a, b) => {
        if (sort === "saved") return Number(Boolean(savedIdForItem(b, savedIds))) - Number(Boolean(savedIdForItem(a, savedIds))) || comparePriority(a, b);
        if (sort === "module") return a.module.localeCompare(b.module) || comparePriority(a, b);
        if (sort === "category") return a.category.localeCompare(b.category) || comparePriority(a, b);
        return comparePriority(a, b);
    });
}

export function visibleItems(items, filters, savedIds = new Set()) {
    return sortItems(filterItems(items, filters), filters.sort, savedIds);
}

export function availableSearch(search, items = []) {
    const modules = new Set(items.map(({ module }) => module));
    const categories = new Set(items.map(({ category }) => category));
    return {
        ...search,
        module: search.module === "all" || modules.has(search.module) ? search.module : "all",
        category: search.category === "all" || categories.has(search.category) ? search.category : "all"
    };
}

export function safeExternalUrl(value) {
    try {
        const url = new URL(String(value || ""));
        return ["http:", "https:"].includes(url.protocol) ? url.href : "#";
    } catch {
        return "#";
    }
}
