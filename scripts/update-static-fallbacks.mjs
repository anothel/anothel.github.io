import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import vm from "node:vm";
import { pathToFileURL } from "node:url";
import "../js/safe-dom.js";
import { buildHomeOverview } from "../js/home.js";
import { renderTodayStatus } from "../js/today.js";
import { buildStatusSummary, collectSourceRows, renderRefreshRun, renderSourceRows } from "../js/status.js";

const { escapeHtml } = globalThis.AnothelDom;

function sourceMetaList(datasets) {
    return Object.values(datasets).flatMap((dataset) => {
        const sourceMeta = dataset?.sourceMeta;
        if (Array.isArray(sourceMeta)) return sourceMeta;
        return sourceMeta && typeof sourceMeta === "object" ? [sourceMeta] : [];
    });
}

function trimLineEnds(markup) {
    return markup.split("\n").map((line) => line.trimEnd()).join("\n");
}

function replaceTaggedText(html, attr, value) {
    const pattern = new RegExp(`(<(strong|span|p)[^>]*${attr}[^>]*>)[\\s\\S]*?(<\\/\\2>)`);
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
    let current = "";
    try {
        current = await readFile(path, "utf8");
    } catch (error) {
        if (error.code !== "ENOENT") throw error;
    }
    await mkdir(dirname(path), { recursive: true });
    if (current !== html) await writeFile(path, html, "utf8");
}

async function loadDatasets(manifest) {
    const entries = await Promise.all((manifest.modules || []).map(async (module) => {
        const data = await readJson(module.data);
        return [module.id, data];
    }));
    return Object.fromEntries(entries);
}

async function topicRuntime() {
    const context = { console, URL };
    vm.runInNewContext(await readFile("js/safe-dom.js", "utf8"), context);
    vm.runInNewContext(await readFile("js/topic-taxonomy.js", "utf8"), context);
    vm.runInNewContext(await readFile("js/topics.js", "utf8"), context);
    return {
        app: context.TopicApp,
        taxonomy: context.TopicTaxonomy
    };
}

async function notesApp() {
    const context = { console, URL };
    vm.runInNewContext(await readFile("js/safe-dom.js", "utf8"), context);
    vm.runInNewContext(await readFile("js/topic-taxonomy.js", "utf8"), context);
    vm.runInNewContext(await readFile("js/notes.js", "utf8"), context);
    return context.NotesApp;
}

function displaySignalLabel(topic) {
    if (topic.label === "Agent skills") return topic.label;
    const label = topic.signalLabel || topic.label;
    return `${label.charAt(0).toUpperCase()}${label.slice(1)}`;
}

function canonicalTopicUrl(routePath) {
    return `https://anothel.github.io/${routePath.replace(/index\.html$/, "")}`;
}

