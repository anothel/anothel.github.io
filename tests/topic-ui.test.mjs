import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import { normalizeExploreData, sortItems } from "../src/lib/explore-domain.js";
import {
    buildTopicPageModel,
    relatedTopicLinks,
    safeExternalUrl,
    safeTopicActionHref,
    sourceMix,
    todayTopicItems,
    topicBySlug,
    topicItems,
    topicRelatedGroups,
    topicSummary,
    topicSupportingSignals
} from "../src/lib/topic-domain.js";
import taxonomy, { topicDefinitions, topicNotes, topicPageLabels } from "../src/lib/topic-taxonomy.js";

const json = (path) => JSON.parse(readFileSync(path, "utf8"));
const data = {
    trends: json("data/trends.json"),
    packages: json("data/packages.json"),
    repos: json("data/repos.json"),
    links: json("data/links.json")
};
const today = json("data/today.json");
const signalPolicy = json("data/signal-policy.json");
const routes = [
    ["agent-skills", "Agent skills"],
    ["ai-agents", "AI agents"],
    ["ai-engineering", "AI engineering"],
    ["ai-evals", "AI evals"],
    ["mcp", "MCP"],
    ["security", "Security"],
    ["workflow-automation", "Workflow automation"]
];

test("topic slugs resolve exactly the seven public topic routes", () => {
    assert.deepEqual(routes.map(([slug]) => topicBySlug(slug)?.label), routes.map(([, label]) => label));
    assert.equal(topicBySlug("developer-tooling"), null);
    assert.equal(topicBySlug("unknown"), null);
    assert.equal(topicBySlug(""), null);
});

test("canonical ES taxonomy preserves the pre-conversion definition fingerprint", () => {
    const payload = JSON.stringify(topicDefinitions, (key, value) => (
        value instanceof RegExp ? { source: value.source, flags: value.flags } : value
    ));

    assert.equal(createHash("sha256").update(payload).digest("hex"), "c522490b504b55bdb0488a1cd1ba3903e4ce1c671cea060813699b79ce5427a8");
});

test("canonical ES helpers preserve legacy classification, aliases, routes, and Notes order", () => {
    const classifications = [
        ["agent skills MCP", "Agent skills"],
        ["MCP LLM evaluation benchmark", "MCP"],
        ["LLM evaluation benchmark model training", "AI evals"],
        ["nanoGPT model Claude Code", "AI engineering"],
        ["Claude Code workflow automation", "AI agents"],
        ["n8n security", "Workflow automation"],
        ["security TypeScript", "Security"],
        ["TypeScript", "Developer tooling"],
        ["unclassified signal", ""]
    ];

    for (const [input, expected] of classifications) assert.equal(taxonomy.classifyTopic(input), expected, input);
    assert.equal(taxonomy.topicByLabel("mcp")?.label, "MCP");
    assert.equal(taxonomy.routeForTopic("AI agents", "../"), "../topics/ai-agents/index.html");
    assert.equal(taxonomy.routeForTopic("Developer tooling", "../"), "../explore/index.html?focus=Developer%20tooling");
    assert.equal(taxonomy.routeForTopic("unknown", "../"), "../explore/index.html");
    assert.equal(taxonomy.exploreRouteForTopic("ai-evals", "../"), "../explore/index.html?focus=AI%20evals");
    assert.equal(taxonomy.exploreRouteForTopic("", "../"), "../explore/index.html?focus=all");
    assert.deepEqual(topicNotes("../").map(({ topic }) => topic), topicPageLabels);
});

test("topic matching preserves every pattern and requires-pattern rule", () => {
    const matches = [
        ["AI agents", "Claude Code coding agent workflow"],
        ["Agent skills", "mattpocock/skills for coding agents"],
        ["MCP", "Model Context Protocol inspector"],
        ["AI evals", "LLM evaluation benchmark harness"],
        ["AI engineering", "nanoGPT model training"],
        ["Workflow automation", "n8n durable workflow automation"],
        ["Security", "OAuth supply chain security"]
    ];
    for (const [topic, title] of matches) assert.equal(taxonomy.matchesTopic({ title }, topic), true, topic);

    assert.equal(taxonomy.matchesTopic({ title: "benchmark harness" }, "AI evals"), false);
    assert.equal(taxonomy.matchesTopic({ title: "training course" }, "AI engineering"), false);
    assert.equal(taxonomy.matchesTopic({ category: "AI evals", title: "benchmark harness" }, "AI evals"), true);
    assert.equal(taxonomy.matchesTopic({ title: "unknown" }, "not-a-topic"), false);
});

