(function attachDataHealth(global) {
    function escapeHtml(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;");
    }

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

    function dataModeText(sourceMeta) {
        const status = aggregateSourceStatus(sourceMeta);
        if (status === "fallback") return "Showing fallback data because checked-in data was unavailable.";
        if (status === "partial") return "Checked-in data loaded with partial source failures.";
        if (status === "error") return "Checked-in data loaded, but source refresh failed.";
        if (status === "ok") return "Checked-in data loaded. Scheduled workflow keeps it fresh.";
        return "Data status unavailable.";
    }

    function sourceDetail(source) {
        const safety = [];
        if (source?.fallbackUsed) safety.push("fallback used");
        if (source?.staleButSafe) safety.push("stale but safe");
        if (source?.rateLimited) safety.push("rate limited");
        if (source?.fallbackReason) safety.push(source.fallbackReason);
        if (source?.previousUpdated) safety.push(`previous ${source.previousUpdated}`);
        if (safety.length > 0) return safety.join(" / ");

        const errors = Array.isArray(source?.errors) ? source.errors : [];
        if (errors.length > 0) {
            const names = errors.map((error) => error.name).filter(Boolean).join(", ");
            const messages = errors.map((error) => error.error).filter(Boolean).join(" / ");
            return `${errors.length} failed: ${names}${messages ? ` - ${messages}` : ""}`;
        }
        if (source?.error) return source.error;
        return source?.updatedAt || source?.updated || "No timestamp";
    }

    function renderSourceHealth(sourceMeta) {
        return sourceList(sourceMeta).map((source) => `
            <article class="source-health-card status-${escapeHtml(source.status || "unknown")}">
                <div>
                    <strong>${escapeHtml(source.name || "unknown")}</strong>
                    <span>${escapeHtml(source.status || "unknown")}</span>
                </div>
                <p>${escapeHtml(source.count || 0)} visible items</p>
                <small>${escapeHtml(sourceDetail(source))}</small>
            </article>
        `).join("");
    }

    global.DataHealth = {
        aggregateSourceStatus,
        dataModeText,
        renderSourceHealth,
        summarizeModules
    };
})(globalThis);