function renderTopicPage({ app, taxonomy, topic, items, summary, today }) {
    const config = taxonomy.topicPageConfig(topic);
    const signalLabel = displaySignalLabel(config);
    const description = `Focused landing page for ${config.signalLabel || config.label} signals across tracked trends, packages, repos, and references.`;
    const insight = app.topicInsight(items, topic);
    const dashboard = app.topicDashboard(items, today, topic);
    const note = app.topicNote(topic);
    const supportingSignals = app.topicSupportingSignals(items);

    return `${trimLineEnds(`<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="${escapeHtml(description)}">
    <meta name="author" content="anothel">
    <link rel="canonical" href="${escapeHtml(canonicalTopicUrl(config.routePath))}">
    <meta property="og:site_name" content="anothel">
    <meta property="og:title" content="${escapeHtml(config.label)} - anothel">
    <meta property="og:description" content="${escapeHtml(description)}">
    <meta property="og:type" content="website">
    <meta property="og:url" content="${escapeHtml(canonicalTopicUrl(config.routePath))}">
    <meta name="twitter:card" content="summary">
    <meta name="twitter:title" content="${escapeHtml(config.label)} - anothel">
    <meta name="twitter:description" content="${escapeHtml(description)}">
    <title>${escapeHtml(config.label)} - anothel</title>
    <link rel="stylesheet" href="../../css/site.css">
</head>
<body>
    <div class="shell hub-shell">
        <header class="topbar">
            <div>
                <p class="eyebrow">Topic focus</p>
                <h1>${escapeHtml(signalLabel)} signals.</h1>
            </div>
            <p class="stamp">tracked topic</p>
            <nav class="site-nav" aria-label="Primary">
                <a href="../../index.html">Home</a>
                <a href="../../today/index.html">Today</a>
                <a href="../../explore/index.html">Explore</a>
                <a href="../../review/index.html">Review</a>
                <a href="../../status/index.html">Status</a>
                <a href="../../trends/index.html">Trends</a>
                <a href="../../packages/index.html">Packages</a>
                <a href="../../repos/index.html">Repos</a>
                <a href="../../links/index.html">Reference shelf</a>
            </nav>
        </header>

        <main class="hub-main">
            <section class="module-detail">
                <h2>${escapeHtml(signalLabel)} signals across tracked sources.</h2>
                <p data-topic-lead>${escapeHtml(insight.lead)}</p>
            </section>

            <section class="topic-note-panel" aria-label="${escapeHtml(config.label)} note" data-topic-note>
${trimLineEnds(app.renderTopicNote(note, supportingSignals))}
            </section>

            <section class="stats-grid topic-stats" aria-label="${escapeHtml(config.label)} topic summary">
                <article class="stat-card">
                    <span>Focused items</span>
                    <strong data-topic-total>${escapeHtml(summary.total)}</strong>
                </article>
                <article class="stat-card">
                    <span>Modules</span>
                    <strong data-topic-modules>${escapeHtml(summary.modules)}</strong>
                </article>
                <article class="stat-card">
                    <span>Data date</span>
                    <strong data-topic-updated>${escapeHtml(summary.updated)}</strong>
                </article>
            </section>

            <section class="topic-dashboard-panel" aria-label="${escapeHtml(config.label)} guidance">
                <div class="section-heading">
                    <div>
                        <h2>Topic context</h2>
                        <p>How to decide whether this topic is worth opening.</p>
                    </div>
                </div>
                <div class="topic-guidance-grid" data-topic-guidance>
${trimLineEnds(app.renderTopicGuidance(dashboard.guidance))}
                </div>
            </section>

            <section class="topic-dashboard-panel" aria-label="${escapeHtml(config.label)} now">
                <div class="section-heading">
                    <div>
                        <h2>Why this topic matters now</h2>
                        <p>Current signals condensed into one direct read.</p>
                    </div>
                </div>
                <div data-topic-why>
${trimLineEnds(app.renderWhyNow(dashboard.whyNow))}
                </div>
            </section>

            <section class="topic-dashboard-panel" aria-label="${escapeHtml(config.label)} top movers">
                <div class="section-heading">
                    <div>
                        <h2>Top movers</h2>
                        <p>The highest-fit signals for this topic.</p>
                    </div>
                </div>
                <div class="topic-dashboard-grid" data-topic-top-movers>
${trimLineEnds(app.renderTopMovers(dashboard.topMovers))}
                </div>
            </section>

            <section class="source-mix-panel" aria-label="${escapeHtml(config.label)} source mix">
                <div class="section-heading">
                    <div>
                        <h2>Source mix</h2>
                        <p>Where this topic is currently appearing.</p>
                    </div>
                </div>
                <div class="source-mix-grid" data-topic-source-mix>
${trimLineEnds(app.renderSourceMix(insight.sourceMix))}
                </div>
            </section>

            <section class="topic-dashboard-panel" aria-label="${escapeHtml(config.label)} related signals">
                <div class="section-heading">
                    <div>
                        <h2>Related signals</h2>
                        <p>Today picks, packages, repos, and references connected to this topic.</p>
                    </div>
                </div>
                <div class="topic-related-grid" data-topic-related>
${trimLineEnds(app.renderRelatedGroups(dashboard.relatedGroups))}
                </div>
            </section>

            <section class="topic-dashboard-panel" aria-label="Related topics">
                <div class="section-heading">
                    <div>
                        <h2>Related topics</h2>
                        <p>Move sideways when the signal overlaps another lens.</p>
                    </div>
                </div>
                <nav class="topic-cross-link-grid" aria-label="Related topic routes" data-topic-cross-links>
${trimLineEnds(app.renderCrossLinks(dashboard.crossLinks))}
                </nav>
            </section>

            <section class="explore-strip topic-actions" aria-label="${escapeHtml(config.label)} topic actions">
                <div>
                    <h2>Continue exploring ${escapeHtml(config.label)}</h2>
                    <p>Open the filtered Explore view, or inspect supporting source modules directly.</p>
                </div>
                <div data-topic-pin>
${trimLineEnds(app.renderTopicPinAction(topic))}
                </div>
                <nav aria-label="${escapeHtml(config.label)} topic routes" data-topic-actions-dynamic>
${trimLineEnds(app.renderTopicActions(topic))}
                </nav>
            </section>

            <section class="topic-grid" aria-label="${escapeHtml(config.label)} topic items" data-topic-list>
${trimLineEnds(app.renderTopicCards(items))}
            </section>
        </main>
    </div>
    <script defer src="../../js/local-state.js"></script>
    <script defer src="../../js/safe-dom.js"></script>
    <script defer src="../../js/topic-taxonomy.js"></script>
    <script defer src="../../js/topics.js" data-topic="${escapeHtml(topic)}" data-trends="../../data/trends.json" data-packages="../../data/packages.json" data-repos="../../data/repos.json" data-links="../../data/links.json" data-today="../../data/today.json"></script>
</body>
</html>`)}\n`;
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
    home = replaceTaggedText(home, "data-home-recovery", homeOverview.recoveryText);
    home = replacePattern(home, /<p class="stamp">Data date [^<]+<\/p>/, `<p class="stamp">Data date ${escapeHtml(updated)}</p>`, "home stamp");
    await writeIfChanged("index.html", home);

    let todayHtml = await readFile("today/index.html", "utf8");
    todayHtml = replaceTaggedText(todayHtml, "data-today-updated", today.updated);
    todayHtml = replacePattern(todayHtml, /<p data-today-status>[\s\S]*?<\/p>/, `<p data-today-status>${escapeHtml(renderTodayStatus(today))}</p>`, "today status");
    await writeIfChanged("today/index.html", todayHtml);

    const exploreSources = sourceMetaList(datasets);
    let exploreHtml = await readFile("explore/index.html", "utf8");
    exploreHtml = replacePattern(exploreHtml, /<section class="health-panel" aria-labelledby="explore-health-title">[\s\S]*?<\/section>\s*\n\s*<section class="explore-workspace"/, `<section class="health-panel" aria-labelledby="explore-health-title">
                <div class="panel-heading">
                    <h2 id="explore-health-title">Source health</h2>
                    <p data-data-mode>${escapeHtml(globalThis.DataHealth.dataModeText(exploreSources, { updated }))}</p>
                </div>
                <div class="source-health-grid" data-source-health>
${trimLineEnds(globalThis.DataHealth.renderSourceHealth(exploreSources, { today: generatedAt }))}
                </div>
            </section>

            <section class="explore-workspace"`, "explore source health");
    await writeIfChanged("explore/index.html", exploreHtml);

    let statusHtml = await readFile("status/index.html", "utf8");
    statusHtml = replaceTaggedText(statusHtml, "data-status-total", statusSummary.totalItems);
    statusHtml = replaceTaggedText(statusHtml, "data-status-sources", statusSummary.totalSources);
    statusHtml = replaceTaggedText(statusHtml, "data-status-health", statusSummary.healthLabel);
    statusHtml = replaceTaggedText(statusHtml, "data-status-updated", statusSummary.updated);
    statusHtml = replacePattern(statusHtml, /<p data-data-mode>[\s\S]*?<\/p>/, `<p data-data-mode>${escapeHtml(globalThis.DataHealth.dataModeText(rows, { updated: statusSummary.updated }))}</p>`, "status data mode");
    statusHtml = replacePattern(statusHtml, /(<div data-refresh-run>)[\s\S]*?\n\s*<\/section>\s*\n\s*(<section class="rank-panel" aria-labelledby="status-table-title">)/, `$1
${renderRefreshRun(report).trim()}
                </div>
            </section>

            $2`, "refresh run");
    statusHtml = replacePattern(statusHtml, /(<div class="status-table" data-status-rows>)[\s\S]*?(<\/div>)/, `$1${trimLineEnds(renderSourceRows(rows, "../"))}
                $2`, "status rows");
    await writeIfChanged("status/index.html", statusHtml);

    for (const module of modules) {
        const dataset = datasets[module.id] || {};
        let html = await readFile(module.route, "utf8");
        html = replaceTaggedText(html, "data-updated", module.updated);
        html = replacePattern(html, /<p data-data-mode>[\s\S]*?<\/p>/, `<p data-data-mode>${escapeHtml(globalThis.DataHealth.dataModeText(dataset.sourceMeta, { updated: dataset.updated || module.updated }))}</p>`, `${module.id} data mode`);
        await writeIfChanged(module.route, html);
    }

    const { app, taxonomy } = await topicRuntime();
    const topicSources = {
        trends: datasets.trends,
        packages: datasets.packages,
        repos: datasets.repos,
        links: datasets.links
    };

    for (const topic of taxonomy.topicPageLabels) {
        const config = taxonomy.topicPageConfig(topic);
        const items = app.topicItems(topicSources, topic);
        const summary = app.topicSummary(items);
        await writeIfChanged(config.routePath, renderTopicPage({ app, taxonomy, topic, items, summary, today }));
    }

    const notes = await notesApp();
    const noteItems = notes.noteItems();
    let notesHtml = await readFile("notes/index.html", "utf8");
    notesHtml = replaceTaggedText(notesHtml, "data-notes-count", noteItems.length);
    notesHtml = replacePattern(notesHtml, /(<section class="topic-note-panel" aria-label="Topic notes" data-notes-list>)[\s\S]*?(<\/section>)/, `$1
${trimLineEnds(notes.renderNotes(noteItems))}
            $2`, "notes list");
    await writeIfChanged("notes/index.html", notesHtml);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    await updateStaticFallbacks();
}
