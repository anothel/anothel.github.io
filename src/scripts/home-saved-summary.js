import { readSavedSummary } from "../lib/storage-contract.js";

const copy = Object.freeze({
    available: "Local queue",
    unavailable: "Local unavailable"
});

export function updateHomeSavedSummary(document, storage) {
    const region = document?.querySelector?.("[data-home-review-summary]");
    if (!region) return null;

    const summary = readSavedSummary(storage);
    const saved = region.querySelector("[data-home-review-saved]");
    const unread = region.querySelector("[data-home-review-unread]");
    const status = region.querySelector("[data-home-review-status]");
    const value = (count) => summary.available ? String(count) : "??";

    if (saved) saved.textContent = value(summary.saved);
    if (unread) unread.textContent = value(summary.unread);
    if (status) status.textContent = summary.available ? copy.available : copy.unavailable;
    region.dataset.storageState = summary.available ? "available" : "unavailable";
    return summary;
}

export function initHomeSavedSummary(scope = globalThis) {
    let storage;
    try {
        storage = scope?.localStorage;
    } catch {
        storage = undefined;
    }
    return updateHomeSavedSummary(scope?.document, storage);
}
