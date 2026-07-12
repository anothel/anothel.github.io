import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const topicPages = [
    ["topics/ai-agents/index.html", "AI agents", /agent workflow/i],
    ["topics/mcp/index.html", "MCP", /protocol layer/i],
    ["topics/agent-skills/index.html", "Agent skills", /reusable instructions/i],
    ["topics/ai-evals/index.html", "AI evals", /measurement/i],
    ["topics/ai-engineering/index.html", "AI engineering", /implementation/i],
    ["topics/workflow-automation/index.html", "Workflow automation", /durable workflows/i],
    ["topics/security/index.html", "Security", /trust boundary/i]
];
const legacyPages = ["notes/index.html", ...topicPages.map(([path]) => path)];

function read(path) {
    return readFileSync(path, "utf8");
}

function json(path) {
    return JSON.parse(read(path));
}

function topicApp() {
    const context = { console, URL };
    vm.runInNewContext(read("js/safe-dom.js"), context);
    vm.runInNewContext(read("js/topic-taxonomy.js"), context);
    vm.runInNewContext(read("js/topics.js"), context);
    return context.TopicApp;
}

function topicSummary(topic) {
    const app = topicApp();
    const sources = {
        trends: json("data/trends.json"),
        packages: json("data/packages.json"),
        repos: json("data/repos.json"),
        links: json("data/links.json")
    };
    return app.topicSummary(app.topicItems(sources, topic));
}

test("remaining legacy pages protect external links", () => {
    for (const path of legacyPages) {
        const links = read(path).match(/<a\b[^>]*href="https?:\/\/[^\"]+"[^>]*>/g) || [];
        for (const link of links) {
            assert.match(link, /\brel="[^"]*\bnoopener\b[^"]*\bnoreferrer\b[^"]*"/, `${path}: ${link}`);
        }
    }
});

test("topic pages keep checked-in judgment notes without JavaScript", () => {
    for (const [path, , pattern] of topicPages) {
        const html = read(path);
        assert.match(html, /<html lang="en">/, path);
        assert.match(html, /data-topic-note/, path);
        assert.match(html, pattern, path);
        assert.match(html, /Supporting signals/i, path);
        assert.match(html, /href="..\/..\/notes\/index\.html"/, path);
        assert.match(html, /Open Notes/, path);
    }
});

test("notes index keeps checked-in topic notes without JavaScript", () => {
    const html = read("notes/index.html");

    assert.match(html, /data-notes-list/);
    assert.match(html, /Measurement decides which AI changes are safe to keep\./);
    assert.match(html, /Implementation details make AI systems easier to judge\./);
    assert.match(html, /Durable workflows matter when agents need repeatable execution\./);
    assert.match(html, /Security signals decide where automation needs stronger guardrails\./);
    assert.match(html, /href="..\/topics\/ai-evals\/index\.html"/);
    assert.match(html, /href="..\/topics\/security\/index\.html"/);
});

test("topic page legacy summaries match current topic data", () => {
    for (const [path, topic] of topicPages) {
        const html = read(path);
        const summary = topicSummary(topic);

        assert.match(html, new RegExp(`<strong data-topic-total>${summary.total}</strong>`), path);
        assert.match(html, new RegExp(`<strong data-topic-modules>${summary.modules}</strong>`), path);
        assert.match(html, new RegExp(`<strong data-topic-updated>${summary.updated}</strong>`), path);
    }
});

test("topic page legacy output renders current sections", () => {
    for (const [path] of topicPages) {
        const html = read(path);
        assert.doesNotMatch(html, /Current data fills this card|Topic fallback|Tracked topic/, path);
        assert.match(html, /Signal fit|No focused items yet/, path);
    }
});

test("remaining legacy copy avoids stale implementation language", () => {
    for (const path of legacyPages) {
        const html = read(path);
        assert.doesNotMatch(html, /2026-06-14|2026-06-15|2026-06-19/, path);
        assert.doesNotMatch(html, /Static fallback|fetch is available|checked-in JSON|checked-in data/i, path);
        assert.doesNotMatch(html, /Data date is current/, path);
    }
});
