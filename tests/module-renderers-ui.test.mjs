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
        }
    };
}

async function runScript(scriptPath, data, selectors) {
    const elements = Object.fromEntries(selectors.map((selector) => [selector, createElement()]));
    const context = {
        document: {
            currentScript: { dataset: {} },
            querySelector(selector) {
                return elements[selector] || null;
            }
        },
        fetch: async () => ({
            ok: true,
            json: async () => data
        }),
        console
    };

    vm.runInNewContext(readFileSync("js/safe-dom.js", "utf8"), context);
    vm.runInNewContext(readFileSync("js/data-health.js", "utf8"), context);
    vm.runInNewContext(readFileSync(scriptPath, "utf8"), context);
    await new Promise((resolve) => setTimeout(resolve, 0));

    return elements;
}

test("package watchlist escapes generated text and blocks unsafe links", async () => {
    const elements = await runScript("js/package-watchlist.js", {
        updated: "2026-06-16",
        sourceMeta: {
            name: "npm",
            status: "partial",
            count: 1,
            errors: [{ name: "openai", error: "bad \"timeout\"" }]
        },
        packages: [
            {
                rank: 1,
                name: "<script>alert(\"pkg\")</script>",
                category: "Tooling",
                downloadsLabel: "1K/week",
                focus: "bad \"focus\"",
                url: "javascript:alert(1)"
            }
        ]
    }, [
        "[data-updated]",
        "[data-total]",
        "[data-top-package]",
        "[data-source-status]",
        "[data-data-mode]",
        "[data-source-health]",
        "[data-package-list]"
    ]);

    const html = `${elements["[data-package-list]"].innerHTML}${elements["[data-source-health]"].innerHTML}`;

    assert.doesNotMatch(html, /javascript:alert/);
    assert.match(html, /href="#"/);
    assert.match(html, /&lt;script&gt;alert\(&quot;pkg&quot;\)&lt;\/script&gt;/);
    assert.match(html, /bad &quot;focus&quot;/);
    assert.equal(elements["[data-data-mode]"].textContent, "Source health partial. Some data is stale but still usable; some sources may be missing. Retry data refresh to recover freshness.");
    assert.match(html, /status-partial/);
    assert.match(html, /1 failed: openai/);
});

test("repo watchlist escapes generated text and blocks unsafe links", async () => {
    const elements = await runScript("js/repo-watchlist.js", {
        updated: "2026-06-16",
        sourceMeta: {
            name: "GitHub",
            status: "partial",
            count: 1,
            errors: [{ name: "bad/repo", error: "rate \"limit\"" }]
        },
        repos: [
            {
                rank: 1,
                name: "<script>alert(\"repo\")</script>",
                category: "Tooling",
                starsLabel: "1K",
                focus: "bad \"focus\"",
                url: "javascript:alert(1)"
            }
        ]
    }, [
        "[data-updated]",
        "[data-total]",
        "[data-top-repo]",
        "[data-source-status]",
        "[data-data-mode]",
        "[data-source-health]",
        "[data-repo-list]"
    ]);

    const html = `${elements["[data-repo-list]"].innerHTML}${elements["[data-source-health]"].innerHTML}`;

    assert.doesNotMatch(html, /javascript:alert/);
    assert.match(html, /href="#"/);
    assert.match(html, /&lt;script&gt;alert\(&quot;repo&quot;\)&lt;\/script&gt;/);
    assert.match(html, /bad &quot;focus&quot;/);
    assert.equal(elements["[data-data-mode]"].textContent, "Source health partial. Some data is stale but still usable; some sources may be missing. Retry data refresh to recover freshness.");
    assert.match(html, /status-partial/);
    assert.match(html, /1 failed: bad\/repo/);
});

test("reference shelf renderer escapes generated text and blocks unsafe links", async () => {
    const elements = await runScript("js/link-queue.js", {
        updated: "2026-06-16",
        sourceMeta: { status: "ok" },
        links: [
            {
                rank: 1,
                title: "<script>alert(\"link\")</script>",
                category: "Docs",
                kind: "Guide",
                url: "javascript:alert(1)",
                summary: "bad \"summary\""
            }
        ]
    }, [
        "[data-updated]",
        "[data-total]",
        "[data-top-category]",
        "[data-source-status]",
        "[data-data-mode]",
        "[data-source-health]",
        "[data-category]",
        "[data-query]",
        "[data-link-list]"
    ]);

    const html = `${elements["[data-link-list]"].innerHTML}${elements["[data-source-health]"].innerHTML}`;

    assert.doesNotMatch(html, /javascript:alert/);
    assert.match(html, /href="#"/);
    assert.match(html, /&lt;script&gt;alert\(&quot;link&quot;\)&lt;\/script&gt;/);
    assert.match(html, /bad &quot;summary&quot;/);
    assert.equal(elements["[data-data-mode]"].textContent, "Source health ok. Data date 2026-06-16. No recovery needed.");
    assert.match(html, /status-ok/);
});
