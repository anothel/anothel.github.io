import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
    activeItems,
    activeNames,
    validateWatchlistGovernance
} from "../scripts/watchlist-governance.mjs";

function json(path) {
    return JSON.parse(readFileSync(path, "utf8"));
}

test("watchlist governance filters disabled entries without deleting history", () => {
    const items = [
        { name: "active", history: [{ date: "2026-06-27", note: "Still useful." }] },
        { name: "retired", disabled: true, history: [{ date: "2026-06-01", note: "Retired from current signals." }] },
        { name: "also-active" }
    ];

    assert.deepEqual(activeItems(items).map((item) => item.name), ["active", "also-active"]);
    assert.deepEqual(activeNames(["ai", { name: "retired", disabled: true }, { name: "openai" }]), ["ai", "openai"]);
    assert.deepEqual(items[1].history, [{ date: "2026-06-01", note: "Retired from current signals." }]);
});

test("checked-in watchlists keep optional disabled and history fields valid", () => {
    assert.deepEqual(validateWatchlistGovernance(json("data/watchlists.json"), { today: json("data/manifest.json").updated }), []);
});

test("watchlist governance rejects history dates after the data date", () => {
    const errors = validateWatchlistGovernance({
        packages: [
            {
                name: "future",
                disabled: true,
                history: [{ date: "2026-06-28", note: "Retired after data date." }]
            }
        ]
    }, { today: "2026-06-27" });

    assert.deepEqual(errors, ["packages[0].history[0].date must not be after 2026-06-27"]);
});

test("source quality alignment review retires broad duplicate sources", () => {
    const watchlists = json("data/watchlists.json");
    const activeTrendPackages = new Set(activeNames(watchlists.trends.npmPackages));
    const activeQueries = new Set(activeItems(watchlists.trends.githubQueries).map((item) => item.query));
    const activePackages = new Set(activeItems(watchlists.packages).map((item) => item.name));
    const activeRepos = new Set(activeItems(watchlists.repos).map((item) => item.fullName));
    const activeLinks = new Set(activeItems(watchlists.links).map((item) => item.title));

    for (const name of ["react", "typescript", "playwright", "vite", "next", "eslint", "prettier", "zod", "tailwindcss", "express", "fastify", "tsx"]) {
        assert.equal(activeTrendPackages.has(name), false, `${name} trend package should be retired`);
    }
    for (const query of ["topic:typescript stars:>500", "topic:developer-tools ai stars:>300"]) {
        assert.equal(activeQueries.has(query), false, `${query} should be retired`);
    }
    for (const name of ["react", "typescript", "playwright", "vite", "next", "zod", "eslint", "prettier"]) {
        assert.equal(activePackages.has(name), false, `${name} package should be retired`);
    }
    for (const name of ["react/react", "vercel/next.js", "vitejs/vite", "microsoft/playwright", "colinhacks/zod"]) {
        assert.equal(activeRepos.has(name), false, `${name} repo should be retired`);
    }
    for (const title of ["MDN Web Docs", "web.dev", "Node.js API", "SQLite Docs", "OpenTelemetry Docs"]) {
        assert.equal(activeLinks.has(title), false, `${title} link should be retired`);
    }
});

test("generated source snapshots omit retired direct watchlist entries", () => {
    const watchlists = json("data/watchlists.json");
    const disabledTrendPackages = new Set(watchlists.trends.npmPackages.filter((item) => item.disabled).map((item) => item.name));
    const disabledPackages = new Set(watchlists.packages.filter((item) => item.disabled).map((item) => item.name));
    const disabledRepos = new Set(watchlists.repos.filter((item) => item.disabled).map((item) => item.fullName));
    const disabledLinks = new Set(watchlists.links.filter((item) => item.disabled).map((item) => item.title));

    for (const item of json("data/trends.json").items.filter((item) => item.source === "npm")) {
        assert.equal(disabledTrendPackages.has(item.title), false, `${item.title} retired npm trend should not be generated`);
    }
    for (const item of json("data/packages.json").packages) {
        assert.equal(disabledPackages.has(item.name), false, `${item.name} retired package should not be generated`);
    }
    for (const item of json("data/repos.json").repos) {
        assert.equal(disabledRepos.has(item.name), false, `${item.name} retired repo should not be generated`);
    }
    for (const item of json("data/links.json").links) {
        assert.equal(disabledLinks.has(item.title), false, `${item.title} retired link should not be generated`);
    }
});
