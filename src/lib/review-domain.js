import { focusDefinitions, focusMatches, safeExternalUrl } from "./explore-domain.js";
import { savedRecordsFromRaw } from "./explore-storage.js";

const statuses = new Set(["unread", "read", "done"]);

function statusRank(status) {
    return status === "done" ? 2 : status === "read" ? 1 : 0;
}

function hasMetadata(item) {
    return Boolean(item.savedReason || item.savedNote || item.savedTag);
}

export function sortReviewItems(items = []) {
    return [...items].sort((a, b) => statusRank(a.savedStatus) - statusRank(b.savedStatus)
        || Number(hasMetadata(b)) - Number(hasMetadata(a))
        || String(b.savedAt || "").localeCompare(String(a.savedAt || "")));
}

export function matchSavedItems(items = [], records = []) {
    const recordsById = new Map(records.map((record) => [record.id, record]));
    const matchedIds = new Set();
    const matched = items.flatMap((item) => {
        const itemIds = [item.id, ...(item.legacyIds || [])];
        itemIds.filter((id) => recordsById.has(id)).forEach((id) => matchedIds.add(id));
        const savedRecordId = itemIds.find((id) => recordsById.has(id));
        if (!savedRecordId) return [];
        const record = recordsById.get(savedRecordId);
        return [{
            ...item,
            savedRecordId,
            savedAt: record.savedAt,
            savedStatus: statuses.has(record.status) ? record.status : "unread",
            savedReason: record.reason || "",
            savedTag: record.tag || "",
            savedNote: record.note || ""
        }];
    });
    return {
        items: sortReviewItems(matched),
        staleRecords: records.filter(({ id }) => !matchedIds.has(id))
    };
}

export function filterReviewItems(items = [], filter = "all") {
    const sorted = sortReviewItems(items);
    return statuses.has(filter) ? sorted.filter((item) => item.savedStatus === filter) : sorted;
}

export function workflowStats(items = []) {
    return Object.fromEntries([...statuses].map((status) => [status, items.filter((item) => item.savedStatus === status).length]));
}

export function reviewStats(items = []) {
    return {
        visible: items.length,
        focusAreas: new Set(items.map(({ category }) => category).filter(Boolean)).size,
        sources: new Set(items.flatMap((item) => item.sources?.length ? item.sources : [item.module]).filter(Boolean)).size
    };
}

export function selectedReviewItem(items = [], selectedId = "") {
    return items.find(({ id }) => id === selectedId) || items[0] || null;
}

export function reviewFocus(item) {
    const security = focusDefinitions.find(({ focus }) => focus === "Security");
    if (security && focusMatches(item, security.focus)) return "Security";
    for (const definition of focusDefinitions) {
        if (definition.focus !== "Security" && focusMatches(item, definition.focus)) return definition.focus;
    }
    return item?.module === "Packages" ? "Packages" : "all";
}

export function similarExploreHref(item, prefix = "../") {
    const focus = reviewFocus(item);
    return focus === "all" ? `${prefix}explore/index.html` : `${prefix}explore/index.html?focus=${encodeURIComponent(focus)}`;
}

export function topicNotesHref(item, prefix = "../") {
    const focus = reviewFocus(item);
    return focusDefinitions.find((entry) => entry.focus === focus)?.route.startsWith("../topics/")
        ? `${prefix}notes/index.html`
        : "";
}

export function reviewImportRecords(text, options) {
    return savedRecordsFromRaw(text, options);
}

export function reviewImportPreview(incoming = [], existing = []) {
    const ids = new Set(existing.map(({ id }) => id));
    let added = 0;
    let skipped = 0;
    for (const { id } of incoming) {
        if (ids.has(id)) skipped += 1;
        else { ids.add(id); added += 1; }
    }
    return { added, skipped };
}

export function reviewJsonPayload(records = [], now = () => new Date().toISOString()) {
    const items = savedRecordsFromRaw(JSON.stringify({ version: 2, items: records }), { now });
    return JSON.stringify({ version: 2, exportedAt: now(), items }, null, 2);
}

function markdownText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
}

function markdownLink(title, value) {
    const label = markdownText(title).replace(/[\[\]]/g, "");
    const href = safeExternalUrl(value);
    return href === "#" ? label : `[${label}](${href.replace(/\(/g, "%28").replace(/\)/g, "%29")})`;
}

export function reviewMarkdownPayload(items = [], now = () => new Date().toISOString()) {
    const lines = ["# Review queue", "", `Exported: ${now()}`, ""];
    for (const item of sortReviewItems(items)) {
        const meta = [item.module, item.category, item.metric].map(markdownText).filter(Boolean).join(" / ");
        lines.push(`- [${markdownText(item.savedStatus || "unread")}] ${markdownLink(item.title || item.id, item.url)}${meta ? ` - ${meta}` : ""}`);
        if (item.savedReason) lines.push(`  - Reason: ${markdownText(item.savedReason)}`);
        if (item.savedTag) lines.push(`  - Tag: ${markdownText(item.savedTag)}`);
        if (item.savedNote) lines.push(`  - Note: ${markdownText(item.savedNote)}`);
        const summary = markdownText(item.summary || item.reason);
        if (summary) lines.push(`  - ${summary}`);
        if (item.savedAt) lines.push(`  - Saved ${String(item.savedAt).slice(0, 10)}`);
    }
    return `${lines.join("\n")}\n`;
}
