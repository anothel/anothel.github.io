import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { validateWatchlistGovernance } from "../scripts/watchlist-governance.mjs";
import topicTaxonomy from "../src/lib/topic-taxonomy.js";

const require = createRequire(import.meta.url);
const signalSchema = require("../js/signal-schema.js");

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
        if (source.emitted !== undefined && source.tracked !== undefined) {
            assert.ok(source.emitted <= source.tracked, `${label} source ${index} coverage must not exceed tracked`);
        }
    }
}

function assertManifestContract(manifest) {
    assertDate(manifest.updated, "manifest updated");
    assertTimestamp(manifest.generatedAt, "manifest generatedAt");
    assert.ok(Array.isArray(manifest.modules), "manifest modules");

    const ids = new Set();
    const routes = new Set();
    const dataPaths = new Set();
    for (const module of manifest.modules) {
        assertNonEmptyString(module.id, "manifest module id");
        assert.equal(ids.has(module.id), false, `duplicate manifest module id ${module.id}`);
        ids.add(module.id);

        assertNonEmptyString(module.title, `${module.id} title`);
        assertSafeUrl(module.route, `${module.id} route`);
        assert.equal(routes.has(module.route), false, `duplicate manifest route ${module.route}`);
        routes.add(module.route);

        assertSafeUrl(module.data, `${module.id} data`);
        assert.equal(dataPaths.has(module.data), false, `duplicate manifest data ${module.data}`);
        dataPaths.add(module.data);

        assert.ok(statusValues.has(module.status), `${module.id} manifest status`);
        assert.equal(typeof module.count, "number", `${module.id} manifest count`);
        assertDate(module.updated, `${module.id} updated`);
    }
}

function assertRefreshReportContract(report, manifest) {
    assertTimestamp(report.generatedAt, "refresh report generatedAt");
    assertDate(report.manifestUpdated, "refresh report manifestUpdated");
    assert.ok(statusValues.has(report.totals?.status), "refresh report status");
    assert.equal(typeof report.totals?.modules, "number", "refresh report module count");
    assert.equal(typeof report.totals?.sources, "number", "refresh report source count");
    assert.equal(typeof report.totals?.items, "number", "refresh report item count");
    assert.equal(typeof report.totals?.errors, "number", "refresh report non-ok count");
    assert.ok(Array.isArray(report.modules), "refresh report modules");

    if (manifest) {
        assert.deepEqual(
            report.modules.map((module) => module.id).sort(),
            manifest.modules.map((module) => module.id).sort(),
            "refresh report module ids align with manifest"
        );
        assert.equal(report.totals.modules, manifest.modules.length, "refresh report module total");
    }
}

function assertSignalPolicyContract(policy) {
    assert.equal(typeof policy.baselinePenalty, "number", "baseline penalty");
    assert.ok(policy.baselinePenalty <= 0, "baseline penalty should downrank");
    assert.equal(typeof policy.intentThreshold, "number", "intent threshold");
    assert.ok(policy.intentThreshold > 0, "intent threshold positive");
    assert.ok(Array.isArray(policy.baselineTitles), "baseline titles");

    const titles = new Set();
    for (const title of policy.baselineTitles) {
        assertNonEmptyString(title, "baseline title");
        assert.equal(titles.has(title), false, `${title} duplicate`);
        titles.add(title);
    }
}

test("source metadata status vocabulary stays user-facing", () => {
    assert.deepEqual([...statusValues], ["ok", "partial", "error", "fallback", "unknown"]);
});

