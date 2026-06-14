import { writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const OUT_FILE = new URL("../data/repos.json", import.meta.url);
const USER_AGENT = "anothel.github.io repo watchlist";

export const repoDefinitions = [
    { fullName: "react/react", category: "UI", focus: "frontend runtime" },
    { fullName: "vercel/next.js", category: "Framework", focus: "React framework" },
    { fullName: "vitejs/vite", category: "Tooling", focus: "build tool" },
    { fullName: "microsoft/playwright", category: "Testing", focus: "browser automation" },
    { fullName: "n8n-io/n8n", category: "Automation", focus: "workflow automation" },
    { fullName: "colinhacks/zod", category: "Validation", focus: "schema validation" }
];

function isoDate(date = new Date()) {
    return date.toISOString().slice(0, 10);
}

function compactNumber(value) {
    return Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);
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
    const definitionByName = new Map(definitions.map((item) => [item.fullName, item]));

    return repoRecords
        .filter((repo) => definitionByName.has(repo.full_name))
        .sort((a, b) => b.stargazers_count - a.stargazers_count)
        .map((repo, index) => {
            const definition = definitionByName.get(repo.full_name);
            return {
                rank: index + 1,
                name: repo.full_name,
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

export async function collectRepos() {
    const headers = {};
    if (process.env.GITHUB_TOKEN) {
        headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    }

    const repoRecords = await Promise.all(
        repoDefinitions.map((definition) =>
            fetchJson(`https://api.github.com/repos/${definition.fullName}`, { headers })
        )
    );
    const repos = buildRepoRows(repoRecords);
    const generatedAt = new Date().toISOString();

    return {
        updated: isoDate(),
        generatedAt,
        sourceMeta: {
            name: "GitHub",
            status: "ok",
            count: repos.length,
            updatedAt: generatedAt
        },
        repos
    };
}

async function main() {
    const data = await collectRepos();
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
