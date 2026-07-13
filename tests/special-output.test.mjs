import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

import { siteOrigin, sitemapEntries } from "../src/lib/site-routes.js";

const read = (path) => readFileSync(path, "utf8");
const manifest = JSON.parse(read("data/manifest.json"));
const expectedPaths = [
    "/",
    "/today/",
    "/explore/",
    "/review/",
    "/status/",
    "/trends/",
    "/packages/",
    "/repos/",
    "/links/",
    "/notes/",
    "/topics/ai-agents/",
    "/topics/mcp/",
    "/topics/agent-skills/",
    "/topics/ai-evals/",
    "/topics/ai-engineering/",
    "/topics/workflow-automation/",
    "/topics/security/"
];

test("Astro owns special output sources and pass-through files stay retired", () => {
    for (const path of ["src/pages/404.astro", "src/pages/robots.txt.ts", "src/pages/sitemap.xml.ts"]) {
        assert.equal(existsSync(path), true, path);
    }
    for (const path of ["404.html", "robots.txt", "sitemap.xml", "src/pages/[...legacy].ts", "scripts/update-static-fallbacks.mjs"]) {
        assert.equal(existsSync(path), false, `${path} should stay retired`);
    }
});

test("fresh Astro output preserves the 404 semantic contract", () => {
    const html = read("dist/404.html");

    assert.match(html, /<html lang="en">/);
    assert.match(html, /<title>Page not found - anothel<\/title>/);
    assert.match(html, /<meta name="description" content="The requested page could not be found\.">/);
    assert.match(html, /<meta name="robots" content="noindex">/);
    assert.match(html, /<link rel="canonical" href="https:\/\/anothel\.github\.io\/404\.html">/);
    assert.match(html, /<p class="eyebrow">404<\/p>/);
    assert.match(html, /<h1>Nothing tracked here\.<\/h1>/);
    assert.match(html, /class="skip-link" href="#main-content"/);
    assert.match(html, /<header class="hero-header">/);
    assert.match(html, /<main(?=[^>]*class="error-main")(?=[^>]*id="main-content")(?=[^>]*tabindex="-1")[^>]*>/);
    assert.match(html, /<h2>This page is not part of the start page\.<\/h2>/);
    assert.match(html, /<p>Return home and choose a tracked area\.<\/p>/);
    assert.match(html, /<a class="home-link" href="\/">Open home<\/a>/);
    assert.doesNotMatch(html, /class="route-nav (?:primary|secondary)-nav"/);
    assert.doesNotMatch(html, /<script\b/);
});

test("fresh Astro output emits the exact robots contract", () => {
    assert.equal(read("dist/robots.txt"), "User-agent: *\nAllow: /\n\nSitemap: https://anothel.github.io/sitemap.xml\n");
});

test("fresh Astro output emits all canonical sitemap entries in policy order", () => {
    const expected = sitemapEntries(manifest.updated);
    const xml = read("dist/sitemap.xml");
    const actual = [...xml.matchAll(/<url>\s*<loc>([^<]+)<\/loc>\s*<lastmod>([^<]+)<\/lastmod>\s*<\/url>/g)]
        .map(([, location, lastmod]) => ({ location, lastmod }));

    assert.equal(expected.length, 17);
    assert.deepEqual(expected.map(({ path }) => path), expectedPaths);
    assert.deepEqual(expected, expectedPaths.map((path) => ({
        path,
        lastmod: path === "/review/" ? "2026-06-20" : path === "/notes/" ? "2026-06-25" : manifest.updated
    })));
    assert.equal([...xml.matchAll(/<url>/g)].length, 17);
    assert.deepEqual(actual, expected.map(({ path, lastmod }) => ({ location: `${siteOrigin}${path}`, lastmod })));
});
