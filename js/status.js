import "./safe-dom.js";
import "./data-health.js";

const manifestUrl = typeof document === "undefined"
    ? "data/manifest.json"
    : document.currentScript?.dataset.manifest || "../data/manifest.json";
const reportUrl = typeof document === "undefined"
    ? "data/refresh-report.json"
    : document.currentScript?.dataset.report || "../data/refresh-report.json";

const dataBase = typeof document === "undefined"
    ? ""
    : document.currentScript?.dataset.base || "../";

const { escapeHtml, safeHref } = globalThis.AnothelDom;

function sourceList(sourceMeta) {
    if (Array.isArray(sourceMeta)) return sourceMeta;
    if (sourceMeta && typeof sourceMeta === "object") return [sourceMeta];
    return [];
}

function sourceUpdated(source) {
    return source?.updatedAt || source?.updated || "-";
}

function statusLabel(rows) {
    const counts = rows.reduce((summary, row) => {
        const status = row.status || "unknown";
        summary[status] = (summary[status] || 0) + 1;
        return summary;
    }, {});

    return ["ok", "partial", "error", "fallback", "unknown"]
        .filter((status) => counts[status] > 0)
        .map((status) => `${counts[status]} ${status}`)
        .join(" / ") || "0 sources";
}

export function collectSourceRows(manifest, datasets, options = {}) {
    return (manifest.modules || []).flatMap((module) => {
        const dataset = datasets[module.id] || {};
        const sources = sourceList(dataset.sourceMeta);

        if (sources.length === 0) {
            return [{
                module: module.title,
                moduleRoute: module.route,
                source: module.source || "unknown",
                status: module.status || "unknown",
                count: module.count || 0,
                updated: module.updated || "-",
                detail: "No source metadata"
            }];
        }

        return sources.map((source) => ({
            module: module.title,
            moduleRoute: module.route,
            source: source.name || "unknown",
            status: source.status || "unknown",
            count: source.count || 0,
            updated: sourceUpdated(source),
            detail: globalThis.DataHealth.sourceDetail(source, options.today)
        }));
    });
}

export function buildStatusSummary(manifest, datasets) {
    const rows = collectSourceRows(manifest, datasets);
    const modules = manifest.modules || [];

    return {
        totalItems: modules.reduce((sum, module) => sum + (module.count || 0), 0),
        totalModules: modules.length,
        totalSources: rows.length,
        healthLabel: statusLabel(rows),
        updated: modules.map((module) => module.updated).filter(Boolean).sort().at(-1) || manifest.updated || "-"
    };
}

export function renderStatusSummary(summary) {
    return `
        <article class="stat-card">
            <span>Items tracked</span>
            <strong>${escapeHtml(summary.totalItems)}</strong>
        </article>
        <article class="stat-card">
            <span>Sources</span>
            <strong>${escapeHtml(summary.totalSources)}</strong>
        </article>
        <article class="stat-card">
            <span>Health</span>
            <strong>${escapeHtml(summary.healthLabel)}</strong>
        </article>
        <article class="stat-card">
            <span>Data date</span>
            <strong>${escapeHtml(summary.updated)}</strong>
        </article>
    `;
}

export function renderSourceRows(rows, base = "") {
    return rows.map((row) => `
        <a class="status-row status-${escapeHtml(row.status)}" href="${safeHref(`${base}${row.moduleRoute}`)}">
            <span>${escapeHtml(row.module)}</span>
            <strong>${escapeHtml(row.source)}</strong>
            <span>${escapeHtml(row.status)}</span>
            <span>${escapeHtml(row.count)} items</span>
            <span>${escapeHtml(row.updated)}</span>
            <small>${escapeHtml(row.detail)}</small>
        </a>
    `).join("");
}

function reportContext(report) {
    return [
        report.runContext?.reason,
        report.runContext?.eventName,
        report.runContext?.runId ? `run ${report.runContext.runId}` : "",
        report.runContext?.refName
    ].filter(Boolean).join(" / ") || "No run context recorded.";
}

