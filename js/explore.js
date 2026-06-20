(function attachExplore(global) {
    const storageKey = "anothel.explore.saved.v1";
    const dataHealth = global.DataHealth;

    const defaultPaths = {
        manifest: "../data/manifest.json",
        trends: "../data/trends.json",
        packages: "../data/packages.json",
        repos: "../data/repos.json",
        links: "../data/links.json"
    };

    const state = {
        items: [],
        sourceMeta: [],
        module: "all",
        category: "all",
        focus: "all",
        query: "",
        sort: "priority",
        savedIds: new Set()
    };

    const topicLensDefinitions = [
        {
            focus: "AI agents",
            label: "AI agents",
            description: "Coding agents, agent runtimes, and workflow automation.",
            route: "../topics/ai-agents/index.html"
        },
        {
            focus: "MCP",
            label: "MCP",
            description: "Protocol, SDK, server, and client signals.",
            route: "../topics/mcp/index.html"
        },
        {
            focus: "Agent skills",
            label: "Agent skills",
            description: "Reusable instructions, skills repos, and agent patterns.",
            route: "../topics/agent-skills/index.html"
        },
        {
            focus: "AI evals",
            label: "AI evals",
            description: "Evaluation, observability, and test harness tools."
        },
        {
            focus: "AI engineering",
            label: "AI engineering",
            description: "Model training, inference, and practical AI systems."
        },
        {
            focus: "Workflow automation",
            label: "Workflow automation",
            description: "Durable workflows, integrations, and local automation."
        },
        {
            focus: "Developer tooling",
            label: "Developer tooling",
            description: "Tools that affect coding, testing, and build flow."
        }
    ];

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
            const parsed = new URL(href, "https://anothel.github.io/explore/");
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

    function itemId(moduleKey, item) {
        return `${moduleKey}:${item.url || item.name || item.title || item.rank}`;
    }

    function clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
    }

    function logScore(value, maxLog) {
        return clamp((Math.log10(Math.max(0, Number(value || 0)) + 1) / maxLog) * 100, 0, 100);
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

    function textBoost(text) {
        let boost = 0;
        if (/\b(ai|llm|agent|agents|agentic)\b/.test(text)) boost += 12;
        if (/\b(skill|skills|mcp|codex|openai|anthropic|langchain)\b/.test(text)) boost += 8;
        if (/\b(coding|developer|workflow|automation)\b/.test(text)) boost += 4;
        return Math.min(boost, 20);
    }

    function isBroadBaselinePackage(item) {
        const name = String(item.name || item.title || "").toLowerCase();
        return new Set([
            "typescript",
            "react",
            "eslint",
            "prettier",
            "vite",
            "next",
            "express",
            "tailwindcss",
            "zod"
        ]).has(name);
    }

    function qualityScoreForItem(moduleKey, item) {
        const text = textBlob(item);
        let score = 0;

        if (moduleKey === "trends") {
            score = Number(item.score || 0);
        } else if (moduleKey === "packages") {
            score = logScore(item.downloads, 9);
        } else if (moduleKey === "repos") {
            score = logScore(item.stars, 6);
        } else if (moduleKey === "links") {
            score = Math.max(35, 92 - Number(item.rank || 0) * 3);
        }

        score += textBoost(text);
        const isNpmTrend = moduleKey === "trends" && String(item.source || "").toLowerCase() === "npm";
        if ((moduleKey === "packages" || isNpmTrend) && isBroadBaselinePackage(item) && textBoost(text) < 8) {
            score = Math.min(score, 76);
        }

        return Math.round(clamp(score, 0, 100));
    }

    function sourceContextFor(sources, moduleName) {
        const alsoIn = sources.filter((source) => source !== moduleName);
        return alsoIn.length > 0 ? `Also in ${alsoIn.join(" / ")}` : "";
    }

    function canonicalUrl(value) {
        const href = String(value || "").trim();
        if (!href) return "";

        try {
            const parsed = new URL(href);
            parsed.hash = "";
            parsed.search = "";
            const pathname = parsed.pathname.replace(/\/$/, "").replace(/\.git$/, "");
            return `${parsed.protocol}//${parsed.hostname.toLowerCase()}${pathname.toLowerCase()}`;
        } catch {
            return href.toLowerCase().replace(/\/$/, "");
        }
    }

    function normalizedTitle(value) {
        return String(value || "")
            .toLowerCase()
            .replace(/[^a-z0-9/]+/g, " ")
            .trim()
            .replace(/\s+/g, " ");
    }

    function duplicateKey(item) {
        const url = canonicalUrl(item.url);
        if (url) return `url:${url}`;
        return `title:${normalizedTitle(item.title)}`;
    }

    function mergeExploreItems(primary, duplicate) {
        const winner = (duplicate.qualityScore || duplicate.score || 0) > (primary.qualityScore || primary.score || 0)
            ? duplicate
            : primary;
        const loser = winner === duplicate ? primary : duplicate;
        const sources = [...new Set([...(winner.sources || [winner.module]), ...(loser.sources || [loser.module])])];
        const updated = [winner.updated, loser.updated].filter(Boolean).sort().at(-1) || "-";

        return {
            ...winner,
            sources,
            updated,
            sourceContext: sourceContextFor(sources, winner.module),
            qualityScore: Math.max(winner.qualityScore || winner.score || 0, loser.qualityScore || loser.score || 0),
            score: Math.max(winner.score || 0, loser.score || 0)
        };
    }

    function dedupeExploreItems(items) {
        const merged = new Map();

        for (const item of items) {
            const key = duplicateKey(item);
            if (merged.has(key)) {
                merged.set(key, mergeExploreItems(merged.get(key), item));
            } else {
                merged.set(key, {
                    ...item,
                    sources: item.sources || [item.module],
                    sourceContext: sourceContextFor(item.sources || [item.module], item.module)
                });
            }
        }

        return [...merged.values()];
    }

    function normalizeExploreData(dataByModule) {
        const trends = (dataByModule.trends?.items || []).map((item) => {
            const qualityScore = qualityScoreForItem("trends", item);
            return {
                id: itemId("trends", item),
                module: "Trends",
                title: item.title,
                category: item.category,
                origin: item.source || "Tracked source",
                metric: item.velocity || item.signal || `${item.score || 0} score`,
                summary: item.summary || item.signal || "",
                url: item.url,
                rawScore: Number(item.score || 0),
                qualityScore,
                score: qualityScore,
                sources: ["Trends"],
                updated: dataByModule.trends?.updated || "-"
            };
        });

        const packages = (dataByModule.packages?.packages || []).map((item) => {
            const qualityScore = qualityScoreForItem("packages", item);
            return {
                id: itemId("packages", item),
                module: "Packages",
                title: item.name,
                category: item.category,
                origin: "npm",
                metric: item.downloadsLabel || `${item.downloads || 0} downloads`,
                summary: item.focus || item.period || "",
                url: item.url,
                rawScore: Number(item.downloads || 0),
                qualityScore,
                score: qualityScore,
                sources: ["Packages"],
                updated: dataByModule.packages?.updated || "-"
            };
        });

        const repos = (dataByModule.repos?.repos || []).map((item) => {
            const qualityScore = qualityScoreForItem("repos", item);
            return {
                id: itemId("repos", item),
                module: "Repos",
                title: item.name,
                category: item.category,
                origin: "GitHub",
                metric: item.starsLabel ? `${item.starsLabel} stars` : `${item.stars || 0} stars`,
                summary: item.summary || item.focus || "",
                url: item.url,
                rawScore: Number(item.stars || 0),
                qualityScore,
                score: qualityScore,
                sources: ["Repos"],
                updated: dataByModule.repos?.updated || "-"
            };
        });

        const links = (dataByModule.links?.links || []).map((item) => {
            const qualityScore = qualityScoreForItem("links", item);
            return {
                id: itemId("links", item),
                module: "Links",
                title: item.title,
                category: item.category,
                origin: item.kind || "Reference",
                metric: item.kind || "Reference",
                summary: item.summary || "",
                url: item.url,
                rawScore: Math.max(0, 100 - Number(item.rank || 0)),
                qualityScore,
                score: qualityScore,
                sources: ["Links"],
                updated: dataByModule.links?.updated || "-"
            };
        });

        return dedupeExploreItems([...trends, ...packages, ...repos, ...links]);
    }

    function collectSourceMeta(dataByModule) {
        return [
            ...(Array.isArray(dataByModule.trends?.sourceMeta)
                ? dataByModule.trends.sourceMeta
                : [dataByModule.trends?.sourceMeta]),
            dataByModule.packages?.sourceMeta,
            dataByModule.repos?.sourceMeta,
            dataByModule.links?.sourceMeta
        ].filter(Boolean);
    }

    function includesQuery(item, query) {
        if (!query) return true;
        const normalized = query.toLowerCase();
        return [item.title, item.module, item.category, item.origin, item.metric, item.summary, item.sourceContext, ...(item.sources || [])]
            .some((value) => String(value || "").toLowerCase().includes(normalized));
    }

    function focusMatches(item, focus = "all") {
        if (!focus || focus === "all") return true;

        const text = [item.title, item.module, item.category, item.origin, item.metric, item.summary, item.sourceContext, ...(item.sources || [])]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

        if (focus === "Packages") return item.module === "Packages";
        if (focus === "MCP") return /\bmcp\b|\bmodelcontextprotocol\b/.test(text);
        if (focus === "Agent skills") return /\b(agent skills?|skills?)\b/.test(text);
        if (focus === "AI evals") return /\b(eval|evals|evaluation|observability|braintrust|evalite)\b/.test(text);
        if (focus === "AI engineering") return /\b(ai engineering|gpt|llm|llama|training|inference|cuda|model)\b/.test(text);
        if (focus === "Workflow automation") return /\b(workflow automation|automation|durable workflow|n8n|inngest|integration)\b/.test(text);
        if (focus === "Developer tooling") return /\b(developer tools?|tooling|build tool|lint|format|testing|browser automation|vite|eslint|prettier|playwright)\b/.test(text);
        if (focus === "Security") return /\b(security|oauth|auth|malware|vulnerability|supply chain)\b/.test(text);
        if (focus === "AI agents") return /\b(ai agents?|agentic|coding agent|codex|claude code|copilot|workflow automation)\b/.test(text);

        return true;
    }

    function topicRouteFor(definition) {
        return definition.route || `../explore/index.html?focus=${encodeURIComponent(definition.focus)}`;
    }

    function buildTopicLenses(items) {
        return topicLensDefinitions.map((definition) => {
            const matches = sortExploreItems(
                items.filter((item) => focusMatches(item, definition.focus)),
                "priority",
                new Set()
            );
            const modules = new Set(matches.map((item) => item.module).filter(Boolean));

            return {
                focus: definition.focus,
                label: definition.label,
                description: definition.description,
                route: topicRouteFor(definition),
                count: matches.length,
                modules: modules.size,
                topItem: matches[0] || null
            };
        });
    }

    function filterExploreItems(items, filters) {
        return items
            .filter((item) => filters.module === "all" || item.module === filters.module)
            .filter((item) => filters.category === "all" || item.category === filters.category)
            .filter((item) => focusMatches(item, filters.focus || "all"))
            .filter((item) => includesQuery(item, filters.query || ""));
    }

    function sortExploreItems(items, sort, savedIds = new Set()) {
        return [...items].sort((a, b) => {
            if (sort === "saved") {
                const savedDiff = Number(savedIds.has(b.id)) - Number(savedIds.has(a.id));
                if (savedDiff !== 0) return savedDiff;
                return Number(b.score || 0) - Number(a.score || 0);
            }
            if (sort === "module") {
                return a.module.localeCompare(b.module) || Number(b.score || 0) - Number(a.score || 0);
            }
            if (sort === "category") {
                return a.category.localeCompare(b.category) || Number(b.score || 0) - Number(a.score || 0);
            }
            return Number(b.score || 0) - Number(a.score || 0);
        });
    }

    function visibleItems(items, filters, savedIds) {
        return sortExploreItems(filterExploreItems(items, filters), filters.sort || "priority", savedIds);
    }

    function activeExploreSummary(filters, savedCount = 0) {
        const parts = [];
        if (filters.focus && filters.focus !== "all") parts.push(`Focus: ${filters.focus}`);
        if (filters.module !== "all") parts.push(`Module: ${filters.module}`);
        if (filters.category !== "all") parts.push(`Category: ${filters.category}`);
        if (filters.query) parts.push(`Search: ${filters.query}`);
        if (filters.sort === "saved") parts.push("Sort: saved first");
        if (savedCount > 0) parts.push(`Saved: ${savedCount}`);
        return parts.length > 0 ? parts.join(" / ") : "Showing all tracked items.";
    }

    function clearedExploreState(filters) {
        return {
            module: "all",
            category: "all",
            focus: "all",
            query: "",
            sort: filters.sort === "saved" ? "saved" : "priority"
        };
    }

    function renderExploreCards(items, savedIds = new Set()) {
        if (items.length === 0) {
            return `
                <article class="explore-card empty-card">
                    <h3>No matching items</h3>
                    <p>Broaden the search, switch module, or clear current filters.</p>
                </article>
            `;
        }

        return items.map((item) => {
            const saved = savedIds.has(item.id);
            return `
                <article class="explore-card" data-item-id="${escapeHtml(item.id)}">
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
                        <span class="quality-marker" aria-label="Signal fit score ${escapeHtml(item.qualityScore || item.score || 0)}">Signal fit ${escapeHtml(item.qualityScore || item.score || 0)}</span>
                    </div>
                    ${item.sourceContext ? `<p class="source-context">${escapeHtml(item.sourceContext)}</p>` : ""}
                    <div class="explore-card-actions">
                        <a href="${safeHref(item.url)}">Open item</a>
                        <button type="button" data-save-id="${escapeHtml(item.id)}" aria-pressed="${saved ? "true" : "false"}">
                            ${saved ? "Saved" : "Save"}
                        </button>
                    </div>
                </article>
            `;
        }).join("");
    }

    function renderSavedQueue(items, savedIds = new Set()) {
        const saved = items.filter((item) => savedIds.has(item.id));
        if (saved.length === 0) {
            return '<p class="saved-empty">Save items to review later in this browser.</p>';
        }

        return saved.map((item) => `
            <article class="saved-item">
                <div>
                    <strong>${escapeHtml(item.title)}</strong>
                    <span>${escapeHtml([item.module, item.metric, item.sourceContext].filter(Boolean).join(" / "))}</span>
                </div>
                <button type="button" data-remove-id="${escapeHtml(item.id)}">Remove</button>
            </article>
        `).join("");
    }

    function renderTopicLenses(lenses, activeFocus = "all") {
        return lenses.map((lens) => {
            const pressed = lens.focus === activeFocus;
            const top = lens.topItem ? `${lens.topItem.title} / ${lens.topItem.module}` : "No focused signal yet";

            return `
                <article class="topic-lens-card">
                    <div>
                        <span>${escapeHtml(lens.count)} items / ${escapeHtml(lens.modules)} modules</span>
                        <strong>${escapeHtml(lens.label)}</strong>
                    </div>
                    <p>${escapeHtml(lens.description)}</p>
                    <small>${escapeHtml(top)}</small>
                    <div class="topic-lens-actions">
                        <button type="button" data-focus-lens="${escapeHtml(lens.focus)}" aria-pressed="${pressed ? "true" : "false"}">Use lens</button>
                        <a href="${safeHref(lens.route)}">Open topic</a>
                    </div>
                </article>
            `;
        }).join("");
    }

    function createExploreStore(storage) {
        const validStatuses = new Set(["unread", "read", "done"]);

        function nowIso() {
            return new Date().toISOString();
        }

        function normalizeRecord(record) {
            if (!record || typeof record.id !== "string") return null;
            return {
                id: record.id,
                savedAt: typeof record.savedAt === "string" ? record.savedAt : nowIso(),
                status: validStatuses.has(record.status) ? record.status : "unread"
            };
        }

        function readRecords() {
            try {
                const parsed = JSON.parse(storage?.getItem(storageKey) || "[]");
                if (Array.isArray(parsed)) {
                    return parsed
                        .filter((id) => typeof id === "string")
                        .map((id) => ({ id, savedAt: nowIso(), status: "unread" }));
                }
                if (parsed?.version === 2 && Array.isArray(parsed.items)) {
                    return parsed.items.map(normalizeRecord).filter(Boolean);
                }
                return [];
            } catch {
                return [];
            }
        }

        function writeRecords(records) {
            try {
                storage?.setItem(storageKey, JSON.stringify({ version: 2, items: records.map(normalizeRecord).filter(Boolean) }));
            } catch {
                // Storage can be disabled in private or local file contexts.
            }
        }

        function read() {
            return new Set(readRecords().map((record) => record.id));
        }

        function recordsById() {
            return new Map(readRecords().map((record) => [record.id, record]));
        }

        return {
            read,
            readRecords,
            recordsById,
            toggle(id) {
                const records = readRecords();
                const index = records.findIndex((record) => record.id === id);
                if (index >= 0) records.splice(index, 1);
                else records.push({ id, savedAt: nowIso(), status: "unread" });
                writeRecords(records);
                return new Set(records.map((record) => record.id));
            },
            remove(id) {
                const records = readRecords().filter((record) => record.id !== id);
                writeRecords(records);
                return new Set(records.map((record) => record.id));
            },
            setStatus(id, status) {
                if (!validStatuses.has(status)) return read();
                const records = readRecords();
                const record = records.find((item) => item.id === id);
                if (record) {
                    record.status = status;
                    writeRecords(records);
                }
                return new Set(records.map((item) => item.id));
            }
        };
    }

    function uniqueValues(items, key) {
        return [...new Set(items.map((item) => item[key]).filter(Boolean))].sort();
    }

    function fillSelect(select, values, label) {
        if (!select) return;
        const current = select.value || "all";
        select.innerHTML = `<option value="all">${label}</option>` + values
            .map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`)
            .join("");
        select.value = values.includes(current) ? current : "all";
    }

    function selectors() {
        return {
            results: document.querySelector("[data-explore-results]"),
            saved: document.querySelector("[data-explore-saved]"),
            module: document.querySelector("[data-explore-module]"),
            category: document.querySelector("[data-explore-category]"),
            query: document.querySelector("[data-explore-query]"),
            sort: document.querySelector("[data-explore-sort]"),
            focusButtons: typeof document.querySelectorAll === "function"
                ? [...document.querySelectorAll("[data-focus-filter]")]
                : [],
            total: document.querySelector("[data-explore-total]"),
            savedCount: document.querySelector("[data-explore-saved-count]"),
            categories: document.querySelector("[data-explore-categories]"),
            summary: document.querySelector("[data-explore-summary]"),
            topicLenses: document.querySelector("[data-topic-lenses]"),
            dataMode: document.querySelector("[data-data-mode]"),
            sourceHealth: document.querySelector("[data-source-health]"),
            clearFilters: document.querySelector("[data-clear-filters]")
        };
    }

    function render(els, store) {
        const items = visibleItems(state.items, state, state.savedIds);
        const categoryCount = uniqueValues(items, "category").length;

        if (els.total) els.total.textContent = String(items.length);
        if (els.savedCount) els.savedCount.textContent = String(state.savedIds.size);
        if (els.categories) els.categories.textContent = String(categoryCount);
        if (els.summary) els.summary.textContent = activeExploreSummary(state, state.savedIds.size);
        if (els.topicLenses) els.topicLenses.innerHTML = renderTopicLenses(buildTopicLenses(state.items), state.focus);
        if (els.results) els.results.innerHTML = renderExploreCards(items, state.savedIds);
        if (els.saved) els.saved.innerHTML = renderSavedQueue(state.items, state.savedIds);
        bindDynamicActions(els, store);
    }

    function updateFocusButtons(els) {
        for (const button of els.focusButtons || []) {
            button.setAttribute?.("aria-pressed", String(button.dataset.focusFilter === state.focus));
        }
    }

    function focusFromLocation(focusButtons = []) {
        try {
            const Params = global.URLSearchParams;
            if (!Params) return "all";
            const requested = new Params(global.location?.search || "").get("focus");
            const allowed = new Set(focusButtons.map((button) => button.dataset.focusFilter));
            return requested && allowed.has(requested) ? requested : "all";
        } catch {
            return "all";
        }
    }

    function renderHealth(els) {
        if (!dataHealth) return;
        if (els.dataMode) els.dataMode.textContent = dataHealth.dataModeText(state.sourceMeta);
        if (els.sourceHealth) els.sourceHealth.innerHTML = dataHealth.renderSourceHealth(state.sourceMeta);
    }

    function bindDynamicActions(els, store) {
        for (const button of [els.results, els.saved]) {
            if (!button?.innerHTML) continue;
        }

        if (typeof document.querySelectorAll !== "function") return;

        document.querySelectorAll("[data-save-id]").forEach((button) => {
            button.addEventListener("click", () => {
                state.savedIds = store.toggle(button.dataset.saveId);
                render(els, store);
            });
        });

        document.querySelectorAll("[data-remove-id]").forEach((button) => {
            button.addEventListener("click", () => {
                state.savedIds = store.remove(button.dataset.removeId);
                render(els, store);
            });
        });

        document.querySelectorAll("[data-focus-lens]").forEach((button) => {
            button.addEventListener("click", () => {
                state.focus = button.dataset.focusLens || "all";
                updateFocusButtons(els);
                render(els, store);
            });
        });
    }

    function bindControls(els, store) {
        els.module?.addEventListener("change", (event) => {
            state.module = event.target.value;
            render(els, store);
        });
        els.category?.addEventListener("change", (event) => {
            state.category = event.target.value;
            render(els, store);
        });
        els.query?.addEventListener("input", (event) => {
            state.query = event.target.value;
            render(els, store);
        });
        els.sort?.addEventListener("change", (event) => {
            state.sort = event.target.value;
            render(els, store);
        });
        for (const button of els.focusButtons || []) {
            button.addEventListener("click", () => {
                state.focus = button.dataset.focusFilter || "all";
                updateFocusButtons(els);
                render(els, store);
            });
        }
        els.clearFilters?.addEventListener("click", () => {
            const cleared = clearedExploreState(state);
            state.module = cleared.module;
            state.category = cleared.category;
            state.focus = cleared.focus;
            state.query = cleared.query;
            state.sort = cleared.sort;
            if (els.module) els.module.value = state.module;
            if (els.category) els.category.value = state.category;
            if (els.query) els.query.value = state.query;
            if (els.sort) els.sort.value = state.sort;
            updateFocusButtons(els);
            render(els, store);
        });
    }

    async function readJson(path) {
        const response = await fetch(path);
        if (!response.ok) return null;
        return response.json();
    }

    async function init() {
        const script = document.currentScript;
        const paths = {
            manifest: script?.dataset.manifest || defaultPaths.manifest,
            trends: script?.dataset.trends || defaultPaths.trends,
            packages: script?.dataset.packages || defaultPaths.packages,
            repos: script?.dataset.repos || defaultPaths.repos,
            links: script?.dataset.links || defaultPaths.links
        };

        const [manifest, trends, packages, repos, links] = await Promise.all([
            readJson(paths.manifest).catch(() => null),
            readJson(paths.trends).catch(() => null),
            readJson(paths.packages).catch(() => null),
            readJson(paths.repos).catch(() => null),
            readJson(paths.links).catch(() => null)
        ]);

        const dataByModule = {
            manifest,
            trends,
            packages,
            repos,
            links
        };
        const els = selectors();
        const store = createExploreStore(global.localStorage);

        state.items = normalizeExploreData(dataByModule);
        state.sourceMeta = collectSourceMeta(dataByModule);
        state.savedIds = store.read();
        state.focus = focusFromLocation(els.focusButtons);

        fillSelect(els.module, uniqueValues(state.items, "module"), "All modules");
        fillSelect(els.category, uniqueValues(state.items, "category"), "All categories");
        updateFocusButtons(els);
        bindControls(els, store);
        renderHealth(els);
        render(els, store);
    }

    global.ExploreApp = {
        normalizeExploreData,
        collectSourceMeta,
        filterExploreItems,
        focusMatches,
        sortExploreItems,
        renderExploreCards,
        renderSavedQueue,
        buildTopicLenses,
        renderTopicLenses,
        createExploreStore,
        qualityScoreForItem,
        dedupeExploreItems,
        activeExploreSummary,
        clearedExploreState
    };

    if (typeof document !== "undefined" && document.querySelector("[data-explore-results]")) {
        init();
    }
})(globalThis);
