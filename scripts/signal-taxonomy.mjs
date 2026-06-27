import "../js/topic-taxonomy.js";
import { readFileSync } from "node:fs";

const taxonomy = globalThis.TopicTaxonomy;
export const trackedTopicLabels = taxonomy.trackedTopicLabels;
export const signalPolicy = JSON.parse(readFileSync(new URL("../data/signal-policy.json", import.meta.url), "utf8"));

const baselineTitles = new Set(signalPolicy.baselineTitles);

function normalizeInput(input = "") {
    if (typeof input === "string") return input.toLowerCase();
    return [
        input.title,
        input.name,
        input.fullName,
        input.full_name,
        input.module,
        input.origin,
        input.category,
        input.metric,
        input.reason,
        input.focus,
        input.summary,
        input.description,
        input.url,
        ...(Array.isArray(input.topics) ? input.topics : [])
    ].filter(Boolean).join(" ").toLowerCase();
}

export function classifySignal(input = "") {
    const topic = taxonomy.classifyTopic(input);
    if (topic) return topic;

    const text = typeof input === "string" ? input.toLowerCase() : [
        input.title,
        input.name,
        input.fullName,
        input.full_name,
        input.module,
        input.origin,
        input.category,
        input.metric,
        input.reason,
        input.focus,
        input.summary,
        input.description,
        input.url,
        ...(Array.isArray(input.topics) ? input.topics : [])
    ].filter(Boolean).join(" ").toLowerCase();
    if (/(database|sqlite|postgres|storage|sync|local-first)/.test(text)) return "Database";
    if (/(security|vulnerability|auth|oauth|supply chain)/.test(text)) return "Security";
    if (/(css|design|ui|frontend|browser|web)/.test(text)) return "Frontend";
    return "Developer tools";
}

export function isBaselineSignal(input = "") {
    const text = normalizeInput(input);
    const direct = text.trim();
    const firstToken = direct.split(/\s+/)[0] || direct;
    const repoName = firstToken.includes("/") ? firstToken.split("/").at(-1) : firstToken;

    return baselineTitles.has(direct)
        || baselineTitles.has(firstToken)
        || baselineTitles.has(repoName);
}

export function signalReason(input = "") {
    const category = classifySignal(input);
    return taxonomy.topicByLabel(category)?.reason || "Developer tooling signal worth keeping nearby.";
}

export function qualityBoost(input = "") {
    const category = classifySignal(input);
    const baselinePenalty = isBaselineSignal(input) ? signalPolicy.baselinePenalty : 0;
    const boosts = Object.fromEntries(taxonomy.topicDefinitions.map((topic) => [topic.label, topic.boost]));

    return (boosts[category] || 0) + baselinePenalty;
}
