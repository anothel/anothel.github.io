import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
    applyManifest,
    buildHomeOverview,
    collectHomeSignals,
    formatModuleMeta,
    formatModuleStatus,
    renderSignalCards
} from "../js/home.js";

function readJson(path) {
    return JSON.parse(readFileSync(path, "utf8"));
}

test("formatModuleMeta summarizes module count, source, and freshness", () => {
    assert.equal(
        formatModuleMeta({
            count: 11,
            source: "Hacker News, GitHub, npm",
            updated: "2026-06-14"
        }),
        "11 items | Hacker News, GitHub, npm | updated 2026-06-14"
    );
});

test("formatModuleMeta uses singular item label", () => {
    assert.equal(
        formatModuleMeta({
            count: 1,
            source: "manual",
            updated: "2026-06-14"
        }),
        "1 item | manual | updated 2026-06-14"
    );
});

test("formatModuleStatus maps data status to home badge copy", () => {
    assert.equal(formatModuleStatus("ok"), "Live");
    assert.equal(formatModuleStatus("error"), "Check");
    assert.equal(formatModuleStatus("unknown"), "Unknown");
});

test("applyManifest updates matching module cards", () => {
    const status = { textContent: "Live" };
    const meta = { textContent: "Static data available." };
    const card = {
        dataset: { moduleId: "trends" },
        querySelector(selector) {
            if (selector === "[data-module-status]") return status;
            if (selector === "[data-module-meta]") return meta;
            return null;
        }
    };
    const root = {
        querySelectorAll(selector) {
            assert.equal(selector, "[data-module-card]");
            return [card];
        }
    };

    const count = applyManifest(root, {
        modules: [
            {
                id: "trends",
                status: "ok",
                count: 11,
                source: "Hacker News, GitHub, npm",
                updated: "2026-06-14"
            }
        ]
    });

    assert.equal(count, 1);
    assert.equal(status.textContent, "Live");
    assert.equal(meta.textContent, "11 items | Hacker News, GitHub, npm | updated 2026-06-14");
});

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
            ["Trends", "Agent workflow", "HN / AI", "96 score", "Ranked trend signal"],
            ["Packages", "typescript", "Language", "216.8M/week", "Weekly npm demand"],
            ["Repos", "react/react", "UI", "245.8K stars", "Repository traction"],
            ["Links", "GitHub REST API", "API / Docs", "reference", "Reference queue"]
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
            reason: "Ranked trend signal",
            url: "https://example.com/trend"
        }
    ]);

    assert.match(html, /class="signal-card"/);
    assert.match(html, /href="https:\/\/example\.com\/trend"/);
    assert.match(html, /Agent workflow/);
    assert.match(html, /Ranked trend signal/);
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

    assert.equal(overview.totalItems, 33);
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

    assert.equal(signals.length, 33);
    assert.equal(signals[0].module, "Trends");
    assert.equal(signals.at(-1).module, "Links");
});
