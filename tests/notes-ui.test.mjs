import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

function loadNotes() {
    const context = { console, URL };
    vm.runInNewContext(readFileSync("js/safe-dom.js", "utf8"), context);
    vm.runInNewContext(readFileSync("js/topic-taxonomy.js", "utf8"), context);
    vm.runInNewContext(readFileSync("js/notes.js", "utf8"), context);
    return context.NotesApp;
}

test("Notes index builds routed topic notes from taxonomy", () => {
    const app = loadNotes();
    const notes = app.noteItems();

    assert.deepEqual(JSON.parse(JSON.stringify(notes.map((note) => note.topic))), [
        "AI agents",
        "MCP",
        "Agent skills",
        "AI evals",
        "Workflow automation",
        "Security"
    ]);
    assert.equal(notes[0].route, "../topics/ai-agents/index.html");
    assert.equal(notes[3].exploreRoute, "../explore/index.html?focus=AI%20evals");
    assert.equal(notes[5].route, "../topics/security/index.html");
});

test("Notes renderer escapes copy and blocks unsafe links", () => {
    const app = loadNotes();
    const html = app.renderNotes([
        {
            topic: "<bad>",
            description: "Use \"care\"",
            route: "javascript:alert(1)",
            exploreRoute: "//evil.example",
            note: {
                title: "Title <x>",
                body: "Body & copy",
                readWhen: "Read \"now\""
            }
        }
    ]);

    assert.match(html, /&lt;bad&gt;/);
    assert.match(html, /Use &quot;care&quot;/);
    assert.match(html, /Title &lt;x&gt;/);
    assert.match(html, /Body &amp; copy/);
    assert.match(html, /Read &quot;now&quot;/);
    assert.match(html, /href="#"/);
});
