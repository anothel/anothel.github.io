import { normalizeExploreData, safeExternalUrl, sortItems } from "./explore-domain.js";
import taxonomy, { topicBySlug, topicPageLabels } from "./topic-taxonomy.js";

export { topicBySlug };

export function topicItems(dataByModule, topic, options = {}) {
    return sortItems(
        normalizeExploreData(dataByModule, { signalPolicy: options.signalPolicy })
            .filter((item) => taxonomy.matchesTopic(item, topic)),
        "priority"
    );
}

export function topicSummary(items) {
    return {
        total: items.length,
        modules: new Set(items.map((item) => item.module)).size,
        updated: items.map((item) => item.updated).filter(Boolean).sort().at(-1) || "-"
    };
}

export function sourceMix(items) {
    const counts = new Map();
    for (const item of items) counts.set(item.module, (counts.get(item.module) || 0) + 1);
    return [...counts.entries()]
        .map(([module, count]) => ({ module, count }))
        .sort((a, b) => b.count - a.count || a.module.localeCompare(b.module));
}

export function topicSupportingSignals(items) {
    const seen = new Set();
    return sortItems(items)
        .filter((item) => {
            const href = safeExternalUrl(item.url);
            if (href === "#" || seen.has(href)) return false;
            seen.add(href);
            return true;
        })
        .slice(0, 3);
}

export function todayTopicItems(today, topic) {
    return (today?.sections || [])
        .flatMap((section) => (section.items || []).map((item) => ({ ...item, section: section.title || section.id || "Today" })))
        .filter((item) => taxonomy.matchesTopic(item, topic))
        .map((item) => ({
            ...item,
            module: "Today",
            origin: item.origin || item.module || item.section || "Today",
            metric: item.metric || `${item.score || 0} score`,
            summary: item.reason || item.summary || "",
            updated: today?.updated || "-",
            score: Number(item.score || 0)
        }))
        .sort((a, b) => b.score - a.score);
}

export function topicRelatedGroups(items, today, topic) {
    const group = (module) => items.filter((item) => item.module === module).slice(0, 3);
    return [
        ["Today picks", todayTopicItems(today, topic).slice(0, 3)],
        ["Packages", group("Packages")],
        ["Repos", group("Repos")],
        ["Links", group("Links")]
    ].filter(([, groupItems]) => groupItems.length)
        .map(([label, groupItems]) => ({ label, items: groupItems }));
}

export function relatedTopicLinks(topic) {
    return topicPageLabels.filter((label) => label !== topic).map((label) => {
        const config = taxonomy.topicPageConfig(label);
        return { topic: label, route: config.route, summary: config.description };
    });
}

export function safeTopicActionHref(value) {
    const href = String(value || "").trim();
    if (!href || href.startsWith("//") || /[\u0000-\u001F\u007F]/.test(href)) return "#";
    try {
        const url = new URL(href, "https://anothel.github.io/topics/topic/");
        return url.origin === "https://anothel.github.io" ? href : "#";
    } catch {
        return "#";
    }
}

export function buildTopicPageModel(dataByModule, today, topic, options = {}) {
    const config = taxonomy.topicPageConfig(topic);
    const items = topicItems(dataByModule, topic, options);
    const summary = topicSummary(items);
    const mix = sourceMix(items);
    const topMovers = items.slice(0, 3);
    const signalLabel = config.signalLabel || config.label;
    const moduleWord = summary.modules === 1 ? "module" : "modules";
    const signalWord = items.length === 1 ? "signal" : "signals";
    const topText = topMovers[0] ? ` Top signal: ${topMovers[0].title} from ${topMovers[0].module}.` : " No top signal yet.";

    return {
        config: {
            ...config,
            actions: config.actions.map(([label, href, description]) => [label, safeTopicActionHref(href), description])
        },
        items,
        summary,
        sourceMix: mix,
        supportingSignals: topicSupportingSignals(items),
        guidance: { ...config.guidance },
        note: { ...config.note },
        lead: `${mix.length} source ${moduleWord} tracking ${items.length} ${signalLabel} ${signalWord}.`,
        whyNow: `${items.length} ${signalLabel} ${signalWord} across ${summary.modules} source ${moduleWord}. ${config.whyPrefix}${topText}`,
        topMovers,
        relatedGroups: topicRelatedGroups(items, today, topic),
        relatedTopics: relatedTopicLinks(topic)
    };
}

export { safeExternalUrl };
