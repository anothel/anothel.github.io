export function isDisabled(item) {
    return Boolean(item && typeof item === "object" && item.disabled === true);
}

export function activeItems(items = []) {
    return items.filter((item) => !isDisabled(item));
}

export function itemName(item) {
    return typeof item === "string" ? item : item?.name;
}

export function activeNames(items = []) {
    return activeItems(items)
        .map(itemName)
        .filter((name) => typeof name === "string" && name.trim() !== "");
}

function validateGovernanceFields(item, label, errors, maxDate) {
    if (!item || typeof item !== "object") return;

    if (item.disabled !== undefined && typeof item.disabled !== "boolean") {
        errors.push(`${label}.disabled must be boolean`);
    }

    if (item.history === undefined) return;
    if (!Array.isArray(item.history)) {
        errors.push(`${label}.history must be an array`);
        return;
    }

    item.history.forEach((entry, index) => {
        const entryLabel = `${label}.history[${index}]`;
        if (!entry || typeof entry !== "object") {
            errors.push(`${entryLabel} must be an object`);
            return;
        }
        const date = String(entry.date || "");
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            errors.push(`${entryLabel}.date must be YYYY-MM-DD`);
        } else if (maxDate && date > maxDate) {
            errors.push(`${entryLabel}.date must not be after ${maxDate}`);
        }
        if (typeof entry.note !== "string" || entry.note.trim() === "") {
            errors.push(`${entryLabel}.note must be non-empty`);
        }
    });
}

export function validateWatchlistGovernance(watchlists, options = {}) {
    const errors = [];
    const maxDate = options.today || new Date().toISOString().slice(0, 10);
    const groups = [
        ["trends.npmPackages", watchlists?.trends?.npmPackages],
        ["trends.githubQueries", watchlists?.trends?.githubQueries],
        ["packages", watchlists?.packages],
        ["repos", watchlists?.repos],
        ["links", watchlists?.links]
    ];

    for (const [groupName, items] of groups) {
        if (!Array.isArray(items)) continue;
        items.forEach((item, index) => validateGovernanceFields(item, `${groupName}[${index}]`, errors, maxDate));
    }

    return errors;
}
