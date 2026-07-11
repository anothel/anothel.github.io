import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

export const dataFiles = [
    "data/links.json",
    "data/manifest.json",
    "data/packages.json",
    "data/refresh-report.json",
    "data/repos.json",
    "data/signal-policy.json",
    "data/today.json",
    "data/trends.json",
    "data/watchlists.json"
];

const statusValues = new Set(["ok", "partial", "error", "fallback", "unknown"]);
const sourceModules = new Set(["trends", "packages", "repos", "links"]);
const moduleLabels = new Set(["Trends", "Packages", "Repos", "Links"]);
const sourceKinds = new Set(["trend", "package", "repo", "reference"]);
const trendSources = new Set(["Hacker News", "GitHub", "npm"]);
const sectionIds = new Set(["start", "skim", "reference"]);
const moduleSpecs = new Map([
    ["trends", { title: "Tech trends", route: "trends/index.html", data: "data/trends.json" }],
    ["packages", { title: "Package watchlist", route: "packages/index.html", data: "data/packages.json" }],
    ["repos", { title: "Repo watchlist", route: "repos/index.html", data: "data/repos.json" }],
    ["links", { title: "Reference shelf", route: "links/index.html", data: "data/links.json" }]
]);
const defaultCategories = new Set([
    "AI",
    "AI SDK",
    "AI agents",
    "AI engineering",
    "AI evals",
    "API",
    "Agent skills",
    "Data",
    "Database",
    "Developer tooling",
    "Developer tools",
    "Framework",
    "Frontend",
    "Language",
    "MCP",
    "Ops",
    "Runtime",
    "Security",
    "Testing",
    "Tooling",
    "TypeScript",
    "UI",
    "Validation",
    "Workflow automation"
]);

function typeOf(value) {
    if (value === null) return "null";
    if (Array.isArray(value)) return "array";
    if (Number.isInteger(value)) return "integer";
    return typeof value;
}

function actualValue(value) {
    if (typeof value === "string") return `string ${JSON.stringify(value)}`;
    if (typeof value === "number" || typeof value === "boolean" || value == null) return `${typeOf(value)} ${String(value)}`;
    return typeOf(value);
}

function diagnostic(level, file, record, field, expected, actual, message) {
    return { level, file, record, field, expected, actual: actualValue(actual), message };
}

function isPlainObject(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function validDate(value) {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

function validTimestamp(value) {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value)) return false;
    return !Number.isNaN(Date.parse(value));
}

