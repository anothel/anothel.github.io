import test from "node:test";
import assert from "node:assert/strict";

import {
    classifySignal,
    isBaselineSignal,
    qualityBoost,
    signalReason,
    trackedTopicLabels
} from "../scripts/signal-taxonomy.mjs";

test("classifySignal maps recurring agent workflow topics", () => {
    assert.equal(classifySignal("mattpocock skills for coding agents"), "Agent skills");
    assert.equal(classifySignal("Model Context Protocol OAuth server"), "MCP");
    assert.equal(classifySignal("LLM eval benchmark harness"), "AI evals");
    assert.equal(classifySignal("Claude Code workflow automation"), "AI agents");
    assert.equal(classifySignal("nanoGPT training walkthrough"), "AI engineering");
});

test("isBaselineSignal separates broad tooling from agent workflow signals", () => {
    assert.equal(isBaselineSignal("typescript"), true);
    assert.equal(isBaselineSignal("react/react"), true);
    assert.equal(isBaselineSignal("mattpocock/skills"), false);
    assert.equal(isBaselineSignal("openai/codex"), false);
});

test("qualityBoost rewards specific agent workflow signals over broad baseline tools", () => {
    assert.ok(qualityBoost("mattpocock/skills reusable agent skills") > qualityBoost("typescript"));
    assert.ok(qualityBoost("modelcontextprotocol servers MCP") > qualityBoost("react"));
});

test("signalReason emits concise user-facing reasons", () => {
    assert.equal(
        signalReason("modelcontextprotocol servers"),
        "MCP infrastructure worth tracking for agent workflows."
    );
    assert.equal(
        signalReason("mattpocock skills"),
        "Agent skills reference for reusable tool instructions."
    );
});

test("trackedTopicLabels exposes stable topic coverage labels", () => {
    assert.deepEqual(trackedTopicLabels, [
        "AI agents",
        "Agent skills",
        "MCP",
        "AI evals",
        "AI engineering",
        "Workflow automation",
        "Developer tooling"
    ]);
});
