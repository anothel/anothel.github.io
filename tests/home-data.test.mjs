import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
    buildHomeOverview,
    buildSavedSummary,
    buildModuleRoutes,
    getTodaySection,
    renderSavedSummary,
    renderModuleRoutes,
    buildTopicMovements,
    renderTopicMovements,
    renderDecisionActions,
    renderSkimList,
    renderStartItems
} from "../js/home.js";

function readJson(path) {
    return JSON.parse(readFileSync(path, "utf8"));
}

test("buildHomeOverview summarizes manifest modules", () => {
    const overview = buildHomeOverview({
        modules: [
            { status: "ok", count: 11, updated: "2026-06-14" },
            { status: "partial", count: 8, updated: "2026-06-13" },
            { status: "ok", count: 6, updated: "2026-06-14" }
        ]
    });

    assert.deepEqual(overview, {
        totalItems: 25,
        liveModules: 2,
        partialModules: 1,
        errorModules: 0,
        totalModules: 3,
        updated: "2026-06-14",
        healthLabel: "2 ok / 1 partial"
    });
});

test("getTodaySection returns matching section items", () => {
    const today = {
        sections: [
            { id: "start", items: [{ title: "First" }] },
            { id: "skim", items: [{ title: "Second" }] }
        ]
    };

    assert.deepEqual(getTodaySection(today, "start"), [{ title: "First" }]);
    assert.deepEqual(getTodaySection(today, "skim"), [{ title: "Second" }]);
    assert.deepEqual(getTodaySection(today, "missing"), []);
    assert.deepEqual(getTodaySection({}, "start"), []);
});

test("buildModuleRoutes maps manifest modules into route cards", () => {
    const routes = buildModuleRoutes({
        modules: [
            {
                id: "trends",
                title: "Tech trends",
                route: "trends/index.html",
                source: "Hacker News, GitHub, npm",
                count: 23,
                updated: "2026-06-15",
                status: "ok"
            }
        ]
    });

    assert.deepEqual(routes, [
        {
            id: "explore",
            title: "Explore workspace",
            route: "explore/index.html",
            source: "All tracked signals",
            count: 23,
            updated: "2026-06-15",
            status: "ok",
            purpose: "Search and save across sources"
        },
        {
            id: "status",
            title: "Source status",
            route: "status/index.html",
            source: "All source metadata",
            count: 23,
            updated: "2026-06-15",
            status: "ok",
            purpose: "Refresh health across sources"
        },
        {
            id: "trends",
            title: "Tech trends",
            route: "trends/index.html",
            source: "Hacker News, GitHub, npm",
            count: 23,
            updated: "2026-06-15",
            status: "ok",
            purpose: "Cross-source movement"
        }
    ]);
});

test("buildSavedSummary reads v1 and v2 saved payloads", () => {
    assert.deepEqual(buildSavedSummary(JSON.stringify(["repos:a", "packages:b"])), {
        saved: 2,
        unread: 2
    });
    assert.deepEqual(buildSavedSummary(JSON.stringify({
        version: 2,
        items: [
            { id: "repos:a", status: "unread" },
            { id: "packages:b", status: "read" },
            { id: "links:c", status: "done" }
        ]
    })), {
        saved: 3,
        unread: 1
    });
    assert.deepEqual(buildSavedSummary("broken"), { saved: 0, unread: 0 });
});

test("renderSavedSummary emits review workflow summary", () => {
    const html = renderSavedSummary({ saved: 5, unread: 2 });

    assert.match(html, /Saved items/);
    assert.match(html, /5/);
    assert.match(html, /Unread/);
    assert.match(html, /2/);
    assert.match(html, /href="review\/index\.html"/);
});

test("renderSavedSummary escapes text through numeric coercion", () => {
    const html = renderSavedSummary({ saved: "<script>", unread: "bad" });

    assert.match(html, />0</);
    assert.doesNotMatch(html, /script/);
});

