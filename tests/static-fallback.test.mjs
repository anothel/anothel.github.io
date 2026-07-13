import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";

function topicPages() {
    if (!existsSync("topics")) return [];
    return readdirSync("topics", { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => `topics/${entry.name}/index.html`)
        .filter(existsSync)
        .sort();
}

const read = (path) => readFileSync(path, "utf8");
const retiredNotesGlobal = ["Notes", "App"].join("");

test("checked-in Notes and topic HTML stay retired", () => {
    assert.equal(existsSync("notes/index.html"), false);
    assert.deepEqual(topicPages(), []);
});

test("the remaining fallback updater writes only sitemap metadata", () => {
    const updater = read("scripts/update-static-fallbacks.mjs");
    const writeTargets = [...updater.matchAll(/\bawait\s+writeIfChanged\(\s*([^,\n)]+)/g)]
        .map((match) => match[1].trim())
        .sort();

    assert.deepEqual(writeTargets, ['"sitemap.xml"']);
    assert.match(updater, /const generatedFiles = new Set\(\[["']sitemap\.xml["']\]\)/);
    assert.doesNotMatch(updater, /notes\/index\.html|js\/notes\.js|js\/safe-dom\.js|node:vm|runInNewContext/);
    assert.doesNotMatch(updater, new RegExp(`\\b${retiredNotesGlobal}\\b`));
});

test("the checked-in sitemap keeps the native Notes route", () => {
    assert.match(read("sitemap.xml"), /<loc>https:\/\/anothel\.github\.io\/notes\/<\/loc>/);
});
