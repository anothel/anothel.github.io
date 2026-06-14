import test from "node:test";
import assert from "node:assert/strict";
import { applyManifest, formatModuleMeta, formatModuleStatus } from "../js/home.js";

test("formatModuleMeta summarizes module count, source, and freshness", () => {
    assert.equal(
        formatModuleMeta({
            count: 11,
            source: "Hacker News, GitHub, npm",
            updated: "2026-06-14"
        }),
        "11 items | Hacker News, GitHub, npm | updated 2026-06-14"
    );
});

test("formatModuleMeta uses singular item label", () => {
    assert.equal(
        formatModuleMeta({
            count: 1,
            source: "manual",
            updated: "2026-06-14"
        }),
        "1 item | manual | updated 2026-06-14"
    );
});

test("formatModuleStatus maps data status to home badge copy", () => {
    assert.equal(formatModuleStatus("ok"), "Live");
    assert.equal(formatModuleStatus("error"), "Check");
    assert.equal(formatModuleStatus("unknown"), "Unknown");
});

test("applyManifest updates matching module cards", () => {
    const status = { textContent: "Live" };
    const meta = { textContent: "Static data available." };
    const card = {
        dataset: { moduleId: "trends" },
        querySelector(selector) {
            if (selector === "[data-module-status]") return status;
            if (selector === "[data-module-meta]") return meta;
            return null;
        }
    };
    const root = {
        querySelectorAll(selector) {
            assert.equal(selector, "[data-module-card]");
            return [card];
        }
    };

    const count = applyManifest(root, {
        modules: [
            {
                id: "trends",
                status: "ok",
                count: 11,
                source: "Hacker News, GitHub, npm",
                updated: "2026-06-14"
            }
        ]
    });

    assert.equal(count, 1);
    assert.equal(status.textContent, "Live");
    assert.equal(meta.textContent, "11 items | Hacker News, GitHub, npm | updated 2026-06-14");
});
