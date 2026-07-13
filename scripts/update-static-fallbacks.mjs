import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import vm from "node:vm";
import { pathToFileURL } from "node:url";
import "../js/safe-dom.js";
import taxonomy from "../src/lib/topic-taxonomy.js";

const { escapeHtml } = globalThis.AnothelDom;
const generatedFiles = new Set(["notes/index.html", "sitemap.xml"]);

function trimLineEnds(markup) {
    return markup.split("\n").map((line) => line.trimEnd()).join("\n");
}

function replaceTaggedText(html, attr, value) {
    const pattern = new RegExp(`(<(strong|span|p)[^>]*${attr}[^>]*>)[\\s\\S]*?(<\\/\\2>)`);
    if (!pattern.test(html)) throw new Error(`Missing legacy HTML field: ${attr}`);
    return html.replace(pattern, `$1${escapeHtml(value)}$3`);
}

function replacePattern(html, pattern, replacement, label) {
    if (!pattern.test(html)) throw new Error(`Missing legacy HTML block: ${label}`);
    return html.replace(pattern, replacement);
}

function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function readJson(path) {
    return JSON.parse(await readFile(path, "utf8"));
}

async function writeIfChanged(path, content) {
    if (!generatedFiles.has(path)) throw new Error(`Unexpected generated file: ${path}`);
    let current = "";
    try {
        current = await readFile(path, "utf8");
    } catch (error) {
        if (error.code !== "ENOENT") throw error;
    }
    await mkdir(dirname(path), { recursive: true });
    if (current !== content) await writeFile(path, content, "utf8");
}

async function notesApp() {
    const context = { console, URL, TopicTaxonomy: taxonomy };
    vm.runInNewContext(await readFile("js/safe-dom.js", "utf8"), context);
    vm.runInNewContext(await readFile("js/notes.js", "utf8"), context);
    return context.NotesApp;
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
    const notes = await notesApp();
    const noteItems = notes.noteItems();
    let notesHtml = await readFile("notes/index.html", "utf8");
    notesHtml = replaceTaggedText(notesHtml, "data-notes-count", noteItems.length);
    notesHtml = replacePattern(notesHtml, /(<section class="topic-note-panel" aria-label="Topic notes" data-notes-list>)[\s\S]*?(<\/section>)/, `$1
${trimLineEnds(notes.renderNotes(noteItems))}
            $2`, "notes list");
    await writeIfChanged("notes/index.html", notesHtml);
    await updateSitemapLastmod(manifest);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    await updateStaticFallbacks();
}
