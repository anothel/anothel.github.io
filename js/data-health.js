(function attachDataHealth(root, factory) {
    const dataHealth = factory(root.AnothelDom);
    if (typeof module === "object" && module.exports) module.exports = dataHealth;
    root.DataHealth = dataHealth;
})(typeof globalThis !== "undefined" ? globalThis : this, function createDataHealth(dom = {}) {
    const escapeHtml = dom.escapeHtml || ((value) => String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;"));
    const freshnessStates = Object.freeze(["fresh", "aging", "stale", "unknown", "unavailable"]);
    const freshnessThresholds = Object.freeze({
        default: Object.freeze({ freshDays: 1, staleAfterDays: 3 }),
        manual: Object.freeze({ freshDays: 30, staleAfterDays: 90 })
    });

    function sourceList(sourceMeta) {
        if (Array.isArray(sourceMeta)) return sourceMeta;
        if (sourceMeta && typeof sourceMeta === "object") return [sourceMeta];
        return [];
    }

    function statusCounts(items) {
        const counts = {
            ok: 0,
            partial: 0,
            error: 0,
            fallback: 0,
            unknown: 0
        };

        for (const item of items) {
            const status = item?.status || "unknown";
            if (Object.hasOwn(counts, status)) {
                counts[status] += 1;
            } else {
                counts.unknown += 1;
            }
        }

        return counts;
    }

    function statusLabel(counts) {
        return [
            ["ok", "ok"],
            ["partial", "partial"],
            ["error", "error"],
            ["fallback", "fallback"],
            ["unknown", "unknown"]
        ]
            .filter(([key]) => counts[key] > 0)
            .map(([key, label]) => `${counts[key]} ${label}`)
            .join(" / ") || "0 modules";
    }

    function summarizeModules(modules = []) {
        const counts = statusCounts(modules);

        return {
            totalItems: modules.reduce((total, module) => total + (module.count || 0), 0),
            totalModules: modules.length,
            ok: counts.ok,
            partial: counts.partial,
            error: counts.error,
            fallback: counts.fallback,
            unknown: counts.unknown,
            updated: modules.map((module) => module.updated).filter(Boolean).sort().at(-1) || "-",
            label: statusLabel(counts)
        };
    }

    function aggregateSourceStatus(sourceMeta) {
        const sources = sourceList(sourceMeta);
        if (sources.length === 0) return "unknown";

        const counts = statusCounts(sources);
        if (counts.fallback > 0) return "fallback";
        if (counts.partial > 0) return "partial";
        if (counts.error > 0 && counts.ok > 0) return "partial";
        if (counts.error > 0) return "error";
        if (counts.ok === sources.length) return "ok";
        return "unknown";
    }

    function datePart(value) {
        const text = String(value || "").trim();
        const match = text.match(/^\d{4}-\d{2}-\d{2}/);
        return match ? match[0] : "";
    }

    function ageDays(updated, today = new Date()) {
        const updatedDate = datePart(updated);
        const todayDate = datePart(today instanceof Date ? today.toISOString() : today);
        if (!updatedDate || !todayDate) return null;

        const diff = Date.parse(`${todayDate}T00:00:00.000Z`) - Date.parse(`${updatedDate}T00:00:00.000Z`);
        if (!Number.isFinite(diff)) return null;
        return Math.max(0, Math.floor(diff / 86400000));
    }

    function validSourceTimestamp(value) {
        return typeof value === "string"
            && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value)
            && Number.isFinite(Date.parse(value));
    }

    function thresholdFor(source) {
        return freshnessThresholds[String(source?.name || source?.source || "").toLowerCase()]
            || freshnessThresholds.default;
    }

    function freshnessForSource(source = {}, today = new Date()) {
        const status = source.status || "unknown";
        const lastSuccessfulUpdate = status === "fallback"
            ? source.previousUpdated
            : status === "error" ? "" : source.updatedAt || source.lastSuccessfulUpdate;

        if (status === "error" && Number(source.count || 0) === 0) {
            return {
                state: "unavailable",
                lastSuccessfulUpdate: null,
                ageDays: null,
                staleReason: source.error || "source failed with no usable data"
            };
        }

        const age = validSourceTimestamp(lastSuccessfulUpdate) ? ageDays(lastSuccessfulUpdate, today) : null;
        if (age === null) {
            return {
                state: "unknown",
                lastSuccessfulUpdate: null,
                ageDays: null,
                staleReason: "last successful source update is missing or ambiguous"
            };
        }

        const threshold = thresholdFor(source);
        const state = age <= threshold.freshDays ? "fresh" : age <= threshold.staleAfterDays ? "aging" : "stale";
        return {
            state,
            lastSuccessfulUpdate,
            ageDays: age,
            staleReason: state === "stale" ? `older than ${threshold.staleAfterDays} days` : null
        };
    }

    function trustState(sourceMeta, options = {}) {
        const sources = sourceList(sourceMeta);
        const counts = sources
            .map((source) => freshnessForSource(source, options.today))
            .reduce((summary, freshness) => {
                summary[freshness.state] = (summary[freshness.state] || 0) + 1;
                return summary;
            }, {});
        const freshness = ["unavailable", "stale", "unknown", "aging", "fresh"]
            .find((state) => counts[state] > 0) || "unknown";

        return {
            pipelineStatus: aggregateSourceStatus(sources),
            freshness,
            counts
        };
    }

    const partialCopy = "Source health partial. Some data is stale but still usable; some sources may be missing. Retry data refresh to recover freshness.";

    function isObject(value) {
        return value !== null && typeof value === "object";
    }

    function isNpmRateLimitedFailure(error) {
        const source = isObject(error)
            ? `${error.name || ""} ${error.error || ""}`
            : `${error || ""}`;
        return /\bn8n-workflow\b/i.test(source) && /\b429\b/.test(source);
    }

    function sourcePartialMode(source) {
        if (source?.status !== "partial") return "";
        if (source?.rateLimited && Array.isArray(source?.errors) && source.errors.some(isNpmRateLimitedFailure)) {
            return "accepted partial";
        }

        return "action required partial";
    }

    function freshnessText(source, today) {
        const status = source?.status || "unknown";
        const freshness = freshnessForSource(source, today);
        const updatedDate = datePart(freshness.lastSuccessfulUpdate);

        if (status === "fallback") {
            return updatedDate ? `Fallback - using ${updatedDate} data (${freshness.state})` : "Unknown - fallback timestamp unavailable";
        }
        if (freshness.state === "unavailable") return "Unavailable - no usable source data";
        if (freshness.state === "unknown") return "Unknown - no reliable source timestamp";
        const prefix = status === "partial" ? "Partial" : freshness.state[0].toUpperCase() + freshness.state.slice(1);
        if (freshness.state === "fresh") return `${prefix} - updated ${updatedDate}`;
        return `${prefix} - ${freshness.ageDays} days old`;
    }

    function cleanErrorMessage(value) {
        return String(value || "").replace(/:\s*https?:\/\/\S+$/i, "");
    }

    function sourceErrorDetail(source) {
        const errors = Array.isArray(source?.errors) ? source.errors : [];
        if (errors.length === 0) return "";

        const normalized = errors.map((error) => {
            if (typeof error === "string") {
                const [name, ...rest] = error.split(": ");
                return { name, error: rest.join(": ") };
            }
            return error || {};
        });
        const names = normalized.map((error) => error.name).filter(Boolean).join(", ");
        const messages = normalized.map((error) => cleanErrorMessage(error.error)).filter(Boolean).join(" / ");
        return `${errors.length} failed: ${names}${messages ? ` - ${messages}` : ""}`;
    }

    function dataModeText(sourceMeta, options = {}) {
        const trust = trustState(sourceMeta, options);
        const status = trust.pipelineStatus;
        if (status === "fallback") return "Source health fallback. Previous data remains available; retry data refresh.";
        if (status === "partial") return partialCopy;
        if (status === "error") return "Source health failed. Retry data refresh before trusting freshness.";
        if (status === "ok") {
            const freshnessCounts = trust.counts;
            const attention = ["aging", "stale", "unknown", "unavailable"]
                .filter((state) => freshnessCounts[state])
                .map((state) => `${freshnessCounts[state]} ${state}`);
            if (attention.length > 0) {
                const recovery = freshnessCounts.stale || freshnessCounts.unavailable ? " Retry data refresh." : "";
                return `Source health ok. Data age: ${attention.join(" / ")}.${recovery}`;
            }
            const updatedDate = datePart(options.updated);
            return updatedDate
                ? `Source health ok. Data date ${updatedDate}. No recovery needed.`
                : "Source health ok. Use the displayed data date for freshness. No recovery needed.";
        }
        return "Data status unavailable. Check Status before trusting freshness.";
    }

    function sourceDetail(source, today) {
        const freshness = freshnessText(source, today);
        const safety = [];
        if (source?.fallbackUsed) safety.push("using fallback");
        if (source?.staleButSafe) safety.push("previous data kept");
        if (source?.rateLimited) safety.push("rate limited");
        if (source?.fallbackReason) safety.push(source.fallbackReason);
        if (source?.previousUpdated) safety.push(`previous refresh ${datePart(source.previousUpdated) || "unknown"}`);

        const errorDetail = sourceErrorDetail(source);
        if (errorDetail) safety.push(errorDetail);
        else if (source?.error) safety.push(cleanErrorMessage(source.error));
        if (source?.status === "partial") {
            const mode = sourcePartialMode(source);
            if (mode) safety.push(mode);
        }
        if ((source?.status === "partial" || source?.status === "error") && safety.length > 0) safety.push("retry data refresh");
        if (safety.length > 0) return `${freshness} / ${safety.join(" / ")}`;
        if (freshnessForSource(source, today).state === "stale") return `${freshness} / retry data refresh`;
        return freshness;
    }

    function renderSourceHealth(sourceMeta, options = {}) {
        return sourceList(sourceMeta).map((source) => `
            <article class="source-health-card status-${escapeHtml(source.status || "unknown")}">
                <div>
                    <strong>${escapeHtml(source.name || "unknown")}</strong>
                    <span>${escapeHtml(source.status || "unknown")}</span>
                </div>
                <p>${escapeHtml(source.count || 0)} visible items</p>
                <small>${escapeHtml(sourceDetail(source, options.today))}</small>
            </article>
        `).join("");
    }

    return {
        aggregateSourceStatus,
        dataModeText,
        freshnessForSource,
        freshnessStates,
        freshnessThresholds,
        freshnessText,
        renderSourceHealth,
        sourceDetail,
        summarizeModules,
        trustState
    };
});
