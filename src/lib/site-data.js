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

export function referenceList(items = []) {
    const seen = new Set();
    return items.flatMap((item, index) => {
        const href = String(item?.url || "").trim();
        try {
            const url = new URL(href);
            if (url.protocol !== "http:" && url.protocol !== "https:") return [];
            url.hash = "";
            url.pathname = url.pathname.replace(/\/+$/, "") || "/";
            if (seen.has(url.href)) return [];
            seen.add(url.href);
            return [{ ...item, url: href, featured: index < 4 }];
        } catch {
            return [];
        }
    });
}
