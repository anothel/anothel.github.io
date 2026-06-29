import { readFileSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { classifySignal, qualityBoost } from "./signal-taxonomy.mjs";
import { applyEmptyCollectionFallback, sourceSafetyFlags } from "./refresh-safety.mjs";
import { activeItems, activeNames } from "./watchlist-governance.mjs";

const OUT_FILE = new URL("../data/trends.json", import.meta.url);
const WATCHLISTS_FILE = new URL("../data/watchlists.json", import.meta.url);
const USER_AGENT = "anothel.github.io tech radar";
export const MAX_ITEMS = 24;
export const requiredTrendCategories = ["AI evals", "Workflow automation"];

function readTrendInputs() {
    const trends = JSON.parse(readFileSync(WATCHLISTS_FILE, "utf8")).trends || {};
    if (!Array.isArray(trends.npmPackages) || !Array.isArray(trends.githubQueries)) {
        throw new Error("data/watchlists.json must define trends.npmPackages and trends.githubQueries");
    }
    return trends;
}

const trendInputs = readTrendInputs();
export const npmPackages = activeNames(trendInputs.npmPackages);
export const githubQueries = activeItems(trendInputs.githubQueries);

export function isoDate(date = new Date()) {
    return date.toISOString().slice(0, 10);
}

function compactNumber(value) {
    return Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function daysAgo(days) {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() - days);
    return isoDate(date);
}

function clampScore(value) {
    return Math.max(1, Math.min(100, Math.round(value)));
}

function stripHtml(value = "") {
    return value.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

function cleanGeneratedText(value = "") {
    return stripHtml(value)
        .replace(/[^\x00-\x7F]+/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

function sourceErrorText(error) {
    return String(error.message || error).replace(/: https?:\/\/\S+$/, "");
}

export function buildNpmDownloadsUrl(packageName) {
    return `https://api.npmjs.org/downloads/point/last-week/${encodeURIComponent(packageName)}`;
}

export function classify(text) {
    const taxonomyCategory = classifySignal(text);
    if (taxonomyCategory === "Agent skills" || taxonomyCategory === "MCP" || taxonomyCategory === "AI evals" || taxonomyCategory === "Workflow automation") {
        return taxonomyCategory;
    }
    if (taxonomyCategory === "AI agents" || taxonomyCategory === "AI engineering") {
        return "AI";
    }

    const value = text.toLowerCase();
    if (/\b(agent skills?|skills? for agents?|claude skills?)\b/.test(value)) return "Agent skills";
    if (/\b(mcp|modelcontextprotocol)\b/.test(value)) return "MCP";
    if (/\b(promptfoo|autoevals|evalite|braintrust|langfuse)\b/.test(value)) return "AI evals";
    if (/\b(evals?|evaluation|benchmarks?)\b/.test(value) && /\b(ai|llm|model)\b/.test(value)) return "AI evals";
    if (/\b(trigger\.dev|@trigger|temporalio|inngest|n8n|n8n-workflow|pipedream)\b/.test(value)) return "Workflow automation";
    if (/\b(ai|llm|agents?|model|inference|openai|claude|anthropic|mcp|modelcontextprotocol)\b/.test(value)) return "AI";
    if (/(typescript|javascript|node|npm|bun|deno|react|vue|svelte)/.test(value)) return "JavaScript";
    if (/(database|sqlite|postgres|storage|sync|local-first)/.test(value)) return "Database";
    if (/(security|vulnerability|auth|supply chain)/.test(value)) return "Security";
    if (/(css|design|ui|frontend|browser|web)/.test(value)) return "Frontend";
    return taxonomyCategory === "Developer tooling" ? "Developer tools" : taxonomyCategory;
}

function textForRepo(repo) {
    return [
        repo.full_name,
        repo.description,
        ...(repo.topics || [])
    ].filter(Boolean).join(" ").toLowerCase();
}

function hasAny(text, patterns) {
    return patterns.some((pattern) => pattern.test(text));
}

export function githubRepoQuality(repo, category) {
    const text = textForRepo(repo);
    const stars = Math.log10(Math.max(repo.stargazers_count || 0, 1)) * 14;
    let boost = 0;
    let required = [];
    const broadFrontend = /\b(frontend|front-end|checklist|css)\b/.test(text);
    const agentSpecific = /\b(agent skills?|coding agent|mcp|modelcontextprotocol|codex|claude)\b/.test(text);

    if (broadFrontend && !agentSpecific) return 0;

    if (category === "Agent skills") {
        required = [/\bskills?\b/, /\bagents?\b/, /\bclaude\b/, /\bcodex\b/, /\bcopilot\b/];
        if (/\bskills?\b/.test(text)) boost += 34;
        if (/\b(agent|claude|codex|copilot)\b/.test(text)) boost += 18;
    } else if (category === "MCP") {
        required = [/\bmcp\b/, /\bmodelcontextprotocol\b/];
        if (/\bmcp\b|\bmodelcontextprotocol\b/.test(text)) boost += 42;
    } else if (category === "AI agents") {
        required = [/\bagents?\b/, /\bcoding agent\b/, /\bclaude code\b/, /\bcodex\b/, /\bcopilot\b/, /\bmcp\b/, /\bworkflow automation\b/];
        if (/\b(coding agent|claude code|codex|copilot)\b/.test(text)) boost += 30;
        if (/\bagents?\b|\bworkflow automation\b/.test(text)) boost += 18;
    } else if (category === "AI evals") {
        required = [/\bevals?\b/, /\bevaluation\b/, /\bbenchmark\b/];
        if (hasAny(text, required)) boost += 32;
    } else if (category === "Workflow automation") {
        required = [/\bworkflow\b/, /\bautomation\b/, /\bdurable\b/, /\borchestration\b/, /\btrigger\.dev\b/, /\btemporal\b/, /\binngest\b/, /\bn8n\b/, /\bpipedream\b/];
        if (hasAny(text, required)) boost += 28;
    } else {
        required = [/\bai\b/, /\bllm\b/, /\bagents?\b/, /\bdeveloper tools?\b/, /\btypescript\b/];
        if (hasAny(text, [/\bai\b/, /\bllm\b/, /\bagents?\b/])) boost += 18;
    }

    if (!hasAny(text, required)) return 0;
    return clampScore(stars + boost + Math.max(0, qualityBoost(text)) / 2);
}

function trendSort(a, b) {
    return b.score - a.score
        || a.source.localeCompare(b.source)
        || a.title.localeCompare(b.title)
        || a.url.localeCompare(b.url);
}

function trendKey(item) {
    return item.url || `${item.source}:${item.title}`;
}

function rerankTrendItems(items) {
    return [...items].sort(trendSort).map((item, index) => ({ ...item, rank: index + 1 }));
}

export function selectTrendItems(items, limit, requiredCategories = requiredTrendCategories) {
    const sorted = [...items].sort(trendSort);
    const picked = [];
    const pickedKeys = new Set();

    function pick(item) {
        const key = trendKey(item);
        if (pickedKeys.has(key)) return;
        pickedKeys.add(key);
        picked.push(item);
    }

    for (const category of requiredCategories) {
        const representative = sorted.find((item) => item.category === category);
        if (representative) {
            pick(representative);
        }
    }

    for (const item of sorted) {
        if (picked.length >= limit) break;
        pick(item);
    }

    return picked.sort(trendSort).slice(0, limit);
}

export function scoreHackerNewsStory(story) {
    const title = stripHtml(story.title || "");
    const text = title.toLowerCase();
    const base = (story.score || 0) / 16 + (story.descendants || 0) / 30;
    const technicalBoost = hasAny(text, [
        /\b(ai|llm|agent|agents|mcp|oauth|api|database|compiler|runtime|javascript|typescript|linux|security|github|open source|programming|developer)\b/,
        /\b(postgres|sqlite|web|browser|code|software|server|protocol)\b/
    ]) ? 34 : 0;
    const generalNewsPenalty = hasAny(text, [
        /\b(parliament|nuclear|telecom giant|controversy|politics|election|war|celebrity)\b/
    ]) ? 55 : 0;

    return clampScore(base + technicalBoost - generalNewsPenalty);
}

async function fetchJson(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        headers: {
            "User-Agent": USER_AGENT,
            Accept: "application/json",
            ...options.headers
        }
    });

    if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}: ${url}`);
    }

    return response.json();
}

async function fetchHackerNews() {
    const ids = await fetchJson("https://hacker-news.firebaseio.com/v0/topstories.json");
    const stories = await Promise.all(
        ids.slice(0, 50).map((id) =>
            fetchJson(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).catch(() => null)
        )
    );

    return stories
        .filter((story) => story && story.type === "story" && story.title && story.url)
        .map((story) => ({ story, qualityScore: scoreHackerNewsStory(story) }))
        .filter((item) => item.qualityScore >= 12)
        .sort((a, b) => b.qualityScore - a.qualityScore)
        .slice(0, 6)
        .map(({ story, qualityScore }) => ({
            title: cleanGeneratedText(story.title),
            source: "Hacker News",
            category: classify(story.title),
            score: qualityScore,
            velocity: `${story.descendants || 0} comments`,
            signal: `${story.score || 0} points`,
            url: story.url,
            summary: `HN story by ${story.by || "unknown"} with ${story.descendants || 0} comments.`
        }));
}

export async function fetchGitHub(fetcher = fetchJson) {
    const since = daysAgo(30);
    const headers = {};
    if (process.env.GITHUB_TOKEN) {
        headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    }

    const results = [];
    const errors = [];

    for (const item of githubQueries) {
        const params = new URLSearchParams({
            q: `${item.query} pushed:>=${since}`,
            sort: "stars",
            order: "desc",
            per_page: "5"
        });

        const data = await fetcher(`https://api.github.com/search/repositories?${params}`, { headers }).catch((error) => {
            console.warn(`Skipping GitHub query ${item.query}: ${error.message}`);
            errors.push({ name: item.query, error: sourceErrorText(error) });
            return { items: [] };
        });
        for (const repo of data.items || []) {
            const score = githubRepoQuality(repo, item.category);
            if (score === 0) continue;

            results.push({
                title: repo.full_name,
                source: "GitHub",
                category: item.category,
                score,
                velocity: `${compactNumber(repo.stargazers_count)} stars`,
                signal: `${compactNumber(repo.forks_count)} forks`,
                url: repo.html_url,
                summary: cleanGeneratedText(repo.description || "Repository recently active in this topic.")
            });
        }
    }

    const selected = selectTrendItems(results, 12);
    if (errors.length > 0) selected.sourceErrors = errors;
    return selected;
}

