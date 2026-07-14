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
