import "../../js/topic-taxonomy.js";

const taxonomy = globalThis.TopicTaxonomy;

if (!taxonomy) throw new Error("topic taxonomy failed to load");

export const topicDefinitions = taxonomy.topicDefinitions;
export const trackedTopicLabels = taxonomy.trackedTopicLabels;
export const topicPageLabels = taxonomy.topicPageLabels;
export const topicByLabel = taxonomy.topicByLabel;
export const matchesTopic = taxonomy.matchesTopic;
export const routeForTopic = taxonomy.routeForTopic;
export const exploreRouteForTopic = taxonomy.exploreRouteForTopic;
export const topicPageConfig = taxonomy.topicPageConfig;

export function topicBySlug(slug) {
    const topic = taxonomy.topicByLabel(slug);
    return topic && topicPageLabels.includes(topic.label) ? topic : null;
}

export default taxonomy;
