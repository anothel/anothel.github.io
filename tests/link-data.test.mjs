import test from "node:test";
import assert from "node:assert/strict";

import { buildLinkRows } from "../scripts/update-links.mjs";

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
