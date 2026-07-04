import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const signalPolicy = JSON.parse(readFileSync("data/signal-policy.json", "utf8"));

function loadExplore(extra = {}) {
    const context = { console, Date, URL, ...extra };
    vm.runInNewContext(readFileSync("js/local-state.js", "utf8"), context);
    vm.runInNewContext(readFileSync("js/safe-dom.js", "utf8"), context);
    vm.runInNewContext(readFileSync("js/data-health.js", "utf8"), context);
    vm.runInNewContext(readFileSync("js/signal-schema.js", "utf8"), context);
    vm.runInNewContext(readFileSync("js/topic-taxonomy.js", "utf8"), context);
    vm.runInNewContext(readFileSync("js/explore.js", "utf8"), context);
    return context.ExploreApp;
}

test("Explore normalizes trends, packages, repos, and links into one item shape", () => {
    const app = loadExplore();
    const items = app.normalizeExploreData({
        trends: {
            updated: "2026-06-18",
            sourceMeta: [{ name: "GitHub", status: "ok", count: 1 }],
            items: [{
                rank: 1,
                title: "Agent trend",
                source: "GitHub",
                category: "AI",
                score: 98,
                velocity: "+12%",
                url: "https://example.com/trend",
                summary: "Trend summary"
            }]
        },
        packages: {
            updated: "2026-06-19",
            sourceMeta: { name: "npm", status: "ok", count: 1 },
            packages: [{
                rank: 1,
                name: "ai",
                category: "AI SDK",
                focus: "Vercel AI SDK",
                downloads: 15000000,
                downloadsLabel: "15M/week",
                url: "https://example.com/package"
            }]
        },
        repos: {
            updated: "2026-06-18",
            sourceMeta: { name: "GitHub", status: "ok", count: 1 },
            repos: [{
                rank: 1,
                name: "openai/codex",
                category: "AI agents",
                focus: "terminal coding agent",
                stars: 92000,
                starsLabel: "92K",
                url: "https://example.com/repo",
                summary: "Repo summary"
            }]
        },
        links: {
            updated: "2026-06-18",
            sourceMeta: { name: "manual", status: "ok", count: 1 },
            links: [{
                rank: 1,
                title: "Agent Skills standard",
                category: "Agent skills",
                kind: "Spec",
                url: "https://example.com/link",
                summary: "Link summary"
            }]
        }
    });

    assert.equal(items.length, 4);
    assert.deepEqual(JSON.parse(JSON.stringify(items.map((item) => [item.module, item.title, item.category, item.origin, item.metric, item.scoreReasons.length]))), [
        ["Trends", "Agent trend", "AI", "GitHub", "+12%", 2],
        ["Packages", "ai", "AI SDK", "npm", "15M/week", 3],
        ["Repos", "openai/codex", "AI agents", "GitHub", "92K stars", 3],
        ["Links", "Agent Skills standard", "Agent skills", "Spec", "Spec", 3]
    ]);
    assert.equal(items[0].id, "url:https://example.com/trend");
    assert.ok(items[0].legacyIds.includes("trends:https://example.com/trend"));
    assert.equal(items[1].updated, "2026-06-19");
    assert.deepEqual(JSON.parse(JSON.stringify(items.map((item) => item.schemaVersion))), [2, 2, 2, 2]);
    assert.deepEqual(JSON.parse(JSON.stringify(items.map((item) => item.sourceModule))), ["trends", "packages", "repos", "links"]);
    assert.deepEqual(JSON.parse(JSON.stringify(items.map((item) => item.sourceKind))), ["trend", "package", "repo", "reference"]);
    assert.ok(items.every((item) => item.canonicalKey && Array.isArray(item.sources)));
});

test("Explore filters and sorts items with saved-first support", () => {
    const app = loadExplore();
    const items = [
        { id: "repos:a", module: "Repos", title: "Agent repo", category: "AI", origin: "GitHub", summary: "coding agent", score: 90 },
        { id: "packages:b", module: "Packages", title: "Runtime package", category: "Runtime", origin: "npm", summary: "node runtime", score: 95 },
        { id: "links:c", module: "Links", title: "Agent docs", category: "AI", origin: "Docs", summary: "reference", score: 20 }
    ];

    assert.deepEqual(
        JSON.parse(JSON.stringify(app.filterExploreItems(items, { module: "Repos", category: "AI", query: "agent" }, new Set()).map((item) => item.id))),
        ["repos:a"]
    );

    assert.deepEqual(
        JSON.parse(JSON.stringify(app.filterExploreItems(items, { module: "all", category: "all", query: "", focus: "AI agents" }, new Set()).map((item) => item.id))),
        ["repos:a"]
    );
    assert.deepEqual(
        JSON.parse(JSON.stringify(app.filterExploreItems(items, { module: "all", category: "all", query: "", focus: "Packages" }, new Set()).map((item) => item.id))),
        ["packages:b"]
    );

    assert.deepEqual(
        JSON.parse(JSON.stringify(app.sortExploreItems(items, "saved", new Set(["links:c"])).map((item) => item.id))),
        ["links:c", "packages:b", "repos:a"]
    );
});

test("Explore normalizes quality scores so broad baseline packages do not dominate AI agent signals", () => {
    const app = loadExplore();
    const items = app.normalizeExploreData({
        trends: { updated: "2026-06-18", sourceMeta: [], items: [] },
        packages: {
            updated: "2026-06-19",
            sourceMeta: { name: "npm", status: "ok", count: 2 },
            packages: [
                {
                    rank: 1,
                    name: "typescript",
                    category: "Language",
                    focus: "typed JavaScript",
                    downloads: 250000000,
                    downloadsLabel: "250M/week",
                    url: "https://www.npmjs.com/package/typescript"
                },
                {
                    rank: 2,
                    name: "ai",
                    category: "AI SDK",
                    focus: "Vercel AI SDK for agent workflows",
                    downloads: 15000000,
                    downloadsLabel: "15M/week",
                    url: "https://www.npmjs.com/package/ai"
                }
            ]
        },
        repos: {
            updated: "2026-06-18",
            sourceMeta: { name: "GitHub", status: "ok", count: 1 },
            repos: [
                {
                    rank: 1,
                    name: "openai/codex",
                    category: "AI agents",
                    focus: "terminal coding agent",
                    stars: 92000,
                    starsLabel: "92K",
                    url: "https://github.com/openai/codex",
                    summary: "Lightweight coding agent."
                }
            ]
        },
        links: { updated: "2026-06-18", sourceMeta: { name: "manual", status: "ok", count: 0 }, links: [] }
    });

    const sorted = app.sortExploreItems(items, "priority", new Set());
    const byTitle = Object.fromEntries(items.map((item) => [item.title, item]));

    assert.equal(sorted[0].title, "openai/codex");
    assert.ok(byTitle.typescript.qualityScore <= 78);
    assert.ok(byTitle.ai.qualityScore > byTitle.typescript.qualityScore);
    assert.equal(byTitle.typescript.rawScore, 250000000);
});

test("Explore baseline scoring uses checked-in signal policy", () => {
    const app = loadExplore();
    const items = app.normalizeExploreData({
        trends: { updated: "2026-06-18", sourceMeta: [], items: [] },
        packages: {
            updated: "2026-06-19",
            sourceMeta: { name: "npm", status: "ok", count: 2 },
            packages: [
                {
                    rank: 1,
                    name: "next.js",
                    category: "Framework",
                    focus: "frontend runtime",
                    downloads: 250000000,
                    downloadsLabel: "250M/week",
                    url: "https://www.npmjs.com/package/next"
                },
                {
                    rank: 2,
                    name: "mastra",
                    category: "AI agents",
                    focus: "agent workflow framework",
                    downloads: 500000,
                    downloadsLabel: "500K/week",
                    url: "https://www.npmjs.com/package/mastra"
                }
            ]
        },
        repos: { updated: "2026-06-18", sourceMeta: { name: "GitHub", status: "ok", count: 0 }, repos: [] },
        links: { updated: "2026-06-18", sourceMeta: { name: "manual", status: "ok", count: 0 }, links: [] }
    }, { signalPolicy });
    const byTitle = Object.fromEntries(items.map((item) => [item.title, item]));

    assert.ok(signalPolicy.baselineTitles.includes("next.js"));
    assert.ok(byTitle["next.js"].qualityScore <= 76);
    assert.ok(byTitle.mastra.qualityScore > byTitle["next.js"].qualityScore);
});

