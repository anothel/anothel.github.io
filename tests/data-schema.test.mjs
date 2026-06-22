import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function json(path) {
    return JSON.parse(readFileSync(path, "utf8"));
}

const statusValues = new Set(["ok", "partial", "error", "fallback", "stale", "unknown"]);
const sectionIds = new Set(["start", "skim", "reference"]);

function assertDate(value, label) {
    assert.match(String(value || ""), /^\d{4}-\d{2}-\d{2}$/, label);
}

function assertTimestamp(value, label) {
    assert.match(String(value || ""), /^\d{4}-\d{2}-\d{2}T/, label);
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
        if (source.updatedAt) assertTimestamp(source.updatedAt, `${label} source ${index} updatedAt`);
    }
}

test("manifest count and status matches module data files", () => {
    const manifest = json("data/manifest.json");

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
            assert.ok(item.title, "today item title");
            assert.ok(item.reason, `${item.title} reason`);
            assertSafeUrl(item.url, `${item.title} url`);
            assert.ok(Number(item.score) >= 0 && Number(item.score) <= 100, `${item.title} score`);
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
