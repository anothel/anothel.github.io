const fallbackRepos = {
    updated: "2026-06-21",
    sourceMeta: {
        name: "GitHub",
        status: "fallback",
        count: 3,
        updatedAt: "2026-06-21T00:00:00.000Z"
    },
    repos: [
        {
            rank: 1,
            name: "react/react",
            category: "UI",
            focus: "frontend runtime",
            starsLabel: "240K",
            forksLabel: "48K",
            pushedAt: "2026-06-01",
            url: "https://github.com/react/react",
            summary: "The library for web and native user interfaces."
        },
        {
            rank: 2,
            name: "vercel/next.js",
            category: "Framework",
            focus: "React framework",
            starsLabel: "135K",
            forksLabel: "29K",
            pushedAt: "2026-06-01",
            url: "https://github.com/vercel/next.js",
            summary: "The React framework."
        },
        {
            rank: 3,
            name: "vitejs/vite",
            category: "Tooling",
            focus: "build tool",
            starsLabel: "75K",
            forksLabel: "6.8K",
            pushedAt: "2026-06-01",
            url: "https://github.com/vitejs/vite",
            summary: "Next generation frontend tooling."
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
    topRepo: document.querySelector("[data-top-repo]"),
    sourceStatus: document.querySelector("[data-source-status]"),
    dataMode: document.querySelector("[data-data-mode]"),
    sourceHealth: document.querySelector("[data-source-health]"),
    list: document.querySelector("[data-repo-list]")
};

async function loadRepos() {
    try {
        const response = await fetch("../data/repos.json");
        if (response.ok) {
            return await response.json();
        }
    } catch {
        return fallbackRepos;
    }

    return fallbackRepos;
}

function render(data) {
    const top = data.repos[0];
    els.updated.textContent = data.updated;
    els.total.textContent = String(data.repos.length);
    els.topRepo.textContent = top ? top.name.split("/")[1] : "-";
    els.sourceStatus.textContent = data.sourceMeta.status;
    els.dataMode.textContent = dataHealth.dataModeText(data.sourceMeta);
    els.sourceHealth.innerHTML = dataHealth.renderSourceHealth(data.sourceMeta);
    els.list.innerHTML = data.repos.map((item) => `
        <a class="watch-row repo-row" href="${safeHref(item.url)}">
            <span>#${escapeHtml(item.rank)}</span>
            <strong>${escapeHtml(item.name)}</strong>
            <span>${escapeHtml(item.category)}</span>
            <span>${escapeHtml(item.starsLabel)} stars</span>
            <span>${escapeHtml(item.focus)}</span>
        </a>
    `).join("");
}

loadRepos().then(render);
