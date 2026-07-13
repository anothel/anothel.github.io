import { readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import taxonomy from "../src/lib/topic-taxonomy.js";

const generatedFiles = new Set(["sitemap.xml"]);

function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function readJson(path) {
    return JSON.parse(await readFile(path, "utf8"));
}

async function writeIfChanged(path, content) {
    if (!generatedFiles.has(path)) throw new Error(`Unexpected generated file: ${path}`);
    const current = await readFile(path, "utf8");
    if (current !== content) await writeFile(path, content, "utf8");
}

function canonicalUrl(routePath) {
    return `https://anothel.github.io/${routePath.replace(/index\.html$/, "")}`;
}

function replaceSitemapLastmod(sitemap, routePath, lastmod) {
    const url = canonicalUrl(routePath);
    const pattern = new RegExp(`(<loc>${escapeRegExp(url)}</loc>\\s*<lastmod>)[^<]+(</lastmod>)`);
    if (!pattern.test(sitemap)) throw new Error(`Missing sitemap route: ${url}`);
    return sitemap.replace(pattern, `$1${lastmod}$2`);
}

async function updateSitemapLastmod(manifest) {
    const routes = [
        "index.html",
        "today/index.html",
        "explore/index.html",
        "status/index.html",
        ...(manifest.modules || []).map((module) => module.route),
        ...taxonomy.topicPageLabels.map((topic) => taxonomy.topicPageConfig(topic).routePath)
    ];
    let sitemap = await readFile("sitemap.xml", "utf8");
    for (const route of routes) sitemap = replaceSitemapLastmod(sitemap, route, manifest.updated);
    await writeIfChanged("sitemap.xml", sitemap);
}

export async function updateStaticFallbacks() {
    const manifest = await readJson("data/manifest.json");
    await updateSitemapLastmod(manifest);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    await updateStaticFallbacks();
}
