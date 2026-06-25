import { readFile, writeFile } from "node:fs/promises";
import vm from "node:vm";
import { pathToFileURL } from "node:url";
import { renderRefreshRun } from "../js/status.js";

const topicPages = [
    ["topics/ai-agents/index.html", "AI agents"],
    ["topics/mcp/index.html", "MCP"],
    ["topics/agent-skills/index.html", "Agent skills"]
];

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");
}

function safeHref(value) {
    const href = String(value || "").trim();
    if (!href || href.startsWith("//") || /[\u0000-\u001F\u007F]/.test(href)) return "#";
    return escapeHtml(href);
}

function datePart(value) {
    return String(value || "").match(/^\d{4}-\d{2}-\d{2}/)?.[0] || "";
}

function ageDays(updated, today = new Date()) {
    const updatedDate = datePart(updated);
    const todayDate = datePart(today instanceof Date ? today.toISOString() : today);
    if (!updatedDate || !todayDate) return null;

    const diff = Date.parse(`${todayDate}T00:00:00.000Z`) - Date.parse(`${updatedDate}T00:00:00.000Z`);
    if (!Number.isFinite(diff)) return null;
    return Math.max(0, Math.floor(diff / 86400000));
}

function dataState(updated, today) {
    const age = ageDays(updated, today);
    if (age === null) return "unknown";
    if (age <= 1) return "Fresh";
    if (age <= 3) return "Aging";
    return "Stale";
}

function sourceList(sourceMeta) {
    if (Array.isArray(sourceMeta)) return sourceMeta;
    if (sourceMeta && typeof sourceMeta === "object") return [sourceMeta];
    return [];
}

function statusLabel(values, emptyLabel) {
    const counts = values.reduce((summary, value) => {
        const status = value.status || "unknown";
        summary[status] = (summary[status] || 0) + 1;
        return summary;
    }, {});

    return ["ok", "partial", "error", "fallback", "unknown"]
        .filter((status) => counts[status] > 0)
        .map((status) => `${counts[status]} ${status}`)
        .join(" / ") || emptyLabel;
}

function dataModeText(sourceMeta, updated) {
    const health = statusLabel(sourceMeta, "0 sources");
    if (health.includes("partial")) return "Source health partial. Usable data remains available.";
    if (health.includes("fallback")) return "Source health fallback. Previous data remains available.";
    if (health.includes("error")) return "Source health failed. Check Status before trusting freshness.";
    return `Source health ok. Data date ${updated}.`;
}

function todayStatusText(today) {
    const total = today.sections.reduce((sum, section) => sum + section.items.length, 0);
    const status = today.sourceMeta?.status || "ok";

    if (status === "fallback") return `${total} generated picks. Source health fallback. Previous data remains available.`;
    if (status === "partial") return `${total} generated picks. Source health partial. Usable data remains available.`;
    if (status === "error") return `${total} generated picks from failed source refresh. Check Status before trusting freshness.`;
    return `${total} generated picks. Source health ok. Data date ${today.updated}.`;
}

function sourceDetail(source, today) {
    const status = source?.status || "unknown";
    const updated = source?.updatedAt || source?.updated;
    const updatedDate = datePart(updated);
    let freshness = "Unknown - no timestamp";

    if (status === "fallback") {
        const fallbackDate = datePart(source?.previousUpdated) || updatedDate;
        freshness = fallbackDate ? `Fallback - using ${fallbackDate} data` : "Fallback - previous data kept";
    } else if (status === "error") {
        freshness = "Error - no current timestamp";
    } else if (status === "partial") {
        freshness = updatedDate ? `Partial - updated ${updatedDate}` : "Partial - usable data remains";
    } else {
        const age = ageDays(updated, today);
        if (age !== null && age <= 1) freshness = `Fresh - updated ${updatedDate}`;
        else if (age !== null && age <= 3) freshness = `Aging - ${age} days old`;
        else if (age !== null) freshness = `Stale - ${age} days old`;
    }

    const safety = [];
    if (source?.fallbackUsed) safety.push("using fallback");
    if (source?.staleButSafe) safety.push("previous data kept");
    if (source?.rateLimited) safety.push("rate limited");
    if (source?.fallbackReason) safety.push(source.fallbackReason);
    if (source?.previousUpdated) safety.push(`previous refresh ${source.previousUpdated}`);
    return safety.length ? `${freshness} / ${safety.join(" / ")}` : freshness;
}

