import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

function loadSafeDom() {
    const context = { URL };
    vm.runInNewContext(readFileSync("js/safe-dom.js", "utf8"), context);
    return context.AnothelDom;
}

test("SafeDom escapes generated text", () => {
    const SafeDom = loadSafeDom();

    assert.equal(
        SafeDom.escapeHtml("<script>alert(\"x\")</script>"),
        "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;"
    );
});

test("SafeDom blocks unsafe hrefs and preserves http links", () => {
    const SafeDom = loadSafeDom();

    assert.equal(SafeDom.safeHref("javascript:alert(1)"), "#");
    assert.equal(SafeDom.safeHref("//evil.example"), "#");
    assert.equal(SafeDom.safeHref("https://example.com/docs?q=agent"), "https://example.com/docs?q=agent");
});
