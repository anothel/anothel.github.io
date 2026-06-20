(function attachTopics(global) {
    const defaultPaths = {
        trends: "../../data/trends.json",
        packages: "../../data/packages.json",
        repos: "../../data/repos.json",
        links: "../../data/links.json",
        today: "../../data/today.json"
    };

    const topicRoutes = {
        "AI agents": {
            route: "../../topics/ai-agents/index.html",
            summary: "Coding agents, workflow automation, and agent runtime movement.",
            whyPrefix: "Agent tooling is moving from demos into daily coding workflow.",
            guidance: {
                whatToWatch: "Coding agents, local CLIs, orchestration frameworks, and agent runtime patterns.",
                whenToOpen: "Open when a tool changes how code gets written, reviewed, tested, or automated.",
                nextAction: "Compare the strongest repo and package signals before saving follow-up items."
            },
            actions: [
                ["Open focused Explore", "../../explore/index.html?focus=AI%20agents", "AI agents lens"],
                ["Repos", "../../repos/index.html", "Coding-agent traction"],
                ["Packages", "../../packages/index.html", "Agent framework demand"]
            ]
        },
        MCP: {
            route: "../../topics/mcp/index.html",
            summary: "Protocol, SDK, server, and client signals for agent tooling.",
            whyPrefix: "Protocol and server adoption is moving across SDKs, packages, and reference repos.",
            guidance: {
                whatToWatch: "SDKs, reference servers, registries, inspector tools, and server packages.",
                whenToOpen: "Open when a protocol or server signal could change how agents connect to tools.",
                nextAction: "Check packages for adoption, then keep stable server references nearby."
            },
            actions: [
                ["Open focused Explore", "../../explore/index.html?focus=MCP", "MCP lens"],
                ["Packages", "../../packages/index.html", "SDK and server demand"],
                ["Links", "../../links/index.html", "Stable protocol references"]
            ]
        },
        "Agent skills": {
            route: "../../topics/agent-skills/index.html",
            summary: "Reusable instructions, skill specs, and agent workflow examples.",
            whyPrefix: "Reusable instruction patterns are becoming a practical layer above one-off prompting.",
            guidance: {
                whatToWatch: "Skill specs, reusable instructions, examples, and workflow checklists.",
                whenToOpen: "Open when a skill pattern can become repeatable work instead of one-off prompting.",
                nextAction: "Start from stable references, then save repos that look reusable."
            },
            actions: [
                ["Open focused Explore", "../../explore/index.html?focus=Agent%20skills", "Agent skills lens"],
                ["Links", "../../links/index.html", "Skill specs and docs"],
                ["Review", "../../review/index.html", "Saved reusable patterns"]
            ]
        }
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

        const hasScheme = /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(href);
        if (!hasScheme && (href.startsWith("../") || href.startsWith("./") || href.startsWith("/"))) {
            return escapeHtml(href);
        }

        try {
            const parsed = new URL(href, "https://anothel.github.io");
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

    function sourceMix(items) {
        const counts = new Map();
        for (const item of items) {
            counts.set(item.module, (counts.get(item.module) || 0) + 1);
        }
        return [...counts.entries()]
            .map(([module, count]) => ({ module, count }))
            .sort((a, b) => Number(b.count) - Number(a.count) || a.module.localeCompare(b.module));
    }

    function topicSignalLabel(topic) {
        if (topic === "AI agents") return "AI agent";
        if (topic === "Agent skills") return "agent skill";
        return topic;
    }

    function topicConfig(topic) {
        return topicRoutes[topic] || topicRoutes["AI agents"];
    }

    function topicGuidance(topic) {
        return { ...topicConfig(topic).guidance };
    }

    function topicInsight(items, topic) {
        const mix = sourceMix(items);
        const moduleWord = mix.length === 1 ? "module" : "modules";
        const signalWord = items.length === 1 ? "signal" : "signals";
        return {
            lead: `${mix.length} source ${moduleWord} tracking ${items.length} ${topicSignalLabel(topic)} ${signalWord}.`,
            sourceMix: mix,
            topItem: items[0] || null
        };
    }

    function todayTopicItems(today, topic) {
        return (today?.sections || [])
            .flatMap((section) => (section.items || []).map((item) => ({ ...item, section: section.title || section.id || "Today" })))
            .filter((item) => topicMatches(item, topic))
            .map((item) => ({
                module: "Today",
                title: item.title,
                category: item.category,
                origin: item.origin || item.module || item.section || "Today",
                metric: item.metric || `${item.score || 0} score`,
                summary: item.reason || item.summary || "",
                url: item.url,
                updated: today?.updated || "-",
                score: Number(item.score || 0)
            }))
            .sort((a, b) => Number(b.score || 0) - Number(a.score || 0));
    }

    function topicModuleGroup(items, module) {
        return items.filter((item) => item.module === module).slice(0, 3);
    }

    function topicRelatedGroups(items, today, topic) {
        return [
            ["Today picks", todayTopicItems(today, topic).slice(0, 3)],
            ["Packages", topicModuleGroup(items, "Packages")],
            ["Repos", topicModuleGroup(items, "Repos")],
            ["Links", topicModuleGroup(items, "Links")]
        ]
            .filter(([, groupItems]) => groupItems.length > 0)
            .map(([label, groupItems]) => ({ label, items: groupItems }));
    }

    function relatedTopicLinks(topic) {
        return Object.entries(topicRoutes)
            .filter(([name]) => name !== topic)
            .map(([name, detail]) => ({
                topic: name,
                route: detail.route,
                summary: detail.summary
            }));
    }

    function topicDashboard(items, today, topic) {
        const rankedItems = [...items].sort((a, b) => Number(b.score || 0) - Number(a.score || 0));
        const topMovers = rankedItems.slice(0, 3);
        const modules = new Set(items.map((item) => item.module)).size;
        const topItem = topMovers[0];
        const moduleWord = modules === 1 ? "module" : "modules";
        const signalWord = items.length === 1 ? "signal" : "signals";
        const config = topicConfig(topic);
        const topText = topItem ? ` Top signal: ${topItem.title} from ${topItem.module}.` : " No top signal yet.";

        return {
            whyNow: `${items.length} ${topicSignalLabel(topic)} ${signalWord} across ${modules} source ${moduleWord}. ${config.whyPrefix}${topText}`,
            guidance: topicGuidance(topic),
            topMovers,
            relatedGroups: topicRelatedGroups(items, today, topic),
            crossLinks: relatedTopicLinks(topic)
        };
    }

    function renderSourceMix(mix) {
        if (mix.length === 0) {
            return '<p class="saved-empty">No source mix yet.</p>';
        }

        return mix.map((entry) => `
            <article class="source-mix-card">
                <span>${escapeHtml(entry.module)}</span>
                <strong>${escapeHtml(entry.count)} items</strong>
            </article>
        `).join("");
    }

    function renderTopicActions(topic) {
        return topicConfig(topic).actions.map(([label, href, description]) => `
            <a href="${safeHref(href)}">
                <strong>${escapeHtml(label)}</strong>
                <span>${escapeHtml(description)}</span>
            </a>
        `).join("");
    }

    function renderTopicGuidance(guidance) {
        const cards = [
            ["What to watch", guidance.whatToWatch],
            ["When to open", guidance.whenToOpen],
            ["Good next action", guidance.nextAction]
        ];

        return cards.map(([label, copy]) => `
            <article class="topic-guidance-card">
                <span>${escapeHtml(label)}</span>
                <p>${escapeHtml(copy)}</p>
            </article>
        `).join("");
    }

    function renderWhyNow(whyNow) {
        return `
            <article class="topic-why-card">
                <span>Why now</span>
                <p>${escapeHtml(whyNow)}</p>
            </article>
        `;
    }

    function renderTopMovers(items) {
        if (items.length === 0) {
            return '<p class="saved-empty">No top movers yet.</p>';
        }

        return items.map((item, index) => `
            <article class="topic-mover-card">
                <div class="card-topline">
                    <span>${escapeHtml(item.module)}</span>
                    <span>#${escapeHtml(index + 1)}</span>
                </div>
                <h3>${escapeHtml(item.title)}</h3>
                <p>${escapeHtml(item.summary)}</p>
                <div class="card-meta">
                    <span>${escapeHtml(item.origin)}</span>
                    <span>${escapeHtml(item.metric)}</span>
                    <span>Fit ${escapeHtml(item.score)}</span>
                </div>
                <a href="${safeHref(item.url)}">Open signal</a>
            </article>
        `).join("");
    }

    function renderRelatedGroups(groups) {
        if (groups.length === 0) {
            return '<p class="saved-empty">No related signals yet.</p>';
        }

        return groups.map((group) => `
            <article class="topic-related-card">
                <span>${escapeHtml(group.label)}</span>
                <div class="topic-related-list">
                    ${group.items.map((item) => `
                        <a href="${safeHref(item.url)}">
                            <strong>${escapeHtml(item.title)}</strong>
                            <small>${escapeHtml(item.metric || item.origin || item.module)}</small>
                        </a>
                    `).join("")}
                </div>
            </article>
        `).join("");
    }

    function renderCrossLinks(links) {
        if (links.length === 0) {
            return "";
        }

        return links.map((link) => `
            <a class="topic-cross-link" href="${safeHref(link.route)}">
                <strong>${escapeHtml(link.topic)}</strong>
                <span>${escapeHtml(link.summary)}</span>
            </a>
        `).join("");
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
                    <span class="quality-marker">Signal fit ${escapeHtml(item.score)}</span>
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
            lead: document.querySelector("[data-topic-lead]"),
            guidance: document.querySelector("[data-topic-guidance]"),
            why: document.querySelector("[data-topic-why]"),
            topMovers: document.querySelector("[data-topic-top-movers]"),
            related: document.querySelector("[data-topic-related]"),
            crossLinks: document.querySelector("[data-topic-cross-links]"),
            sourceMix: document.querySelector("[data-topic-source-mix]"),
            actions: document.querySelector("[data-topic-actions-dynamic]"),
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
            links: script?.dataset.links || defaultPaths.links,
            today: script?.dataset.today || defaultPaths.today
        };

        try {
            const [trends, packages, repos, links, today] = await Promise.all([
                readJson(paths.trends).catch(() => null),
                readJson(paths.packages).catch(() => null),
                readJson(paths.repos).catch(() => null),
                readJson(paths.links).catch(() => null),
                readJson(paths.today).catch(() => null)
            ]);

            const items = topicItems({ trends, packages, repos, links }, topic);
            const summary = topicSummary(items);
            const insight = topicInsight(items, topic);
            const dashboard = topicDashboard(items, today, topic);
            const els = selectors();

            if (els.total) els.total.textContent = String(summary.total);
            if (els.modules) els.modules.textContent = String(summary.modules);
            if (els.updated) els.updated.textContent = summary.updated;
            if (els.lead) els.lead.textContent = insight.lead;
            if (els.guidance) els.guidance.innerHTML = renderTopicGuidance(dashboard.guidance);
            if (els.why) els.why.innerHTML = renderWhyNow(dashboard.whyNow);
            if (els.topMovers) els.topMovers.innerHTML = renderTopMovers(dashboard.topMovers);
            if (els.related) els.related.innerHTML = renderRelatedGroups(dashboard.relatedGroups);
            if (els.crossLinks) els.crossLinks.innerHTML = renderCrossLinks(dashboard.crossLinks);
            if (els.sourceMix) els.sourceMix.innerHTML = renderSourceMix(insight.sourceMix);
            if (els.actions) els.actions.innerHTML = renderTopicActions(topic);
            if (els.list) els.list.innerHTML = renderTopicCards(items);
        } catch {
            // Checked-in HTML stays useful when local file fetch is blocked.
        }
    }

    global.TopicApp = {
        topicItems,
        topicSummary,
        renderTopicCards,
        topicMatches,
        topicInsight,
        topicDashboard,
        topicGuidance,
        renderSourceMix,
        renderTopicActions,
        renderTopicGuidance,
        renderWhyNow,
        renderTopMovers,
        renderRelatedGroups,
        renderCrossLinks
    };

    if (typeof document !== "undefined") {
        init();
    }
})(globalThis);
