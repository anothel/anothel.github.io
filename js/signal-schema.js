(function attachSignalSchema(root, factory) {
    const schema = factory();
    if (typeof module === "object" && module.exports) {
        module.exports = schema;
    }
    root.SignalSchema = schema;
})(typeof globalThis !== "undefined" ? globalThis : this, function createSignalSchema() {
    const schemaVersion = 2;
    const moduleLabels = {
        trends: "Trends",
        packages: "Packages",
        repos: "Repos",
        links: "Links"
    };
    const sourceKinds = {
        trends: "trend",
        packages: "package",
        repos: "repo",
        links: "reference"
    };
    const fallbackSignalPolicy = {
        baselineTitles: [
            "typescript",
            "eslint",
            "prettier",
            "react",
            "react/react",
            "zod",
            "tailwindcss",
            "vite",
            "vitejs/vite",
            "next",
            "next.js",
            "vercel/next.js"
        ]
    };

    function signalPolicyFor(options = {}) {
        return options.signalPolicy || fallbackSignalPolicy;
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

    function isBroadBaselineSignal(item, options = {}) {
        const name = String(item.name || item.title || "").toLowerCase();
        return new Set(signalPolicyFor(options).baselineTitles || []).has(name);
    }

    function qualityScoreForItem(moduleKey, item, options = {}) {
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
        if ((moduleKey === "packages" || moduleKey === "repos" || isNpmTrend) && isBroadBaselineSignal(item, options) && textBoost(text) < 8) {
            score = Math.min(score, 76);
        }

        return Math.round(clamp(score, 0, 100));
    }

    function trendReason(item) {
        return [item.velocity, item.signal].filter(Boolean).join(" / ") || item.summary || "Ranked trend signal";
    }

    function scoreReasons(fields, qualityScore) {
        const reasons = [
            fields.metric && fields.origin ? `${fields.metric} from ${fields.origin}` : fields.metric,
            fields.reason && fields.reason !== fields.metric ? fields.reason : "",
            qualityScore >= 80 ? `Signal fit ${qualityScore}/100` : ""
        ].filter(Boolean);
        return [...new Set(reasons)].slice(0, 3);
    }

    function rankValue(item) {
        const rank = Number(item?.sourceRank || item?.rank || 0);
        return Number.isFinite(rank) && rank > 0 ? rank : Number.MAX_SAFE_INTEGER;
    }

    function modulePriority(item) {
        return {
            Trends: 0,
            Repos: 1,
            Links: 2,
            Packages: 3
        }[item?.module] ?? 4;
    }

    function compareSignalPriority(a, b) {
        return Number(b?.score || 0) - Number(a?.score || 0)
            || modulePriority(a) - modulePriority(b)
            || rankValue(a) - rankValue(b)
            || String(a?.title || "").localeCompare(String(b?.title || ""));
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

    function signalItem(moduleKey, item, data, fields, options) {
        const qualityScore = qualityScoreForItem(moduleKey, item, options);
        const moduleName = moduleLabels[moduleKey];
        const canonicalKey = duplicateKey(fields);
        const legacyId = itemId(moduleKey, item);
        return {
            schemaVersion,
            id: canonicalKey || legacyId,
            legacyIds: legacyId && legacyId !== canonicalKey ? [legacyId] : [],
            sourceModule: moduleKey,
            module: moduleName,
            sourceKind: sourceKinds[moduleKey],
            title: String(fields.title || ""),
            category: String(fields.category || `${moduleName} signal`),
            origin: String(fields.origin || moduleName),
            metric: String(fields.metric || ""),
            summary: String(fields.summary || ""),
            reason: String(fields.reason || fields.summary || ""),
            url: String(fields.url || ""),
            rawScore: fields.rawScore,
            sourceRank: Number(item.rank || 0),
            qualityScore,
            score: qualityScore,
            scoreReasons: scoreReasons(fields, qualityScore),
            sources: [moduleName],
            sourceContext: "",
            canonicalKey,
            updated: data?.updated || "-"
        };
    }

    function mergeSignalItems(primary, duplicate) {
        const winner = (duplicate.qualityScore || duplicate.score || 0) > (primary.qualityScore || primary.score || 0)
            ? duplicate
            : primary;
        const loser = winner === duplicate ? primary : duplicate;
        const sources = [...new Set([...(winner.sources || [winner.module]), ...(loser.sources || [loser.module])])];
        const updated = [winner.updated, loser.updated].filter(Boolean).sort().at(-1) || "-";

        return {
            ...winner,
            sources,
            legacyIds: [...new Set([...(winner.legacyIds || []), ...(loser.legacyIds || []), loser.id])].filter((id) => id && id !== winner.id),
            updated,
            sourceContext: sourceContextFor(sources, winner.module),
            qualityScore: Math.max(winner.qualityScore || winner.score || 0, loser.qualityScore || loser.score || 0),
            score: Math.max(winner.score || 0, loser.score || 0),
            scoreReasons: [...new Set([...(winner.scoreReasons || []), ...(loser.scoreReasons || [])])].slice(0, 3)
        };
    }

    function dedupeSignalItems(items) {
        const merged = new Map();

        for (const item of items) {
            const key = item.canonicalKey || duplicateKey(item);
            if (merged.has(key)) {
                merged.set(key, mergeSignalItems(merged.get(key), item));
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

    function normalizeSignalData(dataByModule = {}, options = {}) {
        const trends = (dataByModule.trends?.items || []).map((item) => signalItem("trends", item, dataByModule.trends, {
            title: item.title,
            category: item.category,
            origin: item.source || "Tracked source",
            metric: item.velocity || item.signal || `${item.score || 0} score`,
            summary: item.summary || item.signal || "",
            reason: trendReason(item),
            url: item.url,
            rawScore: Number(item.score || 0)
        }, options));

        const packages = (dataByModule.packages?.packages || []).map((item) => signalItem("packages", item, dataByModule.packages, {
            title: item.name,
            category: item.category,
            origin: "npm",
            metric: item.downloadsLabel || `${item.downloads || 0} downloads`,
            summary: item.focus || item.period || "",
            reason: item.focus || "Weekly npm demand",
            url: item.url,
            rawScore: Number(item.downloads || 0)
        }, options));

        const repos = (dataByModule.repos?.repos || []).map((item) => signalItem("repos", item, dataByModule.repos, {
            title: item.name,
            category: item.category,
            origin: "GitHub",
            metric: item.starsLabel ? `${item.starsLabel} stars` : `${item.stars || 0} stars`,
            summary: item.summary || item.focus || "",
            reason: item.focus || item.summary || "Repository traction",
            url: item.url,
            rawScore: Number(item.stars || 0)
        }, options));

        const links = (dataByModule.links?.links || []).map((item) => signalItem("links", item, dataByModule.links, {
            title: item.title,
            category: item.category,
            origin: item.kind || "Reference",
            metric: item.kind || "Reference",
            summary: item.summary || "",
            reason: item.summary || "Reference shelf item",
            url: item.url,
            rawScore: Math.max(0, 100 - Number(item.rank || 0))
        }, options));

        const items = [...trends, ...packages, ...repos, ...links].filter((item) => item.title && item.url);
        return options.dedupe === false ? items : dedupeSignalItems(items);
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

    function validateSignalItem(item) {
        const errors = [];
        const sourceModules = new Set(Object.keys(moduleLabels));
        const modules = new Set(Object.values(moduleLabels));
        const kinds = new Set(Object.values(sourceKinds));

        if (item?.schemaVersion !== schemaVersion) errors.push("schemaVersion must be 2");
        if (!item?.id) errors.push("id is required");
        if (!sourceModules.has(item?.sourceModule)) errors.push("sourceModule is invalid");
        if (!modules.has(item?.module)) errors.push("module is invalid");
        if (!kinds.has(item?.sourceKind)) errors.push("sourceKind is invalid");
        for (const field of ["title", "category", "origin", "metric", "summary", "url", "updated", "canonicalKey"]) {
            if (typeof item?.[field] !== "string") errors.push(`${field} must be a string`);
        }
        for (const field of ["rawScore", "qualityScore", "score"]) {
            if (!Number.isFinite(Number(item?.[field]))) errors.push(`${field} must be finite`);
        }
        if (!Array.isArray(item?.scoreReasons) || item.scoreReasons.length < 1 || item.scoreReasons.length > 3) {
            errors.push("scoreReasons must contain 1-3 reasons");
        }
        for (const reason of item?.scoreReasons || []) {
            if (typeof reason !== "string" || !reason.trim()) errors.push("scoreReasons must be non-empty strings");
        }
        if (Number(item?.qualityScore) < 0 || Number(item?.qualityScore) > 100) errors.push("qualityScore must be 0-100");
        if (Number(item?.score) < 0 || Number(item?.score) > 100) errors.push("score must be 0-100");
        if (!Array.isArray(item?.sources) || item.sources.length === 0) errors.push("sources must be non-empty");
        if (!Array.isArray(item?.legacyIds)) errors.push("legacyIds must be an array");
        return errors;
    }

    return {
        schemaVersion,
        itemId,
        qualityScoreForItem,
        sourceContextFor,
        canonicalUrl,
        duplicateKey,
        mergeSignalItems,
        dedupeSignalItems,
        compareSignalPriority,
        normalizeSignalData,
        collectSourceMeta,
        validateSignalItem
    };
});
