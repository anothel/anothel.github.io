const manifestUrl = typeof document === "undefined"
    ? "data/manifest.json"
    : document.currentScript?.dataset.manifest || "../data/manifest.json";

const dataBase = typeof document === "undefined"
    ? ""
    : document.currentScript?.dataset.base || "../";

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

    try {
        const parsed = new URL(href, "https://anothel.github.io");
        const hasScheme = /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(href);
        if (hasScheme && parsed.protocol !== "http:" && parsed.protocol !== "https:") return "#";
        if (!hasScheme && parsed.origin !== "https://anothel.github.io") return "#";
        return escapeHtml(href);
    } catch {
        return "#";
    }
}

function sourceList(sourceMeta) {
    if (Array.isArray(sourceMeta)) return sourceMeta;
    if (sourceMeta && typeof sourceMeta === "object") return [sourceMeta];
    return [];
}

function sourceDetail(source) {
    const errors = Array.isArray(source?.errors) ? source.errors : [];
    if (errors.length > 0) {
        return errors.map((error) => [error.name, error.error].filter(Boolean).join(": ")).join(" / ");
    }
    if (source?.error) return source.error;
    return source?.updatedAt || source?.updated || "No timestamp";
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

export function collectSourceRows(manifest, datasets) {
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
            detail: sourceDetail(source)
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
            <span>Last refresh</span>
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

function applyStatus(root, manifest, datasets) {
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

    if (summarySlots.total) summarySlots.total.textContent = String(summary.totalItems);
    if (summarySlots.sources) summarySlots.sources.textContent = String(summary.totalSources);
    if (summarySlots.health) summarySlots.health.textContent = summary.healthLabel;
    if (summarySlots.updated) summarySlots.updated.textContent = summary.updated;
    if (rowList) rowList.innerHTML = renderSourceRows(rows, dataBase);
    if (sourceCards) sourceCards.innerHTML = renderSourceCards(rows);
    if (dataMode) dataMode.textContent = "Checked-in data loaded. Scheduled workflow keeps it fresh.";
}

async function init() {
    try {
        const manifest = await readJson(manifestUrl);
        const datasets = await loadDatasets(manifest);
        applyStatus(document, manifest, datasets);
    } catch {
        const dataMode = document.querySelector("[data-data-mode]");
        if (dataMode) dataMode.textContent = "Status unavailable. Existing checked-in pages remain usable.";
    }
}

if (typeof document !== "undefined") {
    init();
}
