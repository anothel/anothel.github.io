import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
    buildHomeOverview,
    collectHomeSignals,
    renderSignalCards
} from "../js/home.js";

function readJson(path) {
    return JSON.parse(readFileSync(path, "utf8"));
}

test("buildHomeOverview summarizes manifest modules", () => {
    const overview = buildHomeOverview({
        modules: [
            { status: "ok", count: 11, updated: "2026-06-14" },
            { status: "error", count: 8, updated: "2026-06-13" },
            { status: "ok", count: 6, updated: "2026-06-14" }
        ]
    });

    assert.deepEqual(overview, {
        totalItems: 25,
        liveModules: 2,
        totalModules: 3,
        updated: "2026-06-14"
    });
});

test("collectHomeSignals normalizes module datasets into preview rows", () => {
    const signals = collectHomeSignals({
        trends: {
            items: [
                {
                    title: "Agent workflow",
                    source: "HN",
                    category: "AI",
                    score: 96,
                    url: "https://example.com/trend"
                }
            ]
        },
        packages: {
            packages: [
                {
                    name: "typescript",
                    category: "Language",
                    downloadsLabel: "216.8M/week",
                    url: "https://example.com/package"
                }
            ]
        },
        repos: {
            repos: [
                {
                    name: "react/react",
                    category: "UI",
                    starsLabel: "245.8K",
                    url: "https://example.com/repo"
                }
            ]
        },
        links: {
            links: [
                {
                    title: "GitHub REST API",
                    category: "API",
                    kind: "Docs",
                    url: "https://example.com/link"
                }
            ]
        }
    });

    assert.deepEqual(
        signals.map((signal) => [signal.module, signal.title, signal.meta, signal.metric, signal.reason]),
        [
            ["Trends", "Agent workflow", "HN / AI", "96 score", "Cross-source movement"],
            ["Packages", "typescript", "Language", "216.8M/week", "Weekly download movement"],
            ["Repos", "react/react", "UI", "245.8K stars", "Project traction"],
            ["Links", "GitHub REST API", "API / Docs", "reference", "Reference worth keeping"]
        ]
    );
});

test("renderSignalCards emits stable links for home preview", () => {
    const html = renderSignalCards([
        {
            module: "Trends",
            title: "Agent workflow",
            meta: "HN / AI",
            metric: "96 score",
            reason: "Cross-source movement",
            url: "https://example.com/trend"
        }
    ]);

    assert.match(html, /class="signal-card"/);
    assert.match(html, /href="https:\/\/example\.com\/trend"/);
    assert.match(html, /Agent workflow/);
    assert.match(html, /Cross-source movement/);
    assert.match(html, /96 score/);
});

test("checked-in data powers the home overview and signal preview", () => {
    const overview = buildHomeOverview(readJson("data/manifest.json"));
    const signals = collectHomeSignals({
        trends: readJson("data/trends.json"),
        packages: readJson("data/packages.json"),
        repos: readJson("data/repos.json"),
        links: readJson("data/links.json")
    });

    assert.ok(overview.totalItems >= 60);
    assert.equal(overview.liveModules, 4);
    assert.equal(signals.length, 8);
    assert.deepEqual(
        signals.map((signal) => signal.module),
        ["Trends", "Trends", "Trends", "Packages", "Packages", "Repos", "Repos", "Links"]
    );
});

test("collectHomeSignals can return full digest rows for today page", () => {
    const signals = collectHomeSignals({
        trends: readJson("data/trends.json"),
        packages: readJson("data/packages.json"),
        repos: readJson("data/repos.json"),
        links: readJson("data/links.json")
    }, {
        trends: Infinity,
        packages: Infinity,
        repos: Infinity,
        links: Infinity
    });

    assert.ok(signals.length >= 60);
    assert.equal(signals[0].module, "Trends");
    assert.equal(signals.at(-1).module, "Links");
});