test("Explore uses canonical URL ids and still recognizes legacy saved ids", () => {
    const app = loadExplore();
    const items = app.normalizeExploreData({
        trends: { updated: "2026-06-18", sourceMeta: [], items: [] },
        packages: { updated: "2026-06-19", sourceMeta: { name: "npm", status: "ok", count: 0 }, packages: [] },
        repos: {
            updated: "2026-06-18",
            sourceMeta: { name: "GitHub", status: "ok", count: 1 },
            repos: [{
                rank: 1,
                name: "owner/repo",
                category: "AI agents",
                focus: "agent workflow",
                stars: 1000,
                starsLabel: "1K",
                url: "https://github.com/Owner/Repo.git?tab=readme#intro",
                summary: "Agent workflow."
            }]
        },
        links: {
            updated: "2026-06-18",
            sourceMeta: { name: "manual", status: "ok", count: 1 },
            links: [{
                rank: 1,
                title: "owner/repo docs",
                category: "AI agents",
                kind: "Docs",
                url: "https://github.com/owner/repo/",
                summary: "Same repo reference."
            }]
        }
    });
    const item = items[0];
    const legacyId = "repos:https://github.com/Owner/Repo.git?tab=readme#intro";

    assert.equal(items.length, 1);
    assert.equal(item.id, "url:https://github.com/owner/repo");
    assert.ok(item.legacyIds.includes(legacyId));
    assert.deepEqual([...app.filterSavedIds(items, new Set([legacyId, "missing:id"]))], [legacyId]);
    assert.match(app.renderExploreCards(items, new Set([legacyId])), /aria-pressed="true"/);
    assert.match(app.renderSavedQueue(items, new Set([legacyId])), /owner\/repo docs|owner\/repo/);
});

test("Explore caps broad npm trend items before priority sorting", () => {
    const app = loadExplore();
    const items = app.normalizeExploreData({
        trends: {
            updated: "2026-06-18",
            sourceMeta: [],
            items: [
                {
                    rank: 1,
                    title: "typescript",
                    source: "npm",
                    category: "JavaScript",
                    score: 100,
                    velocity: "250M/week",
                    url: "https://www.npmjs.com/package/typescript",
                    summary: "Broad package movement."
                },
                {
                    rank: 2,
                    title: "openai/codex",
                    source: "GitHub",
                    category: "AI agents",
                    score: 90,
                    velocity: "92K stars",
                    url: "https://github.com/openai/codex",
                    summary: "Terminal coding agent."
                }
            ]
        },
        packages: { updated: "2026-06-19", sourceMeta: { name: "npm", status: "ok", count: 0 }, packages: [] },
        repos: { updated: "2026-06-18", sourceMeta: { name: "GitHub", status: "ok", count: 0 }, repos: [] },
        links: { updated: "2026-06-18", sourceMeta: { name: "manual", status: "ok", count: 0 }, links: [] }
    });

    const sorted = app.sortExploreItems(items, "priority", new Set());
    const byTitle = Object.fromEntries(items.map((item) => [item.title, item]));

    assert.equal(sorted[0].title, "openai/codex");
    assert.ok(byTitle.typescript.qualityScore <= 78);
});

test("Explore merges duplicate URLs and preserves source context", () => {
    const app = loadExplore();
    const items = app.normalizeExploreData({
        trends: { updated: "2026-06-18", sourceMeta: [], items: [] },
        packages: { updated: "2026-06-19", sourceMeta: { name: "npm", status: "ok", count: 0 }, packages: [] },
        repos: {
            updated: "2026-06-18",
            sourceMeta: { name: "GitHub", status: "ok", count: 1 },
            repos: [
                {
                    rank: 1,
                    name: "mattpocock/skills",
                    category: "Agent skills",
                    focus: "engineering workflow skills",
                    stars: 135000,
                    starsLabel: "135K",
                    url: "https://github.com/mattpocock/skills",
                    summary: "Skills for real engineers."
                }
            ]
        },
        links: {
            updated: "2026-06-18",
            sourceMeta: { name: "manual", status: "ok", count: 1 },
            links: [
                {
                    rank: 1,
                    title: "mattpocock/skills",
                    category: "Agent skills",
                    kind: "Repo",
                    url: "https://github.com/mattpocock/skills",
                    summary: "Practical engineering skills for agent work."
                }
            ]
        }
    });

    assert.equal(items.length, 1);
    assert.deepEqual(JSON.parse(JSON.stringify(items[0].sources)), ["Repos", "Links"]);
    assert.equal(items[0].id, "url:https://github.com/mattpocock/skills");
    assert.ok(items[0].legacyIds.includes("repos:https://github.com/mattpocock/skills"));
    assert.match(items[0].sourceContext, /Also in Links/);
});

test("Explore renders merged source context in cards and saved queue", () => {
    const app = loadExplore();
    const item = {
        id: "repos:https://example.com/skills",
        module: "Repos",
        title: "Skills repo",
        category: "Agent skills",
        origin: "GitHub",
        metric: "135K stars",
        summary: "Reusable \"skills\".",
        url: "https://example.com/skills",
        updated: "2026-06-18",
        sources: ["Repos", "Links"],
        sourceContext: "Also in Links",
        scoreReasons: ["135K stars from GitHub", "Reusable <skills>.", "Signal fit 96/100"],
        score: 96,
        qualityScore: 96
    };

    const cards = app.renderExploreCards([item], new Set([item.id]));
    const saved = app.renderSavedQueue([item], new Set([item.id]));

    assert.match(cards, /Also in Links/);
    assert.match(saved, /Also in Links/);
    assert.match(cards, /Reusable &quot;skills&quot;\./);
    assert.match(cards, /Why this matters/);
    assert.match(cards, /Score reasons/);
    assert.match(cards, /Reusable &lt;skills&gt;\./);
    assert.doesNotMatch(cards, /Reusable <skills>\./);
    assert.match(cards, /tabindex="0"/);
    assert.match(cards, /data-card-href="https:\/\/example\.com\/skills"/);
    assert.match(cards, /aria-label="Open Skills repo"/);
    assert.doesNotMatch(cards, /Open item/);
    assert.match(cards, /aria-label="Signal fit score 96"/);
    assert.match(cards, /aria-label="Saved Skills repo for Review"/);
    assert.match(saved, /aria-label="Remove Skills repo from saved queue"/);
    assert.match(cards, /Signal fit 96/);
    assert.match(cards, /class="quality-marker"/);
});

test("Explore summarizes active saved workflow state", () => {
    const app = loadExplore();

    assert.equal(
        app.activeExploreSummary({ module: "all", category: "all", query: "", sort: "priority" }, 0),
        "Showing all tracked items."
    );
    assert.equal(
        app.activeExploreSummary({ module: "Repos", category: "AI agents", focus: "MCP", query: "codex", sort: "saved" }, 2),
        "Focus: MCP / Module: Repos / Category: AI agents / Search: codex / Sort: saved first"
    );
});

test("Explore ignores stale saved ids when current data is known", () => {
    const app = loadExplore();
    const items = [
        { id: "repos:current", module: "Repos", title: "Current", category: "AI", origin: "GitHub", summary: "current", score: 90 }
    ];
    const savedIds = new Set(["repos:current", "repos:stale"]);

    assert.deepEqual([...app.filterSavedIds(items, savedIds)], ["repos:current"]);
});

test("Explore clear behavior preserves saved-first sort only", () => {
    const app = loadExplore();

    assert.deepEqual(JSON.parse(JSON.stringify(app.clearedExploreState({
        module: "Repos",
        category: "AI",
        focus: "MCP",
        query: "codex",
        sort: "saved"
    }))), {
        module: "all",
        category: "all",
        focus: "all",
        query: "",
        sort: "saved"
    });

    assert.deepEqual(JSON.parse(JSON.stringify(app.clearedExploreState({
        module: "Repos",
        category: "AI",
        focus: "Agent skills",
        query: "codex",
        sort: "module"
    }))), {
        module: "all",
        category: "all",
        focus: "all",
        query: "",
        sort: "priority"
    });
});

test("Explore saved queue empty state tells the user what to do", () => {
    const app = loadExplore();

    assert.match(app.renderSavedQueue([], new Set()), /Save items to review later in this browser\./);
});

