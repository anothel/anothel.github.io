import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { measureAssetSizes } from "../scripts/check-size.mjs";

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

test("Home uses only its bundled native module for browser-local saved counts", () => {
    const page = read("src/pages/index.astro");
    const module = read("src/scripts/home-saved-summary.js");
    const html = read("dist/index.html");
    const forbiddenWrites = /document\.createElement\s*\(\s*["']script["']\s*\)|\.innerHTML\s*(?:\+?=)/;

    assert.doesNotMatch(page, /js\/local-state\.js|globalThis\.AnothelState|\bclient:[a-z]+\b|from\s*["']react["']/i);
    assert.doesNotMatch(module, /\bAnothelState\b|from\s*["']react["']/i);
    assert.doesNotMatch(page, forbiddenWrites);
    assert.doesNotMatch(module, forbiddenWrites);
    assert.doesNotMatch(html, /js\/local-state\.js|<astro-island\b|\bcomponent-url=|\brenderer-url=/i);

    const sizes = measureAssetSizes();
    assert.ok(!sizes.routes.home.jsAssets.includes(sizes.routes.explore.clientAsset));
    assert.ok(sizes.routes.home.jsAssets.every((asset) => !/(?:Explore|Review)Island|(?:^|\/)client\.[^/]+\.js$/.test(asset)));
});

test("the retired Home browser module cannot be republished accidentally", () => {
    const route = read("src/pages/js/[file].mjs.ts");
    const checkDist = read("scripts/check-dist.mjs");
    const requiredAssets = checkDist.match(/const requiredAssets = \[([\s\S]*?)\];/)?.[1] || "";
    const retiredAssets = checkDist.match(/const retiredAssets = \[([\s\S]*?)\];/)?.[1] || "";

    assert.equal(existsSync("js/home.mjs"), false);
    assert.equal(existsSync("dist/js/home.mjs"), false);
    assert.doesNotMatch(route, /^\s*["']home["']\s*,?/m);
    assert.doesNotMatch(requiredAssets, /["']js\/home\.mjs["']/);
    assert.match(retiredAssets, /["']js\/home\.mjs["']/);
});
