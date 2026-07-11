import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import vm from "node:vm";

function readPublicScript(name) {
    return readFileSync(resolve(process.cwd(), "js", name), "utf8");
}

function exploreContext() {
    const context = { console, URL, URLSearchParams };
    for (const script of [
        "safe-dom.js",
        "data-health.js",
        "signal-schema.js",
        "topic-taxonomy.js",
        "explore.js"
    ]) {
        vm.runInNewContext(readPublicScript(script), context);
    }
    return context;
}

export function buildExploreFallback({ manifest, trends, packages, repos, links, signalPolicy, generatedAt }) {
    const context = exploreContext();
    const app = context.ExploreApp;
    const dataHealth = context.DataHealth;
    const dataByModule = { manifest, trends, packages, repos, links };
    const items = app.normalizeExploreData(dataByModule, { signalPolicy });
    const sourceMeta = app.collectSourceMeta(dataByModule);
    const visibleItems = app.sortExploreItems(items, "priority", new Set());
    const categories = new Set(visibleItems.map((item) => item.category).filter(Boolean));
    const topicLenses = app.sortTopicLensesByPins(app.buildTopicLenses(items), new Set());

    return {
        total: visibleItems.length,
        savedCount: 0,
        categories: categories.size,
        summary: `${visibleItems.length} tracked. Top 12 shown without JavaScript.`,
        dataMode: dataHealth.dataModeText(sourceMeta, { updated: manifest.updated }),
        sourceHealthHtml: dataHealth.renderSourceHealth(sourceMeta, { today: generatedAt }),
        topicLensesHtml: app.renderTopicLenses(topicLenses, "all", new Set()),
        resultsHtml: app.renderExploreCards(visibleItems.slice(0, 12), new Set()),
        savedHtml: app.renderSavedQueue(items, new Set())
    };
}
