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

function read(path) {
    return readFileSync(path, "utf8");
}

test("remaining Notes fallback protects external links", () => {
    const links = read("notes/index.html").match(/<a\b[^>]*href="https?:\/\/[^\"]+"[^>]*>/g) || [];
    for (const link of links) {
        assert.match(link, /\brel="[^"]*\bnoopener\b[^"]*\bnoreferrer\b[^"]*"/, link);
    }
});

test("Notes keeps checked-in topic judgment without JavaScript", () => {
    const html = read("notes/index.html");

    assert.match(html, /data-notes-list/);
    assert.match(html, /Measurement decides which AI changes are safe to keep\./);
    assert.match(html, /Implementation details make AI systems easier to judge\./);
    assert.match(html, /Durable workflows matter when agents need repeatable execution\./);
    assert.match(html, /Security signals decide where automation needs stronger guardrails\./);
    assert.match(html, /href="\.\.\/topics\/ai-evals\/index\.html"/);
    assert.match(html, /href="\.\.\/topics\/security\/index\.html"/);
});

test("topic source HTML is retired and the fallback updater cannot recreate it", () => {
    const updater = read("scripts/update-static-fallbacks.mjs");

    assert.deepEqual(topicPages(), [], "checked-in topics/*/index.html must stay retired");
    assert.match(updater, /writeIfChanged\("notes\/index\.html"/);
    const writeTargets = [...updater.matchAll(/\bawait\s+writeIfChanged\(\s*([^,\n)]+)/g)]
        .map((match) => match[1].trim())
        .sort();
    assert.deepEqual(writeTargets, ['"notes/index.html"', '"sitemap.xml"']);
    assert.doesNotMatch(updater, /\bTopicApp\b|js\/topics\.js|function renderTopicPage/);
});

test("remaining Notes copy avoids stale implementation language", () => {
    const html = read("notes/index.html");
    assert.doesNotMatch(html, /2026-06-14|2026-06-15|2026-06-19/);
    assert.doesNotMatch(html, /Static fallback|fetch is available|checked-in JSON|checked-in data/i);
    assert.doesNotMatch(html, /Data date is current/);
});