test("Explore builds topic lenses with counts, module spread, and topic routes", () => {
    const app = loadExplore();
    const items = [
        { id: "repos:agent", module: "Repos", title: "openai/codex", category: "AI agents", origin: "GitHub", summary: "coding agent", score: 96 },
        { id: "packages:agent", module: "Packages", title: "mastra", category: "AI agents", origin: "npm", summary: "agent framework", score: 84 },
        { id: "packages:mcp", module: "Packages", title: "@modelcontextprotocol/sdk", category: "MCP", origin: "npm", summary: "MCP SDK", score: 90 },
        { id: "repos:skills", module: "Repos", title: "mattpocock/skills", category: "Agent skills", origin: "GitHub", summary: "workflow skills", score: 88 },
        { id: "links:evals", module: "Links", title: "Evalite docs", category: "AI evals", origin: "Docs", summary: "eval harness", score: 72 }
    ];

    const lenses = app.buildTopicLenses(items);
    const byFocus = Object.fromEntries(lenses.map((lens) => [lens.focus, lens]));

    assert.equal(byFocus["AI agents"].count, 2);
    assert.equal(byFocus["AI agents"].modules, 2);
    assert.equal(byFocus["AI agents"].topItem.title, "openai/codex");
    assert.equal(byFocus.MCP.count, 1);
    assert.equal(byFocus["Agent skills"].route, "../topics/agent-skills/index.html");
    assert.equal(byFocus["AI evals"].route, "../topics/ai-evals/index.html");

    const html = app.renderTopicLenses(lenses, "MCP");
    assert.match(html, /data-focus-lens="MCP"/);
    assert.match(html, /aria-pressed="true"/);
    assert.match(html, /aria-label="Use MCP lens"/);
    assert.match(html, /aria-label="Pin AI agents topic"/);
    assert.match(html, /Open topic/);
    assert.match(html, /2 items \/ 2 modules/);
    assert.match(html, /href="..\/topics\/agent-skills\/index\.html"/);
});

test("Explore pinned topics store and lens sorting prioritize repeat topics", () => {
    const app = loadExplore();
    const memory = new Map();
    const storage = {
        getItem(key) { return memory.get(key) || null; },
        setItem(key, value) { memory.set(key, value); }
    };
    const store = app.createPinnedTopicStore(storage);
    const lenses = [
        { focus: "AI agents", label: "AI agents", count: 8 },
        { focus: "Agent skills", label: "Agent skills", count: 4 },
        { focus: "MCP", label: "MCP", count: 3 }
    ];

    assert.deepEqual(JSON.parse(JSON.stringify(store.toggle("MCP"))), ["MCP"]);
    assert.deepEqual(JSON.parse(JSON.stringify(store.toggle("AI agents"))), ["MCP", "AI agents"]);
    assert.deepEqual(JSON.parse(JSON.stringify(store.toggle("Agent skills"))), ["MCP", "AI agents", "Agent skills"]);
    assert.deepEqual(JSON.parse(JSON.stringify(store.toggle("AI evals"))), ["AI agents", "Agent skills", "AI evals"]);
    assert.deepEqual(JSON.parse(JSON.stringify(app.createPinnedTopicStore({ getItem() { throw new Error("blocked"); } }).read())), []);
    assert.deepEqual(
        JSON.parse(JSON.stringify(app.sortTopicLensesByPins(lenses, new Set(["MCP"])).map((lens) => lens.focus))),
        ["MCP", "AI agents", "Agent skills"]
    );
});

test("Explore preferred state store saves explicit focus and sort only", () => {
    const app = loadExplore();
    const memory = new Map();
    const storage = {
        getItem(key) { return memory.get(key) || null; },
        setItem(key, value) { memory.set(key, value); },
        removeItem(key) { memory.delete(key); }
    };
    const store = app.createPreferredExploreStore(storage);

    assert.deepEqual(JSON.parse(JSON.stringify(store.read())), { focus: "all", sort: "priority" });
    assert.deepEqual(JSON.parse(JSON.stringify(store.save({ focus: "MCP", sort: "saved", query: "ignored", module: "Repos" }))), { focus: "MCP", sort: "saved" });
    assert.deepEqual(JSON.parse(memory.get("anothel.preferences.exploreState.v1")), { version: 1, focus: "MCP", sort: "saved" });
    assert.deepEqual(JSON.parse(JSON.stringify(store.save({ focus: "Unknown", sort: "bad" }))), { focus: "all", sort: "priority" });
    assert.deepEqual(JSON.parse(JSON.stringify(store.reset())), { focus: "all", sort: "priority" });
    assert.equal(memory.has("anothel.preferences.exploreState.v1"), false);
    assert.deepEqual(JSON.parse(JSON.stringify(app.createPreferredExploreStore({ getItem() { throw new Error("blocked"); } }).read())), { focus: "all", sort: "priority" });
});

test("Explore default status text describes explicit preferred state", () => {
    const app = loadExplore();

    assert.equal(app.defaultStatusText({ focus: "all", sort: "priority" }), "Default: All / priority");
    assert.equal(app.defaultStatusText({ focus: "MCP", sort: "saved" }, "Default saved"), "Default saved: MCP / saved first");
});

test("Explore saved search store normalizes, dedupes, caps, and removes presets", () => {
    const app = loadExplore();
    const memory = new Map();
    const storage = {
        getItem(key) { return memory.get(key) || null; },
        setItem(key, value) { memory.set(key, value); },
        removeItem(key) { memory.delete(key); }
    };
    const store = app.createSavedSearchStore(storage);

    assert.deepEqual(JSON.parse(JSON.stringify(store.read())), []);

    let result = store.save({ focus: "MCP", module: "Repos", category: "all", query: " server ", sort: "saved" });
    assert.equal(result.status, "saved");
    assert.equal(result.items[0].id, "focus:mcp|module:repos|category:all|query:server|sort:saved");
    assert.equal(result.items[0].query, "server");

    result = store.save({ focus: "MCP", module: "Repos", category: "all", query: "server", sort: "saved" });
    assert.equal(result.status, "updated");
    assert.equal(result.items.length, 1);

    for (const query of ["a", "b", "c", "d"]) {
        store.save({ focus: "all", module: "all", category: "all", query, sort: "priority" });
    }
    result = store.save({ focus: "AI agents", module: "Links", category: "Reference", query: "agents", sort: "module" });
    assert.equal(result.status, "full");
    assert.equal(result.items.length, 5);

    result = store.remove("focus:mcp|module:repos|category:all|query:server|sort:saved");
    assert.equal(result.status, "removed");
    assert.equal(result.items.some((item) => item.query === "server"), false);
});

test("Explore saved search labels omit default fields", () => {
    const app = loadExplore();

    assert.equal(app.savedSearchLabel({ focus: "all", module: "all", category: "all", query: "", sort: "priority" }), "All signals");
    assert.equal(app.savedSearchLabel({ focus: "MCP", module: "Repos", category: "all", query: "", sort: "saved" }), "MCP / Repos / saved first");
    assert.equal(app.savedSearchLabel({ focus: "Agent skills", module: "all", category: "all", query: "skills", sort: "priority" }), "Agent skills / skills");
});

test("Explore shortens long query copy without changing saved query ids", () => {
    const app = loadExplore();
    const query = "agent workflow automation evaluation benchmark orchestration";

    assert.equal(
        app.savedSearchLabel({ focus: "MCP", module: "all", category: "all", query, sort: "priority" }),
        "MCP / agent workflow automation evaluation bench..."
    );
    assert.equal(
        app.savedSearchId({ focus: "MCP", module: "all", category: "all", query, sort: "priority" }),
        "focus:mcp|module:all|category:all|query:agent workflow automation evaluation benchmark orchestration|sort:priority"
    );
    assert.equal(
        app.activeExploreSummary({ module: "all", category: "all", focus: "MCP", query, sort: "priority" }),
        "Focus: MCP / Search: agent workflow automation evaluation bench..."
    );
});

test("Explore saved search apply ignores stale module and category values", () => {
    const app = loadExplore();
    const module = { value: "all", options: [{ value: "all" }, { value: "Trends" }] };
    const category = { value: "all", options: [{ value: "all" }, { value: "MCP" }] };
    const query = { value: "" };
    const sort = { value: "priority" };
    const focusButtons = [
        { dataset: { focusFilter: "all" }, ariaPressed: "", setAttribute(name, value) { if (name === "aria-pressed") this.ariaPressed = value; } },
        { dataset: { focusFilter: "MCP" }, ariaPressed: "", setAttribute(name, value) { if (name === "aria-pressed") this.ariaPressed = value; } }
    ];

    app.applySearchState({ module, category, query, sort, focusButtons }, {
        focus: "MCP",
        module: "Old module",
        category: "Old category",
        query: "server",
        sort: "saved"
    });

    assert.deepEqual(JSON.parse(JSON.stringify(app.currentSearchState())), {
        focus: "MCP",
        module: "all",
        category: "all",
        query: "server",
        sort: "saved"
    });
    assert.equal(module.value, "all");
    assert.equal(category.value, "all");
    assert.equal(focusButtons[1].ariaPressed, "true");
});

