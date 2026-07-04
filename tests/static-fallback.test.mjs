import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import {
    buildHomeOverview,
    buildModuleRoutes,
    buildTopicMovements,
    getTodaySection,
    renderModuleRoutes,
    renderSkimList,
    renderStartItems,
    renderTopicMovements
} from "../js/home.mjs";

function read(path) {
    return readFileSync(path, "utf8");
}

function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function collapseMarkup(value) {
    return String(value).replace(/\s+/g, " ").trim();
}

function json(path) {
    return JSON.parse(read(path));
}

const manifest = json("data/manifest.json");
const today = json("data/today.json");
const trends = json("data/trends.json");
const packages = json("data/packages.json");
const repos = json("data/repos.json");
const links = json("data/links.json");
const refreshReport = json("data/refresh-report.json");
const pages = [
    "index.html",
    "today/index.html",
    "explore/index.html",
    "review/index.html",
    "status/index.html",
    "trends/index.html",
    "packages/index.html",
    "repos/index.html",
    "links/index.html",
    "notes/index.html",
    "topics/ai-agents/index.html",
    "topics/mcp/index.html",
    "topics/agent-skills/index.html",
    "topics/ai-evals/index.html",
    "topics/ai-engineering/index.html",
    "topics/workflow-automation/index.html",
    "topics/security/index.html"
];
const topicPages = [
    ["topics/ai-agents/index.html", "AI agents"],
    ["topics/mcp/index.html", "MCP"],
    ["topics/agent-skills/index.html", "Agent skills"],
    ["topics/ai-evals/index.html", "AI evals"],
    ["topics/ai-engineering/index.html", "AI engineering"],
    ["topics/workflow-automation/index.html", "Workflow automation"],
    ["topics/security/index.html", "Security"]
];

function moduleTotal() {
    return manifest.modules.reduce((total, module) => total + module.count, 0);
}

function moduleHealth() {
    const counts = manifest.modules.reduce((summary, module) => {
        summary[module.status] = (summary[module.status] || 0) + 1;
        return summary;
    }, {});
    return ["ok", "partial", "error", "fallback"]
        .filter((status) => counts[status] > 0)
        .map((status) => `${counts[status]} ${status}`)
        .join(" / ");
}

function sourceHealth() {
    const sources = manifest.modules.flatMap((module) => {
        const sourceMeta = json(module.data).sourceMeta;
        return Array.isArray(sourceMeta) ? sourceMeta : [sourceMeta];
    });
    const counts = sources.reduce((summary, source) => {
        summary[source.status] = (summary[source.status] || 0) + 1;
        return summary;
    }, {});
    return ["ok", "partial", "error", "fallback"]
        .filter((status) => counts[status] > 0)
        .map((status) => `${counts[status]} ${status}`)
        .join(" / ");
}

function sourceMeta() {
    return manifest.modules.flatMap((module) => {
        const source = json(module.data).sourceMeta;
        return Array.isArray(source) ? source : [source];
    });
}

function dataHealth() {
    const context = { URL };
    vm.runInNewContext(read("js/safe-dom.js"), context);
    vm.runInNewContext(read("js/data-health.js"), context);
    return context.DataHealth;
}

function todayStatusText() {
    const total = today.sections.reduce((sum, section) => sum + section.items.length, 0);
    const status = today.sourceMeta?.status || "ok";

    if (status === "fallback") return `${total} generated picks. Source health fallback. Previous data remains available; retry data refresh.`;
    if (status === "partial") return `${total} generated picks. Source health partial. Usable data remains available; retry data refresh for missing sources.`;
    if (status === "error") return `${total} generated picks from failed source refresh. Retry data refresh before trusting freshness.`;
    return `${total} generated picks. Source health ok. Data date ${today.updated}. No recovery needed.`;
}

function dataModeText() {
    const health = moduleHealth();
    if (health.includes("partial")) return "Source health partial. Usable data remains available; retry data refresh for missing sources.";
    if (health.includes("fallback")) return "Source health fallback. Previous data remains available; retry data refresh.";
    return `Source health ok. Data date ${manifest.updated}. No recovery needed.`;
}

function topicApp() {
    const context = { console, URL };
    vm.runInNewContext(read("js/safe-dom.js"), context);
    vm.runInNewContext(read("js/topic-taxonomy.js"), context);
    vm.runInNewContext(read("js/topics.js"), context);
    return context.TopicApp;
}

function topicSummary(topic) {
    const app = topicApp();
    const sources = {
        trends: json("data/trends.json"),
        packages: json("data/packages.json"),
        repos: json("data/repos.json"),
        links: json("data/links.json")
    };
    return app.topicSummary(app.topicItems(sources, topic));
}

