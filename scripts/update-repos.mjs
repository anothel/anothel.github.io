import { readFileSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { applyEmptyCollectionFallback, sourceSafetyFlags } from "./refresh-safety.mjs";
import { activeItems } from "./watchlist-governance.mjs";

const OUT_FILE = new URL("../data/repos.json", import.meta.url);
const WATCHLIST_FILE = new URL("../data/watchlists.json", import.meta.url);
const USER_AGENT = "anothel.github.io repo watchlist";

function readWatchlists() {
    return JSON.parse(readFileSync(WATCHLIST_FILE, "utf8"));
}

export const repoDefinitions = activeItems(readWatchlists().repos);

function isoDate(date = new Date()) {
    return date.toISOString().slice(0, 10);
}

function compactNumber(value) {
    return Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function sourceStatus(successCount, totalCount) {
    if (successCount === totalCount) return "ok";
    if (successCount === 0) return "error";
    return "partial";
}

function buildSourceMeta(count, totalCount, errors, generatedAt) {
    const meta = {
        name: "GitHub",
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

async function fetchJson(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        headers: {
            "User-Agent": USER_AGENT,
            Accept: "application/vnd.github+json",
            ...options.headers
        }
    });

    if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}: ${url}`);
    }

    return response.json();
}

export function buildRepoRows(repoRecords, definitions = repoDefinitions) {
    const definitionByName = new Map(definitions.map((item) => [item.fullName.toLowerCase(), item]));

    return repoRecords
        .filter((repo) => definitionByName.has(repo.full_name.toLowerCase()))
        .sort((a, b) => b.stargazers_count - a.stargazers_count)
        .map((repo, index) => {
            const definition = definitionByName.get(repo.full_name.toLowerCase());
            return {
                rank: index + 1,
                name: definition.fullName,
                category: definition.category,
                focus: definition.focus,
                stars: repo.stargazers_count,
                starsLabel: compactNumber(repo.stargazers_count),
                forksLabel: compactNumber(repo.forks_count),
                pushedAt: isoDate(new Date(repo.pushed_at)),
                url: repo.html_url,
                summary: repo.description || "Selected repository worth tracking.",
                topics: repo.topics || []
            };
        });
}

function rerankRepos(repos) {
    return [...repos]
        .sort((a, b) => (b.stars || 0) - (a.stars || 0))
        .map((item, index) => ({ ...item, rank: index + 1 }));
}

export async function collectRepos(
    definitions = repoDefinitions,
    fetcher = fetchJson,
    generatedAt = new Date().toISOString()
) {
    const headers = {};
    if (process.env.GITHUB_TOKEN) {
        headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    }

    const results = await Promise.all(
        definitions.map(async (definition) => {
            try {
                return {
                    ok: true,
                    record: await fetcher(`https://api.github.com/repos/${definition.fullName}`, { headers }, definition)
                };
            } catch (error) {
                return {
                    ok: false,
                    error: {
                        name: definition.fullName,
                        error: error.message
                    }
                };
            }
        })
    );
    const repoRecords = results.filter((result) => result.ok).map((result) => result.record);
    const errors = results.filter((result) => !result.ok).map((result) => result.error);
    const repos = buildRepoRows(repoRecords, definitions);

    return {
        updated: isoDate(new Date(generatedAt)),
        generatedAt,
        sourceMeta: buildSourceMeta(repos.length, definitions.length, errors, generatedAt),
        repos
    };
}

export function prepareRepoDataForWrite(data, previousData) {
    const nextItems = Array.isArray(data?.repos) ? data.repos : [];
    const previousItems = Array.isArray(previousData?.repos) ? previousData.repos : [];
    const errors = Array.isArray(data?.sourceMeta?.errors) ? data.sourceMeta.errors : [];

    if (data?.sourceMeta?.status === "partial" && nextItems.length > 0 && previousItems.length > 0 && errors.length > 0) {
        const activeNames = new Set(repoDefinitions.map((definition) => definition.fullName));
        const existing = new Set(nextItems.map((item) => item.name));
        const previousByName = new Map(previousItems.map((item) => [item.name, item]));
        const restored = errors
            .map((error) => error.name)
            .filter((name) => activeNames.has(name) && !existing.has(name) && previousByName.has(name))
            .map((name) => previousByName.get(name));

        if (restored.length > 0) {
            const repos = rerankRepos([...nextItems, ...restored]);
            const tracked = Math.max(data.sourceMeta.tracked || repoDefinitions.length, repos.length);
            data = {
                ...data,
                sourceMeta: {
                    ...data.sourceMeta,
                    tracked,
                    count: repos.length,
                    emitted: repos.length,
                    coverage: `${repos.length}/${tracked}`,
                    previousUpdated: previousData.sourceMeta?.updatedAt || previousData.generatedAt || data.sourceMeta.previousUpdated,
                    rateLimited: sourceSafetyFlags(errors).rateLimited
                },
                repos
            };
        }
    }

    return applyEmptyCollectionFallback(data, previousData, {
        collection: "repos",
        fallbackReason: "No repo rows fetched",
        sourceName: "GitHub"
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
    const data = prepareRepoDataForWrite(await collectRepos(), await readPreviousData());
    if (data.repos.length === 0) {
        throw new Error("No repo rows fetched; leaving existing data untouched");
    }
    const output = `${JSON.stringify(data, null, 2)}\n`;

    if (process.argv.includes("--stdout")) {
        console.log(output);
    } else {
        await writeFile(OUT_FILE, output, "utf8");
        console.log(`Wrote ${data.repos.length} repo rows to data/repos.json`);
    }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    await main();
}
