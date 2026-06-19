(function attachTopics(global) {
    const defaultPaths = {
        trends: "../../data/trends.json",
        packages: "../../data/packages.json",
        repos: "../../data/repos.json",
        links: "../../data/links.json"
    };

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

    function textBlob(item) {
        return [
            item.title,
            item.name,
            item.category,
            item.focus,
            item.summary,
            item.source,
            item.kind,
            item.url
        ].filter(Boolean).join(" ").toLowerCase();
    }

    function topicMatches(item, topic) {
        const category = String(item.category || "").toLowerCase();
        const text = textBlob(item);

        if (topic === "MCP") return category === "mcp" || /\bmcp\b|\bmodelcontextprotocol\b/.test(text);
        if (topic === "Agent skills") return category === "agent skills" || /\b(agent skills?|coding agent skills?)\b/.test(text);
        if (topic === "AI agents") {
            return category === "ai agents" || /\b(ai agents?|agentic|coding agent|codex|claude code|copilot|workflow automation)\b/.test(text);
        }
        return false;
    }

    function scoreItem(module, item) {
        if (module === "Trends") return Number(item.score || 0);
        if (module === "Packages") return Math.min(95, Math.round(Math.log10(Number(item.downloads || 0) + 1) * 14));
        if (module === "Repos") return Math.min(98, Math.round(Math.log10(Number(item.stars || 0) + 1) * 17));
        return Math.max(35, 58 - Number(item.rank || 0) * 2);
    }

    function normalize(dataByModule) {
        const trends = (dataByModule.trends?.items || []).map((item) => ({
            module: "Trends",
            title: item.title,
            category: item.category,
            origin: item.source || "Tracked source",
            metric: item.velocity || item.signal || `${item.score || 0} score`,
            summary: item.summary || item.signal || "",
            url: item.url,
            updated: dataByModule.trends?.updated || "-",
            score: scoreItem("Trends", item)
        }));

        const packages = (dataByModule.packages?.packages || []).map((item) => ({
            module: "Packages",
            title: item.name,
            category: item.category,
            origin: "npm",
            metric: item.downloadsLabel || `${item.downloads || 0} downloads`,
            summary: item.focus || item.period || "",
            url: item.url,
            updated: dataByModule.packages?.updated || "-",
            score: scoreItem("Packages", item)
        }));

        const repos = (dataByModule.repos?.repos || []).map((item) => ({
            module: "Repos",
            title: item.name,
            category: item.category,
            origin: "GitHub",
            metric: item.starsLabel ? `${item.starsLabel} stars` : `${item.stars || 0} stars`,
            summary: item.summary || item.focus || "",
            url: item.url,
            updated: dataByModule.repos?.updated || "-",
            score: scoreItem("Repos", item)
        }));

        const links = (dataByModule.links?.links || []).map((item) => ({
            module: "Links",
            title: item.title,
            category: item.category,
            origin: item.kind || "Reference",
            metric: item.kind || "Reference",
            summary: item.summary || "",
            url: item.url,
            updated: dataByModule.links?.updated || "-",
            score: scoreItem("Links", item)
        }));

        return [...trends, ...packages, ...repos, ...links];
    }

    function topicItems(dataByModule, topic) {
        return normalize(dataByModule)
            .filter((item) => topicMatches(item, topic))
            .sort((a, b) => Number(b.score || 0) - Number(a.score || 0));
    }

    function topicSummary(items) {
        return {
            total: items.length,
            modules: new Set(items.map((item) => item.module)).size,
            updated: items.map((item) => item.updated).filter(Boolean).sort().at(-1) || "-"
        };
    }

    function renderTopicCards(items) {
        if (items.length === 0) {
            return `
                <article class="explore-card empty-card">
                    <h3>No focused items yet</h3>
                    <p>Open focused Explore to broaden this topic across all tracked signals.</p>
                </article>
            `;
        }

        return items.slice(0, 9).map((item) => `
            <article class="explore-card topic-card">
                <div class="card-topline">
                    <span>${escapeHtml(item.module)}</span>
                    <span>${escapeHtml(item.category)}</span>
                </div>
                <h3>${escapeHtml(item.title)}</h3>
                <p class="why-copy"><strong>Why this matters</strong> ${escapeHtml(item.summary)}</p>
                <div class="card-meta">
                    <span>${escapeHtml(item.origin)}</span>
                    <span>${escapeHtml(item.metric)}</span>
                    <span>${escapeHtml(item.updated)}</span>
                </div>
                <div class="explore-card-actions">
                    <a href="${safeHref(item.url)}">Open item</a>
                </div>
            </article>
        `).join("");
    }

    async function readJson(path) {
        const response = await fetch(path);
        if (!response.ok) return null;
        return response.json();
    }

    function selectors() {
        return {
            total: document.querySelector("[data-topic-total]"),
            modules: document.querySelector("[data-topic-modules]"),
            updated: document.querySelector("[data-topic-updated]"),
            list: document.querySelector("[data-topic-list]")
        };
    }

    async function init() {
        const script = document.currentScript;
        const topic = script?.dataset.topic || "AI agents";
        const paths = {
            trends: script?.dataset.trends || defaultPaths.trends,
            packages: script?.dataset.packages || defaultPaths.packages,
            repos: script?.dataset.repos || defaultPaths.repos,
            links: script?.dataset.links || defaultPaths.links
        };

        try {
            const [trends, packages, repos, links] = await Promise.all([
                readJson(paths.trends).catch(() => null),
                readJson(paths.packages).catch(() => null),
                readJson(paths.repos).catch(() => null),
                readJson(paths.links).catch(() => null)
            ]);

            const items = topicItems({ trends, packages, repos, links }, topic);
            const summary = topicSummary(items);
            const els = selectors();

            if (els.total) els.total.textContent = String(summary.total);
            if (els.modules) els.modules.textContent = String(summary.modules);
            if (els.updated) els.updated.textContent = summary.updated;
            if (els.list) els.list.innerHTML = renderTopicCards(items);
        } catch {
            // Checked-in HTML stays useful when local file fetch is blocked.
        }
    }

    global.TopicApp = {
        topicItems,
        topicSummary,
        renderTopicCards,
        topicMatches
    };

    if (typeof document !== "undefined") {
        init();
    }
})(globalThis);
