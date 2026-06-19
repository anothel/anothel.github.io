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
    assert.ok(manifest.modules.every((module) => module.status === "ok"));
});

test("checked-in manifest points to existing pages and data", () => {
    const manifest = readJson("data/manifest.json");

    assert.equal(manifest.modules.length, 4);
    for (const module of manifest.modules) {
        assert.ok(existsSync(module.route), `${module.route} should exist`);
        assert.ok(existsSync(module.data), `${module.data} should exist`);
        assert.match(module.source, /\S/);
    }
});

test("checked-in manifest counts match generated data files", () => {
    const manifest = readJson("data/manifest.json");
    const packages = readJson("data/packages.json");
    const today = readJson("data/today.json");
    const packageModule = manifest.modules.find((module) => module.id === "packages");

    assert.equal(packageModule.count, packages.packages.length);
    assert.equal(packages.sourceMeta.count, packages.packages.length);
    assert.equal(today.sourceMeta.count, today.sections.flatMap((section) => section.items).length);
});
