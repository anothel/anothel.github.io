import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { sectionCounts } from "../scripts/update-today.mjs";
import { renderExploreLinks, renderTodaySections, totalSectionItems } from "../js/today.js";

const todayData = JSON.parse(readFileSync("data/today.json", "utf8"));
const expectedSectionCounts = [
    sectionCounts.start,
    sectionCounts.skim,
    sectionCounts.reference
];
const expectedItemFields = ["title", "module", "origin", "category", "metric", "reason", "url", "score"];

test("totalSectionItems counts generated brief items", () => {
    assert.equal(totalSectionItems([{ items: [{}, {}] }, { items: [{}] }]), 3);
    assert.equal(totalSectionItems([]), 0);
});

test("renderTodaySections emits section cards and item links", () => {
    const sections = [
        {
            id: "start",
            title: "Start here",
            summary: "Open these first.",
            items: [
                {
                    title: "Synthetic trend",
                    module: "Trends",
                    origin: "Example source",
                    category: "Developer tools",
                    metric: "91 score",
                    reason: "Synthetic reason",
                    url: "https://example.test/trend",
                    score: 91
                }
            ]
        }
    ];
    const html = renderTodaySections(sections);

    assert.match(html, /class="today-section"/);
    assert.match(html, /class="section-heading"/);
    assert.match(html, /class="today-grid"/);
    assert.match(html, /class="signal-card today-card"/);
    assert.match(html, /Start here/);
    assert.match(html, /Open these first\./);
    assert.match(html, /href="https:\/\/example\.test\/trend"/);
    assert.match(html, /Synthetic trend/);
    assert.match(html, /Trends/);
    assert.match(html, /Example source \/ Developer tools/);
    assert.match(html, /91 score/);
    assert.match(html, /Synthetic reason/);
});

test("renderExploreLinks links to all full module pages", () => {
    const html = renderExploreLinks();

    for (const href of [
        "../trends/index.html",
        "../repos/index.html",
        "../packages/index.html",
        "../links/index.html"
    ]) {
        assert.match(html, new RegExp(`href="${href.replaceAll("/", "\\/")}"`));
    }
});

test("checked-in today data has stable section contract", () => {
    assert.deepEqual(todayData.sections.map((section) => section.id), ["start", "skim", "reference"]);
    assert.ok(todayData.sections.every((section) => section.summary));
    assert.deepEqual(todayData.sections.map((section) => section.items.length), expectedSectionCounts);
    assert.equal(totalSectionItems(todayData.sections), todayData.sourceMeta.count);

    for (const section of todayData.sections) {
        for (const item of section.items) {
            for (const field of expectedItemFields) {
                assert.ok(Object.hasOwn(item, field), `${section.id} item missing ${field}`);
            }
        }
    }
});
