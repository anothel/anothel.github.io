import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");
const islands = ["src/components/ExploreIsland.jsx", "src/components/ReviewIsland.jsx"];

test("Explore and Review islands cannot reintroduce browser-global script bridges", () => {
    const forbidden = [
        [/\bloadScript\s*\(/, "dynamic script loader"],
        [/\bscriptNames\b/, "dynamic script list"],
        [/document\.createElement\s*\(\s*["']script["']\s*\)/, "dynamic script element"],
        [/dangerouslySetInnerHTML/, "dangerouslySetInnerHTML"],
        [/\.innerHTML\s*(?:\+?=)/, "innerHTML write"],
        [/\[\s*["']innerHTML["']\s*\]\s*(?:\+?=)/, "innerHTML bracket write"],
        [/\b(?:globalThis|window|self)\s*\.\s*(?:ExploreApp|ReviewApp)\b/, "legacy global dependency"]
    ];
    for (const path of islands) {
        const source = read(path);
        for (const [pattern, label] of forbidden) assert.doesNotMatch(source, pattern, `${path}: ${label}`);
    }
});

test("generated island routes cannot reference retired Explore or Review scripts", () => {
    const references = /\b(?:src|href)=["'](?:[^"']*\/)?js\/(?:explore|review)\.js(?:[?#][^"']*)?["']/i;
    assert.doesNotMatch(read("dist/explore/index.html"), references);
    assert.doesNotMatch(read("dist/review/index.html"), references);
    assert.equal(existsSync("dist/js/explore.js"), false);
    assert.equal(existsSync("dist/js/review.js"), false);
});

test("Astro browser-asset routes cannot republish retired bridge files", () => {
    const route = read("src/pages/js/[file].js.ts");
    const requiredAssets = read("scripts/check-dist.mjs").match(/const requiredAssets = \[([\s\S]*?)\];/)?.[1] || "";
    for (const name of ["explore", "review"]) {
        assert.doesNotMatch(route, new RegExp(`^\\s*["']${name}["']\\s*,?`, "m"));
        assert.doesNotMatch(requiredAssets, new RegExp(`["']js/${name}\\.js["']`));
        assert.equal(existsSync(`js/${name}.js`), false);
        assert.equal(existsSync(`src/pages/js/${name}.js.ts`), false);
    }
});
