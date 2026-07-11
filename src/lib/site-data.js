import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const dataHealth = require("../../js/data-health.js");

export const { freshnessForSource, freshnessText, freshnessStates, freshnessThresholds, trustState } = dataHealth;

export function sourceList(sourceMeta) {
    if (Array.isArray(sourceMeta)) return sourceMeta;
    if (sourceMeta && typeof sourceMeta === "object") return [sourceMeta];
    return [];
}

export function sourceMetaForDatasets(datasets = {}) {
    return Object.values(datasets).flatMap((dataset) => sourceList(dataset?.sourceMeta));
}

export function todayTrustText({ total = 0, updated = "", trust = {} } = {}) {
    const pipelineStatus = trust.pipelineStatus || "unknown";
    const freshness = trust.freshness || "unknown";
    const current = pipelineStatus === "ok" && freshness === "fresh";
    const detail = current
        ? `${updated ? ` Data date ${updated}.` : ""} No recovery needed.`
        : " Check Status before trusting currentness.";
    return `${total} generated picks. Pipeline status ${pipelineStatus}. Freshness ${freshness}.${detail}`;
}

export function statusLabel(statuses) {
    const counts = statuses.reduce((summary, status = "unknown") => {
        summary[status] = (summary[status] || 0) + 1;
        return summary;
    }, {});

    return ["ok", "partial", "error", "fallback", "unknown"]
        .filter((status) => counts[status] > 0)
        .map((status) => `${counts[status]} ${status}`)
        .join(" / ") || "0 sources";
}

export function dataModeText(sourceMeta, updated = "") {
    return dataHealth.dataModeText(sourceMeta, { updated });
}

export function externalRel(url) {
    try {
        return new URL(url, "https://anothel.github.io").origin === "https://anothel.github.io"
            ? undefined
            : "noopener noreferrer";
    } catch {
        return undefined;
    }
}

export function topCategory(items = []) {
    const counts = items.reduce((summary, item) => {
        const category = item.category || "Unknown";
        summary.set(category, (summary.get(category) || 0) + 1);
        return summary;
    }, new Map());
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] || "-";
}

export function trendSignal(item) {
    return {
        module: "Trends",
        metric: item.velocity || `${item.score || 0} score`,
        origin: item.source,
        category: item.category,
        title: item.title,
        reason: item.summary,
        action: "Open the source and decide whether it belongs in the saved queue.",
        url: item.url
    };
}

export function packageSignal(item) {
    return {
        module: "Packages",
        metric: item.downloadsLabel,
        origin: "npm",
        category: item.category,
        title: item.name,
        reason: item.focus || item.period,
        action: "Check package demand, then compare related repos.",
        url: item.url
    };
}

export function repoSignal(item) {
    return {
        module: "Repos",
        metric: item.starsLabel ? `${item.starsLabel} stars` : `${item.stars || 0} stars`,
        origin: "GitHub",
        category: item.category,
        title: item.name,
        reason: item.summary || item.focus,
        action: "Compare repo traction before saving.",
        url: item.url
    };
}

export function linkSignal(item) {
    return {
        module: "Links",
        metric: item.kind,
        origin: item.kind,
        category: item.category,
        title: item.title,
        reason: item.summary,
        action: "Open the reference and keep it nearby if useful.",
        url: item.url
    };
}