test("home static fallback matches current manifest summary", () => {
    const home = read("index.html");
    const overview = buildHomeOverview(manifest, { today: refreshReport.generatedAt || manifest.generatedAt });

    assert.match(home, new RegExp(`<strong data-home-total>${moduleTotal()}</strong>`));
    assert.match(home, new RegExp(`<strong data-home-live>${moduleHealth()}</strong>`));
    assert.match(home, new RegExp(`<strong data-home-updated>${manifest.updated}</strong>`));
    assert.match(home, new RegExp(`<strong data-home-freshness>${overview.dataState}</strong>`));
    assert.match(home, new RegExp(`<p class="review-summary-note" data-home-recovery>${dataModeText().replaceAll(".", "\\.")}</p>`));
    for (const route of buildModuleRoutes(manifest)) {
        assert.match(home, new RegExp(`href="${escapeRegExp(route.route)}"`), route.id);
        assert.match(home, new RegExp(`<small>${route.count} items / ${route.updated} / Status ${route.status}</small>`), route.id);
    }
    assert.match(
        collapseMarkup(home),
        new RegExp(escapeRegExp(collapseMarkup(renderStartItems(getTodaySection(today, "start")))))
    );
    assert.match(
        collapseMarkup(home),
        new RegExp(escapeRegExp(collapseMarkup(renderSkimList(getTodaySection(today, "skim")))))
    );
    assert.match(
        collapseMarkup(home),
        new RegExp(escapeRegExp(collapseMarkup(renderModuleRoutes(buildModuleRoutes(manifest)))))
    );
    assert.match(
        collapseMarkup(home),
        new RegExp(escapeRegExp(collapseMarkup(renderTopicMovements(buildTopicMovements({ trends, packages, repos, links })))))
    );
    assert.match(home, /A personal radar for AI engineering signals/);
    assert.doesNotMatch(home, /Static fallback|fetch is available|local file fetch is blocked/);
});

test("today static fallback matches current generated brief", () => {
    const html = read("today/index.html");

    assert.match(html, new RegExp(`<span data-today-updated>${today.updated}</span>`));
    assert.match(html, new RegExp(todayStatusText().replaceAll(".", "\\.")));
    assert.match(html, /<strong>anthropics\/skills<\/strong>/);
    assert.match(html, /<strong>Next action<\/strong>/);
    assert.match(html, /href="..\/review\/index\.html"/);
    assert.match(html, /Review later/);
});

test("status static fallback matches current manifest summary", () => {
    const html = read("status/index.html");

    assert.match(html, new RegExp(`<strong data-status-total>${moduleTotal()}</strong>`));
    assert.match(html, new RegExp(`<strong data-status-health>${sourceHealth()}</strong>`));
    assert.match(html, new RegExp(`<strong data-status-updated>${manifest.updated}</strong>`));
    assert.match(html, new RegExp(`<strong data-status-fallback-generated>${escapeRegExp(refreshReport.generatedAt)}</strong>`));
    assert.match(html, new RegExp(dataModeText().replaceAll(".", "\\.")));
    assert.match(html, new RegExp(`<strong>${refreshReport.generatedAt}</strong>`));
    if (refreshReport.totals.status === "ok") {
        assert.match(html, /No failed, partial, or fallback sources\./);
    } else {
        assert.match(html, /<span>Attention<\/span>/);
        assert.match(html, /\d+ source/);
    }
    assert.match(html, /<small>(Fresh|Aging|Stale|Partial|Fallback|Error|Unknown) - /);
});

test("home today explore and status fallbacks use one source health truth", () => {
    assert.match(read("index.html"), new RegExp(`<strong data-home-live>${moduleHealth()}</strong>`));
    assert.match(read("today/index.html"), new RegExp(todayStatusText().replaceAll(".", "\\.")));
    assert.match(read("status/index.html"), new RegExp(`<strong data-status-health>${sourceHealth()}</strong>`));
    assert.match(read("explore/index.html"), new RegExp(`<p data-data-mode>${dataModeText().replaceAll(".", "\\.")}</p>`));
});

test("home today status and explore freshness dates follow manifest and refresh report", () => {
    assert.equal(today.updated, manifest.updated);
    assert.equal(refreshReport.manifestUpdated, manifest.updated);
    assert.match(read("index.html"), new RegExp(`<p class="stamp">Data date ${manifest.updated}</p>`));
    assert.match(read("today/index.html"), new RegExp(`<span data-today-updated>${manifest.updated}</span>`));
    assert.match(read("status/index.html"), new RegExp(`<strong data-status-updated>${manifest.updated}</strong>`));
    assert.match(read("status/index.html"), new RegExp(`<strong data-status-fallback-generated>${escapeRegExp(refreshReport.generatedAt)}</strong>`));
    assert.match(read("status/index.html"), new RegExp(`<strong>${escapeRegExp(refreshReport.generatedAt)}</strong>`));
    assert.match(read("explore/index.html"), new RegExp(`updated ${manifest.updated}`));
});

