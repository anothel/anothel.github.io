import { focusDefinitions, focusMatches, sortItems } from "./explore-domain.js";

function sourceList(sourceMeta) {
    return Array.isArray(sourceMeta) ? sourceMeta : sourceMeta && typeof sourceMeta === "object" ? [sourceMeta] : [];
}

function datePart(value) {
    return String(value || "").match(/^\d{4}-\d{2}-\d{2}/)?.[0] || "";
}

function ageDays(value, today = new Date()) {
    const updated = datePart(value);
    const current = datePart(today instanceof Date ? today.toISOString() : today);
    if (!updated || !current) return null;
    const diff = Date.parse(`${current}T00:00:00Z`) - Date.parse(`${updated}T00:00:00Z`);
    return Number.isFinite(diff) ? Math.max(0, Math.floor(diff / 86400000)) : null;
}

function freshness(source, today) {
    const status = source?.status || "unknown";
    const updated = status === "fallback" ? source.previousUpdated : status === "error" ? "" : source.updatedAt || source.lastSuccessfulUpdate;
    if (status === "error" && Number(source?.count || 0) === 0) return { state: "unavailable", age: null, updated: "" };
    const age = ageDays(updated, today);
    if (age === null) return { state: "unknown", age, updated: "" };
    const manual = String(source?.name || source?.source || "").toLowerCase() === "manual";
    const state = age <= (manual ? 30 : 1) ? "fresh" : age <= (manual ? 90 : 3) ? "aging" : "stale";
    return { state, age, updated: datePart(updated) };
}

export function sourceHealthModel(sourceMeta, today) {
    return sourceList(sourceMeta).map((source) => {
        const current = freshness(source, today);
        const detail = current.state === "fresh" ? `Fresh - updated ${current.updated}`
            : current.state === "aging" || current.state === "stale" ? `${current.state[0].toUpperCase()}${current.state.slice(1)} - ${current.age} days old`
                : current.state === "unavailable" ? "Unavailable - no usable source data" : "Unknown - no reliable source timestamp";
        const safety = [source.fallbackUsed && "using fallback", source.staleButSafe && "previous data kept", source.rateLimited && "rate limited"].filter(Boolean);
        return {
            name: source.name || source.source || "unknown",
            status: source.status || "unknown",
            count: Number(source.count || 0),
            detail: safety.length ? `${detail} / ${safety.join(" / ")}` : detail
        };
    });
}

export function dataModeText(sourceMeta, updated = "", today) {
    const sources = sourceList(sourceMeta);
    const statuses = new Set(sources.map((source) => source.status || "unknown"));
    if (statuses.has("fallback")) return "Source health fallback. Previous data remains available; retry data refresh.";
    if (statuses.has("partial") || (statuses.has("error") && statuses.has("ok"))) return "Source health partial. Some data is stale but still usable; some sources may be missing. Retry data refresh to recover freshness.";
    if (statuses.has("error")) return "Source health failed. Retry data refresh before trusting freshness.";
    if (sources.length && [...statuses].every((status) => status === "ok")) {
        const counts = sourceHealthModel(sources, today).reduce((summary, source) => {
            const state = source.detail.split(" ")[0].toLowerCase();
            if (["aging", "stale", "unknown", "unavailable"].includes(state)) summary[state] = (summary[state] || 0) + 1;
            return summary;
        }, {});
        const attention = ["aging", "stale", "unknown", "unavailable"].filter((key) => counts[key]).map((key) => `${counts[key]} ${key}`);
        if (attention.length) return `Source health ok. Data age: ${attention.join(" / ")}.${counts.stale || counts.unavailable ? " Retry data refresh." : ""}`;
        return updated ? `Source health ok. Data date ${datePart(updated)}. No recovery needed.` : "Source health ok. Use the displayed data date for freshness. No recovery needed.";
    }
    return "Data status unavailable. Check Status before trusting freshness.";
}

export function buildTopicLenses(items, pinnedTopics = new Set()) {
    const lenses = focusDefinitions.map((definition) => {
        const matches = sortItems(items.filter((item) => focusMatches(item, definition.focus)), "priority");
        return {
            focus: definition.focus,
            label: definition.label,
            description: definition.description,
            route: definition.route,
            count: matches.length,
            modules: new Set(matches.map((item) => item.module)).size,
            topItem: matches[0] ? { title: matches[0].title, module: matches[0].module } : null
        };
    });
    const rank = new Map([...pinnedTopics].map((topic, index) => [topic, index]));
    return lenses.sort((a, b) => {
        if (rank.has(a.focus) || rank.has(b.focus)) return rank.has(a.focus) && rank.has(b.focus) ? rank.get(a.focus) - rank.get(b.focus) : rank.has(a.focus) ? -1 : 1;
        return 0;
    });
}

export function activeSummary(filters, visibleCount, savedCount, sourceMeta) {
    const parts = [`${visibleCount} visible`];
    if (filters.focus !== "all") parts.push(filters.focus);
    if (filters.module !== "all") parts.push(filters.module);
    if (filters.category !== "all") parts.push(filters.category);
    if (filters.query) parts.push(filters.query.length > 42 ? `${filters.query.slice(0, 42)}...` : filters.query);
    if (filters.sort === "saved") parts.push("saved first");
    if (savedCount) parts.push(`${savedCount} saved`);
    const partial = sourceList(sourceMeta).filter(({ status }) => status === "partial").map(({ name, source }) => name || source).filter(Boolean);
    if (partial.length) parts.push(`Partial sources: ${partial.join(", ")}`);
    return parts.join(" / ");
}