async function fetchNpm() {
    const packageResults = await Promise.all(
        npmPackages.map((packageName) =>
            fetchJson(buildNpmDownloadsUrl(packageName)).catch((error) => {
                console.warn(`Skipping npm package ${packageName}: ${error.message}`);
                return null;
            })
        )
    );

    const items = packageResults
        .filter((item) => item && item.package && typeof item.downloads === "number")
        .sort((a, b) => b.downloads - a.downloads)
        .map((item) => ({
            title: item.package,
            source: "npm",
            category: classify(item.package),
            score: clampScore(Math.log10(Math.max(item.downloads, 1)) * 12),
            velocity: `${compactNumber(item.downloads)}/week`,
            signal: `${item.start} to ${item.end}`,
            url: `https://www.npmjs.com/package/${encodeURIComponent(item.package)}`,
            summary: `${compactNumber(item.downloads)} downloads over the last available week.`
        }));

    return selectTrendItems(items, 8);
}

export function buildSourceMeta(items, results, generatedAt) {
    const countBySource = new Map();
    for (const item of items) {
        countBySource.set(item.source, (countBySource.get(item.source) || 0) + 1);
    }

    return results.map((result) => {
        const emitted = countBySource.get(result.name) || 0;
        const tracked = Math.max(result.tracked || 1, emitted);
        const errors = Array.isArray(result.errors) ? result.errors : [];
        const meta = {
            name: result.name,
            status: errors.length > 0 ? (emitted > 0 ? "partial" : "error") : (result.ok ? "ok" : "error"),
            count: emitted,
            tracked,
            emitted,
            coverage: `${emitted}/${tracked}`,
            updatedAt: generatedAt
        };

        if (errors.length > 0) {
            meta.errors = errors;
            meta.rateLimited = sourceSafetyFlags(errors).rateLimited;
        }

        if (!result.ok && result.error) {
            meta.error = result.error;
        }

        return meta;
    });
}