test("explore source cards use refresh report time for freshness detail", () => {
    const html = read("explore/index.html");
    const DataHealth = dataHealth();

    for (const source of sourceMeta()) {
        const detail = escapeHtml(DataHealth.sourceDetail(source, refreshReport.generatedAt));
        assert.match(html, new RegExp(detail.replaceAll("/", "\\/")));
    }
});

test("explore static fallback carries the same score explanation as dynamic cards", () => {
    const html = read("explore/index.html");

    assert.match(html, /<ul class="score-reasons" aria-label="Score reasons">/);
    assert.match(html, /<span class="quality-marker" aria-label="Signal fit score \d+">Signal fit \d+<\/span>/);
    assert.match(html, /<p class="source-context">/);
});

test("module page stamps stay aligned with checked-in manifest", () => {
    for (const module of manifest.modules) {
        const html = read(module.route);
        assert.match(html, new RegExp(`<span data-updated>${module.updated}</span>`), module.route);
    }
});

test("module pages keep top source rows without JavaScript", () => {
    for (const module of manifest.modules) {
        const dataset = json(module.data);
        const total = dataset.items?.length || dataset.packages?.length || dataset.repos?.length || dataset.links?.length || 0;
        if (total === 0) continue;

        const html = read(module.route);
        const hrefCount = (html.match(/href="https?:\/\//g) || []).length;

        assert.ok(hrefCount >= 3, `${module.route} should keep at least 3 static item links`);
    }
});

test("checked-in external item links carry rel protection", () => {
    for (const path of pages) {
        const html = read(path);
        const links = html.match(/<a\b[^>]*href="https?:\/\/[^"]+"[^>]*>/g) || [];

        for (const link of links) {
            assert.match(link, /\brel="[^"]*\bnoopener\b[^"]*\bnoreferrer\b[^"]*"/, `${path}: ${link}`);
        }
    }
});

test("topic pages keep checked-in judgment notes without JavaScript", () => {
    const expectations = [
        ["topics/ai-agents/index.html", /agent workflow/i],
        ["topics/mcp/index.html", /protocol layer/i],
        ["topics/agent-skills/index.html", /reusable instructions/i],
        ["topics/ai-evals/index.html", /measurement/i],
        ["topics/ai-engineering/index.html", /implementation/i],
        ["topics/workflow-automation/index.html", /durable workflows/i],
        ["topics/security/index.html", /trust boundary/i]
    ];

    for (const [path, pattern] of expectations) {
        const html = read(path);
        assert.match(html, /data-topic-note/, path);
        assert.match(html, pattern, path);
        assert.match(html, /Supporting signals/i, path);
        assert.match(html, /href="..\/..\/notes\/index\.html"/, path);
        assert.match(html, /Open Notes/, path);
    }
});

test("notes index keeps checked-in topic notes without JavaScript", () => {
    const html = read("notes/index.html");

    assert.match(html, /data-notes-list/);
    assert.match(html, /Measurement decides which AI changes are safe to keep\./);
    assert.match(html, /Implementation details make AI systems easier to judge\./);
    assert.match(html, /Durable workflows matter when agents need repeatable execution\./);
    assert.match(html, /Security signals decide where automation needs stronger guardrails\./);
    assert.match(html, /href="..\/topics\/ai-evals\/index\.html"/);
    assert.match(html, /href="..\/topics\/ai-engineering\/index\.html"/);
    assert.match(html, /href="..\/topics\/workflow-automation\/index\.html"/);
    assert.match(html, /href="..\/topics\/security\/index\.html"/);
});

test("topic page static fallback summaries match current topic data", () => {
    for (const [path, topic] of topicPages) {
        const html = read(path);
        const summary = topicSummary(topic);

        assert.match(html, new RegExp(`<strong data-topic-total>${summary.total}</strong>`), path);
        assert.match(html, new RegExp(`<strong data-topic-modules>${summary.modules}</strong>`), path);
        assert.match(html, new RegExp(`<strong data-topic-updated>${summary.updated}</strong>`), path);
    }
});

test("topic page fallbacks render current topic sections instead of placeholder cards", () => {
    for (const [path] of topicPages) {
        const html = read(path);

        assert.doesNotMatch(html, /Current data fills this card|Topic fallback|Tracked topic/, path);
        assert.match(html, /Signal fit|No focused items yet/, path);
    }
});

test("checked-in fallback copy avoids stale internal implementation language", () => {
    for (const path of pages) {
        const html = read(path);
        assert.doesNotMatch(html, /2026-06-14|2026-06-15|2026-06-19/, path);
        assert.doesNotMatch(html, /Static fallback|fetch is available|checked-in JSON|checked-in data/i, path);
        assert.doesNotMatch(html, /Data date is current/, path);
    }
});
