const manifestUrl = typeof document === "undefined"
    ? "data/manifest.json"
    : document.currentScript?.dataset.source || "data/manifest.json";

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");
}

export function buildHomeOverview(manifest) {
    const modules = manifest.modules || [];

    return {
        totalItems: modules.reduce((sum, module) => sum + module.count, 0),
        liveModules: modules.filter((module) => module.status === "ok").length,
        totalModules: modules.length,
        updated: modules.map((module) => module.updated).filter(Boolean).sort().at(-1) || "-"
    };
}

const defaultSignalLimits = {
    trends: 3,
    packages: 2,
    repos: 2,
    links: 1
};

function take(items, limit) {
    return items.slice(0, Number.isFinite(limit) ? limit : items.length);
}

export function collectHomeSignals(datasets, limits = defaultSignalLimits) {
    const trendRows = take(datasets.trends?.items || [], limits.trends).map((item) => ({
        module: "Trends",
        title: item.title,
        meta: `${item.source} / ${item.category}`,
        metric: `${item.score} score`,
        reason: "Ranked trend signal",
        url: item.url
    }));

    const packageRows = take(datasets.packages?.packages || [], limits.packages).map((item) => ({
        module: "Packages",
        title: item.name,
        meta: item.category,
        metric: item.downloadsLabel,
        reason: "Weekly npm demand",
        url: item.url
    }));

    const repoRows = take(datasets.repos?.repos || [], limits.repos).map((item) => ({
        module: "Repos",
        title: item.name,
        meta: item.category,
        metric: `${item.starsLabel} stars`,
        reason: "Repository traction",
        url: item.url
    }));

    const linkRows = take(datasets.links?.links || [], limits.links).map((item) => ({
        module: "Links",
        title: item.title,
        meta: `${item.category} / ${item.kind}`,
        metric: "reference",
        reason: "Reference queue",
        url: item.url
    }));

    return [...trendRows, ...packageRows, ...repoRows, ...linkRows];
}

export function renderSignalCards(signals) {
    return signals.map((signal) => `
        <a class="signal-card" href="${escapeHtml(signal.url)}">
            <div>
                <span>${escapeHtml(signal.module)}</span>
                <em>${escapeHtml(signal.metric)}</em>
            </div>
            <strong>${escapeHtml(signal.title)}</strong>
            <small>${escapeHtml(signal.meta)}</small>
            <p>${escapeHtml(signal.reason)}</p>
        </a>
    `).join("");
}

function applyOverview(root, manifest) {
    const overview = buildHomeOverview(manifest);
    const total = root.querySelector("[data-home-total]");
    const live = root.querySelector("[data-home-live]");
    const updated = root.querySelector("[data-home-updated]");

    if (total) total.textContent = String(overview.totalItems);
    if (live) live.textContent = `${overview.liveModules}/${overview.totalModules}`;
    if (updated) updated.textContent = overview.updated;
}

async function readModuleData(module) {
    const response = await fetch(module.data);
    if (!response.ok) return null;
    return response.json();
}

async function applySignals(root, manifest) {
    const list = root.querySelector("[data-home-signals]");
    if (!list) return;

    const datasets = {};
    for (const module of manifest.modules || []) {
        const data = await readModuleData(module).catch(() => null);
        if (data) datasets[module.id] = data;
    }

    const signals = collectHomeSignals(datasets);
    if (signals.length > 0) {
        list.innerHTML = renderSignalCards(signals);
    }
}

async function init() {
    try {
        const response = await fetch(manifestUrl);
        if (!response.ok) return;
        const manifest = await response.json();
        applyOverview(document, manifest);
        await applySignals(document, manifest);
    } catch {
        // Static card copy remains useful when local file fetch is blocked.
    }
}

if (typeof document !== "undefined") {
    init();
}