test("manifest count and status matches module data files", () => {
    const manifest = json("data/manifest.json");

    assertManifestContract(manifest);
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

test("checked-in refresh report describes the latest data update", () => {
    const report = json("data/refresh-report.json");
    const manifest = json("data/manifest.json");

    assertRefreshReportContract(report, manifest);
    assertTimestamp(report.generatedAt, "refresh report generatedAt");
    assertDate(report.manifestUpdated, "refresh report manifestUpdated");
    assert.ok(statusValues.has(report.totals.status), "refresh report status");
    assert.equal(typeof report.totals.modules, "number", "refresh report module count");
    assert.equal(typeof report.totals.sources, "number", "refresh report source count");
    assert.equal(typeof report.totals.items, "number", "refresh report item count");
    assert.equal(typeof report.totals.errors, "number", "refresh report non-ok count");
    assert.ok(Array.isArray(report.changedModules), "refresh report changed modules");
    assert.equal(typeof report.runContext, "object", "refresh report run context");

    for (const module of report.modules) {
        assertNonEmptyString(module.id, "refresh report module id");
        assertNonEmptyString(module.title, `${module.id} title`);
        assert.ok(statusValues.has(module.status), `${module.id} status`);
        assert.equal(typeof module.changed, "boolean", `${module.id} changed`);
        assert.ok(Array.isArray(module.sources), `${module.id} sources`);
        for (const source of module.sources) {
            assert.ok(statusValues.has(source.status), `${module.id} source status`);
            assert.equal(typeof source.count, "number", `${module.id} source count`);
            assert.ok(Array.isArray(source.errors), `${module.id} source errors`);
            assert.ok(Array.isArray(source.safetyDetails), `${module.id} source safety details`);
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
    assert.ok(Array.isArray(watchlists.trends?.npmPackages), "trend npm packages");
    assert.ok(Array.isArray(watchlists.trends?.githubQueries), "trend GitHub queries");
    assert.ok(Array.isArray(watchlists.packages), "watchlist packages");
    assert.ok(Array.isArray(watchlists.repos), "watchlist repos");

    for (const packageName of watchlists.trends.npmPackages) {
        assertNonEmptyString(typeof packageName === "string" ? packageName : packageName?.name, "trend npm package");
    }

    assert.deepEqual(validateWatchlistGovernance(watchlists), []);

    for (const item of watchlists.trends.githubQueries) {
        assertNonEmptyString(item.query, "trend GitHub query");
        assertNonEmptyString(item.category, `${item.query} category`);
    }

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

test("signal policy stays editable data with stable fields", () => {
    const policy = json("data/signal-policy.json");

    assertSignalPolicyContract(policy);
    assert.equal(typeof policy.baselinePenalty, "number", "baseline penalty");
    assert.ok(policy.baselinePenalty <= 0, "baseline penalty should downrank");
    assert.equal(typeof policy.intentThreshold, "number", "intent threshold");
    assert.ok(policy.intentThreshold > 0, "intent threshold positive");
    assert.ok(Array.isArray(policy.baselineTitles), "baseline titles");

    const titles = new Set();
    for (const title of policy.baselineTitles) {
        assertNonEmptyString(title, "baseline title");
        assert.equal(titles.has(title), false, `${title} duplicate`);
        titles.add(title);
    }
});

test("data contract helpers reject focused mismatch fixtures", () => {
    const manifest = json("data/manifest.json");
    const report = json("data/refresh-report.json");
    const policy = json("data/signal-policy.json");

    assert.throws(
        () => assertManifestContract({
            ...manifest,
            modules: [manifest.modules[0], { ...manifest.modules[0] }]
        }),
        /duplicate manifest module id/
    );
    assert.throws(
        () => assertRefreshReportContract({
            ...report,
            modules: report.modules.slice(1)
        }, manifest),
        /refresh report module ids align with manifest/
    );
    assert.throws(
        () => assertSignalPolicyContract({ ...policy, baselinePenalty: 1 }),
        /baseline penalty should downrank/
    );
});

test("topic taxonomy keeps labels, slugs, aliases, and routes in one contract", async () => {
    const { trackedTopicLabels } = await import("../scripts/signal-taxonomy.mjs");
    const routeLabels = new Set(["AI agents", "MCP", "Agent skills", "AI evals", "AI engineering", "Workflow automation", "Security"]);

    assert.deepEqual(trackedTopicLabels, topicTaxonomy.trackedTopicLabels);
    assert.deepEqual(topicTaxonomy.trackedTopicLabels, [
        "AI agents",
        "Agent skills",
        "MCP",
        "AI evals",
        "AI engineering",
        "Workflow automation",
        "Security",
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
