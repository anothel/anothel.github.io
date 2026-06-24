import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const signalSchema = require("../js/signal-schema.js");
const topicTaxonomy = require("../js/topic-taxonomy.js");

function json(path) {
    return JSON.parse(readFileSync(path, "utf8"));
}

const statusValues = new Set(["ok", "partial", "error", "fallback", "unknown"]);
const sourceMetaKeys = new Set([
    "name",
    "status",
    "count",
    "tracked",
    "emitted",
    "coverage",
    "updatedAt",
    "updated",
    "errors",
    "error",
    "fallbackUsed",
    "staleButSafe",
    "fallbackReason",
    "previousUpdated",
    "rateLimited"
]);
const sectionIds = new Set(["start", "skim", "reference"]);

function assertDate(value, label) {
    assert.match(String(value || ""), /^\d{4}-\d{2}-\d{2}$/, label);
}

function assertTimestamp(value, label) {
    assert.match(String(value || ""), /^\d{4}-\d{2}-\d{2}T/, label);
}

function assertNonEmptyString(value, label) {
    assert.equal(typeof value, "string", label);
    assert.notEqual(value.trim(), "", label);
}

function assertSafeUrl(value, label) {
    const url = String(value || "");
    assert.ok(/^https?:\/\//.test(url) || /^(\.\.\/|\.\/|\/)?[a-z0-9._/-]+/i.test(url), label);
    assert.doesNotMatch(url, /^\/\//, label);
    assert.doesNotMatch(url, /[\u0000-\u001F\u007F]/, label);
}

function assertSourceMeta(sourceMeta, label) {
    const metas = Array.isArray(sourceMeta) ? sourceMeta : [sourceMeta];
    assert.ok(metas.length > 0, `${label} has source metadata`);
    for (const [index, source] of metas.entries()) {
        assert.ok(statusValues.has(source.status), `${label} source ${index} status`);
        assert.equal(typeof source.count, "number", `${label} source ${index} count`);
        for (const key of Object.keys(source)) {
            assert.ok(sourceMetaKeys.has(key), `${label} source ${index} marker ${key}`);
        }
        if (source.status === "fallback") {
            assert.equal(source.fallbackUsed, true, `${label} source ${index} fallbackUsed`);
            assert.equal(source.staleButSafe, true, `${label} source ${index} staleButSafe`);
            assert.equal(typeof source.fallbackReason, "string", `${label} source ${index} fallbackReason`);
        } else {
            assert.equal(source.fallbackUsed, undefined, `${label} source ${index} fallbackUsed`);
            assert.equal(source.staleButSafe, undefined, `${label} source ${index} staleButSafe`);
            assert.equal(source.fallbackReason, undefined, `${label} source ${index} fallbackReason`);
        }
        if (source.rateLimited !== undefined) assert.equal(typeof source.rateLimited, "boolean", `${label} source ${index} rateLimited`);
        if (source.updatedAt) assertTimestamp(source.updatedAt, `${label} source ${index} updatedAt`);
    }
}

test("source metadata status vocabulary stays user-facing", () => {
    assert.deepEqual([...statusValues], ["ok", "partial", "error", "fallback", "unknown"]);
});

test("manifest count and status matches module data files", () => {
    const manifest = json("data/manifest.json");

    assertDate(manifest.updated, "manifest updated");
    assertTimestamp(manifest.generatedAt, "manifest generatedAt");

    for (const module of manifest.modules) {
        const data = json(module.data);
        const collection = data.items || data.packages || data.repos || data.links || [];

        assert.ok(statusValues.has(module.status), `${module.id} manifest status`);
        assert.equal(module.count, collection.length, `${module.id} manifest count`);
        assertDate(module.updated, `${module.id} updated`);
        assertSourceMeta(data.sourceMeta, module.id);
    }
});

test("today brief uses stable sections and safe links", () => {
    const today = json("data/today.json");

    assertDate(today.updated, "today updated");
    assertTimestamp(today.generatedAt, "today generatedAt");
    assertSourceMeta(today.sourceMeta, "today");

    for (const section of today.sections) {
        assert.ok(sectionIds.has(section.id), `section ${section.id}`);
        assert.ok(section.title, "section title");
        assert.ok(Array.isArray(section.items), "section items");
        for (const item of section.items) {
            assert.equal(item.schemaVersion, 2, `${item.title} schemaVersion`);
            assert.ok(item.id, `${item.title} id`);
            assert.ok(item.sourceModule, `${item.title} sourceModule`);
            assert.ok(item.sourceKind, `${item.title} sourceKind`);
            assert.ok(item.canonicalKey, `${item.title} canonicalKey`);
            assert.ok(item.title, "today item title");
            assert.ok(item.reason, `${item.title} reason`);
            assertSafeUrl(item.url, `${item.title} url`);
            assert.ok(Number(item.score) >= 0 && Number(item.score) <= 100, `${item.title} score`);
        }
    }
});

test("module item urls and scores stay within display contract", () => {
    const trends = json("data/trends.json");
    const packages = json("data/packages.json");
    const repos = json("data/repos.json");
    const links = json("data/links.json");

    for (const item of trends.items) {
        assertSafeUrl(item.url, `trend ${item.title}`);
        assert.ok(Number(item.score) >= 0 && Number(item.score) <= 100, `trend ${item.title} score`);
    }
    for (const item of packages.packages) {
        assertSafeUrl(item.url, `package ${item.name}`);
        assert.ok(Number(item.downloads) >= 0, `package ${item.name} downloads`);
    }
    for (const item of repos.repos) {
        assertSafeUrl(item.url, `repo ${item.name}`);
        assert.ok(Number(item.stars) >= 0, `repo ${item.name} stars`);
    }
    for (const item of links.links) {
        assertSafeUrl(item.url, `link ${item.title}`);
        assert.ok(item.summary, `link ${item.title} summary`);
    }
});

test("watchlist definitions stay editable data with stable fields", () => {
    const watchlists = json("data/watchlists.json");
    assert.ok(Array.isArray(watchlists.packages), "watchlist packages");
    assert.ok(Array.isArray(watchlists.repos), "watchlist repos");

    const packageNames = new Set();
    for (const item of watchlists.packages) {
        assertNonEmptyString(item.name, "package name");
        assertNonEmptyString(item.category, `${item.name} category`);
        assertNonEmptyString(item.focus, `${item.name} focus`);
        assert.equal(packageNames.has(item.name), false, `${item.name} duplicate`);
        packageNames.add(item.name);
    }

    const repoNames = new Set();
    for (const item of watchlists.repos) {
        assertNonEmptyString(item.fullName, "repo fullName");
        assertNonEmptyString(item.category, `${item.fullName} category`);
        assertNonEmptyString(item.focus, `${item.fullName} focus`);
        assert.equal(repoNames.has(item.fullName.toLowerCase()), false, `${item.fullName} duplicate`);
        repoNames.add(item.fullName.toLowerCase());
    }

    const linkUrls = new Set();
    assert.ok(Array.isArray(watchlists.links), "watchlist links");
    for (const item of watchlists.links) {
        assertNonEmptyString(item.title, "link title");
        assertNonEmptyString(item.category, `${item.title} category`);
        assertNonEmptyString(item.kind, `${item.title} kind`);
        assertSafeUrl(item.url, `${item.title} url`);
        assertNonEmptyString(item.summary, `${item.title} summary`);
        assert.equal(linkUrls.has(item.url), false, `${item.url} duplicate`);
        linkUrls.add(item.url);
    }
});

test("topic taxonomy keeps labels, slugs, aliases, and routes in one contract", async () => {
    const { trackedTopicLabels } = await import("../scripts/signal-taxonomy.mjs");
    const routeLabels = new Set(["AI agents", "MCP", "Agent skills"]);

    assert.deepEqual(trackedTopicLabels, topicTaxonomy.trackedTopicLabels);
    assert.deepEqual(topicTaxonomy.trackedTopicLabels, [
        "AI agents",
        "Agent skills",
        "MCP",
        "AI evals",
        "AI engineering",
        "Workflow automation",
        "Developer tooling"
    ]);

    for (const topic of topicTaxonomy.topicDefinitions) {
        assert.match(topic.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/, `${topic.label} slug`);
        assertNonEmptyString(topic.description, `${topic.label} description`);
        assert.equal(topicTaxonomy.topicByLabel(topic.label), topic, `${topic.label} lookup`);

        const route = topicTaxonomy.routeForTopic(topic.label);
        if (routeLabels.has(topic.label)) {
            assert.equal(route, `topics/${topic.slug}/index.html`, `${topic.label} route`);
        } else {
            assert.equal(route, `explore/index.html?focus=${encodeURIComponent(topic.label)}`, `${topic.label} explore route`);
        }
    }

    assert.equal(topicTaxonomy.matchesTopic({ title: "Model Context Protocol server" }, "MCP"), true);
    assert.equal(topicTaxonomy.matchesTopic({ title: "mattpocock/skills for coding agents" }, "Agent skills"), true);
    assert.equal(topicTaxonomy.matchesTopic({ title: "unknown" }, "not-a-topic"), false);
});

test("checked-in sources normalize to Signal Schema v2 items", () => {
    const items = signalSchema.normalizeSignalData({
        trends: json("data/trends.json"),
        packages: json("data/packages.json"),
        repos: json("data/repos.json"),
        links: json("data/links.json")
    });
    const sourceModules = new Set(["trends", "packages", "repos", "links"]);
    const modules = new Set(["Trends", "Packages", "Repos", "Links"]);
    const sourceKinds = new Set(["trend", "package", "repo", "reference"]);

    assert.ok(items.length > 0, "normalized items exist");
    assert.equal(new Set(items.map((item) => item.id)).size, items.length, "normalized ids are unique after dedupe");

    for (const item of items) {
        assert.deepEqual(signalSchema.validateSignalItem(item), []);
        assert.equal(item.schemaVersion, 2);
        assert.ok(sourceModules.has(item.sourceModule), `${item.id} sourceModule`);
        assert.ok(modules.has(item.module), `${item.id} module`);
        assert.ok(sourceKinds.has(item.sourceKind), `${item.id} sourceKind`);
        assert.ok(item.canonicalKey, `${item.id} canonicalKey`);
        assert.ok(Array.isArray(item.sources) && item.sources.length > 0, `${item.id} sources`);
        assertSafeUrl(item.url, `${item.id} url`);
        assert.ok(Number.isFinite(item.rawScore), `${item.id} rawScore`);
        assert.ok(Number(item.qualityScore) >= 0 && Number(item.qualityScore) <= 100, `${item.id} qualityScore`);
        assert.ok(Number(item.score) >= 0 && Number(item.score) <= 100, `${item.id} score`);
    }
});