test("buildTopicMovements ranks recurring topic movement across checked-in data", () => {
    const movements = buildTopicMovements({
        trends: {
            updated: "2026-06-20",
            items: [
                { title: "OpenAI Codex", source: "GitHub", category: "AI agents", score: 96, velocity: "92K stars", url: "https://example.com/codex", summary: "coding agent" },
                { title: "Zero-Touch OAuth for MCP", source: "HN", category: "MCP", score: 80, velocity: "263 points", url: "https://example.com/mcp", summary: "MCP auth" }
            ]
        },
        packages: {
            updated: "2026-06-19",
            packages: [
                { name: "mastra", category: "AI agents", focus: "TypeScript agent framework", downloads: 440000, downloadsLabel: "440K/week", url: "https://example.com/mastra" },
                { name: "evalite", category: "AI evals", focus: "LLM evaluation toolkit", downloads: 270000, downloadsLabel: "270K/week", url: "https://example.com/evalite" }
            ]
        },
        repos: {
            updated: "2026-06-19",
            repos: [
                { name: "mattpocock/skills", category: "Agent skills", focus: "engineering workflow skills", stars: 136000, starsLabel: "136K", url: "https://example.com/skills", summary: "skills" }
            ]
        },
        links: {
            updated: "2026-06-19",
            links: [
                { title: "Agents SDK", category: "AI agents", kind: "Docs", rank: 1, url: "https://example.com/agents", summary: "agent docs" }
            ]
        }
    }, 3);

    assert.deepEqual(JSON.parse(JSON.stringify(movements.map((item) => [item.topic, item.count, item.modules, item.route]))), [
        ["AI agents", 3, 3, "topics/ai-agents/index.html"],
        ["Agent skills", 1, 1, "topics/agent-skills/index.html"],
        ["MCP", 1, 1, "topics/mcp/index.html"]
    ]);
    assert.equal(movements[0].topItem.title, "OpenAI Codex");
    assert.equal(movements[0].updated, "2026-06-20");
});

test("home decision renderers emit safe action and topic markup", () => {
    const movements = [
        {
            topic: "AI agents",
            count: 3,
            modules: 2,
            route: "topics/ai-agents/index.html",
            exploreRoute: "explore/index.html?focus=AI%20agents",
            updated: "2026-06-20",
            topItem: {
                title: "OpenAI \"Codex\"",
                module: "Repos",
                metric: "92K stars",
                url: "https://example.com/codex"
            }
        },
        {
            topic: "<script>",
            count: 1,
            modules: 1,
            route: "javascript:alert(1)",
            exploreRoute: "javascript:alert(1)",
            updated: "2026-06-19",
            topItem: {
                title: "<bad>",
                module: "Links",
                metric: "Docs",
                url: "javascript:alert(1)"
            }
        }
    ];
    const actions = renderDecisionActions({ startCount: 3, saved: 4, unread: 2, topTopic: movements[0] });
    const topics = renderTopicMovements(movements);

    assert.match(actions, /Open first/);
    assert.match(actions, /3 priority picks/);
    assert.match(actions, /Browse topic movement/);
    assert.match(actions, /AI agents/);
    assert.match(actions, /Review saved/);
    assert.match(actions, /2 unread/);
    assert.match(topics, /href="topics\/ai-agents\/index\.html"/);
    assert.match(topics, /OpenAI &quot;Codex&quot;/);
    assert.match(topics, /3 signals \/ 2 modules/);
    assert.match(topics, /href="#"/);
    assert.doesNotMatch(`${actions}${topics}`, /javascript:alert/);
    assert.doesNotMatch(`${actions}${topics}`, /<script>/);
});

