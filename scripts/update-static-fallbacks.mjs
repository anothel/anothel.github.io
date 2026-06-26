import { readFile, writeFile } from "node:fs/promises";
import vm from "node:vm";
import { pathToFileURL } from "node:url";
import "../js/safe-dom.js";
import { buildHomeOverview } from "../js/home.js";
import { renderTodayStatus } from "../js/today.js";
import { buildStatusSummary, collectSourceRows, renderRefreshRun, renderSourceRows } from "../js/status.js";

const topicPages = [
    ["topics/ai-agents/index.html", "AI agents"],
    ["topics/mcp/index.html", "MCP"],
    ["topics/agent-skills/index.html", "Agent skills"],
    ["topics/ai-evals/index.html", "AI evals"],
    ["topics/workflow-automation/index.html", "Workflow automation"]
];

const { escapeHtml } = globalThis.AnothelDom;

function dataModeText(health, updated) {
    if (health.includes("partial")) return "Source health partial. Usable data remains available.";
    if (health.includes("fallback")) return "Source health fallback. Previous data remains available.";
    if (health.includes("error")) return "Source health failed. Check Status before trusting freshness.";
    return `Source health ok. Data date ${updated}.`;
}

function trimLineEnds(markup) {
    return markup.split("\n").map((line) => line.trimEnd()).join("\n");
}

function replaceTaggedText(html, attr, value) {
    const pattern = new RegExp(`(<(strong|span)[^>]*${attr}[^>]*>)[\\s\\S]*?(<\\/\\2>)`);
    if (!pattern.test(html)) throw new Error(`Missing static fallback field: ${attr}`);
    return html.replace(pattern, `$1${escapeHtml(value)}$3`);
}

function replacePattern(html, pattern, replacement, label) {
    if (!pattern.test(html)) throw new Error(`Missing static fallback block: ${label}`);
    return html.replace(pattern, replacement);
}

async function readJson(path) {
    return JSON.parse(await readFile(path, "utf8"));
}

async function writeIfChanged(path, html) {
    const current = await readFile(path, "utf8");
    if (current !== html) await writeFile(path, html, "utf8");
}

async function loadDatasets(manifest) {
    const entries = await Promise.all((manifest.modules || []).map(async (module) => {
        const data = await readJson(module.data);
        return [module.id, data];
    }));
    return Object.fromEntries(entries);
}

async function topicApp() {
    const context = { console, URL };
    vm.runInNewContext(await readFile("js/safe-dom.js", "utf8"), context);
    vm.runInNewContext(await readFile("js/topic-taxonomy.js", "utf8"), context);
    vm.runInNewContext(await readFile("js/topics.js", "utf8"), context);
    return context.TopicApp;
}

async function notesApp() {
    const context = { console, URL };
    vm.runInNewContext(await readFile("js/safe-dom.js", "utf8"), context);
    vm.runInNewContext(await readFile("js/topic-taxonomy.js", "utf8"), context);
    vm.runInNewContext(await readFile("js/notes.js", "utf8"), context);
    return context.NotesApp;
}

async function updateStaticFallbacks() {
    const manifest = await readJson("data/manifest.json");
    const today = await readJson("data/today.json");
    const report = await readJson("data/refresh-report.json");
    const datasets = await loadDatasets(manifest);
    const modules = manifest.modules || [];
    const generatedAt = report.generatedAt || manifest.generatedAt || manifest.updated || "-";
    const homeOverview = buildHomeOverview(manifest, { today: generatedAt });
    const statusSummary = buildStatusSummary(manifest, datasets);
    const rows = collectSourceRows(manifest, datasets, { today: generatedAt });
    const updated = homeOverview.updated;

    let home = await readFile("index.html", "utf8");
    home = replaceTaggedText(home, "data-home-total", homeOverview.totalItems);
    home = replaceTaggedText(home, "data-home-live", homeOverview.healthLabel);
    home = replaceTaggedText(home, "data-home-updated", updated);
    home = replaceTaggedText(home, "data-home-freshness", homeOverview.dataState);
    home = replacePattern(home, /<p class="stamp">Data date [^<]+<\/p>/, `<p class="stamp">Data date ${escapeHtml(updated)}</p>`, "home stamp");
    await writeIfChanged("index.html", home);

    let todayHtml = await readFile("today/index.html", "utf8");
    todayHtml = replaceTaggedText(todayHtml, "data-today-updated", today.updated);
    todayHtml = replacePattern(todayHtml, /<p data-today-status>[\s\S]*?<\/p>/, `<p data-today-status>${escapeHtml(renderTodayStatus(today))}</p>`, "today status");
    await writeIfChanged("today/index.html", todayHtml);

    let statusHtml = await readFile("status/index.html", "utf8");
    statusHtml = replaceTaggedText(statusHtml, "data-status-total", statusSummary.totalItems);
    statusHtml = replaceTaggedText(statusHtml, "data-status-sources", statusSummary.totalSources);
    statusHtml = replaceTaggedText(statusHtml, "data-status-health", statusSummary.healthLabel);
    statusHtml = replaceTaggedText(statusHtml, "data-status-updated", statusSummary.updated);
    statusHtml = replacePattern(statusHtml, /<p data-data-mode>[\s\S]*?<\/p>/, `<p data-data-mode>${escapeHtml(dataModeText(statusSummary.healthLabel, statusSummary.updated))}</p>`, "status data mode");
    statusHtml = replacePattern(statusHtml, /(<div data-refresh-run>)[\s\S]*?\n\s*<\/section>\s*\n\s*(<section class="rank-panel" aria-labelledby="status-table-title">)/, `$1
${renderRefreshRun(report).trim()}
                </div>
            </section>

            $2`, "refresh run");
    statusHtml = replacePattern(statusHtml, /(<div class="status-table" data-status-rows>)[\s\S]*?(<\/div>)/, `$1${trimLineEnds(renderSourceRows(rows, "../"))}
                $2`, "status rows");
    await writeIfChanged("status/index.html", statusHtml);

    for (const module of modules) {
        let html = await readFile(module.route, "utf8");
        html = replaceTaggedText(html, "data-updated", module.updated);
        await writeIfChanged(module.route, html);
    }

    const app = await topicApp();
    const topicSources = {
        trends: datasets.trends,
        packages: datasets.packages,
        repos: datasets.repos,
        links: datasets.links
    };

    for (const [path, topic] of topicPages) {
        const summary = app.topicSummary(app.topicItems(topicSources, topic));
        let html = await readFile(path, "utf8");
        html = replaceTaggedText(html, "data-topic-total", summary.total);
        html = replaceTaggedText(html, "data-topic-modules", summary.modules);
        html = replaceTaggedText(html, "data-topic-updated", summary.updated);
        await writeIfChanged(path, html);
    }

    const notes = await notesApp();
    const noteItems = notes.noteItems();
    let notesHtml = await readFile("notes/index.html", "utf8");
    notesHtml = replaceTaggedText(notesHtml, "data-notes-count", noteItems.length);
    notesHtml = replacePattern(notesHtml, /(<section class="topic-note-panel" aria-label="Topic notes" data-notes-list>)[\s\S]*?(<\/section>)/, `$1
${notes.renderNotes(noteItems)}
            $2`, "notes list");
    await writeIfChanged("notes/index.html", notesHtml);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    await updateStaticFallbacks();
}