function validUrl(value) {
    if (typeof value !== "string" || value.trim() === "" || /[\u0000-\u001F\u007F]/.test(value)) return false;
    if (value.startsWith("//")) return false;
    if (/^https?:\/\//.test(value)) {
        try {
            new URL(value);
            return true;
        } catch {
            return false;
        }
    }
    return /^(\.\.\/|\.\/|\/)?[a-z0-9._/-]+(?:\?[^\s#]*)?(?:#[^\s]*)?$/i.test(value);
}

function add(out, level, file, record, field, expected, actual, message) {
    out.push(diagnostic(level, file, record, field, expected, actual, message));
}

function error(out, file, record, field, expected, actual, message) {
    add(out, "error", file, record, field, expected, actual, message);
}

function warning(out, file, record, field, expected, actual, message) {
    add(out, "warning", file, record, field, expected, actual, message);
}

function checkObject(out, file, record, value) {
    if (isPlainObject(value)) return true;
    error(out, file, record, "(record)", "object", value, "record must be an object");
    return false;
}

function checkKeys(out, file, record, obj, keys) {
    for (const key of Object.keys(obj)) {
        if (!keys.has(key)) {
            error(out, file, record, key, `supported fields: ${[...keys].sort().join(", ")}`, obj[key], "unsupported field");
        }
    }
}

function required(out, file, record, obj, field) {
    if (Object.hasOwn(obj, field)) return true;
    error(out, file, record, field, "required field", undefined, "missing required field");
    return false;
}

function nonEmptyString(out, file, record, obj, field) {
    if (!required(out, file, record, obj, field)) return;
    if (typeof obj[field] !== "string") {
        error(out, file, record, field, "non-empty string", obj[field], "invalid field type");
    } else if (obj[field].trim() === "") {
        error(out, file, record, field, "non-empty string", obj[field], "empty required text");
    }
}

function optionalString(out, file, record, obj, field) {
    if (obj[field] !== undefined && typeof obj[field] !== "string") {
        error(out, file, record, field, "string", obj[field], "invalid field type");
    }
}

function stringField(out, file, record, obj, field) {
    if (!required(out, file, record, obj, field)) return;
    if (typeof obj[field] !== "string") error(out, file, record, field, "string", obj[field], "invalid field type");
}

function numberRange(out, file, record, obj, field, min = -Infinity, max = Infinity, requiredField = true) {
    if (requiredField && !required(out, file, record, obj, field)) return;
    if (!requiredField && obj[field] === undefined) return;
    if (typeof obj[field] !== "number" || !Number.isFinite(obj[field])) {
        error(out, file, record, field, `number ${min}..${max}`, obj[field], "invalid field type");
    } else if (obj[field] < min || obj[field] > max) {
        error(out, file, record, field, `number ${min}..${max}`, obj[field], "score outside the allowed range");
    }
}

function integerRange(out, file, record, obj, field, min = -Infinity, max = Infinity, requiredField = true) {
    if (requiredField && !required(out, file, record, obj, field)) return;
    if (!requiredField && obj[field] === undefined) return;
    if (!Number.isInteger(obj[field])) {
        error(out, file, record, field, `integer ${min}..${max}`, obj[field], "invalid field type");
    } else if (obj[field] < min || obj[field] > max) {
        error(out, file, record, field, `integer ${min}..${max}`, obj[field], "number outside allowed range");
    }
}

function boolField(out, file, record, obj, field, requiredField = true) {
    if (requiredField && !required(out, file, record, obj, field)) return;
    if (!requiredField && obj[field] === undefined) return;
    if (typeof obj[field] !== "boolean") error(out, file, record, field, "boolean", obj[field], "invalid field type");
}

function dateField(out, file, record, obj, field, requiredField = true) {
    if (requiredField && !required(out, file, record, obj, field)) return;
    if (!requiredField && obj[field] === undefined) return;
    if (!validDate(obj[field])) error(out, file, record, field, "date YYYY-MM-DD", obj[field], "malformed date");
}

function timestampField(out, file, record, obj, field, requiredField = true) {
    if (requiredField && !required(out, file, record, obj, field)) return;
    if (!requiredField && obj[field] === undefined) return;
    if (!validTimestamp(obj[field])) error(out, file, record, field, "ISO timestamp", obj[field], `invalid ${field} value`);
}

function urlField(out, file, record, obj, field) {
    if (!required(out, file, record, obj, field)) return;
    if (!validUrl(obj[field])) error(out, file, record, field, "http(s) or safe relative URL", obj[field], "malformed URL");
}

function arrayField(out, file, record, obj, field) {
    if (!required(out, file, record, obj, field)) return false;
    if (!Array.isArray(obj[field])) {
        error(out, file, record, field, "array", obj[field], "invalid field type");
        return false;
    }
    return true;
}

function oneOf(out, file, record, obj, field, values) {
    if (!required(out, file, record, obj, field)) return;
    if (!values.has(obj[field])) {
        error(out, file, record, field, `one of: ${[...values].join(", ")}`, obj[field], "invalid source/category value");
    }
}

function noDuplicate(out, file, record, field, value, seen) {
    if (typeof value !== "string" && typeof value !== "number") return;
    const key = String(value).toLowerCase();
    if (seen.has(key)) {
        error(out, file, record, field, "unique stable identifier", value, "duplicate item identifier");
    }
    seen.add(key);
}

function sourceMetaList(sourceMeta) {
    if (Array.isArray(sourceMeta)) return sourceMeta;
    if (isPlainObject(sourceMeta)) return [sourceMeta];
    return [];
}

function validateSourceError(out, file, record, value) {
    if (typeof value === "string") {
        if (value.trim() === "") error(out, file, record, "(record)", "non-empty string", value, "empty required text");
        return;
    }
    if (!checkObject(out, file, record, value)) return;
    checkKeys(out, file, record, value, new Set(["name", "error", "message"]));
    optionalString(out, file, record, value, "name");
    if (value.error !== undefined) optionalString(out, file, record, value, "error");
    if (value.message !== undefined) optionalString(out, file, record, value, "message");
}

function validateSourceMeta(out, file, sourceMeta, record = "sourceMeta") {
    const list = sourceMetaList(sourceMeta);
    if (list.length === 0) {
        error(out, file, record, "sourceMeta", "object or non-empty array", sourceMeta, "invalid field type");
        return;
    }

    list.forEach((source, index) => {
        const path = Array.isArray(sourceMeta) ? `${record}[${index}]` : record;
        if (!checkObject(out, file, path, source)) return;
        checkKeys(out, file, path, source, new Set([
            "name",
            "status",
            "count",
            "tracked",
            "emitted",
            "coverage",
            "updatedAt",
            "updated",
            "errors",
            "error",
            "fallbackUsed",
            "staleButSafe",
            "fallbackReason",
            "previousUpdated",
            "rateLimited"
        ]));
        nonEmptyString(out, file, path, source, "name");
        oneOf(out, file, path, source, "status", statusValues);
        integerRange(out, file, path, source, "count", 0);
        integerRange(out, file, path, source, "tracked", 0, Infinity, false);
        integerRange(out, file, path, source, "emitted", 0, Infinity, false);
        optionalString(out, file, path, source, "coverage");
        timestampField(out, file, path, source, "updatedAt", false);
        dateField(out, file, path, source, "updated", false);
        optionalString(out, file, path, source, "error");
        boolField(out, file, path, source, "fallbackUsed", false);
        boolField(out, file, path, source, "staleButSafe", false);
        optionalString(out, file, path, source, "fallbackReason");
        if (source.previousUpdated !== undefined) timestampField(out, file, path, source, "previousUpdated", false);
        boolField(out, file, path, source, "rateLimited", false);
        if (source.emitted !== undefined && source.tracked !== undefined && source.emitted > source.tracked) {
            error(out, file, path, "emitted", "<= tracked", source.emitted, "source coverage cannot exceed tracked count");
        }
        if (source.errors !== undefined) {
            if (!Array.isArray(source.errors)) {
                error(out, file, path, "errors", "array", source.errors, "invalid field type");
            } else {
                source.errors.forEach((entry, errorIndex) => validateSourceError(out, file, `${path}.errors[${errorIndex}]`, entry));
            }
        }
    });
}

function validateCategory(out, file, record, obj, ctx) {
    nonEmptyString(out, file, record, obj, "category");
    if (typeof obj.category === "string" && obj.category.trim() !== "" && !ctx.categories.has(obj.category)) {
        error(out, file, record, "category", `one of supported categories`, obj.category, "invalid source/category value");
    }
}

function validateTopDates(out, file, data) {
    dateField(out, file, "(top-level)", data, "updated");
    timestampField(out, file, "(top-level)", data, "generatedAt");
}

function validateRanked(out, file, record, item, seenRank) {
    integerRange(out, file, record, item, "rank", 1);
    noDuplicate(out, file, record, "rank", item.rank, seenRank);
}

function validateTrends(out, file, data, ctx) {
    checkKeys(out, file, "(top-level)", data, new Set(["updated", "generatedAt", "sources", "sourceMeta", "items"]));
    validateTopDates(out, file, data);
    if (arrayField(out, file, "(top-level)", data, "sources")) {
        data.sources.forEach((source, index) => {
            if (typeof source !== "string" || source.trim() === "") {
                error(out, file, `sources[${index}]`, "(record)", "non-empty string", source, "invalid field type");
            } else if (!trendSources.has(source)) {
                error(out, file, `sources[${index}]`, "(record)", `one of: ${[...trendSources].join(", ")}`, source, "invalid source/category value");
            }
        });
    }
    validateSourceMeta(out, file, data.sourceMeta);
    if (!arrayField(out, file, "(top-level)", data, "items")) return;
    const seenRank = new Set();
    const seenUrl = new Set();
    data.items.forEach((item, index) => {
        const record = `items[${index}]`;
        if (!checkObject(out, file, record, item)) return;
        checkKeys(out, file, record, item, new Set(["rank", "title", "source", "category", "score", "velocity", "signal", "url", "summary"]));
        validateRanked(out, file, record, item, seenRank);
        nonEmptyString(out, file, record, item, "title");
        oneOf(out, file, record, item, "source", trendSources);
        validateCategory(out, file, record, item, ctx);
        numberRange(out, file, record, item, "score", 0, 100);
        nonEmptyString(out, file, record, item, "velocity");
        nonEmptyString(out, file, record, item, "signal");
        urlField(out, file, record, item, "url");
        nonEmptyString(out, file, record, item, "summary");
        noDuplicate(out, file, record, "url", item.url, seenUrl);
    });
}

function validatePackages(out, file, data, ctx) {
    checkKeys(out, file, "(top-level)", data, new Set(["updated", "generatedAt", "sourceMeta", "packages"]));
    validateTopDates(out, file, data);
    validateSourceMeta(out, file, data.sourceMeta);
    if (!arrayField(out, file, "(top-level)", data, "packages")) return;
    const seenRank = new Set();
    const seenName = new Set();
    data.packages.forEach((item, index) => {
        const record = `packages[${index}]`;
        if (!checkObject(out, file, record, item)) return;
        checkKeys(out, file, record, item, new Set(["rank", "name", "category", "focus", "downloads", "downloadsLabel", "period", "url"]));
        validateRanked(out, file, record, item, seenRank);
        nonEmptyString(out, file, record, item, "name");
        validateCategory(out, file, record, item, ctx);
        nonEmptyString(out, file, record, item, "focus");
        integerRange(out, file, record, item, "downloads", 0);
        nonEmptyString(out, file, record, item, "downloadsLabel");
        nonEmptyString(out, file, record, item, "period");
        urlField(out, file, record, item, "url");
        noDuplicate(out, file, record, "name", item.name, seenName);
    });
}

function validateRepos(out, file, data, ctx) {
    checkKeys(out, file, "(top-level)", data, new Set(["updated", "generatedAt", "sourceMeta", "repos"]));
    validateTopDates(out, file, data);
    validateSourceMeta(out, file, data.sourceMeta);
    if (!arrayField(out, file, "(top-level)", data, "repos")) return;
    const seenRank = new Set();
    const seenName = new Set();
    data.repos.forEach((item, index) => {
        const record = `repos[${index}]`;
        if (!checkObject(out, file, record, item)) return;
        checkKeys(out, file, record, item, new Set(["rank", "name", "category", "focus", "stars", "starsLabel", "forksLabel", "pushedAt", "url", "summary", "topics"]));
        validateRanked(out, file, record, item, seenRank);
        nonEmptyString(out, file, record, item, "name");
        validateCategory(out, file, record, item, ctx);
        nonEmptyString(out, file, record, item, "focus");
        integerRange(out, file, record, item, "stars", 0);
        nonEmptyString(out, file, record, item, "starsLabel");
        nonEmptyString(out, file, record, item, "forksLabel");
        dateField(out, file, record, item, "pushedAt");
        urlField(out, file, record, item, "url");
        nonEmptyString(out, file, record, item, "summary");
        if (arrayField(out, file, record, item, "topics")) {
            item.topics.forEach((topic, topicIndex) => {
                if (typeof topic !== "string" || topic.trim() === "") {
                    error(out, file, `${record}.topics[${topicIndex}]`, "(record)", "non-empty string", topic, "empty required text");
                }
            });
        }
        noDuplicate(out, file, record, "name", item.name, seenName);
    });
}

function validateLinks(out, file, data, ctx) {
    checkKeys(out, file, "(top-level)", data, new Set(["updated", "generatedAt", "sourceMeta", "links"]));
    validateTopDates(out, file, data);
    validateSourceMeta(out, file, data.sourceMeta);
    if (!arrayField(out, file, "(top-level)", data, "links")) return;
    const seenRank = new Set();
    const seenUrl = new Set();
    data.links.forEach((item, index) => {
        const record = `links[${index}]`;
        if (!checkObject(out, file, record, item)) return;
        checkKeys(out, file, record, item, new Set(["rank", "title", "category", "kind", "url", "summary"]));
        validateRanked(out, file, record, item, seenRank);
        nonEmptyString(out, file, record, item, "title");
        validateCategory(out, file, record, item, ctx);
        nonEmptyString(out, file, record, item, "kind");
        urlField(out, file, record, item, "url");
        nonEmptyString(out, file, record, item, "summary");
        noDuplicate(out, file, record, "url", item.url, seenUrl);
    });
}

function validateTodayItem(out, file, record, item, ctx, seenId, seenCanonical) {
    if (!checkObject(out, file, record, item)) return;
    checkKeys(out, file, record, item, new Set([
        "schemaVersion",
        "id",
        "sourceModule",
        "sourceKind",
        "title",
        "module",
        "origin",
        "category",
        "metric",
        "reason",
        "scoreReasons",
        "action",
        "url",
        "rawScore",
        "qualityScore",
        "score",
        "sources",
        "sourceContext",
        "canonicalKey",
        "updated",
        "legacyIds"
    ]));
    integerRange(out, file, record, item, "schemaVersion", 2, 2);
    nonEmptyString(out, file, record, item, "id");
    oneOf(out, file, record, item, "sourceModule", sourceModules);
    oneOf(out, file, record, item, "sourceKind", sourceKinds);
    nonEmptyString(out, file, record, item, "title");
    oneOf(out, file, record, item, "module", moduleLabels);
    nonEmptyString(out, file, record, item, "origin");
    validateCategory(out, file, record, item, ctx);
    nonEmptyString(out, file, record, item, "metric");
    nonEmptyString(out, file, record, item, "reason");
    nonEmptyString(out, file, record, item, "action");
    urlField(out, file, record, item, "url");
    numberRange(out, file, record, item, "rawScore", -Infinity, Infinity);
    numberRange(out, file, record, item, "qualityScore", 0, 100);
    numberRange(out, file, record, item, "score", 0, 100);
    stringField(out, file, record, item, "sourceContext");
    nonEmptyString(out, file, record, item, "canonicalKey");
    dateField(out, file, record, item, "updated");
    if (arrayField(out, file, record, item, "scoreReasons")) {
        if (item.scoreReasons.length < 1 || item.scoreReasons.length > 3) {
            error(out, file, record, "scoreReasons", "array with 1..3 strings", item.scoreReasons, "invalid field type");
        }
        item.scoreReasons.forEach((reason, index) => {
            if (typeof reason !== "string" || reason.trim() === "") {
                error(out, file, `${record}.scoreReasons[${index}]`, "(record)", "non-empty string", reason, "empty required text");
            }
        });
    }
    if (arrayField(out, file, record, item, "sources")) {
        if (item.sources.length === 0) error(out, file, record, "sources", "non-empty array", item.sources, "invalid field type");
        item.sources.forEach((source, index) => {
            if (typeof source !== "string" || source.trim() === "") {
                error(out, file, `${record}.sources[${index}]`, "(record)", "non-empty string", source, "empty required text");
            }
        });
    }
    if (item.legacyIds !== undefined) {
        if (!Array.isArray(item.legacyIds)) {
            error(out, file, record, "legacyIds", "array", item.legacyIds, "invalid field type");
        } else {
            item.legacyIds.forEach((id, index) => {
                if (typeof id !== "string" || id.trim() === "") error(out, file, `${record}.legacyIds[${index}]`, "(record)", "non-empty string", id, "empty required text");
            });
        }
    }
    noDuplicate(out, file, record, "id", item.id, seenId);
    noDuplicate(out, file, record, "canonicalKey", item.canonicalKey, seenCanonical);
}

function validateToday(out, file, data, ctx) {
    checkKeys(out, file, "(top-level)", data, new Set(["updated", "generatedAt", "sourceMeta", "sections"]));
    validateTopDates(out, file, data);
    validateSourceMeta(out, file, data.sourceMeta);
    if (!arrayField(out, file, "(top-level)", data, "sections")) return;
    const seenSection = new Set();
    const seenId = new Set();
    const seenCanonical = new Set();
    data.sections.forEach((section, index) => {
        const record = `sections[${index}]`;
        if (!checkObject(out, file, record, section)) return;
        checkKeys(out, file, record, section, new Set(["id", "title", "summary", "items"]));
        oneOf(out, file, record, section, "id", sectionIds);
        nonEmptyString(out, file, record, section, "title");
        nonEmptyString(out, file, record, section, "summary");
        noDuplicate(out, file, record, "id", section.id, seenSection);
        if (arrayField(out, file, record, section, "items")) {
            section.items.forEach((item, itemIndex) => validateTodayItem(out, file, `${record}.items[${itemIndex}]`, item, ctx, seenId, seenCanonical));
        }
    });
}

function validateManifest(out, file, data) {
    checkKeys(out, file, "(top-level)", data, new Set(["updated", "generatedAt", "modules"]));
    dateField(out, file, "(top-level)", data, "updated");
    timestampField(out, file, "(top-level)", data, "generatedAt");
    if (!arrayField(out, file, "(top-level)", data, "modules")) return;
    const seenId = new Set();
    const seenRoute = new Set();
    const seenData = new Set();
    data.modules.forEach((module, index) => {
        const record = `modules[${index}]`;
        if (!checkObject(out, file, record, module)) return;
        checkKeys(out, file, record, module, new Set(["id", "title", "route", "data", "source", "status", "count", "updated"]));
        nonEmptyString(out, file, record, module, "id");
        const spec = moduleSpecs.get(module.id);
        if (!spec) {
            error(out, file, record, "id", `one of: ${[...moduleSpecs.keys()].join(", ")}`, module.id, "invalid source/category value");
        } else {
            for (const field of ["title", "route", "data"]) {
                if (module[field] !== spec[field]) error(out, file, record, field, spec[field], module[field], "manifest module field mismatch");
            }
        }
        nonEmptyString(out, file, record, module, "title");
        urlField(out, file, record, module, "route");
        urlField(out, file, record, module, "data");
        nonEmptyString(out, file, record, module, "source");
        oneOf(out, file, record, module, "status", statusValues);
        integerRange(out, file, record, module, "count", 0);
        dateField(out, file, record, module, "updated");
        noDuplicate(out, file, record, "id", module.id, seenId);
        noDuplicate(out, file, record, "route", module.route, seenRoute);
        noDuplicate(out, file, record, "data", module.data, seenData);
    });
}

function validateRefreshSource(out, file, record, source) {
    if (!checkObject(out, file, record, source)) return;
    checkKeys(out, file, record, source, new Set([
        "module",
        "source",
        "status",
        "count",
        "updatedAt",
        "coverage",
        "fallbackUsed",
        "staleButSafe",
        "rateLimited",
        "fallbackReason",
        "previousUpdated",
        "consecutiveRateLimitedRuns",
        "safetyDetails",
        "errors"
    ]));
    oneOf(out, file, record, source, "module", sourceModules);
    nonEmptyString(out, file, record, source, "source");
    oneOf(out, file, record, source, "status", statusValues);
    integerRange(out, file, record, source, "count", 0);
    if (source.updatedAt !== "-") timestampField(out, file, record, source, "updatedAt");
    optionalString(out, file, record, source, "coverage");
    boolField(out, file, record, source, "fallbackUsed");
    boolField(out, file, record, source, "staleButSafe");
    boolField(out, file, record, source, "rateLimited");
    optionalString(out, file, record, source, "fallbackReason");
    if (source.previousUpdated !== "") timestampField(out, file, record, source, "previousUpdated", false);
    integerRange(out, file, record, source, "consecutiveRateLimitedRuns", 0);
    if (arrayField(out, file, record, source, "safetyDetails")) {
        source.safetyDetails.forEach((detail, index) => {
            if (typeof detail !== "string" || detail.trim() === "") error(out, file, `${record}.safetyDetails[${index}]`, "(record)", "non-empty string", detail, "empty required text");
        });
    }
    if (arrayField(out, file, record, source, "errors")) {
        source.errors.forEach((entry, index) => validateSourceError(out, file, `${record}.errors[${index}]`, entry));
    }
}

function validateRefreshReport(out, file, data) {
    checkKeys(out, file, "(top-level)", data, new Set(["generatedAt", "manifestUpdated", "runContext", "changedModules", "modules", "totals"]));
    timestampField(out, file, "(top-level)", data, "generatedAt");
    dateField(out, file, "(top-level)", data, "manifestUpdated");
    if (checkObject(out, file, "runContext", data.runContext)) {
        checkKeys(out, file, "runContext", data.runContext, new Set(["reason", "eventName", "runId", "refName"]));
        for (const field of ["reason", "eventName", "runId", "refName"]) optionalString(out, file, "runContext", data.runContext, field);
    }
    if (arrayField(out, file, "(top-level)", data, "changedModules")) {
        data.changedModules.forEach((module, index) => validateRefreshModuleSummary(out, file, `changedModules[${index}]`, module));
    }
    if (arrayField(out, file, "(top-level)", data, "modules")) {
        const seen = new Set();
        data.modules.forEach((module, index) => {
            const record = `modules[${index}]`;
            if (!checkObject(out, file, record, module)) return;
            checkKeys(out, file, record, module, new Set(["id", "title", "status", "count", "updated", "changed", "sources"]));
            validateRefreshModuleSummary(out, file, record, module);
            oneOf(out, file, record, module, "status", statusValues);
            boolField(out, file, record, module, "changed");
            noDuplicate(out, file, record, "id", module.id, seen);
            if (arrayField(out, file, record, module, "sources")) {
                module.sources.forEach((source, sourceIndex) => validateRefreshSource(out, file, `${record}.sources[${sourceIndex}]`, source));
            }
        });
    }
    if (checkObject(out, file, "totals", data.totals)) {
        checkKeys(out, file, "totals", data.totals, new Set(["modules", "sources", "items", "status", "errors"]));
        integerRange(out, file, "totals", data.totals, "modules", 0);
        integerRange(out, file, "totals", data.totals, "sources", 0);
        integerRange(out, file, "totals", data.totals, "items", 0);
        oneOf(out, file, "totals", data.totals, "status", statusValues);
        integerRange(out, file, "totals", data.totals, "errors", 0);
    }
}

function validateRefreshModuleSummary(out, file, record, module) {
    if (!checkObject(out, file, record, module)) return;
    oneOf(out, file, record, module, "id", sourceModules);
    nonEmptyString(out, file, record, module, "title");
    integerRange(out, file, record, module, "count", 0);
    dateField(out, file, record, module, "updated");
}

function validateSignalPolicy(out, file, data) {
    checkKeys(out, file, "(top-level)", data, new Set(["baselinePenalty", "intentThreshold", "baselineTitles"]));
    numberRange(out, file, "(top-level)", data, "baselinePenalty", -100, 0);
    numberRange(out, file, "(top-level)", data, "intentThreshold", 0, 100);
    if (arrayField(out, file, "(top-level)", data, "baselineTitles")) {
        const seen = new Set();
        data.baselineTitles.forEach((title, index) => {
            if (typeof title !== "string" || title.trim() === "") {
                error(out, file, `baselineTitles[${index}]`, "(record)", "non-empty string", title, "empty required text");
            }
            noDuplicate(out, file, `baselineTitles[${index}]`, "(record)", title, seen);
        });
    }
}

function validateHistory(out, file, record, item) {
    if (item.disabled !== undefined) boolField(out, file, record, item, "disabled", false);
    if (item.history === undefined) return;
    if (!Array.isArray(item.history)) {
        error(out, file, record, "history", "array", item.history, "invalid field type");
        return;
    }
    item.history.forEach((entry, index) => {
        const path = `${record}.history[${index}]`;
        if (!checkObject(out, file, path, entry)) return;
        checkKeys(out, file, path, entry, new Set(["date", "note"]));
        dateField(out, file, path, entry, "date");
        nonEmptyString(out, file, path, entry, "note");
    });
}

function validateWatchlists(out, file, data, ctx) {
    checkKeys(out, file, "(top-level)", data, new Set(["trends", "packages", "repos", "links"]));
    if (checkObject(out, file, "trends", data.trends)) {
        checkKeys(out, file, "trends", data.trends, new Set(["npmPackages", "githubQueries"]));
        validateWatchlistNpmPackages(out, file, data.trends.npmPackages);
        validateWatchlistQueries(out, file, data.trends.githubQueries, ctx);
    }
    validateWatchlistPackages(out, file, data.packages, ctx);
    validateWatchlistRepos(out, file, data.repos, ctx);
    validateWatchlistLinks(out, file, data.links, ctx);
}

function validateWatchlistNpmPackages(out, file, items) {
    if (!Array.isArray(items)) {
        error(out, file, "trends", "npmPackages", "array", items, "invalid field type");
        return;
    }
    const seen = new Set();
    items.forEach((item, index) => {
        const record = `trends.npmPackages[${index}]`;
        if (typeof item === "string") {
            if (item.trim() === "") error(out, file, record, "(record)", "non-empty string", item, "empty required text");
            noDuplicate(out, file, record, "(record)", item, seen);
            return;
        }
        if (!checkObject(out, file, record, item)) return;
        checkKeys(out, file, record, item, new Set(["name", "disabled", "history"]));
        nonEmptyString(out, file, record, item, "name");
        noDuplicate(out, file, record, "name", item.name, seen);
        validateHistory(out, file, record, item);
    });
}

function validateWatchlistQueries(out, file, items, ctx) {
    if (!Array.isArray(items)) {
        error(out, file, "trends", "githubQueries", "array", items, "invalid field type");
        return;
    }
    const seen = new Set();
    items.forEach((item, index) => {
        const record = `trends.githubQueries[${index}]`;
        if (!checkObject(out, file, record, item)) return;
        checkKeys(out, file, record, item, new Set(["query", "category", "disabled", "history"]));
        nonEmptyString(out, file, record, item, "query");
        validateCategory(out, file, record, item, ctx);
        noDuplicate(out, file, record, "query", item.query, seen);
        validateHistory(out, file, record, item);
    });
}

function validateWatchlistPackages(out, file, items, ctx) {
    if (!Array.isArray(items)) {
        error(out, file, "(top-level)", "packages", "array", items, "invalid field type");
        return;
    }
    const seen = new Set();
    items.forEach((item, index) => {
        const record = `packages[${index}]`;
        if (!checkObject(out, file, record, item)) return;
        checkKeys(out, file, record, item, new Set(["name", "category", "focus", "disabled", "history"]));
        nonEmptyString(out, file, record, item, "name");
        validateCategory(out, file, record, item, ctx);
        nonEmptyString(out, file, record, item, "focus");
        noDuplicate(out, file, record, "name", item.name, seen);
        validateHistory(out, file, record, item);
    });
}

function validateWatchlistRepos(out, file, items, ctx) {
    if (!Array.isArray(items)) {
        error(out, file, "(top-level)", "repos", "array", items, "invalid field type");
        return;
    }
    const seen = new Set();
    items.forEach((item, index) => {
        const record = `repos[${index}]`;
        if (!checkObject(out, file, record, item)) return;
        checkKeys(out, file, record, item, new Set(["fullName", "category", "focus", "disabled", "history"]));
        nonEmptyString(out, file, record, item, "fullName");
        validateCategory(out, file, record, item, ctx);
        nonEmptyString(out, file, record, item, "focus");
        noDuplicate(out, file, record, "fullName", item.fullName, seen);
        validateHistory(out, file, record, item);
    });
}

function validateWatchlistLinks(out, file, items, ctx) {
    if (!Array.isArray(items)) {
        error(out, file, "(top-level)", "links", "array", items, "invalid field type");
        return;
    }
    const seen = new Set();
    items.forEach((item, index) => {
        const record = `links[${index}]`;
        if (!checkObject(out, file, record, item)) return;
        checkKeys(out, file, record, item, new Set(["title", "category", "kind", "url", "summary", "disabled", "history"]));
        nonEmptyString(out, file, record, item, "title");
        validateCategory(out, file, record, item, ctx);
        nonEmptyString(out, file, record, item, "kind");
        urlField(out, file, record, item, "url");
        nonEmptyString(out, file, record, item, "summary");
        noDuplicate(out, file, record, "url", item.url, seen);
        validateHistory(out, file, record, item);
    });
}

function categoriesFromWatchlists(watchlists) {
    const categories = new Set(defaultCategories);
    const collect = (items) => {
        if (!Array.isArray(items)) return;
        for (const item of items) {
            if (item && typeof item === "object" && typeof item.category === "string" && item.category.trim()) {
                categories.add(item.category);
            }
        }
    };
    collect(watchlists?.trends?.githubQueries);
    collect(watchlists?.packages);
    collect(watchlists?.repos);
    collect(watchlists?.links);
    return categories;
}

function validateFile(file, data, ctx) {
    const out = [];
    if (!checkObject(out, file, "(top-level)", data)) return out;

    if (file === "data/trends.json") validateTrends(out, file, data, ctx);
    else if (file === "data/packages.json") validatePackages(out, file, data, ctx);
    else if (file === "data/repos.json") validateRepos(out, file, data, ctx);
    else if (file === "data/links.json") validateLinks(out, file, data, ctx);
    else if (file === "data/today.json") validateToday(out, file, data, ctx);
    else if (file === "data/manifest.json") validateManifest(out, file, data);
    else if (file === "data/refresh-report.json") validateRefreshReport(out, file, data);
    else if (file === "data/signal-policy.json") validateSignalPolicy(out, file, data);
    else if (file === "data/watchlists.json") validateWatchlists(out, file, data, ctx);
    else warning(out, file, "(top-level)", "(file)", dataFiles.join(", "), file, "untracked JSON file under data/");

    return out;
}

export function validateDataMap(dataByFile) {
    const expected = new Set(dataFiles);
    const diagnostics = [];
    for (const file of expected) {
        if (!Object.hasOwn(dataByFile, file)) {
            error(diagnostics, file, "(file)", "(file)", "checked-in data file", undefined, "missing required field");
        }
    }
    for (const file of Object.keys(dataByFile)) {
        if (!expected.has(file)) warning(diagnostics, file, "(file)", "(file)", dataFiles.join(", "), file, "untracked JSON file under data/");
    }

    const ctx = { categories: categoriesFromWatchlists(dataByFile["data/watchlists.json"]) };
    for (const [file, data] of Object.entries(dataByFile).sort(([a], [b]) => a.localeCompare(b))) {
        diagnostics.push(...validateFile(file, data, ctx));
    }

    return {
        diagnostics,
        errors: diagnostics.filter((item) => item.level === "error"),
        warnings: diagnostics.filter((item) => item.level === "warning")
    };
}

export async function readDataFiles(root = process.cwd()) {
    const files = await readdir(join(root, "data"));
    const jsonFiles = files.filter((file) => file.endsWith(".json")).sort();
    const dataByFile = {};

    for (const file of jsonFiles) {
        const path = `data/${file}`;
        try {
            dataByFile[path] = JSON.parse(await readFile(join(root, path), "utf8"));
        } catch (err) {
            dataByFile[path] = null;
            dataByFile.__readErrors ??= [];
            dataByFile.__readErrors.push(diagnostic("error", path, "(file)", "(file)", "valid JSON", err.message, "invalid JSON"));
        }
    }

    return dataByFile;
}

export async function validateDataFiles(root = process.cwd()) {
    const dataByFile = await readDataFiles(root);
    const readErrors = dataByFile.__readErrors || [];
    delete dataByFile.__readErrors;
    const result = validateDataMap(dataByFile);
    result.diagnostics.unshift(...readErrors);
    result.errors = result.diagnostics.filter((item) => item.level === "error");
    result.warnings = result.diagnostics.filter((item) => item.level === "warning");
    return result;
}

export function formatDiagnostic(item) {
    return `[${item.level}] ${item.file} ${item.record} ${item.field} expected ${item.expected}; actual ${item.actual} - ${item.message}`;
}

export function printDiagnostics(result, stream = process.stderr) {
    for (const item of result.diagnostics) {
        stream.write(`${formatDiagnostic(item)}\n`);
    }
    if (result.diagnostics.length > 0) {
        stream.write(`data validation: ${result.errors.length} error(s), ${result.warnings.length} warning(s)\n`);
    }
}

async function main() {
    const result = await validateDataFiles();
    printDiagnostics(result);
    if (result.errors.length > 0) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    await main();
}
