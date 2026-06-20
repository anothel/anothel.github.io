import test from "node:test";
import assert from "node:assert/strict";

import { buildLinkRows, linkDefinitions } from "../scripts/update-links.mjs";

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

test("default links include AI skills and agent references", () => {
    const titles = new Set(linkDefinitions.map((link) => link.title));
    const categories = new Set(linkDefinitions.map((link) => link.category));

    assert.ok(linkDefinitions.length >= 18);
    assert.ok(categories.has("Agent skills"));
    assert.ok(categories.has("AI agents"));
    assert.ok(titles.has("Anthropic Agent Skills"));
    assert.ok(titles.has("mattpocock/skills"));
    assert.ok(titles.has("GitHub Awesome Copilot"));
    assert.ok(titles.has("Model Context Protocol servers"));
    assert.ok(titles.has("OpenAI Agents SDK"));
    assert.ok(titles.has("MCP TypeScript SDK"));
    assert.ok(titles.has("Evalite"));
    assert.ok(titles.has("Karpathy GitHub"));
});