test("home renderers emit command center markup", () => {
    const items = [
        {
            title: "Iroh 1.0",
            module: "Trends",
            origin: "Hacker News",
            category: "Developer tools",
            metric: "100 score",
            reason: "267 comments / 852 points",
            url: "https://example.test/iroh"
        }
    ];
    const routes = [
        {
            id: "trends",
            title: "Tech trends",
            route: "trends/index.html",
            source: "Hacker News, GitHub, npm",
            count: 23,
            updated: "2026-06-15",
            status: "ok",
            purpose: "Cross-source movement"
        }
    ];

    const startHtml = renderStartItems(items);
    const skimHtml = renderSkimList(items);
    const routeHtml = renderModuleRoutes(routes);

    assert.match(startHtml, /class="start-item"/);
    assert.match(startHtml, /href="https:\/\/example\.test\/iroh"/);
    assert.match(startHtml, /Iroh 1\.0/);
    assert.match(startHtml, /100 score/);
    assert.match(startHtml, /267 comments/);
    assert.match(skimHtml, /class="skim-item"/);
    assert.match(skimHtml, /href="https:\/\/example\.test\/iroh"/);
    assert.match(skimHtml, /Iroh 1\.0/);
    assert.match(skimHtml, /Trends \/ 100 score/);
    assert.match(routeHtml, /class="module-route status-ok"/);
    assert.match(routeHtml, /href="trends\/index\.html"/);
    assert.match(routeHtml, /href="explore\/index\.html"/);
    assert.match(routeHtml, /href="status\/index\.html"/);
    assert.match(routeHtml, /Search and save across sources/);
    assert.match(routeHtml, /Refresh health across sources/);
    assert.match(routeHtml, /23 items/);
    assert.match(routeHtml, /Status ok/);
    assert.ok(routeHtml.indexOf("explore/index.html") < routeHtml.indexOf("trends/index.html"));
    assert.ok(routeHtml.indexOf("status/index.html") < routeHtml.indexOf("trends/index.html"));
});

test("home renderers escape text and block unsafe hrefs", () => {
    const unsafeItems = [
        {
            title: "<script>alert(\"x\")</script>",
            module: "Trends",
            origin: "Hacker News",
            category: "Developer tools",
            metric: "100 score",
            reason: "bad \"quote\"",
            url: "javascript:alert(1)"
        }
    ];
    const unsafeRoutes = [
        {
            id: "trends",
            title: "Tech trends",
            route: "javascript:alert(1)",
            source: "Hacker News, GitHub, npm",
            count: 23,
            updated: "2026-06-15",
            status: "ok",
            purpose: "Cross-source movement"
        }
    ];

    const startHtml = renderStartItems(unsafeItems);
    const skimHtml = renderSkimList(unsafeItems);
    const routeHtml = renderModuleRoutes(unsafeRoutes);

    assert.match(startHtml, /href="#"/);
    assert.match(skimHtml, /href="#"/);
    assert.match(routeHtml, /href="#"/);
    assert.doesNotMatch(`${startHtml}${skimHtml}${routeHtml}`, /javascript:alert/);
    assert.match(startHtml, /&lt;script&gt;alert\(&quot;x&quot;\)&lt;\/script&gt;/);
    assert.match(startHtml, /bad &quot;quote&quot;/);
});

test("checked-in data powers the home command center", () => {
    const manifest = readJson("data/manifest.json");
    const today = readJson("data/today.json");
    const trends = readJson("data/trends.json");
    const packages = readJson("data/packages.json");
    const repos = readJson("data/repos.json");
    const links = readJson("data/links.json");
    const overview = buildHomeOverview(manifest);
    const startItems = getTodaySection(today, "start");
    const skimItems = getTodaySection(today, "skim");
    const routes = buildModuleRoutes(manifest);
    const movements = buildTopicMovements({ trends, packages, repos, links }, 4);

    assert.ok(overview.totalItems >= 60);
    assert.equal(overview.liveModules, 4);
    assert.equal(startItems.length, 3);
    assert.equal(skimItems.length, 6);
    assert.equal(routes.length, 6);
    assert.ok(movements.length >= 3);
    assert.equal(movements[0].topic, "AI agents");
    assert.deepEqual(routes.map((route) => route.id), ["explore", "status", "trends", "packages", "repos", "links"]);
});
