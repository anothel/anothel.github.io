import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const workflow = readFileSync(".github/workflows/update-trends.yml", "utf8");

test("data update workflow runs every data updater", () => {
    for (const script of [
        "scripts/update-trends.mjs",
        "scripts/update-packages.mjs",
        "scripts/update-repos.mjs",
        "scripts/update-links.mjs"
    ]) {
        assert.match(workflow, new RegExp(`node ${script.replace("/", "\\/")}`));
    }
});

test("data update workflow commits every generated data file", () => {
    for (const file of [
        "data/trends.json",
        "data/packages.json",
        "data/repos.json",
        "data/links.json"
    ]) {
        assert.match(workflow, new RegExp(file.replace("/", "\\/")));
    }
});
