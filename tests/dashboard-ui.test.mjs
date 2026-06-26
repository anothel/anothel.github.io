import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

function createElement() {
    return {
        innerHTML: "",
        textContent: "",
        value: "all",
        listeners: {},
        addEventListener(type, listener) {
            this.listeners[type] = listener;
        },
        dispatch(type, value = this.value) {
            this.value = value;
            this.listeners[type]?.({ target: this });
        }
    };
}

async function runDashboard(data) {
    const elements = {
        "[data-grid]": createElement(),
        "[data-table]": createElement(),
        "select[data-source]": createElement(),
        "[data-category]": createElement(),
        "[data-query]": createElement(),
        "[data-sort]": createElement(),
        "[data-updated]": createElement(),
        "[data-data-mode]": createElement(),
        "[data-source-health]": createElement(),
        "[data-total]": createElement(),
        "[data-top-score]": createElement(),
        "[data-top-category]": createElement(),
        "[data-filter-summary]": createElement(),
        "[data-clear-filters]": createElement()
    };

    const context = {
        document: {
            currentScript: { dataset: { source: "data/trends.json" } },
            querySelector(selector) {
                return elements[selector] || null;
            }
        },
        fetch: async () => ({
            ok: true,
            json: async () => data
        }),
        URL,
        console
    };

    vm.runInNewContext(readFileSync("js/safe-dom.js", "utf8"), context);
    vm.runInNewContext(readFileSync("js/data-health.js", "utf8"), context);
    vm.runInNewContext(readFileSync("js/dashboard.js", "utf8"), context);
    await new Promise((resolve) => setTimeout(resolve, 0));

    return elements;
}

test("dashboard fills filters, summarizes active filters, and clears them", async () => {
    const elements = await runDashboard({
        updated: "2026-06-16",
        sourceMeta: [],
        items: [
            {
                rank: 1,
                title: "Agent repo",
                source: "GitHub",
                category: "AI",
                score: 95,
                velocity: "10K stars",
                url: "https://example.com/repo",
                summary: "Repository signal."
            },
            {
                rank: 2,
                title: "Runtime package",
                source: "npm",
                category: "JavaScript",
                score: 90,
                velocity: "1M/week",
                url: "https://example.com/package",
                summary: "Package signal."
            }
        ]
    });

    assert.match(elements["select[data-source]"].innerHTML, /GitHub/);
    assert.match(elements["select[data-source]"].innerHTML, /npm/);
    assert.equal(elements["[data-filter-summary]"].textContent, "Showing all signals.");

    elements["select[data-source]"].dispatch("change", "GitHub");
    assert.equal(elements["[data-total]"].textContent, "1");
    assert.equal(elements["[data-filter-summary]"].textContent, "Origin: GitHub");

    elements["[data-query]"].dispatch("input", "missing");
    assert.equal(elements["[data-total]"].textContent, "0");
    assert.match(elements["[data-grid]"].innerHTML, /No matching signals/);
    assert.equal(elements["[data-filter-summary]"].textContent, "Origin: GitHub / Search: missing");

    elements["[data-clear-filters]"].dispatch("click");
    assert.equal(elements["select[data-source]"].value, "all");
    assert.equal(elements["[data-category]"].value, "all");
    assert.equal(elements["[data-query]"].value, "");
    assert.equal(elements["[data-sort]"].value, "rank");
    assert.equal(elements["[data-total]"].textContent, "2");
    assert.equal(elements["[data-filter-summary]"].textContent, "Showing all signals.");
});

test("dashboard escapes generated text and blocks unsafe item links", async () => {
    const elements = await runDashboard({
        updated: "2026-06-16",
        sourceMeta: [
            {
                name: "<script>source()</script>",
                status: "partial",
                count: 1,
                updatedAt: "bad \"time\"",
                errors: [
                    { name: "bad-source", error: "bad \"timeout\"" }
                ]
            }
        ],
        items: [
            {
                rank: 1,
                title: "<script>alert(\"x\")</script>",
                source: "GitHub",
                category: "AI",
                score: 95,
                velocity: "10K stars",
                url: "javascript:alert(1)",
                summary: "bad \"quote\""
            }
        ]
    });

    const html = `${elements["[data-grid]"].innerHTML}${elements["[data-table]"].innerHTML}${elements["[data-source-health]"].innerHTML}`;

    assert.doesNotMatch(html, /javascript:alert/);
    assert.match(html, /href="#"/);
    assert.match(html, /&lt;script&gt;alert\(&quot;x&quot;\)&lt;\/script&gt;/);
    assert.match(html, /bad &quot;quote&quot;/);
    assert.match(html, /&lt;script&gt;source\(\)&lt;\/script&gt;/);
    assert.match(html, /status-partial/);
    assert.match(html, /1 failed: bad-source/);
    assert.match(html, /bad &quot;timeout&quot;/);
});

test("dashboard trend cards are directly clickable links", async () => {
    const elements = await runDashboard({
        updated: "2026-06-16",
        sourceMeta: [],
        items: [
            {
                rank: 1,
                title: "Clickable trend",
                source: "GitHub",
                category: "AI agents",
                score: 95,
                velocity: "10K stars",
                url: "https://example.com/clickable",
                summary: "Card should open directly."
            }
        ]
    });

    assert.match(elements["[data-grid]"].innerHTML, /<a class="trend-card" href="https:\/\/example\.com\/clickable">/);
    assert.doesNotMatch(elements["[data-grid]"].innerHTML, />Open item<\/a>/);
});
