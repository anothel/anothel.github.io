import { writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const OUT_FILE = new URL("../data/trends.json", import.meta.url);
const USER_AGENT = "anothel.github.io tech radar";
const MAX_ITEMS = 12;

const npmPackages = [
    "react",
    "typescript",
    "vite",
    "next",
    "eslint",
    "prettier",
    "zod",
    "tailwindcss",
    "playwright",
    "express",
    "fastify",
    "tsx"
];

const githubQueries = [
    { query: "topic:ai stars:>500", category: "AI" },
    { query: "topic:typescript stars:>500", category: "TypeScript" },
    { query: "topic:developer-tools stars:>300", category: "Developer tools" },
    { query: "topic:frontend stars:>500", category: "Frontend" }
];

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

function classify(text) {
    const value = text.toLowerCase();
    if (/(ai|llm|agent|model|inference|openai|claude)/.test(value)) return "AI";
    if (/(typescript|javascript|node|npm|bun|deno|react|vue|svelte)/.test(value)) return "JavaScript";
    if (/(database|sqlite|postgres|storage|sync|local-first)/.test(value)) return "Database";
    if (/(security|vulnerability|auth|supply chain)/.test(value)) return "Security";
    if (/(css|design|ui|frontend|browser|web)/.test(value)) return "Frontend";
    return "Developer tools";
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
        ids.slice(0, 35).map((id) =>
            fetchJson(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).catch(() => null)
        )
    );

    return stories
        .filter((story) => story && story.type === "story" && story.title && story.url)
        .slice(0, 4)
        .map((story) => ({
            title: stripHtml(story.title),
            source: "Hacker News",
            category: classify(story.title),
            score: clampScore((story.score || 0) / 8),
            velocity: `${story.descendants || 0} comments`,
            signal: `${story.score || 0} points`,
            url: story.url,
            summary: `HN story by ${story.by || "unknown"} with ${story.descendants || 0} comments.`
        }));
}

async function fetchGitHub() {
    const since = daysAgo(30);
    const headers = {};
    if (process.env.GITHUB_TOKEN) {
        headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    }

    const results = [];

    for (const item of githubQueries) {
        const params = new URLSearchParams({
            q: `${item.query} pushed:>=${since}`,
            sort: "stars",
            order: "desc",
            per_page: "3"
        });

        const data = await fetchJson(`https://api.github.com/search/repositories?${params}`, { headers });
        for (const repo of data.items || []) {
            results.push({
                title: repo.full_name,
                source: "GitHub",
                category: item.category,
                score: clampScore(Math.log10(Math.max(repo.stargazers_count, 1)) * 18),
                velocity: `${compactNumber(repo.stargazers_count)} stars`,
                signal: `${compactNumber(repo.forks_count)} forks`,
                url: repo.html_url,
                summary: repo.description || "Repository recently active in this topic."
            });
        }
    }

    return results.slice(0, 4);
}

async function fetchNpm() {
    const packages = npmPackages.join(",");
    const data = await fetchJson(`https://api.npmjs.org/downloads/point/last-week/${packages}`);

    return Object.values(data)
        .filter((item) => item && item.package && typeof item.downloads === "number")
        .sort((a, b) => b.downloads - a.downloads)
        .slice(0, 4)
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
}

export function buildSourceMeta(items, results, generatedAt) {
    const countBySource = new Map();
    for (const item of items) {
        countBySource.set(item.source, (countBySource.get(item.source) || 0) + 1);
    }

    return results.map((result) => {
        const meta = {
            name: result.name,
            status: result.ok ? "ok" : "error",
            count: countBySource.get(result.name) || 0,
            updatedAt: generatedAt
        };

        if (!result.ok && result.error) {
            meta.error = result.error;
        }

        return meta;
    });
}

export async function collect() {
    const sourceJobs = [
        ["Hacker News", fetchHackerNews],
        ["GitHub", fetchGitHub],
        ["npm", fetchNpm]
    ];

    const results = await Promise.all(
        sourceJobs.map(async ([name, fn]) => {
            try {
                return { name, ok: true, items: await fn() };
            } catch (error) {
                console.warn(`Skipping ${name}: ${error.message}`);
                return { name, ok: false, error: error.message, items: [] };
            }
        })
    );

    const seen = new Set();
    const items = results
        .flatMap((result) => result.items)
        .filter((item) => {
            const key = `${item.source}:${item.title}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, MAX_ITEMS)
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

async function main() {
    const data = await collect();
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