test("Explore saved search renderer emits empty, item, and full states safely", () => {
    const app = loadExplore();

    assert.match(app.renderSavedSearches([], "empty"), /Save reusable filter sets here/);
    const html = app.renderSavedSearches([
        { id: "x", focus: "MCP", module: "Repos", category: "all", query: "<script>", sort: "saved" }
    ], "saved");

    assert.match(html, /MCP \/ Repos \/ &lt;script&gt; \/ saved first/);
    assert.match(html, /data-apply-search-id="x"/);
    assert.match(html, /data-remove-search-id="x"/);
    assert.doesNotMatch(html, /<script>/);
    assert.match(app.savedSearchStatusText("full"), /Remove one to save another/);
    assert.equal(app.savedSearchStatusText("applied"), "Search applied.");
});

test("Explore topic lenses render pin state", () => {
    const app = loadExplore();
    const lenses = [
        { focus: "MCP", label: "MCP", description: "Protocol.", route: "../topics/mcp/index.html", count: 3, modules: 2, topItem: null },
        { focus: "AI agents", label: "AI agents", description: "Agents.", route: "../topics/ai-agents/index.html", count: 8, modules: 4, topItem: null }
    ];
    const html = app.renderTopicLenses(lenses, "all", new Set(["MCP"]));

    assert.match(html, /data-pin-topic="MCP"/);
    assert.match(html, /Pinned/);
    assert.match(html, /aria-pressed="true"/);
    assert.match(html, /aria-label="Unpin MCP topic"/);
    assert.match(html, /data-pin-topic="AI agents"/);
    assert.match(html, />Pin</);
    assert.match(html, /aria-pressed="false"/);
    assert.match(html, /aria-label="Pin AI agents topic"/);
});

test("Explore saved store reads, toggles, removes, and ignores broken storage", () => {
    const app = loadExplore();
    const memory = new Map();
    const storage = {
        getItem(key) {
            return memory.get(key) || null;
        },
        setItem(key, value) {
            memory.set(key, value);
        }
    };
    const store = app.createExploreStore(storage);

    assert.deepEqual([...store.read()], []);
    store.toggle("repos:a");
    assert.deepEqual([...store.read()], ["repos:a"]);
    store.toggle("packages:b");
    assert.deepEqual([...store.read()].sort(), ["packages:b", "repos:a"]);
    store.remove("repos:a");
    assert.deepEqual([...store.read()], ["packages:b"]);

    const broken = app.createExploreStore({
        getItem() {
            throw new Error("blocked");
        },
        setItem() {
            throw new Error("blocked");
        }
    });
    assert.deepEqual([...broken.read()], []);
});

test("Explore saved store migrates v1 arrays and writes v2 metadata", () => {
    const app = loadExplore({
        Date: class extends Date {
            constructor(...args) {
                super(...(args.length > 0 ? args : ["2026-06-20T01:02:03.000Z"]));
            }

            static now() {
                return new Date("2026-06-20T01:02:03.000Z").getTime();
            }
        }
    });
    const memory = new Map([["anothel.explore.saved.v1", JSON.stringify(["repos:a"])]]);
    const storage = {
        getItem(key) {
            return memory.get(key) || null;
        },
        setItem(key, value) {
            memory.set(key, value);
        }
    };
    const store = app.createExploreStore(storage);

    assert.deepEqual(JSON.parse(JSON.stringify(store.readRecords())), [
        { id: "repos:a", savedAt: "2026-06-20T01:02:03.000Z", status: "unread" }
    ]);

    store.toggle("packages:b");
    assert.deepEqual(JSON.parse(memory.get("anothel.explore.saved.v1")), {
        version: 2,
        items: [
            { id: "repos:a", savedAt: "2026-06-20T01:02:03.000Z", status: "unread" },
            { id: "packages:b", savedAt: "2026-06-20T01:02:03.000Z", status: "unread" }
        ]
    });

    store.setStatus("repos:a", "done");
    assert.equal(store.recordsById().get("repos:a").status, "done");
    store.setStatus("repos:a", "invalid");
    assert.equal(store.recordsById().get("repos:a").status, "done");
});

test("Explore script does not auto-fetch on non-Explore pages", async () => {
    let fetchCount = 0;
    const context = {
        console,
        document: {
            currentScript: { dataset: {} },
            querySelector() {
                return null;
            },
            querySelectorAll() {
                return [];
            }
        },
        fetch: async () => {
            fetchCount += 1;
            throw new Error("Explore init should not run without Explore hooks");
        }
    };

    vm.runInNewContext(readFileSync("js/local-state.js", "utf8"), context);
    vm.runInNewContext(readFileSync("js/safe-dom.js", "utf8"), context);
    vm.runInNewContext(readFileSync("js/data-health.js", "utf8"), context);
    vm.runInNewContext(readFileSync("js/signal-schema.js", "utf8"), context);
    vm.runInNewContext(readFileSync("js/topic-taxonomy.js", "utf8"), context);
    vm.runInNewContext(readFileSync("js/explore.js", "utf8"), context);
    await new Promise((resolve) => setTimeout(resolve, 0));

    assert.equal(fetchCount, 0);
    assert.equal(typeof context.ExploreApp.normalizeExploreData, "function");
});

