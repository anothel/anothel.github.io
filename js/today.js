const manifestUrl = typeof document === "undefined"
    ? "../data/manifest.json"
    : document.currentScript?.dataset.source || "../data/manifest.json";

const state = {
    signals: [],
    module: "all",
    query: ""
};

const els = typeof document === "undefined" ? {} : {
    list: document.querySelector("[data-today-list]"),
    total: document.querySelector("[data-today-total]"),
    module: document.querySelector("[data-today-module]"),
    query: document.querySelector("[data-today-query]")
};

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");
}

function takeAll(items) {
    return Array.isArray(items) ? items : [];
}

function collectSignals(datasets) {
    const trends = takeAll(datasets.trends?.items).map((item) => ({
        module: "Trends",
        title: item.title,
        meta: `${item.source} / ${item.category}`,
        metric: `${item.score} score`,
        reason: "Ranked trend signal",
        url: item.url
    }));

    const packages = takeAll(datasets.packages?.packages).map((item) => ({
        module: "Packages",
        title: item.name,
        meta: item.category,
        metric: item.downloadsLabel,
        reason: "Weekly npm demand",
        url: item.url
    }));

    const repos = takeAll(datasets.repos?.repos).map((item) => ({
        module: "Repos",
        title: item.name,
        meta: item.category,
        metric: `${item.starsLabel} stars`,
        reason: "Repository traction",
        url: item.url
    }));

    const links = takeAll(datasets.links?.links).map((item) => ({
        module: "Links",
        title: item.title,
        meta: `${item.category} / ${item.kind}`,
        metric: "reference",
        reason: "Reference queue",
        url: item.url
    }));

    return [...trends, ...packages, ...repos, ...links];
}

export function moduleOptions(signals) {
    return [...new Set(signals.map((signal) => signal.module))].sort();
}

export function filterSignals(signals, filters) {
    const query = filters.query.trim().toLowerCase();

    return signals
        .filter((signal) => filters.module === "all" || signal.module === filters.module)
        .filter((signal) => {
            if (!query) return true;
            return [signal.module, signal.title, signal.meta, signal.metric, signal.reason].some((value) =>
                value.toLowerCase().includes(query)
            );
        });
}

function renderCards(signals) {
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

function fillModuleFilter(signals) {
    els.module.innerHTML = '<option value="all">All modules</option>' + moduleOptions(signals)
        .map((module) => `<option value="${module}">${module}</option>`)
        .join("");
}

function render() {
    const signals = filterSignals(state.signals, {
        module: state.module,
        query: state.query
    });

    els.total.textContent = String(signals.length);
    els.list.innerHTML = renderCards(signals);
}

async function readJson(path) {
    const response = await fetch(path);
    if (!response.ok) return null;
    return response.json();
}

async function init() {
    try {
        const manifest = await readJson(manifestUrl);
        if (!manifest) return;

        const datasets = {};
        for (const module of manifest.modules || []) {
            const data = await readJson(`../${module.data}`).catch(() => null);
            if (data) datasets[module.id] = data;
        }

        state.signals = collectSignals(datasets);
        fillModuleFilter(state.signals);
        els.module.addEventListener("change", (event) => {
            state.module = event.target.value;
            render();
        });
        els.query.addEventListener("input", (event) => {
            state.query = event.target.value;
            render();
        });
        render();
    } catch {
        // Fallback card remains visible if static JSON fetch fails.
    }
}

if (typeof document !== "undefined") {
    init();
}