function sourceUpdated(source) {
    return source?.updatedAt || source?.updated || "-";
}

function renderStatusRows(rows) {
    return rows.map(({ module, source, detail }) => `
                    <a class="status-row status-${escapeHtml(source.status || "unknown")}" href="../${safeHref(module.route)}">
                        <span>${escapeHtml(module.title)}</span>
                        <strong>${escapeHtml(source.name || "unknown")}</strong>
                        <span>${escapeHtml(source.status || "unknown")}</span>
                        <span>${escapeHtml(source.count || 0)} items</span>
                        <span>${escapeHtml(sourceUpdated(source))}</span>
                        <small>${escapeHtml(detail)}</small>
                    </a>`).join("");
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

function sourceRows(manifest, datasets) {
    return (manifest.modules || []).flatMap((module) => {
        const sources = sourceList(datasets[module.id]?.sourceMeta);
        return sources.map((source) => ({
            module,
            source,
            detail: sourceDetail(source)
        }));
    });
}

async function topicApp() {
    const context = { console, URL };
    vm.runInNewContext(await readFile("js/topic-taxonomy.js", "utf8"), context);
    vm.runInNewContext(await readFile("js/topics.js", "utf8"), context);
    return context.TopicApp;
}

async function updateStaticFallbacks() {
    const manifest = await readJson("data/manifest.json");
    const today = await readJson("data/today.json");
    const report = await readJson("data/refresh-report.json");
    const datasets = await loadDatasets(manifest);
    const modules = manifest.modules || [];
    const rows = sourceRows(manifest, datasets);
    const updated = modules.map((module) => module.updated).filter(Boolean).sort().at(-1) || manifest.updated || "-";
    const total = modules.reduce((sum, module) => sum + module.count, 0);
    const sourceHealth = statusLabel(rows.map((row) => row.source), "0 sources");
    const moduleHealth = statusLabel(modules, "0 ok");

    let home = await readFile("index.html", "utf8");
    home = replaceTaggedText(home, "data-home-total", total);
    home = replaceTaggedText(home, "data-home-live", moduleHealth);
    home = replaceTaggedText(home, "data-home-updated", updated);
    home = replaceTaggedText(home, "data-home-freshness", dataState(updated));
    home = replacePattern(home, /<p class="stamp">Data date [^<]+<\/p>/, `<p class="stamp">Data date ${escapeHtml(updated)}</p>`, "home stamp");
    await writeIfChanged("index.html", home);

    let todayHtml = await readFile("today/index.html", "utf8");
    todayHtml = replaceTaggedText(todayHtml, "data-today-updated", today.updated);
    todayHtml = replacePattern(todayHtml, /<p data-today-status>[\s\S]*?<\/p>/, `<p data-today-status>${escapeHtml(todayStatusText(today))}</p>`, "today status");
    await writeIfChanged("today/index.html", todayHtml);

    let statusHtml = await readFile("status/index.html", "utf8");
    statusHtml = replaceTaggedText(statusHtml, "data-status-total", total);
    statusHtml = replaceTaggedText(statusHtml, "data-status-sources", rows.length);
    statusHtml = replaceTaggedText(statusHtml, "data-status-health", sourceHealth);
    statusHtml = replaceTaggedText(statusHtml, "data-status-updated", updated);
    statusHtml = replacePattern(statusHtml, /<p data-data-mode>[\s\S]*?<\/p>/, `<p data-data-mode>${escapeHtml(dataModeText(rows.map((row) => row.source), updated))}</p>`, "status data mode");
    statusHtml = replacePattern(statusHtml, /(<div data-refresh-run>)[\s\S]*?\n\s*<\/section>\s*\n\s*(<section class="rank-panel" aria-labelledby="status-table-title">)/, `$1
${renderRefreshRun(report).trim()}
                </div>
            </section>

            $2`, "refresh run");
    statusHtml = replacePattern(statusHtml, /(<div class="status-table" data-status-rows>)[\s\S]*?(<\/div>)/, `$1${renderStatusRows(rows)}
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
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    await updateStaticFallbacks();
}
