import { readPinnedTopicsState, togglePinnedTopicState } from "../lib/storage-contract.js";

export function renderTopicPin(region, state) {
    const button = region?.querySelector?.("[data-topic-pin-button]");
    const status = region?.querySelector?.("[data-topic-pin-status]");
    const topic = region?.dataset?.topic || "";
    if (!button || !status || !topic) return;

    if (!state.available) {
        button.textContent = "Pin unavailable";
        button.setAttribute("aria-pressed", "mixed");
        button.setAttribute("aria-label", `Pin status unavailable for ${topic}`);
        button.disabled = true;
        status.textContent = "Browser-local pin state is unavailable in this browser.";
        return;
    }

    const pinned = state.topics.includes(topic);
    button.textContent = pinned ? "Pinned topic" : "Pin topic";
    button.setAttribute("aria-pressed", String(pinned));
    button.setAttribute("aria-label", pinned ? `Unpin ${topic} topic` : `Pin ${topic} topic`);
    button.disabled = false;
    status.textContent = "Pinning is local to this browser.";
}

export function initTopicPin(scope = globalThis) {
    const region = scope?.document?.querySelector?.("[data-topic-pin]");
    if (!region) return null;

    let validTopics;
    let storage;
    try {
        validTopics = JSON.parse(region.dataset.validTopics || "[]");
        storage = scope.localStorage;
    } catch {
        validTopics = [];
    }
    if (!Array.isArray(validTopics) || validTopics.length === 0) {
        renderTopicPin(region, { available: false, topics: [] });
        return null;
    }

    renderTopicPin(region, readPinnedTopicsState(storage, validTopics));
    const button = region.querySelector("[data-topic-pin-button]");
    button?.addEventListener?.("click", () => {
        renderTopicPin(region, togglePinnedTopicState(storage, region.dataset.topic, validTopics));
    });
    return region;
}
