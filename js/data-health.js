(function attachDataHealth(global) {
    const { escapeHtml } = global.AnothelDom;

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

    function freshnessText(source, today) {
        const status = source?.status || "unknown";
        const updated = source?.updatedAt || source?.updated;
        const updatedDate = datePart(updated);

        if (status === "fallback") {
            const fallbackDate = datePart(source?.previousUpdated) || updatedDate;
            return fallbackDate ? `Fallback - using ${fallbackDate} data` : "Fallback - previous data kept";
        }
        if (status === "error") return "Error - no current timestamp";
        if (status === "partial") return updatedDate ? `Partial - updated ${updatedDate}` : "Partial - usable data remains";

        const age = ageDays(updated, today);
        if (age === null) return "Unknown - no timestamp";
        if (age <= 1) return `Fresh - updated ${updatedDate}`;
        if (age <= 3) return `Aging - ${age} days old`;
        return `Stale - ${age} days old`;
    }

    function dataModeText(sourceMeta, options = {}) {
        const status = aggregateSourceStatus(sourceMeta);
        if (status === "fallback") return "Source health fallback. Previous data remains available; retry data refresh.";
        if (status === "partial") return "Source health partial. Usable data remains available; retry data refresh for missing sources.";
        if (status === "error") return "Source health failed. Retry data refresh before trusting freshness.";
        if (status === "ok") {
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
        if (source?.previousUpdated) safety.push(`previous refresh ${source.previousUpdated}`);
        if (safety.length > 0) return `${freshness} / ${safety.join(" / ")}`;
        if (freshness.startsWith("Stale -")) return `${freshness} / retry data refresh`;

        const errors = Array.isArray(source?.errors) ? source.errors : [];
        if (errors.length > 0) {
            const names = errors.map((error) => error.name).filter(Boolean).join(", ");
            const messages = errors.map((error) => error.error).filter(Boolean).join(" / ");
            return `${freshness} / ${errors.length} failed: ${names}${messages ? ` - ${messages}` : ""}`;
        }
        if (source?.error) return `${freshness} / ${source.error}`;
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

    global.DataHealth = {
        aggregateSourceStatus,
        dataModeText,
        freshnessText,
        renderSourceHealth,
        sourceDetail,
        summarizeModules
    };
})(globalThis);
