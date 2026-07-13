import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { dataFiles } from "./data-contract.mjs";

export const requiredRoutes = [
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
    "/topics/agent-skills/",
    "/topics/ai-agents/",
    "/topics/ai-engineering/",
    "/topics/ai-evals/",
    "/topics/mcp/",
    "/topics/security/",
    "/topics/workflow-automation/"
];

const requiredAssets = [
    "404.html",
    "robots.txt",
    "sitemap.xml",
    "css/site.css",
    "js/dashboard.js",
    "js/data-health.js",
    "js/link-queue.js",
    "js/package-watchlist.js",
    "js/repo-watchlist.js",
    "js/safe-dom.js",
    "js/signal-schema.js",
    "js/status.mjs",
    "js/today.mjs"
];
const retiredAssets = ["js/explore.js", "js/home.mjs", "js/local-state.js", "js/notes.js", "js/review.js", "js/topic-taxonomy.js", "js/topics.js"];

function routeFile(route) {
    return route === "/" ? "index.html" : `${route.slice(1)}index.html`;
}

function htmlFiles(root, relative = "") {
    return readdirSync(resolve(root, relative), { withFileTypes: true }).flatMap((entry) => {
        const path = `${relative}${entry.name}`;
        if (entry.isDirectory()) return htmlFiles(root, `${path}/`);
        return entry.isFile() && entry.name.endsWith(".html") ? [path] : [];
    });
}

function internalHrefTarget(root, page, href) {
    const value = href.split("?")[0].split("#")[0];
    if (!value || value.startsWith("#") || /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(value)) return null;
    const target = value.startsWith("/") ? resolve(root, `.${value}`) : resolve(dirname(resolve(root, page)), value);
    const indexTarget = value.endsWith("/") ? resolve(target, "index.html") : target;
    return indexTarget;
}

function assertFile(root, file, label, failures) {
    if (!existsSync(resolve(root, file))) failures.push(`${label}: ${file}`);
}

function checkSitemap(root, failures) {
    const sitemap = readFileSync(resolve(root, "sitemap.xml"), "utf8");
    const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
    const paths = new Set();

    for (const location of locations) {
        try {
            const url = new URL(location);
            if (url.origin !== "https://anothel.github.io") {
                failures.push(`unexpected sitemap origin: ${location}`);
                continue;
            }
            if (paths.has(url.pathname)) failures.push(`duplicate sitemap location: ${url.pathname}`);
            paths.add(url.pathname);
            if (!existsSync(resolve(root, routeFile(url.pathname)))) failures.push(`missing sitemap route: ${location}`);
        } catch {
            failures.push(`invalid sitemap location: ${location}`);
        }
    }

    for (const route of requiredRoutes) {
        if (!paths.has(route)) failures.push(`missing required sitemap location: ${route}`);
    }
}

export function checkDist(root = resolve(process.cwd(), "dist")) {
    const failures = [];
    if (!existsSync(root)) throw new Error(`dist directory is missing: ${root}`);

    for (const route of requiredRoutes) assertFile(root, routeFile(route), `missing required route ${route}`, failures);
    for (const asset of requiredAssets) assertFile(root, asset, "missing required asset", failures);
    for (const asset of retiredAssets) if (existsSync(resolve(root, asset))) failures.push(`retired asset reintroduced: ${asset}`);
    if (existsSync(resolve(root, "sitemap.xml"))) checkSitemap(root, failures);
    if (!existsSync(resolve(root, "_astro")) || readdirSync(resolve(root, "_astro")).length === 0) failures.push("missing generated Astro assets: _astro/");
    for (const dataFile of dataFiles) {
        const outputFile = dataFile.replace(/^data\//, "data/");
        assertFile(root, outputFile, "missing generated data", failures);
        try {
            JSON.parse(readFileSync(resolve(root, outputFile), "utf8"));
        } catch {
            failures.push(`malformed generated data: ${outputFile}`);
        }
    }

    for (const page of htmlFiles(root)) {
        const html = readFileSync(resolve(root, page), "utf8");
        if (html.length < 100 || !/<html\b/i.test(html) || !/<body\b/i.test(html)) failures.push(`empty or malformed document: ${page}`);
        if (/\{\{[^}]+\}\}|>\s*(?:undefined|null|NaN)\s*</i.test(html)) failures.push(`unresolved placeholder: ${page}`);

        for (const match of html.matchAll(/\s(?:href|src)=(["'])(.*?)\1/gis)) {
            const target = internalHrefTarget(root, page, match[2]);
            if (target && !existsSync(target)) failures.push(`broken internal resource: ${page} -> ${match[2]}`);
        }
    }

    if (failures.length > 0) throw new Error(`dist check failed:\n${failures.join("\n")}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    checkDist();
    console.log("dist check passed");
}