export async function collect() {
    const sourceJobs = [
        ["Hacker News", fetchHackerNews, 1],
        ["GitHub", fetchGitHub, githubQueries.length],
        ["npm", fetchNpm, npmPackages.length]
    ];

    const results = await Promise.all(
        sourceJobs.map(async ([name, fn, tracked]) => {
            try {
                const items = await fn();
                return { name, ok: true, tracked, items, errors: items.sourceErrors };
            } catch (error) {
                console.warn(`Skipping ${name}: ${error.message}`);
                return { name, ok: false, tracked, error: error.message, items: [] };
            }
        })
    );

    const seen = new Set();
    const dedupedItems = results
        .flatMap((result) => result.items)
        .filter((item) => {
            const key = `${item.source}:${item.title}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    const items = selectTrendItems(dedupedItems, MAX_ITEMS)
        .map((item, index) => ({ rank: index + 1, ...item }));

    if (items.length === 0) {
        throw new Error("No trend items fetched");
    }

    const generatedAt = new Date().toISOString();

    return {
        updated: isoDate(),
        generatedAt,
        sources: sourceJobs.map(([name]) => name),
        sourceMeta: buildSourceMeta(items, results, generatedAt),
        items
    };
}

export function prepareTrendDataForWrite(data, previousData) {
    const nextItems = Array.isArray(data?.items) ? data.items : [];
    const previousItems = Array.isArray(previousData?.items) ? previousData.items : [];
    const sourceMeta = Array.isArray(data?.sourceMeta) ? data.sourceMeta : [];
    const failedSources = new Set(sourceMeta.filter((source) => source.status === "error").map((source) => source.name));

    if (nextItems.length > 0 && previousItems.length > 0 && failedSources.size > 0) {
        const activeNpmPackages = new Set(npmPackages);
        const existing = new Set(nextItems.map(trendKey));
        const restored = previousItems.filter((item) => {
            if (!failedSources.has(item.source)) return false;
            if (item.source === "npm" && !activeNpmPackages.has(item.title)) return false;
            return !existing.has(trendKey(item));
        });

        if (restored.length > 0) {
            const restoredCountBySource = restored.reduce((counts, item) => {
                counts[item.source] = (counts[item.source] || 0) + 1;
                return counts;
            }, {});
            data = {
                ...data,
                sourceMeta: sourceMeta.map((source) => {
                    const restoredCount = restoredCountBySource[source.name] || 0;
                    if (restoredCount === 0) return source;
                    const errors = source.error ? [{ name: source.name, error: source.error }] : source.errors || [];
                    return {
                        ...source,
                        status: "fallback",
                        count: restoredCount,
                        emitted: restoredCount,
                        tracked: Math.max(source.tracked || 1, restoredCount),
                        coverage: `${restoredCount}/${Math.max(source.tracked || 1, restoredCount)}`,
                        fallbackUsed: true,
                        staleButSafe: true,
                        previousUpdated: previousData.updated || source.previousUpdated,
                        rateLimited: sourceSafetyFlags(errors).rateLimited
                    };
                }),
                items: rerankTrendItems([...nextItems, ...restored])
            };
        }
    }

    return applyEmptyCollectionFallback(data, previousData, {
        collection: "items",
        fallbackReason: "No trend items fetched",
        sourceName: "trends"
    });
}

export function buildTrendFailureData(error, generatedAt = new Date().toISOString()) {
    return {
        updated: isoDate(new Date(generatedAt)),
        generatedAt,
        sources: ["Hacker News", "GitHub", "npm"],
        sourceMeta: [
            {
                name: "trends",
                status: "error",
                count: 0,
                error: error.message,
                updatedAt: generatedAt
            }
        ],
        items: []
    };
}

async function readPreviousData() {
    try {
        return JSON.parse(await readFile(OUT_FILE, "utf8"));
    } catch {
        return null;
    }
}

async function main() {
    const previousData = await readPreviousData();
    const data = prepareTrendDataForWrite(
        await collect().catch((error) => buildTrendFailureData(error)),
        previousData
    );
    const output = `${JSON.stringify(data, null, 2)}\n`;

    if (process.argv.includes("--stdout")) {
        console.log(output);
    } else {
        await writeFile(OUT_FILE, output, "utf8");
        console.log(`Wrote ${data.items.length} trend items to data/trends.json`);
    }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    await main();
}
