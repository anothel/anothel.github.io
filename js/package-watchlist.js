const fallbackPackages = {
    updated: "2026-06-14",
    sourceMeta: {
        name: "npm",
        status: "fallback",
        count: 3,
        updatedAt: "2026-06-14T00:00:00.000Z"
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

const els = {
    updated: document.querySelector("[data-updated]"),
    total: document.querySelector("[data-total]"),
    topPackage: document.querySelector("[data-top-package]"),
    sourceStatus: document.querySelector("[data-source-status]"),
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
    els.list.innerHTML = data.packages.map((item) => `
        <a class="watch-row" href="${item.url}">
            <span>#${item.rank}</span>
            <strong>${item.name}</strong>
            <span>${item.category}</span>
            <span>${item.downloadsLabel}</span>
            <span>${item.focus}</span>
        </a>
    `).join("");
}

loadPackages().then(render);
