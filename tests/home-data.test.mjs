import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
    buildHomeOverview,
    buildModuleRoutes,
    getTodaySection,
    renderModuleRoutes,
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
    assert.match(routeHtml, /23 items/);
    assert.match(routeHtml, /Status ok/);
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
    const overview = buildHomeOverview(manifest);
    const startItems = getTodaySection(today, "start");
    const skimItems = getTodaySection(today, "skim");
    const routes = buildModuleRoutes(manifest);

    assert.ok(overview.totalItems >= 60);
    assert.equal(overview.liveModules, 4);
    assert.equal(startItems.length, 3);
    assert.equal(skimItems.length, 6);
    assert.equal(routes.length, 4);
    assert.deepEqual(routes.map((route) => route.id), ["trends", "packages", "repos", "links"]);
});