test("Explore rendering escapes generated text and blocks unsafe links", () => {
    const app = loadExplore();
    const html = app.renderExploreCards([
        {
            id: "repos:bad",
            module: "Repos",
            title: "<script>alert(\"x\")</script>",
            category: "AI",
            origin: "GitHub",
            metric: "bad \"metric\"",
            summary: "bad \"summary\"",
            url: "javascript:alert(1)"
        }
    ], new Set(["repos:bad"]));

    assert.doesNotMatch(html, /javascript:alert/);
    assert.doesNotMatch(html, /data-card-href/);
    assert.doesNotMatch(html, /tabindex="0"/);
    assert.doesNotMatch(html, /aria-label="Open/);
    assert.match(html, /&lt;script&gt;alert\(&quot;x&quot;\)&lt;\/script&gt;/);
    assert.match(html, /bad &quot;summary&quot;/);
    assert.match(html, /aria-pressed="true"/);
    assert.match(html, /aria-label="Saved &lt;script&gt;alert\(&quot;x&quot;\)&lt;\/script&gt; for Review"/);
});

test("Explore browser init renders stats, health, filters, and saved queue", async () => {
    function createElement() {
        return {
            innerHTML: "",
            textContent: "",
            value: "all",
            listeners: {},
            addEventListener(type, listener) {
                this.listeners[type] = listener;
            },
            dispatch(type, value = this.value) {
                this.value = value;
                this.listeners[type]?.({ target: this });
            }
        };
    }

    const elements = Object.fromEntries([
        "[data-explore-results]",
        "[data-explore-saved]",
        "[data-explore-module]",
        "[data-explore-category]",
        "[data-explore-query]",
        "[data-explore-sort]",
        "[data-focus-filter]",
        "[data-explore-total]",
        "[data-explore-saved-count]",
        "[data-explore-categories]",
        "[data-explore-summary]",
        "[data-topic-lenses]",
        "[data-data-mode]",
        "[data-source-health]",
        "[data-clear-filters]"
    ].map((selector) => [selector, createElement()]));
    const focusButtons = [
        { dataset: { focusFilter: "all" }, ariaPressed: "", listeners: {}, addEventListener(type, listener) { this.listeners[type] = listener; }, setAttribute(name, value) { if (name === "aria-pressed") this.ariaPressed = value; } },
        { dataset: { focusFilter: "AI agents" }, ariaPressed: "", listeners: {}, addEventListener(type, listener) { this.listeners[type] = listener; }, setAttribute(name, value) { if (name === "aria-pressed") this.ariaPressed = value; } }
    ];
    const card = {
        dataset: { cardHref: "https://example.com/trend" },
        listeners: {},
        addEventListener(type, listener) {
            this.listeners[type] = listener;
        }
    };

    const sources = {
        "../data/manifest.json": { modules: [] },
        "../data/trends.json": {
            updated: "2026-06-18",
            sourceMeta: [{ name: "GitHub", status: "partial", count: 1, errors: [{ name: "GitHub", error: "rate limit" }] }],
            items: [{ rank: 1, title: "Agent trend", source: "GitHub", category: "AI", score: 90, velocity: "+5%", url: "https://example.com/trend", summary: "Trend" }]
        },
        "../data/packages.json": { updated: "2026-06-19", sourceMeta: { name: "npm", status: "ok", count: 0 }, packages: [] },
        "../data/repos.json": { updated: "2026-06-18", sourceMeta: { name: "GitHub", status: "ok", count: 0 }, repos: [] },
        "../data/links.json": { updated: "2026-06-18", sourceMeta: { name: "manual", status: "ok", count: 0 }, links: [] },
        "../data/signal-policy.json": signalPolicy
    };
    const fetchPaths = [];

    const context = {
        console,
        opened: null,
        open(href, target, features) {
            this.opened = { href, target, features };
        },
        document: {
            currentScript: { dataset: {} },
            querySelector(selector) {
                return elements[selector] || null;
            },
            querySelectorAll(selector) {
                if (selector === "[data-focus-filter]") return focusButtons;
                if (selector === "[data-card-href]") return [card];
                return [];
            }
        },
        location: {
            opened: "",
            assign(href) {
                this.opened = href;
            }
        },
        localStorage: {
            getItem() {
                return JSON.stringify({
                    version: 2,
                    items: [{ id: "trends:https://example.com/trend", savedAt: "2026-06-20T00:00:00.000Z", status: "unread" }]
                });
            },
            setItem() {}
        },
        fetch: async (path) => {
            fetchPaths.push(path);
            return {
                ok: true,
                json: async () => sources[path]
            };
        }
    };

    vm.runInNewContext(readFileSync("js/local-state.js", "utf8"), context);
    vm.runInNewContext(readFileSync("js/safe-dom.js", "utf8"), context);
    vm.runInNewContext(readFileSync("js/data-health.js", "utf8"), context);
    vm.runInNewContext(readFileSync("js/signal-schema.js", "utf8"), context);
    vm.runInNewContext(readFileSync("js/topic-taxonomy.js", "utf8"), context);
    vm.runInNewContext(readFileSync("js/explore.js", "utf8"), context);
    await new Promise((resolve) => setTimeout(resolve, 0));

    assert.equal(elements["[data-explore-total]"].textContent, "1");
    assert.equal(elements["[data-explore-saved-count]"].textContent, "1");
    assert.match(elements["[data-explore-results]"].innerHTML, /Agent trend/);
    assert.match(elements["[data-explore-saved]"].innerHTML, /Agent trend/);
    assert.match(elements["[data-topic-lenses]"].innerHTML, /AI agents/);
    assert.match(elements["[data-topic-lenses]"].innerHTML, /Use lens/);
    assert.match(elements["[data-source-health]"].innerHTML, /status-partial/);
    assert.equal(focusButtons[0].ariaPressed, "true");
    assert.ok(fetchPaths.includes("../data/signal-policy.json"));
    card.listeners.click({ target: { closest: () => null } });
    assert.deepEqual(context.opened, {
        href: "https://example.com/trend",
        target: "_blank",
        features: "noopener,noreferrer"
    });
    assert.equal(context.location.opened, "");

    elements["[data-explore-query]"].dispatch("input", "missing");
    assert.equal(elements["[data-explore-total]"].textContent, "0");
    assert.match(elements["[data-explore-results]"].innerHTML, /No matching items/);
});

test("Explore browser flow keeps saved queue visible through filters and preserves saved-first on clear", async () => {
    function createElement() {
        return {
            innerHTML: "",
            textContent: "",
            value: "all",
            listeners: {},
            addEventListener(type, listener) {
                this.listeners[type] = listener;
            },
            dispatch(type, value = this.value) {
                this.value = value;
                this.listeners[type]?.({ target: this });
            }
        };
    }

    const elements = Object.fromEntries([
        "[data-explore-results]",
        "[data-explore-saved]",
        "[data-explore-module]",
        "[data-explore-category]",
        "[data-explore-query]",
        "[data-explore-sort]",
        "[data-focus-filter]",
        "[data-explore-total]",
        "[data-explore-saved-count]",
        "[data-explore-categories]",
        "[data-explore-summary]",
        "[data-topic-lenses]",
        "[data-data-mode]",
        "[data-source-health]",
        "[data-clear-filters]"
    ].map((selector) => [selector, createElement()]));
    const focusButtons = [
        { dataset: { focusFilter: "all" }, listeners: {}, addEventListener(type, listener) { this.listeners[type] = listener; }, setAttribute() {} },
        { dataset: { focusFilter: "AI agents" }, listeners: {}, addEventListener(type, listener) { this.listeners[type] = listener; }, setAttribute() {} }
    ];

    const sources = {
        "../data/manifest.json": { modules: [] },
        "../data/trends.json": {
            updated: "2026-06-18",
            sourceMeta: [{ name: "GitHub", status: "ok", count: 2 }],
            items: [
                { rank: 1, title: "Saved agent", source: "GitHub", category: "AI", score: 90, velocity: "+5%", url: "https://example.com/saved", summary: "Saved item." },
                { rank: 2, title: "Other runtime", source: "npm", category: "Runtime", score: 70, velocity: "1M/week", url: "https://example.com/other", summary: "Other item." }
            ]
        },
        "../data/packages.json": { updated: "2026-06-19", sourceMeta: { name: "npm", status: "ok", count: 0 }, packages: [] },
        "../data/repos.json": { updated: "2026-06-18", sourceMeta: { name: "GitHub", status: "ok", count: 0 }, repos: [] },
        "../data/links.json": { updated: "2026-06-18", sourceMeta: { name: "manual", status: "ok", count: 0 }, links: [] }
    };

    const context = {
        console,
        document: {
            currentScript: { dataset: {} },
            querySelector(selector) {
                return elements[selector] || null;
            },
            querySelectorAll(selector) {
                if (selector === "[data-focus-filter]") return focusButtons;
                return [];
            }
        },
        localStorage: {
            getItem() {
                return JSON.stringify({
                    version: 2,
                    items: [{ id: "trends:https://example.com/saved", savedAt: "2026-06-20T00:00:00.000Z", status: "unread" }]
                });
            },
            setItem() {}
        },
        fetch: async (path) => ({
            ok: true,
            json: async () => sources[path]
        })
    };

    vm.runInNewContext(readFileSync("js/local-state.js", "utf8"), context);
    vm.runInNewContext(readFileSync("js/safe-dom.js", "utf8"), context);
    vm.runInNewContext(readFileSync("js/data-health.js", "utf8"), context);
    vm.runInNewContext(readFileSync("js/signal-schema.js", "utf8"), context);
    vm.runInNewContext(readFileSync("js/topic-taxonomy.js", "utf8"), context);
    vm.runInNewContext(readFileSync("js/explore.js", "utf8"), context);
    await new Promise((resolve) => setTimeout(resolve, 0));

    elements["[data-explore-query]"].dispatch("input", "missing");
    assert.equal(elements["[data-explore-total]"].textContent, "0");
    assert.match(elements["[data-explore-results]"].innerHTML, /No matching items/);
    assert.match(elements["[data-explore-saved]"].innerHTML, /Saved agent/);

    elements["[data-explore-sort]"].dispatch("change", "saved");
    assert.match(elements["[data-explore-summary]"].textContent, /Sort: saved first/);
    assert.doesNotMatch(elements["[data-explore-summary]"].textContent, /Saved:/);
    assert.equal(elements["[data-explore-saved-count]"].textContent, "1");

    focusButtons[1].listeners.click({ target: focusButtons[1] });
    assert.match(elements["[data-explore-summary]"].textContent, /Focus: AI agents/);

    elements["[data-clear-filters]"].listeners.click({ target: elements["[data-clear-filters]"] });
    assert.equal(elements["[data-explore-query]"].value, "");
    assert.equal(elements["[data-explore-sort]"].value, "saved");
    assert.match(elements["[data-explore-summary]"].textContent, /Sort: saved first/);
    assert.equal(elements["[data-explore-total]"].textContent, "2");
});

test("Explore topic lens click applies the matching focus filter", async () => {
    function createElement() {
        return {
            innerHTML: "",
            textContent: "",
            value: "all",
            listeners: {},
            addEventListener(type, listener) {
                this.listeners[type] = listener;
            },
            dispatch(type, value = this.value) {
                this.value = value;
                this.listeners[type]?.({ target: this });
            }
        };
    }

    const elements = Object.fromEntries([
        "[data-explore-results]",
        "[data-explore-saved]",
        "[data-explore-module]",
        "[data-explore-category]",
        "[data-explore-query]",
        "[data-explore-sort]",
        "[data-explore-total]",
        "[data-explore-saved-count]",
        "[data-explore-categories]",
        "[data-explore-summary]",
        "[data-topic-lenses]",
        "[data-data-mode]",
        "[data-source-health]",
        "[data-clear-filters]"
    ].map((selector) => [selector, createElement()]));
    const focusButtons = [
        { dataset: { focusFilter: "all" }, ariaPressed: "", listeners: {}, addEventListener(type, listener) { this.listeners[type] = listener; }, setAttribute(name, value) { if (name === "aria-pressed") this.ariaPressed = value; } },
        { dataset: { focusFilter: "MCP" }, ariaPressed: "", listeners: {}, addEventListener(type, listener) { this.listeners[type] = listener; }, setAttribute(name, value) { if (name === "aria-pressed") this.ariaPressed = value; } }
    ];
    let lensButton = null;
    const sources = {
        "../data/manifest.json": { modules: [] },
        "../data/trends.json": {
            updated: "2026-06-20",
            sourceMeta: [],
            items: [
                { rank: 1, title: "MCP server", source: "GitHub", category: "MCP", score: 90, velocity: "+5%", url: "https://example.com/mcp", summary: "Model Context Protocol server." },
                { rank: 2, title: "Other runtime", source: "npm", category: "Runtime", score: 70, velocity: "1M/week", url: "https://example.com/other", summary: "Other item." }
            ]
        },
        "../data/packages.json": { updated: "2026-06-20", sourceMeta: { name: "npm", status: "ok", count: 0 }, packages: [] },
        "../data/repos.json": { updated: "2026-06-20", sourceMeta: { name: "GitHub", status: "ok", count: 0 }, repos: [] },
        "../data/links.json": { updated: "2026-06-20", sourceMeta: { name: "manual", status: "ok", count: 0 }, links: [] }
    };
    const context = {
        console,
        document: {
            currentScript: { dataset: {} },
            querySelector(selector) {
                return elements[selector] || null;
            },
            querySelectorAll(selector) {
                if (selector === "[data-focus-filter]") return focusButtons;
                if (selector === "[data-focus-lens]") {
                    lensButton = {
                        dataset: { focusLens: "MCP" },
                        addEventListener(type, listener) {
                            this.listeners = { [type]: listener };
                        }
                    };
                    return [lensButton];
                }
                return [];
            }
        },
        localStorage: {
            getItem() {
                return "[]";
            },
            setItem() {}
        },
        fetch: async (path) => ({
            ok: true,
            json: async () => sources[path]
        })
    };

    vm.runInNewContext(readFileSync("js/local-state.js", "utf8"), context);
    vm.runInNewContext(readFileSync("js/safe-dom.js", "utf8"), context);
    vm.runInNewContext(readFileSync("js/data-health.js", "utf8"), context);
    vm.runInNewContext(readFileSync("js/signal-schema.js", "utf8"), context);
    vm.runInNewContext(readFileSync("js/topic-taxonomy.js", "utf8"), context);
    vm.runInNewContext(readFileSync("js/explore.js", "utf8"), context);
    await new Promise((resolve) => setTimeout(resolve, 0));

    lensButton.listeners.click({ target: lensButton });

    assert.equal(elements["[data-explore-total]"].textContent, "1");
    assert.match(elements["[data-explore-summary]"].textContent, /Focus: MCP/);
    assert.equal(focusButtons[1].ariaPressed, "true");
});

test("Explore topic pin click updates stored pins and rerenders lenses", async () => {
    function createElement() {
        return {
            innerHTML: "",
            textContent: "",
            value: "all",
            listeners: {},
            addEventListener(type, listener) {
                this.listeners[type] = listener;
            },
            dispatch(type, value = this.value) {
                this.value = value;
                this.listeners[type]?.({ target: this });
            }
        };
    }

    const elements = Object.fromEntries([
        "[data-explore-results]",
        "[data-explore-saved]",
        "[data-explore-module]",
        "[data-explore-category]",
        "[data-explore-query]",
        "[data-explore-sort]",
        "[data-explore-total]",
        "[data-explore-saved-count]",
        "[data-explore-categories]",
        "[data-explore-summary]",
        "[data-topic-lenses]",
        "[data-data-mode]",
        "[data-source-health]",
        "[data-clear-filters]"
    ].map((selector) => [selector, createElement()]));
    const focusButtons = [
        { dataset: { focusFilter: "all" }, addEventListener() {}, setAttribute() {} },
        { dataset: { focusFilter: "MCP" }, addEventListener() {}, setAttribute() {} }
    ];
    let pinButton = null;
    const memory = new Map();
    const sources = {
        "../data/manifest.json": { modules: [] },
        "../data/trends.json": {
            updated: "2026-06-20",
            sourceMeta: [],
            items: [
                { rank: 1, title: "MCP server", source: "GitHub", category: "MCP", score: 90, velocity: "+5%", url: "https://example.com/mcp", summary: "Model Context Protocol server." },
                { rank: 2, title: "Agent runtime", source: "GitHub", category: "AI agents", score: 80, velocity: "+4%", url: "https://example.com/agent", summary: "Coding agent." }
            ]
        },
        "../data/packages.json": { updated: "2026-06-20", sourceMeta: { name: "npm", status: "ok", count: 0 }, packages: [] },
        "../data/repos.json": { updated: "2026-06-20", sourceMeta: { name: "GitHub", status: "ok", count: 0 }, repos: [] },
        "../data/links.json": { updated: "2026-06-20", sourceMeta: { name: "manual", status: "ok", count: 0 }, links: [] }
    };
    const context = {
        console,
        document: {
            currentScript: { dataset: {} },
            querySelector(selector) {
                return elements[selector] || null;
            },
            querySelectorAll(selector) {
                if (selector === "[data-focus-filter]") return focusButtons;
                if (selector === "[data-pin-topic]") {
                    pinButton = {
                        dataset: { pinTopic: "MCP" },
                        addEventListener(type, listener) {
                            this.listeners = { [type]: listener };
                        }
                    };
                    return [pinButton];
                }
                return [];
            }
        },
        localStorage: {
            getItem(key) {
                return memory.get(key) || "[]";
            },
            setItem(key, value) {
                memory.set(key, value);
            }
        },
        fetch: async (path) => ({
            ok: true,
            json: async () => sources[path]
        })
    };

    vm.runInNewContext(readFileSync("js/local-state.js", "utf8"), context);
    vm.runInNewContext(readFileSync("js/safe-dom.js", "utf8"), context);
    vm.runInNewContext(readFileSync("js/data-health.js", "utf8"), context);
    vm.runInNewContext(readFileSync("js/signal-schema.js", "utf8"), context);
    vm.runInNewContext(readFileSync("js/topic-taxonomy.js", "utf8"), context);
    vm.runInNewContext(readFileSync("js/explore.js", "utf8"), context);
    await new Promise((resolve) => setTimeout(resolve, 0));

    pinButton.listeners.click({ target: pinButton });

    assert.match(memory.get("anothel.preferences.pinnedTopics.v1"), /MCP/);
    assert.match(elements["[data-topic-lenses]"].innerHTML, /Pinned/);
});

test("Explore browser init applies focus from URL query", async () => {
    function createElement() {
        return {
            innerHTML: "",
            textContent: "",
            value: "all",
            listeners: {},
            addEventListener(type, listener) {
                this.listeners[type] = listener;
            }
        };
    }

    const elements = Object.fromEntries([
        "[data-explore-results]",
        "[data-explore-saved]",
        "[data-explore-module]",
        "[data-explore-category]",
        "[data-explore-query]",
        "[data-explore-sort]",
        "[data-explore-total]",
        "[data-explore-saved-count]",
        "[data-explore-categories]",
        "[data-explore-summary]",
        "[data-data-mode]",
        "[data-source-health]",
        "[data-clear-filters]"
    ].map((selector) => [selector, createElement()]));
    const focusButtons = [
        { dataset: { focusFilter: "all" }, ariaPressed: "", addEventListener() {}, setAttribute(name, value) { if (name === "aria-pressed") this.ariaPressed = value; } },
        { dataset: { focusFilter: "MCP" }, ariaPressed: "", addEventListener() {}, setAttribute(name, value) { if (name === "aria-pressed") this.ariaPressed = value; } }
    ];
    const sources = {
        "../data/manifest.json": { modules: [] },
        "../data/trends.json": {
            updated: "2026-06-20",
            sourceMeta: [],
            items: [
                { rank: 1, title: "MCP server", source: "GitHub", category: "MCP", score: 90, velocity: "+5%", url: "https://example.com/mcp", summary: "Model Context Protocol server." },
                { rank: 2, title: "Other runtime", source: "npm", category: "Runtime", score: 70, velocity: "1M/week", url: "https://example.com/other", summary: "Other item." }
            ]
        },
        "../data/packages.json": { updated: "2026-06-20", sourceMeta: { name: "npm", status: "ok", count: 0 }, packages: [] },
        "../data/repos.json": { updated: "2026-06-20", sourceMeta: { name: "GitHub", status: "ok", count: 0 }, repos: [] },
        "../data/links.json": { updated: "2026-06-20", sourceMeta: { name: "manual", status: "ok", count: 0 }, links: [] }
    };
    const context = {
        console,
        URLSearchParams,
        location: { search: "?focus=MCP" },
        document: {
            currentScript: { dataset: {} },
            querySelector(selector) {
                return elements[selector] || null;
            },
            querySelectorAll(selector) {
                if (selector === "[data-focus-filter]") return focusButtons;
                return [];
            }
        },
        localStorage: {
            getItem() {
                return "[]";
            },
            setItem() {}
        },
        fetch: async (path) => ({
            ok: true,
            json: async () => sources[path]
        })
    };

    vm.runInNewContext(readFileSync("js/local-state.js", "utf8"), context);
    vm.runInNewContext(readFileSync("js/safe-dom.js", "utf8"), context);
    vm.runInNewContext(readFileSync("js/data-health.js", "utf8"), context);
    vm.runInNewContext(readFileSync("js/signal-schema.js", "utf8"), context);
    vm.runInNewContext(readFileSync("js/topic-taxonomy.js", "utf8"), context);
    vm.runInNewContext(readFileSync("js/explore.js", "utf8"), context);
    await new Promise((resolve) => setTimeout(resolve, 0));

    assert.equal(elements["[data-explore-total]"].textContent, "1");
    assert.match(elements["[data-explore-summary]"].textContent, /Focus: MCP/);
    assert.equal(focusButtons[1].ariaPressed, "true");
});

test("Explore browser init restores explicit default focus and sort", async () => {
    function createElement() {
        return {
            innerHTML: "",
            textContent: "",
            value: "all",
            listeners: {},
            addEventListener(type, listener) {
                this.listeners[type] = listener;
            }
        };
    }

    const elements = Object.fromEntries([
        "[data-explore-results]",
        "[data-explore-saved]",
        "[data-explore-module]",
        "[data-explore-category]",
        "[data-explore-query]",
        "[data-explore-sort]",
        "[data-explore-total]",
        "[data-explore-saved-count]",
        "[data-explore-categories]",
        "[data-explore-summary]",
        "[data-topic-lenses]",
        "[data-data-mode]",
        "[data-source-health]",
        "[data-clear-filters]",
        "[data-save-explore-default]",
        "[data-reset-explore-default]",
        "[data-explore-default-status]"
    ].map((selector) => [selector, createElement()]));
    const focusButtons = [
        { dataset: { focusFilter: "all" }, ariaPressed: "", addEventListener() {}, setAttribute(name, value) { if (name === "aria-pressed") this.ariaPressed = value; } },
        { dataset: { focusFilter: "MCP" }, ariaPressed: "", addEventListener() {}, setAttribute(name, value) { if (name === "aria-pressed") this.ariaPressed = value; } }
    ];
    const sources = {
        "../data/manifest.json": { modules: [] },
        "../data/trends.json": {
            updated: "2026-06-20",
            sourceMeta: [],
            items: [
                { rank: 1, title: "MCP server", source: "GitHub", category: "MCP", score: 90, velocity: "+5%", url: "https://example.com/mcp", summary: "Model Context Protocol server." },
                { rank: 2, title: "Saved agent", source: "GitHub", category: "AI agents", score: 80, velocity: "+4%", url: "https://example.com/agent", summary: "Coding agent." }
            ]
        },
        "../data/packages.json": { updated: "2026-06-20", sourceMeta: { name: "npm", status: "ok", count: 0 }, packages: [] },
        "../data/repos.json": { updated: "2026-06-20", sourceMeta: { name: "GitHub", status: "ok", count: 0 }, repos: [] },
        "../data/links.json": { updated: "2026-06-20", sourceMeta: { name: "manual", status: "ok", count: 0 }, links: [] }
    };
    const context = {
        console,
        URLSearchParams,
        location: { search: "" },
        document: {
            currentScript: { dataset: {} },
            querySelector(selector) {
                return elements[selector] || null;
            },
            querySelectorAll(selector) {
                if (selector === "[data-focus-filter]") return focusButtons;
                return [];
            }
        },
        localStorage: {
            getItem(key) {
                if (key === "anothel.preferences.exploreState.v1") return JSON.stringify({ version: 1, focus: "MCP", sort: "saved" });
                return "[]";
            },
            setItem() {}
        },
        fetch: async (path) => ({
            ok: true,
            json: async () => sources[path]
        })
    };

    vm.runInNewContext(readFileSync("js/local-state.js", "utf8"), context);
    vm.runInNewContext(readFileSync("js/safe-dom.js", "utf8"), context);
    vm.runInNewContext(readFileSync("js/data-health.js", "utf8"), context);
    vm.runInNewContext(readFileSync("js/signal-schema.js", "utf8"), context);
    vm.runInNewContext(readFileSync("js/topic-taxonomy.js", "utf8"), context);
    vm.runInNewContext(readFileSync("js/explore.js", "utf8"), context);
    await new Promise((resolve) => setTimeout(resolve, 0));

    assert.equal(elements["[data-explore-sort]"].value, "saved");
    assert.match(elements["[data-explore-summary]"].textContent, /Focus: MCP/);
    assert.match(elements["[data-explore-summary]"].textContent, /Sort: saved first/);
    assert.equal(elements["[data-explore-default-status]"].textContent, "Default: MCP / saved first");
    assert.equal(focusButtons[1].ariaPressed, "true");
});

test("Explore default controls save and reset explicit preferred state", async () => {
    function createElement() {
        return {
            innerHTML: "",
            textContent: "",
            value: "all",
            listeners: {},
            addEventListener(type, listener) {
                this.listeners[type] = listener;
            },
            dispatch(type, value = this.value) {
                this.value = value;
                this.listeners[type]?.({ target: this });
            }
        };
    }

    const elements = Object.fromEntries([
        "[data-explore-results]",
        "[data-explore-saved]",
        "[data-explore-module]",
        "[data-explore-category]",
        "[data-explore-query]",
        "[data-explore-sort]",
        "[data-explore-total]",
        "[data-explore-saved-count]",
        "[data-explore-categories]",
        "[data-explore-summary]",
        "[data-topic-lenses]",
        "[data-data-mode]",
        "[data-source-health]",
        "[data-clear-filters]",
        "[data-save-explore-default]",
        "[data-reset-explore-default]",
        "[data-explore-default-status]"
    ].map((selector) => [selector, createElement()]));
    const focusButtons = [
        { dataset: { focusFilter: "all" }, ariaPressed: "", listeners: {}, addEventListener(type, listener) { this.listeners[type] = listener; }, setAttribute(name, value) { if (name === "aria-pressed") this.ariaPressed = value; } },
        { dataset: { focusFilter: "MCP" }, ariaPressed: "", listeners: {}, addEventListener(type, listener) { this.listeners[type] = listener; }, setAttribute(name, value) { if (name === "aria-pressed") this.ariaPressed = value; } }
    ];
    const memory = new Map();
    const sources = {
        "../data/manifest.json": { modules: [] },
        "../data/trends.json": {
            updated: "2026-06-20",
            sourceMeta: [],
            items: [{ rank: 1, title: "MCP server", source: "GitHub", category: "MCP", score: 90, velocity: "+5%", url: "https://example.com/mcp", summary: "Model Context Protocol server." }]
        },
        "../data/packages.json": { updated: "2026-06-20", sourceMeta: { name: "npm", status: "ok", count: 0 }, packages: [] },
        "../data/repos.json": { updated: "2026-06-20", sourceMeta: { name: "GitHub", status: "ok", count: 0 }, repos: [] },
        "../data/links.json": { updated: "2026-06-20", sourceMeta: { name: "manual", status: "ok", count: 0 }, links: [] }
    };
    const context = {
        console,
        URLSearchParams,
        location: { search: "" },
        document: {
            currentScript: { dataset: {} },
            querySelector(selector) {
                return elements[selector] || null;
            },
            querySelectorAll(selector) {
                if (selector === "[data-focus-filter]") return focusButtons;
                return [];
            }
        },
        localStorage: {
            getItem(key) {
                return memory.get(key) || "[]";
            },
            setItem(key, value) {
                memory.set(key, value);
            },
            removeItem(key) {
                memory.delete(key);
            }
        },
        fetch: async (path) => ({
            ok: true,
            json: async () => sources[path]
        })
    };

    vm.runInNewContext(readFileSync("js/local-state.js", "utf8"), context);
    vm.runInNewContext(readFileSync("js/safe-dom.js", "utf8"), context);
    vm.runInNewContext(readFileSync("js/data-health.js", "utf8"), context);
    vm.runInNewContext(readFileSync("js/signal-schema.js", "utf8"), context);
    vm.runInNewContext(readFileSync("js/topic-taxonomy.js", "utf8"), context);
    vm.runInNewContext(readFileSync("js/explore.js", "utf8"), context);
    await new Promise((resolve) => setTimeout(resolve, 0));

    focusButtons[1].listeners.click({ target: focusButtons[1] });
    elements["[data-explore-sort]"].dispatch("change", "saved");
    elements["[data-save-explore-default]"].listeners.click({ target: elements["[data-save-explore-default]"] });

    assert.deepEqual(JSON.parse(memory.get("anothel.preferences.exploreState.v1")), { version: 1, focus: "MCP", sort: "saved" });
    assert.equal(elements["[data-explore-default-status]"].textContent, "Default saved: MCP / saved first");

    elements["[data-reset-explore-default]"].listeners.click({ target: elements["[data-reset-explore-default]"] });

    assert.equal(memory.has("anothel.preferences.exploreState.v1"), false);
    assert.equal(elements["[data-explore-sort]"].value, "priority");
    assert.equal(elements["[data-explore-default-status]"].textContent, "Default reset: All / priority");
    assert.match(elements["[data-explore-summary]"].textContent, /Showing all tracked items/);
    assert.equal(focusButtons[0].ariaPressed, "true");
});

test("Explore saved search controls save, apply, remove, and keep URL unchanged", async () => {
    let dynamicButtons = [];

    function createElement() {
        return {
            innerHTML: "",
            textContent: "",
            value: "all",
            listeners: {},
            addEventListener(type, listener) {
                this.listeners[type] = listener;
            },
            dispatch(type, value = this.value) {
                this.value = value;
                this.listeners[type]?.({ target: this });
            }
        };
    }
    function createButton(dataset = {}) {
        return {
            dataset,
            listeners: {},
            addEventListener(type, listener) {
                this.listeners[type] = listener;
            }
        };
    }

    const elements = Object.fromEntries([
        "[data-explore-results]",
        "[data-explore-saved]",
        "[data-explore-module]",
        "[data-explore-category]",
        "[data-explore-query]",
        "[data-explore-sort]",
        "[data-explore-total]",
        "[data-explore-saved-count]",
        "[data-explore-categories]",
        "[data-explore-summary]",
        "[data-topic-lenses]",
        "[data-data-mode]",
        "[data-source-health]",
        "[data-clear-filters]",
        "[data-save-explore-default]",
        "[data-reset-explore-default]",
        "[data-explore-default-status]",
        "[data-save-search]",
        "[data-saved-searches]",
        "[data-saved-search-status]"
    ].map((selector) => [selector, createElement()]));
    const focusButtons = [
        { dataset: { focusFilter: "all" }, ariaPressed: "", listeners: {}, addEventListener(type, listener) { this.listeners[type] = listener; }, setAttribute(name, value) { if (name === "aria-pressed") this.ariaPressed = value; } },
        { dataset: { focusFilter: "MCP" }, ariaPressed: "", listeners: {}, addEventListener(type, listener) { this.listeners[type] = listener; }, setAttribute(name, value) { if (name === "aria-pressed") this.ariaPressed = value; } }
    ];
    const memory = new Map();
    const location = { search: "" };
    const sources = {
        "../data/manifest.json": { modules: [] },
        "../data/trends.json": {
            updated: "2026-06-20",
            sourceMeta: [],
            items: [
                { rank: 1, title: "MCP server", source: "GitHub", category: "MCP", score: 90, velocity: "+5%", url: "https://example.com/mcp", summary: "Model Context Protocol server." },
                { rank: 2, title: "Other runtime", source: "npm", category: "Runtime", score: 70, velocity: "1M/week", url: "https://example.com/other", summary: "Other item." }
            ]
        },
        "../data/packages.json": { updated: "2026-06-20", sourceMeta: { name: "npm", status: "ok", count: 0 }, packages: [] },
        "../data/repos.json": { updated: "2026-06-20", sourceMeta: { name: "GitHub", status: "ok", count: 0 }, repos: [] },
        "../data/links.json": { updated: "2026-06-20", sourceMeta: { name: "manual", status: "ok", count: 0 }, links: [] }
    };
    const context = {
        console,
        URLSearchParams,
        location,
        document: {
            currentScript: { dataset: {} },
            querySelector(selector) {
                return elements[selector] || null;
            },
            querySelectorAll(selector) {
                if (selector === "[data-focus-filter]") return focusButtons;
                if (selector === "[data-apply-search-id], [data-remove-search-id]") return dynamicButtons;
                return [];
            }
        },
        localStorage: {
            getItem(key) {
                return memory.get(key) || null;
            },
            setItem(key, value) {
                memory.set(key, value);
            },
            removeItem(key) {
                memory.delete(key);
            }
        },
        fetch: async (path) => ({
            ok: true,
            json: async () => sources[path]
        })
    };

    vm.runInNewContext(readFileSync("js/local-state.js", "utf8"), context);
    vm.runInNewContext(readFileSync("js/safe-dom.js", "utf8"), context);
    vm.runInNewContext(readFileSync("js/data-health.js", "utf8"), context);
    vm.runInNewContext(readFileSync("js/signal-schema.js", "utf8"), context);
    vm.runInNewContext(readFileSync("js/topic-taxonomy.js", "utf8"), context);
    vm.runInNewContext(readFileSync("js/explore.js", "utf8"), context);
    await new Promise((resolve) => setTimeout(resolve, 0));

    focusButtons[1].listeners.click({ target: focusButtons[1] });
    elements["[data-explore-query]"].dispatch("input", "server");
    elements["[data-explore-sort]"].dispatch("change", "saved");
    elements["[data-save-search]"].listeners.click({ target: elements["[data-save-search]"] });

    const savedPayload = JSON.parse(memory.get("anothel.preferences.savedSearches.v1"));
    assert.equal(savedPayload.items.length, 1);
    assert.match(elements["[data-saved-searches]"].innerHTML, /MCP \/ server \/ saved first/);
    assert.equal(elements["[data-saved-search-status]"].textContent, "Search saved.");

    elements["[data-explore-query]"].dispatch("input", "other");
    const savedSearchStore = context.ExploreApp.createSavedSearchStore(context.localStorage);
    const appEls = {
        module: elements["[data-explore-module]"],
        category: elements["[data-explore-category]"],
        query: elements["[data-explore-query]"],
        sort: elements["[data-explore-sort]"],
        focusButtons
    };
    assert.equal(context.ExploreApp.applySavedSearchById(
        appEls,
        savedSearchStore,
        savedPayload.items[0].id
    ), true);

    assert.equal(elements["[data-explore-query]"].value, "server");
    assert.equal(elements["[data-explore-sort]"].value, "saved");
    assert.equal(focusButtons[1].ariaPressed, "true");
    assert.equal(location.search, "");

    dynamicButtons = [createButton({ applySearchId: savedPayload.items[0].id })];
    context.ExploreApp.bindSavedSearchActions(
        appEls,
        savedSearchStore,
        context.ExploreApp.createExploreStore(context.localStorage),
        context.ExploreApp.createPinnedTopicStore(context.localStorage)
    );
    elements["[data-explore-query]"].dispatch("input", "other");
    dynamicButtons[0].listeners.click({ target: dynamicButtons[0] });

    assert.equal(elements["[data-explore-query]"].value, "server");
    assert.equal(elements["[data-saved-search-status]"].textContent, "Search applied.");

    const removed = savedSearchStore.remove(savedPayload.items[0].id);

    assert.deepEqual(JSON.parse(JSON.stringify(removed.items)), []);
    assert.deepEqual(JSON.parse(memory.get("anothel.preferences.savedSearches.v1")).items, []);
});