function sourceFreshness(report, source) {
    return globalThis.DataHealth?.freshnessText
        ? globalThis.DataHealth.freshnessText({ status: source.status, updatedAt: source.updatedAt || source.updated }, report.generatedAt)
        : "";
}

function isStaleSource(report, source) {
    return source.status === "ok" && sourceFreshness(report, source).startsWith("Stale -");
}

function sourceNeedsAttention(report, source) {
    return source.status !== "ok" || (source.errors || []).length > 0 || isStaleSource(report, source);
}

function reportAttentionSources(report) {
    return (report.modules || [])
        .flatMap((module) => (module.sources || []).map((source) => ({ module, source })))
        .filter(({ source }) => sourceNeedsAttention(report, source));
}

function sourceAttentionLabel(report, source) {
    return isStaleSource(report, source) ? "stale" : source.status;
}

function sourceIssueText(source, report) {
    const errors = Array.isArray(source.errors) ? source.errors.filter(Boolean).join(" / ") : "";
    const freshness = isStaleSource(report, source) ? sourceFreshness(report, source) : "";
    const safety = [
        source.fallbackUsed ? "fallback used" : "",
        source.staleButSafe ? "previous data kept" : "",
        source.rateLimited ? "rate limited" : "",
        source.fallbackReason || ""
    ].filter(Boolean).join(" / ");
    return [source.source || "unknown", sourceAttentionLabel(report, source), errors || safety || freshness]
        .filter(Boolean)
        .join(" ");
}

function reportDetailRows(report, attention) {
    const changedIds = new Set((report.changedModules || []).map((module) => module.id));
    const modules = (report.modules || []).filter((module) => {
        const hasAttention = (module.sources || []).some((source) => sourceNeedsAttention(report, source));
        return changedIds.has(module.id) || module.changed || hasAttention;
    });

    if (!modules.length) {
        return `<article class="status-row status-${escapeHtml(report.totals?.status || "unknown")}">
                <span>Last refresh</span>
                <strong>No changed modules</strong>
                <span>${escapeHtml(report.totals?.status || "unknown")}</span>
                <span>${escapeHtml(report.totals?.items || 0)} items</span>
                <small>${attention.length ? `${attention.length} sources need attention` : "No failed, partial, or fallback sources."}</small>
            </article>`;
    }

    return modules.map((module) => {
        const issues = (module.sources || [])
            .filter((source) => sourceNeedsAttention(report, source))
            .map((source) => sourceIssueText(source, report));
        const detail = issues.length ? issues.join(" / ") : "Changed data file";

        return `<article class="status-row status-${escapeHtml(module.status || "unknown")}">
                <span>${escapeHtml(module.title || module.id || "Module")}</span>
                <strong>${escapeHtml(module.changed || changedIds.has(module.id) ? "changed" : "attention")}</strong>
                <span>${escapeHtml(module.status || "unknown")}</span>
                <span>${escapeHtml(module.count || 0)} items</span>
                <small>${escapeHtml(detail)}</small>
            </article>`;
    }).join("");
}

