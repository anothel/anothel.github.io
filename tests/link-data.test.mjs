import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { buildLinkRows, linkDefinitions } from "../scripts/update-links.mjs";
import { activeItems } from "../scripts/watchlist-governance.mjs";
import { referenceList } from "../src/lib/site-data.js";

function readJson(path) {
    return JSON.parse(readFileSync(path, "utf8"));
}

test("default link definitions come from checked-in watchlist data", () => {
    assert.deepEqual(linkDefinitions, activeItems(readJson("data/watchlists.json").links));
});

test("buildLinkRows sorts links by category and title", () => {
    const rows = buildLinkRows([
        {
            title: "MDN Web Docs",
            category: "Frontend",
            kind: "Docs",
            url: "https://developer.mozilla.org/",
            summary: "Reference for web platform APIs."
        },
        {
            title: "GitHub REST API",
            category: "API",
            kind: "Docs",
            url: "https://docs.github.com/en/rest",
            summary: "GitHub API documentation."
        }
    ]);

    assert.deepEqual(rows, [
        {
            rank: 1,
            title: "GitHub REST API",
            category: "API",
            kind: "Docs",
            url: "https://docs.github.com/en/rest",
            summary: "GitHub API documentation."
        },
        {
            rank: 2,
            title: "MDN Web Docs",
            category: "Frontend",
            kind: "Docs",
            url: "https://developer.mozilla.org/",
            summary: "Reference for web platform APIs."
        }
    ]);
});

test("referenceList preserves source order, marks the first four, canonicalizes duplicate identity, and rejects unsafe URLs", () => {
    const links = referenceList([
        { title: "One", url: "https://EXAMPLE.com/docs/#intro" },
        { title: "Duplicate title differs", url: "https://example.com/docs" },
        { title: "One", url: "https://example.com/other" },
        { title: "Three", url: "https://example.com/three" },
        { title: "Unsafe", url: "javascript:alert(1)" },
        { title: "Five", url: "https://example.com/five" }
    ]);

    assert.deepEqual(links.map(({ title, featured }) => [title, featured]), [
        ["One", true],
        ["One", true],
        ["Three", true],
        ["Five", false]
    ]);
});

test("default links include AI skills and agent references", () => {
    const titles = new Set(linkDefinitions.map((link) => link.title));
    const categories = new Set(linkDefinitions.map((link) => link.category));
    const categoryByTitle = new Map(linkDefinitions.map((link) => [link.title, link.category]));

    assert.ok(linkDefinitions.length >= 25);
    assert.ok(categories.has("Agent skills"));
    assert.ok(categories.has("AI agents"));
    assert.ok(categories.has("MCP"));
    assert.ok(titles.has("Anthropic Agent Skills"));
    assert.ok(titles.has("mattpocock/skills"));
    assert.ok(titles.has("GitHub Awesome Copilot"));
    assert.ok(titles.has("Model Context Protocol servers"));
    assert.ok(titles.has("OpenAI Agents SDK"));
    assert.ok(titles.has("MCP TypeScript SDK"));
    assert.ok(titles.has("OpenCode"));
    assert.ok(titles.has("Goose"));
    assert.ok(titles.has("Aider"));
    assert.ok(titles.has("Gemini CLI"));
    assert.ok(titles.has("MCP Python SDK"));
    assert.ok(titles.has("MCP Registry"));
    assert.ok(titles.has("Awesome MCP Servers"));
    assert.ok(titles.has("Evalite"));
    assert.ok(titles.has("Karpathy GitHub"));
    assert.equal(categoryByTitle.get("Model Context Protocol servers"), "MCP");
});

test("default links include AI evals and workflow automation references", () => {
    const expanded = linkDefinitions.filter((item) =>
        ["AI evals", "Workflow automation"].includes(item.category)
    );
    const titles = new Set(expanded.map((item) => item.title));

    assert.ok(expanded.length >= 6);
    assert.ok(titles.has("Promptfoo"));
    assert.ok(titles.has("DeepEval"));
    assert.ok(titles.has("Langfuse"));
    assert.ok(titles.has("Trigger.dev"));
    assert.ok(titles.has("Temporal TypeScript SDK"));
    assert.ok(titles.has("Pipedream"));
});
