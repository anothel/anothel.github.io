const fallbackPackages = {
    updated: "2026-06-21",
    sourceMeta: {
        name: "npm",
        status: "fallback",
        count: 3,
        updatedAt: "2026-06-21T00:00:00.000Z"
    },
    packages: [
        {
            rank: 1,
            name: "typescript",
            category: "Language",
            focus: "typed JavaScript",
            downloadsLabel: "216.8M/week",
            period: "2026-06-06 to 2026-06-12",
            url: "https://www.npmjs.com/package/typescript"
        },
        {
            rank: 2,
            name: "zod",
            category: "Validation",
            focus: "schema validation",
            downloadsLabel: "192.5M/week",
            period: "2026-06-06 to 2026-06-12",
            url: "https://www.npmjs.com/package/zod"
        },
        {
            rank: 3,
            name: "react",
            category: "UI",
            focus: "frontend runtime",
            downloadsLabel: "140.9M/week",
            period: "2026-06-06 to 2026-06-12",
            url: "https://www.npmjs.com/package/react"
        }
    ]
};

const dataHealth = globalThis.DataHealth;

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");
}

function safeHref(value) {
    const href = String(value || "").trim();
    if (!href || href.startsWith("//") || /[\u0000-\u001F\u007F]/.test(href)) {
        return "#";
    }

    try {
        const parsed = new URL(href, "https://anothel.github.io");
        const hasScheme = /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(href);
        if (hasScheme && parsed.protocol !== "http:" && parsed.protocol !== "https:") {
            return "#";
        }
        if (!hasScheme && parsed.origin !== "https://anothel.github.io") {
            return "#";
        }
        return escapeHtml(href);
    } catch {
        return "#";
    }
}

const els = {
    updated: document.querySelector("[data-updated]"),
    total: document.querySelector("[data-total]"),
    topPackage: document.querySelector("[data-top-package]"),
    sourceStatus: document.querySelector("[data-source-status]"),
    dataMode: document.querySelector("[data-data-mode]"),
    sourceHealth: document.querySelector("[data-source-health]"),
    list: document.querySelector("[data-package-list]")
};

async function loadPackages() {
    try {
        const response = await fetch("../data/packages.json");
        if (response.ok) {
            return await response.json();
        }
    } catch {
        return fallbackPackages;
    }

    return fallbackPackages;
}

function render(data) {
    const top = data.packages[0];
    els.updated.textContent = data.updated;
    els.total.textContent = String(data.packages.length);
    els.topPackage.textContent = top ? top.name : "-";
    els.sourceStatus.textContent = data.sourceMeta.status;
    els.dataMode.textContent = dataHealth.dataModeText(data.sourceMeta, { updated: data.updated });
    els.sourceHealth.innerHTML = dataHealth.renderSourceHealth(data.sourceMeta);
    els.list.innerHTML = data.packages.map((item) => `
        <a class="watch-row" href="${safeHref(item.url)}">
            <span>#${escapeHtml(item.rank)}</span>
            <strong>${escapeHtml(item.name)}</strong>
            <span>${escapeHtml(item.category)}</span>
            <span>${escapeHtml(item.downloadsLabel)}</span>
            <span>${escapeHtml(item.focus)}</span>
        </a>
    `).join("");
}

loadPackages().then(render);
