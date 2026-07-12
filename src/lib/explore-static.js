import { collectSourceMeta, normalizeExploreData, sortItems } from "./explore-domain.js";
import { buildTopicLenses, dataModeText, sourceHealthModel } from "./explore-model.js";

export function buildExploreFallback({ manifest, trends, packages, repos, links, signalPolicy, generatedAt }) {
    const dataByModule = { manifest, trends, packages, repos, links };
    const items = normalizeExploreData(dataByModule, { signalPolicy });
    const sourceMeta = collectSourceMeta(dataByModule);
    const visibleItems = sortItems(items, "priority");
    const categories = new Set(visibleItems.map((item) => item.category).filter(Boolean));

    return {
        total: visibleItems.length,
        savedCount: 0,
        categories: categories.size,
        summary: `${visibleItems.length} tracked. Top 12 shown without JavaScript.`,
        updated: manifest.updated,
        sourceMeta,
        sourceHealth: sourceHealthModel(sourceMeta, generatedAt),
        dataMode: dataModeText(sourceMeta, manifest.updated, generatedAt),
        topicLenses: buildTopicLenses(items),
        items: visibleItems.slice(0, 12)
    };
}
