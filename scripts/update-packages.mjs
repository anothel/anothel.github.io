import { readFileSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { applyEmptyCollectionFallback } from "./refresh-safety.mjs";
import { activeItems } from "./watchlist-governance.mjs";

const OUT_FILE = new URL("../data/packages.json", import.meta.url);
const WATCHLIST_FILE = new URL("../data/watchlists.json", import.meta.url);
const USER_AGENT = "anothel.github.io package watchlist";

function readWatchlists() {
    return JSON.parse(readFileSync(WATCHLIST_FILE, "utf8"));
}

export const packageDefinitions = activeItems(readWatchlists().packages);

function isoDate(date = new Date()) {
    return date.toISOString().slice(0, 10);
}

function compactNumber(value) {
    return Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

async function fetchJson(url) {
    const response = await fetch(url, {
        headers: {
            "User-Agent": USER_AGENT,
            Accept: "application/json"
        }
    });

    if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}: ${url}`);
    }

    return response.json();
}

function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(fetcher, url, definition, options = {}) {
    const retries = options.retries ?? 2;
    const retryDelayMs = options.retryDelayMs ?? 250;
    let lastError;

    for (let attempt = 0; attempt <= retries; attempt += 1) {
        try {
            return await fetcher(url, definition);
        } catch (error) {
            lastError = error;
            if (attempt === retries) break;
            if (retryDelayMs > 0) {
                await wait(retryDelayMs * (attempt + 1));
            }
        }
    }

    throw lastError;
}

export function buildPackageDownloadUrl(name) {
    return `https://api.npmjs.org/downloads/point/last-week/${encodeURIComponent(name)}`;
}

function sourceStatus(successCount, totalCount) {
    if (successCount === totalCount) return "ok";
    if (successCount === 0) return "error";
    return "partial";
}

function buildSourceMeta(count, totalCount, errors, generatedAt) {
    const meta = {
        name: "npm",
        status: sourceStatus(count, totalCount),
        count,
        tracked: totalCount,
        emitted: count,
        coverage: `${count}/${totalCount}`,
        updatedAt: generatedAt
    };

    if (errors.length > 0) {
        meta.errors = errors;
    }

    return meta;
}

export function buildPackageRows(downloadRecords, definitions = packageDefinitions) {
    const definitionByName = new Map(definitions.map((item) => [item.name, item]));

    return downloadRecords
        .filter((item) => definitionByName.has(item.package))
        .sort((a, b) => b.downloads - a.downloads)
        .map((item, index) => {
            const definition = definitionByName.get(item.package);
            return {
                rank: index + 1,
                name: item.package,
                category: definition.category,
                focus: definition.focus,
                downloads: item.downloads,
                downloadsLabel: `${compactNumber(item.downloads)}/week`,
                period: `${item.start} to ${item.end}`,
                url: `https://www.npmjs.com/package/${encodeURIComponent(item.package)}`
            };
        });
}

function rerankPackages(packages) {
    return [...packages]
        .sort((a, b) => (b.downloads || 0) - (a.downloads || 0))
        .map((item, index) => ({ ...item, rank: index + 1 }));
}

export async function collectPackages(
    definitions = packageDefinitions,
    fetcher = fetchJson,
    generatedAt = new Date().toISOString(),
    options = {}
) {
    const results = [];
    for (const definition of definitions) {
        try {
            results.push({
                ok: true,
                record: await fetchWithRetry(fetcher, buildPackageDownloadUrl(definition.name), definition, options)
            });
        } catch (error) {
            results.push({
                ok: false,
                error: {
                    name: definition.name,
                    error: error.message
                }
            });
        }
    }
    const downloadRecords = results.filter((result) => result.ok).map((result) => result.record);
    const errors = results.filter((result) => !result.ok).map((result) => result.error);
    const packages = buildPackageRows(downloadRecords, definitions);

    return {
        updated: isoDate(new Date(generatedAt)),
        generatedAt,
        sourceMeta: buildSourceMeta(packages.length, definitions.length, errors, generatedAt),
        packages
    };
}

export function preparePackageDataForWrite(data, previousData) {
    const nextItems = Array.isArray(data?.packages) ? data.packages : [];
    const previousItems = Array.isArray(previousData?.packages) ? previousData.packages : [];
    const errors = Array.isArray(data?.sourceMeta?.errors) ? data.sourceMeta.errors : [];

    if (data?.sourceMeta?.status === "partial" && nextItems.length > 0 && previousItems.length > 0 && errors.length > 0) {
        const activeNames = new Set(packageDefinitions.map((definition) => definition.name));
        const existing = new Set(nextItems.map((item) => item.name));
        const previousByName = new Map(previousItems.map((item) => [item.name, item]));
        const restored = errors
            .map((error) => error.name)
            .filter((name) => activeNames.has(name) && !existing.has(name) && previousByName.has(name))
            .map((name) => previousByName.get(name));

        if (restored.length > 0) {
            const packages = rerankPackages([...nextItems, ...restored]);
            data = {
                ...data,
                sourceMeta: {
                    ...data.sourceMeta,
                    count: packages.length,
                    emitted: packages.length,
                    coverage: `${packages.length}/${data.sourceMeta.tracked || packageDefinitions.length}`,
                    staleButSafe: true,
                    previousUpdated: previousData.updated || data.sourceMeta.previousUpdated
                },
                packages
            };
        }
    }

    return applyEmptyCollectionFallback(data, previousData, {
        collection: "packages",
        fallbackReason: "No package rows fetched",
        sourceName: "npm"
    });
}

async function readPreviousData() {
    try {
        return JSON.parse(await readFile(OUT_FILE, "utf8"));
    } catch {
        return null;
    }
}

async function main() {
    const data = preparePackageDataForWrite(await collectPackages(), await readPreviousData());
    if (data.packages.length === 0) {
        throw new Error("No package rows fetched; leaving existing data untouched");
    }
    const output = `${JSON.stringify(data, null, 2)}\n`;

    if (process.argv.includes("--stdout")) {
        console.log(output);
    } else {
        await writeFile(OUT_FILE, output, "utf8");
        console.log(`Wrote ${data.packages.length} package rows to data/packages.json`);
    }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    await main();
}
