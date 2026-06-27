import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

function read(path) {
    return readFileSync(path, "utf8");
}

test("architecture PoC gate defines scope, budgets, and static safety", () => {
    const architecture = read("docs/ARCHITECTURE.md");

    assert.match(architecture, /## Architecture PoC Gate/);
    assert.match(architecture, /Scope: Review queue/);
    assert.match(architecture, /Routes: no public route changes/);
    assert.match(architecture, /Fallback: checked-in HTML remains useful without JavaScript/);
    assert.match(architecture, /Storage: preserve `anothel\.explore\.saved\.v1`/);
    assert.match(architecture, /Budget: no framework code on `main` until a measured vanilla JS blocker exists/);
    assert.match(architecture, /Budget: PoC may add at most 20 KB raw shipped JavaScript/);
});

test("architecture PoC has not added a package manager or build output", () => {
    for (const path of ["package.json", "package-lock.json", "pnpm-lock.yaml", "yarn.lock", "dist"]) {
        assert.equal(existsSync(path), false, `${path} should not exist before a PoC proves value`);
    }
});

test("Review queue keeps public route and localStorage smoke coverage before any PoC", () => {
    assert.match(read("sitemap.xml"), /https:\/\/anothel\.github\.io\/review\//);
    assert.match(read("review/index.html"), /<article class="review-empty">/);
    assert.match(read("tests/local-state.test.mjs"), /saved item store migrates v1 ids and normalizes missing fields/);
    assert.match(read("tests/review-ui.test.mjs"), /Review browser init renders saved queue and removes items/);
});
