import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { buildManifest, moduleDefinitions } from "../scripts/update-manifest.mjs";

function readJson(path) {
    return JSON.parse(readFileSync(path, "utf8"));
}

test("manifest describes every dashboard module", () => {
    const generatedAt = "2026-06-14T00:00:00.000Z";
    const manifest = buildManifest(moduleDefinitions, {
        trends: {
            updated: "2026-06-14",
            sources: ["Hacker News", "GitHub", "npm"],
            sourceMeta: [
                { name: "Hacker News", status: "ok", count: 2 },
                { name: "GitHub", status: "ok", count: 1 },
                { name: "npm", status: "ok", count: 1 }
            ],
            items: [{}, {}, {}, {}]
        },
        packages: {
            updated: "2026-06-14",
            sourceMeta: { name: "npm", status: "ok", count: 2 },
            packages: [{}, {}]
        },
        repos: {
            updated: "2026-06-14",
            sourceMeta: { name: "GitHub", status: "ok", count: 1 },
            repos: [{}]
        },
        links: {
            updated: "2026-06-14",
            sourceMeta: { name: "manual", status: "ok", count: 3 },
            links: [{}, {}, {}]
        }
    }, generatedAt);

    assert.equal(manifest.updated, "2026-06-14");
    assert.equal(manifest.generatedAt, generatedAt);
    assert.deepEqual(
        manifest.modules.map((module) => module.id),
        ["trends", "packages", "repos", "links"]
    );
    assert.deepEqual(
        manifest.modules.map((module) => module.count),
        [4, 2, 1, 3]
    );
    assert.equal(manifest.modules.find((module) => module.id === "links").title, "Reference shelf");
    assert.ok(manifest.modules.every((module) => module.status === "ok"));
});

test("manifest preserves partial source status", () => {
    const manifest = buildManifest(moduleDefinitions, {
        trends: {
            updated: "2026-06-14",
            sources: ["Hacker News", "GitHub", "npm"],
            sourceMeta: [
                { name: "Hacker News", status: "ok", count: 2 },
                { name: "GitHub", status: "error", count: 0 },
                { name: "npm", status: "ok", count: 1 }
            ],
            items: [{}, {}, {}]
        },
        packages: {
            updated: "2026-06-14",
            sourceMeta: { name: "npm", status: "partial", count: 1 },
            packages: [{}]
        },
        repos: {
            updated: "2026-06-14",
            sourceMeta: { name: "GitHub", status: "error", count: 0 },
            repos: []
        },
        links: {
            updated: "2026-06-14",
            sourceMeta: { name: "manual", status: "ok", count: 1 },
            links: [{}]
        }
    }, "2026-06-14T00:00:00.000Z");

    assert.deepEqual(
        manifest.modules.map((module) => [module.id, module.status]),
        [
            ["trends", "partial"],
            ["packages", "partial"],
            ["repos", "error"],
            ["links", "ok"]
        ]
    );
});

test("checked-in manifest points to generated Astro pages and checked-in data", () => {
    const manifest = readJson("data/manifest.json");

    assert.equal(manifest.modules.length, 4);
    for (const module of manifest.modules) {
        assert.ok(existsSync(`dist/${module.route}`), `dist/${module.route} should exist`);
        assert.ok(existsSync(module.data), `${module.data} should exist`);
        assert.match(module.source, /\S/);
    }
});

test("checked-in manifest counts match generated data files", () => {
    const manifest = readJson("data/manifest.json");
    const packages = readJson("data/packages.json");
    const today = readJson("data/today.json");
    const packageModule = manifest.modules.find((module) => module.id === "packages");
    const linksModule = manifest.modules.find((module) => module.id === "links");

    assert.equal(packageModule.count, packages.packages.length);
    assert.equal(linksModule.title, "Reference shelf");
    assert.equal(packages.sourceMeta.count, packages.packages.length);
    assert.equal(today.sourceMeta.count, today.sections.flatMap((section) => section.items).length);
});
