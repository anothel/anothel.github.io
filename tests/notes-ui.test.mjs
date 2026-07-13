import test from "node:test";
import assert from "node:assert/strict";
import { topicNotes } from "../src/lib/topic-taxonomy.js";

const expectedTopics = [
    "AI agents",
    "MCP",
    "Agent skills",
    "AI evals",
    "AI engineering",
    "Workflow automation",
    "Security"
];

test("Notes model contains exactly the route-backed topic notes in canonical order", () => {
    const notes = topicNotes("../");

    assert.deepEqual(notes.map((note) => note.topic), expectedTopics);
    assert.equal(notes.length, 7);
    assert.equal(notes.some((note) => note.topic === "Developer tooling"), false);
    assert.equal(notes[0].route, "../topics/ai-agents/index.html");
    assert.equal(notes[3].exploreRoute, "../explore/index.html?focus=AI%20evals");
    assert.equal(notes[4].route, "../topics/ai-engineering/index.html");
    assert.equal(notes[6].route, "../topics/security/index.html");
});

test("Notes model exposes complete copy and safe internal routes", () => {
    for (const item of topicNotes("../")) {
        assert.ok(item.note.title, `${item.topic} title`);
        assert.ok(item.note.body, `${item.topic} body`);
        assert.ok(item.note.readWhen, `${item.topic} readWhen`);
        assert.ok(item.description, `${item.topic} description`);

        const topicUrl = new URL(item.route, "https://anothel.github.io/notes/");
        const exploreUrl = new URL(item.exploreRoute, "https://anothel.github.io/notes/");
        assert.equal(topicUrl.origin, "https://anothel.github.io", `${item.topic} topic origin`);
        assert.match(topicUrl.pathname, /^\/topics\/[a-z0-9]+(?:-[a-z0-9]+)*\/index\.html$/, `${item.topic} topic route`);
        assert.equal(exploreUrl.origin, "https://anothel.github.io", `${item.topic} Explore origin`);
        assert.equal(exploreUrl.pathname, "/explore/index.html", `${item.topic} Explore route`);
        assert.equal(exploreUrl.searchParams.get("focus"), item.topic, `${item.topic} encoded focus`);
    }
});
