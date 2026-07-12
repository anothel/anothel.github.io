import test from "node:test";
import assert from "node:assert/strict";
import { resolve } from "node:path";

import { resolveStaticPath } from "../scripts/serve.mjs";

test("resolveStaticPath maps routes to static files", () => {
    const root = resolve(process.cwd(), "dist");

    assert.equal(resolveStaticPath("/", root), resolve(root, "index.html"));
    assert.equal(resolveStaticPath("/today/", root), resolve(root, "today/index.html"));
    assert.equal(resolveStaticPath("/today", root), resolve(root, "today/index.html"));
    assert.equal(resolveStaticPath("/trends/", root), resolve(root, "trends/index.html"));
    assert.equal(resolveStaticPath("/trends", root), resolve(root, "trends/index.html"));
    assert.equal(resolveStaticPath("/css/site.css", root), resolve(root, "css/site.css"));
});

test("resolveStaticPath blocks traversal outside root", () => {
    assert.equal(resolveStaticPath("/../secret.txt", resolve(process.cwd(), "dist")), null);
});
