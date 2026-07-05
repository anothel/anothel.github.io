import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const manifest = JSON.parse(readFileSync("data/manifest.json", "utf8"));
const topicRoutes = readdirSync("topics", { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => `topics/${entry.name}/index.html`)
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
    return existsSync(directoryCandidate) ? directoryCandidate : null;
}

test("public routes resolve to checked-in HTML pages", () => {
    for (const route of publicRoutes) {
        assert.ok(existsSync(route), `Public route should exist in-repo: ${route}`);
        assert.match(readFileSync(route, "utf8"), /<html\b[^>]*>/i, `${route} should be HTML`);
    }
}
);

test("public anchors use resolvable local routes", () => {
    const missing = [];
    for (const page of publicRoutes) {
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
