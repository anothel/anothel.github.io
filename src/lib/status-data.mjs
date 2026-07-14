import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { freshnessForSource, trustState } = require("../../js/data-health.js");

const validStatuses = new Set(["ok", "partial", "error", "fallback", "unknown"]);

function text(value, fallback = "unknown") {
    return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function count(value) {
    return Number.isInteger(value) && value >= 0 ? value : null;
}

function validationState(validation, file) {
    if (!validation) return "unknown";
    if ((validation.errors || []).some((item) => !file || item.file === file)) return "invalid";
    if ((validation.warnings || []).some((item) => !file || item.file === file)) return "warning";
    return "valid";
}

function sourceIssue(source, freshness, availability) {
    const errors = Array.isArray(source.errors) ? source.errors : [];
    const latest = errors.at(-1);
    if (latest) {
        const value = typeof latest === "string"
            ? latest
            : [latest.name, latest.error || latest.message].filter(Boolean).join(": ");
        return text(value).replace(/:\s*https?:\/\/\S+$/i, "");
    }
    if (source.error) return text(source.error).replace(/:\s*https?:\/\/\S+$/i, "");
    if (source.fallbackReason) return text(source.fallbackReason);
    if (source.rateLimited) return "Rate limited.";
    if (availability === "empty") return "Zero results reported without a source failure.";
    if (freshness.staleReason) return text(freshness.staleReason);
    return "None recorded.";
}

function sourceAvailability(status, itemCount) {
    if (status === "error") return "failed";
    if (status === "fallback") return "fallback";
    if (status === "unknown") return "unknown";
    if (status === "ok" && itemCount === 0) return "empty";
    return "available";
}

function sourceHealth(status, freshness, validation, availability) {
    if (availability === "failed") return "unavailable";
    if (validation === "invalid" || status === "partial" || status === "fallback") return "degraded";
    if (freshness.state === "stale") return "stale";
    if (freshness.state === "unknown" || status === "unknown") return "unknown";
    return "healthy";
}

function overallHealth(rows, validation) {
    if (rows.length === 0) return "unknown";
    if (rows.every((row) => row.health === "unavailable")) return "unavailable";
    if (validation === "invalid" || rows.some((row) => row.health === "degraded" || row.health === "unavailable")) return "degraded";
    if (rows.some((row) => row.health === "stale")) return "stale";
    if (rows.some((row) => row.health === "unknown")) return "unknown";
    return "healthy";
}

function healthSummary(state, validation) {
    if (validation === "invalid") return "Checked-in data failed validation.";
    if (state === "unavailable") return "No source has usable current data.";
    if (state === "degraded") return "Pipeline output exists, but one or more sources are partial, failed, or using fallback data.";
    if (state === "stale") return "Pipeline output validates, but source data is stale.";
    if (state === "unknown") return "Pipeline output exists, but freshness cannot be proven for every source.";
    return "Pipeline output validates and all source data is current.";
}

export function buildStatusDashboard({ manifest = {}, datasets = {}, report = {}, validation = null, now = new Date() } = {}) {
    const modules = Array.isArray(manifest.modules) ? manifest.modules : [];
    const sourceMetadata = modules.flatMap((module) => {
        const sourceMeta = datasets[module.id]?.sourceMeta;
        if (Array.isArray(sourceMeta)) return sourceMeta;
        return sourceMeta && typeof sourceMeta === "object" ? [sourceMeta] : [];
    });
    const trust = trustState(sourceMetadata, { today: now });
    const rows = modules.flatMap((module) => {
        const sourceMeta = datasets[module.id]?.sourceMeta;
        const sources = Array.isArray(sourceMeta) ? sourceMeta : sourceMeta && typeof sourceMeta === "object" ? [sourceMeta] : [null];
        const file = text(module.data, "");
        const sourceValidation = validationState(validation, file);

        return sources.map((sourceMetaItem) => {
            const source = sourceMetaItem || {};
            const status = validStatuses.has(source.status) ? source.status : "unknown";
            const itemCount = count(source.count);
            const freshness = freshnessForSource({ ...source, status, count: itemCount }, now);
            const retainedUpdate = freshness.lastSuccessfulUpdate || freshnessForSource({ status: "fallback", previousUpdated: source.previousUpdated }, now).lastSuccessfulUpdate;
            const availability = sourceAvailability(status, itemCount);
            return {
                name: text(source.name || module.source),
                category: text(module.title || module.id),
                route: text(module.route, "status/index.html"),
                pipelineStatus: status,
                health: sourceHealth(status, freshness, sourceValidation, availability),
                availability,
                freshness: freshness.state,
                ageDays: freshness.ageDays,
                lastSuccessfulUpdate: retainedUpdate,
                itemCount,
                coverage: text(source.coverage),
                validation: sourceValidation,
                issue: sourceMetaItem ? sourceIssue(source, freshness, availability) : "Required source metadata missing.",
                fallback: Boolean(source.fallbackUsed || status === "fallback")
            };
        });
    });

    const overallValidation = validationState(validation);
    const counts = {
        total: rows.length,
        healthy: rows.filter((row) => row.health === "healthy").length,
        stale: rows.filter((row) => row.health === "stale").length,
        failed: rows.filter((row) => row.availability === "failed").length,
        empty: rows.filter((row) => row.availability === "empty").length,
        unknown: rows.filter((row) => row.health === "unknown").length,
        fallback: rows.filter((row) => row.fallback).length
    };
    const overall = overallHealth(rows, overallValidation);
    const generatedFreshness = freshnessForSource({ status: "ok", updatedAt: report.generatedAt }, now);
    const generatedAt = generatedFreshness.lastSuccessfulUpdate || "unknown";
    const reportStatus = validStatuses.has(report.totals?.status) ? report.totals.status : "unknown";

    return {
        overall,
        overallSummary: healthSummary(overall, overallValidation),
        generatedAt,
        dataAgeDays: generatedFreshness.ageDays,
        counts,
        validation: overallValidation,
        validationDetail: validation
            ? `${validation.errors?.length || 0} errors / ${validation.warnings?.length || 0} warnings`
            : "Validation result unavailable.",
        latestSuccessfulGeneration: reportStatus === "ok" && generatedAt !== "unknown" ? generatedAt : "unknown",
        pipelineStatus: trust.pipelineStatus,
        freshness: trust.freshness,
        reportStatus,
        rows
    };
}