test("topic items reuse Explore normalization, canonical ids, dedupe, and priority ranking", () => {
    const normalized = normalizeExploreData(data, { signalPolicy });
    for (const topic of topicPageLabels) {
        const expected = sortItems(normalized.filter((item) => taxonomy.matchesTopic(item, topic)), "priority");
        const actual = topicItems(data, topic, { signalPolicy });
        assert.deepEqual(actual.map(({ id }) => id), expected.map(({ id }) => id), topic);
        assert.equal(new Set(actual.map(({ id }) => id)).size, actual.length, `${topic} canonical ids`);
        assert.ok(actual.every(({ schemaVersion, canonicalKey, sourceContext, scoreReasons }) => (
            schemaVersion === 2
            && canonicalKey
            && typeof sourceContext === "string"
            && Array.isArray(scoreReasons)
        )), `${topic} Explore item contract`);
    }
});

test("topic summary and source mix stay deterministic", () => {
    const items = [
        { module: "Repos", updated: "2026-07-10" },
        { module: "Links", updated: "2026-07-12" },
        { module: "Repos", updated: "2026-07-11" },
        { module: "Packages", updated: "2026-07-09" }
    ];
    assert.deepEqual(topicSummary(items), { total: 4, modules: 3, updated: "2026-07-12" });
    assert.deepEqual(sourceMix(items), [
        { module: "Repos", count: 2 },
        { module: "Links", count: 1 },
        { module: "Packages", count: 1 }
    ]);
});

test("supporting signals keep the strongest three safe unique URLs", () => {
    const signals = topicSupportingSignals([
        { id: "a", title: "First", module: "Repos", url: "https://example.com/a", score: 70 },
        { id: "b", title: "Best", module: "Trends", url: "https://example.com/b", score: 99 },
        { id: "b2", title: "Duplicate", module: "Packages", url: "https://example.com/b", score: 98 },
        { id: "c", title: "Second", module: "Links", url: "https://example.com/c", score: 80 },
        { id: "d", title: "Third", module: "Packages", url: "https://example.com/d", score: 75 },
        { id: "bad", title: "Unsafe", module: "Links", url: "javascript:alert(1)", score: 100 }
    ]);
    assert.deepEqual(signals.map(({ title }) => title), ["Best", "Second", "Third"]);
});

test("Today and module-related groups preserve matching, order, limits, and omission", () => {
    const currentToday = {
        updated: "2026-07-12",
        sections: [{
            id: "start",
            items: [
                { title: "Lower MCP", category: "MCP", score: 80, url: "https://example.com/lower" },
                { title: "Top MCP", category: "MCP", score: 99, reason: "Open first", url: "https://example.com/top" },
                { title: "Other", category: "Security", score: 100, url: "https://example.com/other" }
            ]
        }]
    };
    const relatedItems = [
        ...Array.from({ length: 4 }, (_, index) => ({ module: "Packages", title: `Package ${index}`, url: index === 0 ? "https://example.com/top" : `https://example.com/package-${index}`, score: 90 - index })),
        { module: "Repos", title: "Repo", score: 70 },
        { module: "Trends", title: "Trend", score: 100 }
    ];

    assert.deepEqual(todayTopicItems(currentToday, "MCP").map(({ title }) => title), ["Top MCP", "Lower MCP"]);
    const groups = topicRelatedGroups(relatedItems, currentToday, "MCP");
    assert.deepEqual(groups.map(({ label }) => label), ["Today picks", "Packages", "Repos"]);
    assert.equal(groups.find(({ label }) => label === "Packages").items.length, 3);
    assert.equal(new Set(groups.flatMap(({ items }) => items.map(({ url, module, title }) => url || `${module}:${title}`))).size, groups.flatMap(({ items }) => items).length);
    assert.equal(groups.some(({ label }) => label === "Trends"), false);
});

test("topic page models contain complete static decision support for every route", () => {
    for (const topic of topicPageLabels) {
        const model = buildTopicPageModel(data, today, topic, { signalPolicy });
        assert.equal(model.config.label, topic);
        assert.equal(model.summary.total, model.items.length);
        assert.deepEqual(model.topMovers, model.items.slice(0, 3));
        assert.ok(model.items.length > 0, `${topic} signals`);
        assert.ok(model.note.title && model.note.body && model.note.readWhen, `${topic} note`);
        assert.ok(model.guidance.whatToWatch && model.guidance.whenToOpen && model.guidance.nextAction, `${topic} guidance`);
        assert.ok(model.lead && model.whyNow, `${topic} context`);
        assert.ok(model.supportingSignals.length <= 3, `${topic} supporting signals`);
        assert.equal(model.relatedTopics.length, 6, `${topic} related topics`);
        assert.ok(model.config.actions.every(([, href]) => href !== "#"), `${topic} actions`);
        assert.doesNotMatch(JSON.stringify(model), /(?:^|[":\s])(undefined|null|NaN)(?:$|[",\s])/);
    }
});

