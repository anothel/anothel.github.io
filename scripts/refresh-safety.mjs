export function isRateLimitError(errorText = "") {
    return /rate limit|rate_limited|too many requests|secondary rate limit/i.test(String(errorText));
}

export function sourceSafetyFlags(errors = []) {
    const list = Array.isArray(errors) ? errors : [];
    return {
        errorCount: list.length,
        rateLimited: list.some((error) => isRateLimitError([error?.name, error?.error, error?.message].filter(Boolean).join(" ")))
    };
}

function sourceMetaList(sourceMeta) {
    if (Array.isArray(sourceMeta)) return sourceMeta;
    if (sourceMeta && typeof sourceMeta === "object") return [sourceMeta];
    return [];
}

function sourceErrors(sourceMeta) {
    return sourceMetaList(sourceMeta).flatMap((source) => {
        if (Array.isArray(source.errors)) return source.errors;
        if (source.error) return [{ name: source.name, error: source.error }];
        return [];
    });
}

function markSourceMeta(sourceMeta, previousCount, options, nextData) {
    const sources = sourceMetaList(sourceMeta);
    const base = sources.length > 0 ? sources : [{ name: options.sourceName || "unknown" }];
    const errors = sourceErrors(nextData.sourceMeta);
    const flags = sourceSafetyFlags(errors);

    return base.map((source) => ({
        ...source,
        status: "fallback",
        count: previousCount,
        fallbackUsed: true,
        staleButSafe: true,
        fallbackReason: options.fallbackReason,
        previousUpdated: options.previousUpdated,
        rateLimited: flags.rateLimited,
        ...(errors.length > 0 ? { errors } : {})
    }));
}

export function applyEmptyCollectionFallback(nextData, previousData, options) {
    const collection = options.collection;
    const nextItems = Array.isArray(nextData?.[collection]) ? nextData[collection] : [];
    const previousItems = Array.isArray(previousData?.[collection]) ? previousData[collection] : [];

    if (nextItems.length > 0 || previousItems.length === 0) {
        return nextData;
    }

    const previousUpdated = previousData.updated || "-";
    const sourceMeta = markSourceMeta(previousData.sourceMeta, previousItems.length, {
        ...options,
        previousUpdated
    }, nextData);

    return {
        ...previousData,
        generatedAt: nextData.generatedAt,
        sourceMeta: Array.isArray(previousData.sourceMeta) ? sourceMeta : sourceMeta[0],
        [collection]: previousItems
    };
}
