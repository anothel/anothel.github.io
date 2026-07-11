import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dataFiles, formatDiagnostic, validateDataMap } from "../scripts/data-contract.mjs";

function json(path) {
    return JSON.parse(readFileSync(path, "utf8"));
}

function checkedInData() {
    return Object.fromEntries(dataFiles.map((file) => [file, json(file)]));
}

function clone(value) {
    return JSON.parse(JSON.stringify(value));
}

function hasDiagnostic(result, field, message) {
    return result.errors.some((item) => item.field === field && item.message === message);
}

test("checked-in data files satisfy the data contract", () => {
    const result = validateDataMap(checkedInData());

    assert.deepEqual(result.errors, []);
});

test("invalid fixture data fails with field-level diagnostics", () => {
    const data = clone(checkedInData());

    delete data["data/trends.json"].items[0].title;
    data["data/trends.json"].items[1].rank = "2";
    data["data/trends.json"].items[2].score = 101;
    data["data/trends.json"].items[3].source = "Mastodon";
    data["data/packages.json"].updated = "2026-02-30";
    data["data/packages.json"].packages[0].category = "Nope";
    data["data/repos.json"].generatedAt = "yesterday";
    data["data/repos.json"].repos[0].extra = true;
    data["data/repos.json"].repos[1].topics = "agent";
    data["data/links.json"].links[0].url = "https://";
    data["data/links.json"].links[1].summary = " ";
    data["data/links.json"].sourceMeta.updatedAt = "2026-07-07";
    data["data/today.json"].sections[0].items[1].id = data["data/today.json"].sections[0].items[0].id;

    const result = validateDataMap(data);
    const rendered = result.errors.map(formatDiagnostic).join("\n");

    assert.ok(result.errors.length >= 12, rendered);
    assert.ok(result.errors.every((item) => item.file && item.record && item.field && item.expected && item.actual), rendered);
    assert.ok(hasDiagnostic(result, "title", "missing required field"), rendered);
    assert.ok(hasDiagnostic(result, "rank", "invalid field type"), rendered);
    assert.ok(hasDiagnostic(result, "updated", "malformed date"), rendered);
    assert.ok(hasDiagnostic(result, "url", "malformed URL"), rendered);
    assert.ok(hasDiagnostic(result, "score", "score outside the allowed range"), rendered);
    assert.ok(hasDiagnostic(result, "source", "invalid source/category value"), rendered);
    assert.ok(hasDiagnostic(result, "category", "invalid source/category value"), rendered);
    assert.ok(hasDiagnostic(result, "summary", "empty required text"), rendered);
    assert.ok(hasDiagnostic(result, "generatedAt", "invalid generatedAt value"), rendered);
    assert.ok(hasDiagnostic(result, "updatedAt", "invalid updatedAt value"), rendered);
    assert.ok(hasDiagnostic(result, "id", "duplicate item identifier"), rendered);
    assert.ok(hasDiagnostic(result, "extra", "unsupported field"), rendered);
    assert.ok(hasDiagnostic(result, "topics", "invalid field type"), rendered);
});

test("untracked JSON is a warning, not a blocking error", () => {
    const data = checkedInData();
    data["data/extra.json"] = {};

    const result = validateDataMap(data);

    assert.deepEqual(result.errors, []);
    assert.equal(result.warnings.length, 2);
    assert.ok(result.warnings.every((item) => item.level === "warning"));
});

test("valid partial source data remains publishable", () => {
    const data = clone(checkedInData());
    data["data/packages.json"].sourceMeta = {
        ...data["data/packages.json"].sourceMeta,
        status: "partial",
        errors: [{ name: "one-package", error: "429 rate limited" }],
        rateLimited: true
    };

    const result = validateDataMap(data);

    assert.deepEqual(result.errors, []);
});