test("checked-in topic corpus stays within audited semantic goldens", () => {
    const goldens = {
        "Agent skills": { range: [5, 9], modules: 3, top: ["anthropics/skills", "JuliusBrussee/caveman", "mattpocock/skills"], purpose: ["anthropics/skills"] },
        "AI agents": { range: [28, 38], modules: 4, top: ["activepieces/activepieces", "affaan-m/ECC", "AgentOps-AI/agentops"], purpose: ["anthropics/claude-code"] },
        "AI engineering": { range: [18, 30], modules: 4, top: ["AgentOps-AI/agentops", "langfuse/langfuse", "promptfoo/promptfoo"], purpose: ["karpathy/nanoGPT", "karpathy/nanochat"] },
        "AI evals": { range: [12, 21], modules: 4, top: ["affaan-m/ECC", "AgentOps-AI/agentops", "Arize-ai/phoenix"], purpose: ["promptfoo/promptfoo"] },
        MCP: { range: [11, 18], modules: 3, top: ["activepieces/activepieces", "awslabs/mcp", "@modelcontextprotocol/sdk"], purpose: ["modelcontextprotocol/servers"] },
        Security: { range: [2, 6], modules: 2, top: ["affaan-m/ECC", "promptfoo/promptfoo"], purpose: ["promptfoo/promptfoo"] },
        "Workflow automation": { range: [11, 18], modules: 4, top: ["activepieces/activepieces", "enescingoz/awesome-n8n-templates", "n8n-io/n8n"], purpose: ["@temporalio/workflow"] }
    };

    for (const [topic, golden] of Object.entries(goldens)) {
        const model = buildTopicPageModel(data, today, topic, { signalPolicy });
        const titles = model.items.map(({ title }) => title);
        const topTitles = titles.slice(0, golden.top.length);

        assert.ok(model.items.length >= golden.range[0] && model.items.length <= golden.range[1], `${topic} count`);
        assert.ok(model.summary.modules >= golden.modules, `${topic} source diversity`);
        assert.deepEqual(topTitles.toSorted(), golden.top.toSorted(), `${topic} top-result set`);
        for (const title of golden.purpose) assert.ok(titles.slice(0, 10).includes(title), `${topic} purpose: ${title}`);
        assert.equal(new Set(model.items.map(({ canonicalKey }) => canonicalKey)).size, model.items.length, `${topic} duplicate URL`);
        assert.ok(model.items.every(({ url }) => safeExternalUrl(url) !== "#"), `${topic} external URLs`);
    }
});

test("topic definitions keep durable notes, guidance, actions, and related route order", () => {
    for (const topic of topicDefinitions.filter(({ label }) => topicPageLabels.includes(label))) {
        assert.ok(topic.note.title.length > 20, `${topic.label} note title`);
        assert.ok(topic.note.body.length > 60, `${topic.label} note body`);
        assert.ok(topic.note.readWhen.length > 40, `${topic.label} note readWhen`);
        assert.ok(topic.guidance.whatToWatch.length > 40, `${topic.label} whatToWatch`);
        assert.ok(topic.guidance.whenToOpen.length > 40, `${topic.label} whenToOpen`);
        assert.ok(topic.guidance.nextAction.length > 40, `${topic.label} nextAction`);
        assert.equal(topic.actions.length, 3, `${topic.label} actions`);
        assert.equal(topic.actions[0][0], "Open focused Explore", `${topic.label} focused action`);
    }
    assert.deepEqual(relatedTopicLinks("MCP").map(({ topic }) => topic), topicPageLabels.filter((topic) => topic !== "MCP"));
});

test("topic link policies reject executable and off-site configuration URLs", () => {
    assert.equal(safeExternalUrl("javascript:alert(1)"), "#");
    assert.equal(safeExternalUrl("https://example.com/signal"), "https://example.com/signal");
    assert.equal(safeTopicActionHref("../../explore/index.html?focus=MCP"), "../../explore/index.html?focus=MCP");
    assert.equal(safeTopicActionHref("javascript:alert(1)"), "#");
    assert.equal(safeTopicActionHref("https://evil.example/path"), "#");
    assert.equal(safeTopicActionHref("//evil.example/path"), "#");
});
