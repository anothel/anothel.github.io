import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { measureAssetSizes } from "../scripts/check-size.mjs";

const read = (path) => readFileSync(path, "utf8");
const islands = ["src/components/ExploreIsland.jsx", "src/components/ReviewIsland.jsx"];
const topicSlugs = ["agent-skills", "ai-agents", "ai-engineering", "ai-evals", "mcp", "security", "workflow-automation"];
const retiredNotesGlobal = ["Notes", "App"].join("");

function topicSourcePages() {
    if (!existsSync("topics")) return [];
    return readdirSync("topics", { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => `topics/${entry.name}/index.html`)
        .filter(existsSync)
        .sort();
}

function sourceFiles(directory) {
    return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
        const path = `${directory}/${entry.name}`;
        return entry.isDirectory() ? sourceFiles(path) : [path];
    });
}

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

test("topic routes use static Astro templates and only a native pin module", () => {
    const sources = [
        ["src/pages/topics/[slug].astro", read("src/pages/topics/[slug].astro")],
        ["src/lib/topic-domain.js", read("src/lib/topic-domain.js")],
        ["src/scripts/topic-pin.js", read("src/scripts/topic-pin.js")]
    ];
    const forbidden = [
        [/js\/(?:topics|local-state)\.js/, "retired topic script"],
        [/\b(?:TopicApp|AnothelState)\b/, "legacy browser global"],
        [/\bclient:[a-z]+\b/, "React hydration directive"],
        [/from\s*["']react["']|<astro-island\b/i, "React runtime"],
        [/dangerouslySetInnerHTML|set:html/, "HTML injection escape hatch"],
        [/\.innerHTML\s*(?:\+?=)/, "innerHTML write"],
        [/document\.createElement\s*\(\s*["']script["']\s*\)/, "dynamic script creation"]
    ];

    for (const [path, source] of sources) {
        for (const [pattern, label] of forbidden) assert.doesNotMatch(source, pattern, `${path}: ${label}`);
    }
    assert.doesNotMatch(sources[0][1], /\bfetch\s*\(/, "topic content should be available at build time");

    for (const slug of topicSlugs) {
        const html = read(`dist/topics/${slug}/index.html`);
        assert.doesNotMatch(html, /js\/(?:topics|local-state)\.js|\b(?:TopicApp|AnothelState)\b|<astro-island\b|\bcomponent-url=|\brenderer-url=/i, slug);
    }
});

test("Notes is static Astro output with one canonical taxonomy and no browser runtime", () => {
    const page = read("src/pages/notes/index.astro");
    const html = read("dist/notes/index.html");
    const forbiddenSource = /dangerouslySetInnerHTML|set:html|\.innerHTML\s*(?:\+?=)|\bclient:[a-z]+\b|from\s*["']react["']|\bfetch\s*\(|<script\b/i;
    const forbiddenOutput = /js\/(?:notes|safe-dom|topic-taxonomy)\.js|<script\b|<astro-island\b|\bcomponent-url=|\brenderer-url=/i;

    assert.doesNotMatch(page, forbiddenSource);
    assert.doesNotMatch(html, forbiddenOutput);
    assert.doesNotMatch(page, new RegExp(`\\b${retiredNotesGlobal}\\b`));
    assert.doesNotMatch(html, new RegExp(`\\b${retiredNotesGlobal}\\b`));
    assert.doesNotMatch(html, />\s*(?:undefined|null|NaN)\s*</i);

    const definitionSources = ["src", "scripts", "js"]
        .flatMap(sourceFiles)
        .filter((path) => /\.(?:astro|js|jsx|mjs|ts)$/.test(path))
        .filter((path) => /(?:export\s+)?const\s+topicDefinitions\s*=\s*\[/.test(read(path)));
    assert.deepEqual(definitionSources, ["src/lib/topic-taxonomy.js"]);

    const notes = measureAssetSizes().routes.notes;
    assert.equal(notes.routeJs, 0);
    assert.equal(notes.totalJs, 0);
});

test("Explore and Review use the canonical topic taxonomy", () => {
    const explore = read("src/lib/explore-domain.js");
    const review = read("src/lib/review-domain.js");

    assert.match(explore, /import taxonomy from ["']\.\/topic-taxonomy\.js["']/);
    assert.match(explore, /focusDefinitions\s*=\s*taxonomy\.topicLensDefinitions\(["']\.\.\/["']\)/);
    assert.match(explore, /taxonomy\.matchesTopic\(item, focus\)/);
    assert.doesNotMatch(explore, /(?:const|let|var)\s+focusDefinitions\s*=\s*\[/);
    assert.doesNotMatch(review, /\.pattern\.test\(|\.requires\.test\(/);
});

test("retired Notes and topic HTML or browser globals cannot return through build routes and workflows", () => {
    const legacyRoute = read("src/pages/[...legacy].ts");
    const browserAssets = read("src/pages/js/[file].js.ts");
    const updater = read("scripts/update-static-fallbacks.mjs");
    const workflow = read(".github/workflows/update-trends.yml");
    const checkDist = read("scripts/check-dist.mjs");
    const requiredAssets = checkDist.match(/const requiredAssets = \[([\s\S]*?)\];/)?.[1] || "";
    const retiredAssets = checkDist.match(/const retiredAssets = \[([\s\S]*?)\];/)?.[1] || "";

    assert.equal(existsSync("notes/index.html"), false, "checked-in Notes HTML must stay retired");
    assert.deepEqual(topicSourcePages(), [], "checked-in topics/*/index.html must stay retired");
    assert.doesNotMatch(legacyRoute, /["'](?:notes|topics)\//);
    assert.doesNotMatch(browserAssets, /^\s*["'](?:local-state|notes|topic-taxonomy|topics)["']\s*,?/m);
    const writeTargets = [...updater.matchAll(/\bawait\s+writeIfChanged\(\s*([^,\n)]+)/g)]
        .map((match) => match[1].trim())
        .sort();
    assert.deepEqual(writeTargets, ['"sitemap.xml"']);
    assert.match(updater, /const generatedFiles = new Set\(\[["']sitemap\.xml["']\]\)/);
    assert.doesNotMatch(updater, /notes\/index\.html|js\/notes\.js|js\/safe-dom\.js|node:vm|runInNewContext|\bTopicApp\b|js\/topics\.js|function renderTopicPage/);
    assert.doesNotMatch(updater, new RegExp(`\\b${retiredNotesGlobal}\\b`));
    assert.doesNotMatch(workflow, /notes\/index\.html|topics\/[a-z-]+\/index\.html/);

    for (const asset of ["js/local-state.js", "js/notes.js", "js/topic-taxonomy.js", "js/topics.js"]) {
        const escaped = asset.replaceAll(/[.*+?^${}()|[\]\\]/g, "\\$&");
        assert.equal(existsSync(asset), false, asset);
        assert.equal(existsSync(`dist/${asset}`), false, `dist/${asset}`);
        assert.doesNotMatch(requiredAssets, new RegExp(`["']${escaped}["']`));
        assert.match(retiredAssets, new RegExp(`["']${escaped}["']`));
    }
});
