import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { topicByLabel, topicPageLabels } from "../src/lib/topic-taxonomy.js";

const manifest = JSON.parse(readFileSync("data/manifest.json", "utf8"));
const topicRoutes = topicPageLabels
    .map((label) => topicByLabel(label).routePath)
    .sort();

const coreRoutes = [
    "index.html",
    "today/index.html",
    "explore/index.html",
    "review/index.html",
    "status/index.html",
    "notes/index.html",
    ...manifest.modules.map((module) => module.route).sort()
];
const publicRoutes = [...new Set([...coreRoutes, ...topicRoutes])];
const artifactRoutes = publicRoutes.map((route) => resolve("dist", route));
const canonicalSecureKitUrl = "https://github.com/anothel/AnoSecureKit-Community";

function extractAnchors(html) {
    const anchorRegex = /<a\b[^>]*\shref=(["'])(.*?)\1/gis;
    return Array.from(html.matchAll(anchorRegex), (match) => match[2]);
}

function isSkippableHref(href) {
    return (
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.startsWith("javascript:") ||
        /^\/\//.test(href) ||
        /^[a-z][a-z0-9+.-]*:/.test(href) ||
        href === "/"
    );
}

function localRouteTarget(pagePath, href) {
    const baseHref = href.split("?")[0].split("#")[0];
    if (!baseHref) return null;
    if (isSkippableHref(baseHref)) return null;
    if (baseHref.startsWith("/")) return null;

    const directoryHref = baseHref.endsWith("/") ? `${baseHref}index.html` : baseHref;
    const candidate = resolve(dirname(pagePath), directoryHref);
    if (existsSync(candidate)) return candidate;

    const directoryCandidate = resolve(dirname(pagePath), `${baseHref.replace(/\/+$/, "")}/index.html`);
    return directoryCandidate;
}

test("canonical taxonomy exposes exactly seven public topic routes", () => {
    assert.equal(topicRoutes.length, 7);
    assert.equal(new Set(topicRoutes).size, 7);
    assert.ok(!topicRoutes.some((route) => route.includes("developer-tooling")));
});

test("public routes resolve to generated Astro HTML", () => {
    for (const route of artifactRoutes) {
        assert.ok(existsSync(route), `Generated public route should exist: ${route}`);
        assert.match(readFileSync(route, "utf8"), /<html\b[^>]*>/i, `${route} should be HTML`);
    }
}
);

test("Home SecureKit card uses the verified public destination", () => {
    const html = readFileSync(resolve("dist", "index.html"), "utf8");
    const projectAnchor = html.match(/<a\b[^>]*\bclass="project-card"[^>]*>/i)?.[0];
    assert.ok(projectAnchor, "Home should render the SecureKit project card");

    const href = projectAnchor.match(/\bhref="([^"]+)"/i)?.[1];
    assert.ok(href, "Home SecureKit card should have a destination");

    const destination = new URL(href, "https://anothel.github.io/");
    if (destination.origin === "https://anothel.github.io") {
        const route = destination.pathname.replace(/^\/+|\/+$/g, "");
        const artifact = route
            ? resolve("dist", route, "index.html")
            : resolve("dist", "index.html");
        assert.ok(existsSync(artifact), `Home project route should exist: ${destination.pathname}`);
    }

    assert.equal(href, canonicalSecureKitUrl);
    assert.match(projectAnchor, /\brel="noopener noreferrer"/i);
});

test("public anchors use resolvable local routes", () => {
    const missing = [];
    for (const page of artifactRoutes) {
        const html = readFileSync(page, "utf8");
        const anchors = extractAnchors(html);
        for (const rawHref of anchors) {
            const target = localRouteTarget(page, rawHref);
            if (!target) continue;
            if (!existsSync(target)) {
                missing.push(`${page} -> ${rawHref}`);
            }
        }
    }

    assert.equal(missing.length, 0, `Missing local href targets:\n${missing.join("\n")}`);
});