export function renderRefreshRun(report) {
    if (!report) return "";

    const changed = report.changedModules || [];
    const attention = reportAttentionSources(report);
    const changedText = changed.length
        ? changed.map((module) => module.title || module.id).join(" / ")
        : "No changed modules.";
    const attentionText = attention.length
        ? attention.slice(0, 4).map(({ module, source }) => `${module.title || module.id}: ${source.source} ${sourceAttentionLabel(report, source)}`).join(" / ")
        : "No failed, partial, or fallback sources.";
    const changedCount = changed.length === 1 ? "1 changed" : `${changed.length} changed`;
    const attentionCount = attention.length === 1 ? "1 source" : `${attention.length} sources`;

    return `
        <div class="stats-grid status-stats">
            <article class="stat-card">
                <span>Last run</span>
                <strong>${escapeHtml(report.generatedAt || "-")}</strong>
                <p>${escapeHtml(reportContext(report))}</p>
            </article>
            <article class="stat-card">
                <span>Result</span>
                <strong>${escapeHtml(report.totals?.status || "unknown")}</strong>
                <p>${escapeHtml(report.totals?.items || 0)} items / ${escapeHtml(report.totals?.sources || 0)} sources / manifest ${escapeHtml(report.manifestUpdated || "-")}</p>
            </article>
            <article class="stat-card">
                <span>Changed</span>
                <strong>${escapeHtml(changedCount)}</strong>
                <p>${escapeHtml(changedText)}</p>
            </article>
            <article class="stat-card">
                <span>Attention</span>
                <strong>${escapeHtml(attentionCount)}</strong>
                <p>${escapeHtml(attentionText)}</p>
            </article>
        </div>
        <div class="status-head" aria-hidden="true">
            <span>Module</span>
            <span>Run state</span>
            <span>Status</span>
            <span>Items</span>
            <span>Detail</span>
        </div>
        <div class="status-table">
            ${reportDetailRows(report, attention).trim()}
        </div>
    `;
}

function renderSourceCards(rows) {
    if (globalThis.DataHealth?.renderSourceHealth) {
        return globalThis.DataHealth.renderSourceHealth(rows.map((row) => ({
            name: `${row.module} / ${row.source}`,
            status: row.status,
            count: row.count,
            updatedAt: row.updated,
            error: row.status === "error" ? row.detail : undefined
        })));
    }
    return "";
}

async function readJson(path) {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`${response.status} ${path}`);
    return response.json();
}

async function loadDatasets(manifest) {
    const entries = await Promise.all((manifest.modules || []).map(async (module) => {
        const data = await readJson(`${dataBase}${module.data}`);
        return [module.id, data];
    }));

    return Object.fromEntries(entries);
}

function applyStatus(root, manifest, datasets, report = null) {
    const rows = collectSourceRows(manifest, datasets);
    const summary = buildStatusSummary(manifest, datasets);
    const summarySlots = {
        total: root.querySelector("[data-status-total]"),
        sources: root.querySelector("[data-status-sources]"),
        health: root.querySelector("[data-status-health]"),
        updated: root.querySelector("[data-status-updated]")
    };
    const rowList = root.querySelector("[data-status-rows]");
    const sourceCards = root.querySelector("[data-source-health]");
    const dataMode = root.querySelector("[data-data-mode]");
    const refreshRun = root.querySelector("[data-refresh-run]");

    if (summarySlots.total) summarySlots.total.textContent = String(summary.totalItems);
    if (summarySlots.sources) summarySlots.sources.textContent = String(summary.totalSources);
    if (summarySlots.health) summarySlots.health.textContent = summary.healthLabel;
    if (summarySlots.updated) summarySlots.updated.textContent = summary.updated;
    if (rowList) rowList.innerHTML = renderSourceRows(rows, dataBase);
    if (sourceCards) sourceCards.innerHTML = renderSourceCards(rows);
    if (refreshRun && report) refreshRun.innerHTML = renderRefreshRun(report);
    if (dataMode) {
        const sourceMeta = rows.map((row) => ({ status: row.status }));
        dataMode.textContent = globalThis.DataHealth?.dataModeText
            ? globalThis.DataHealth.dataModeText(sourceMeta, { updated: summary.updated })
            : "Source health unavailable. Existing pages remain usable.";
    }
}

async function init() {
    try {
        const manifest = await readJson(manifestUrl);
        const [datasets, report] = await Promise.all([
            loadDatasets(manifest),
            readJson(reportUrl).catch(() => null)
        ]);
        applyStatus(document, manifest, datasets, report);
    } catch {
        const dataMode = document.querySelector("[data-data-mode]");
        if (dataMode) dataMode.textContent = "Status unavailable. Existing checked-in pages remain usable.";
    }
}

if (typeof document !== "undefined") {
    init();
}
