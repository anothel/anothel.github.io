const manifestUrl = typeof document === "undefined"
    ? "data/manifest.json"
    : document.currentScript?.dataset.source || "data/manifest.json";

export function formatModuleMeta(module) {
    const countLabel = `${module.count} ${module.count === 1 ? "item" : "items"}`;
    return `${countLabel} | ${module.source} | updated ${module.updated}`;
}

export function formatModuleStatus(status) {
    if (status === "ok") return "Live";
    if (status === "error") return "Check";
    return "Unknown";
}

export function applyManifest(root, manifest) {
    const modulesById = new Map(manifest.modules.map((module) => [module.id, module]));
    let updatedCards = 0;

    for (const card of root.querySelectorAll("[data-module-card]")) {
        const module = modulesById.get(card.dataset.moduleId);
        if (!module) continue;

        const status = card.querySelector("[data-module-status]");
        const meta = card.querySelector("[data-module-meta]");

        if (status) status.textContent = formatModuleStatus(module.status);
        if (meta) meta.textContent = formatModuleMeta(module);
        updatedCards += 1;
    }

    return updatedCards;
}

async function init() {
    try {
        const response = await fetch(manifestUrl);
        if (!response.ok) return;
        const manifest = await response.json();
        applyManifest(document, manifest);
    } catch {
        // Static card copy remains useful when local file fetch is blocked.
    }
}

if (typeof document !== "undefined") {
    init();
}
