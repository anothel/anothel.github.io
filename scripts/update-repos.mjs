import { readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { applyEmptyCollectionFallback } from "./refresh-safety.mjs";

const OUT_FILE = new URL("../data/repos.json", import.meta.url);
const USER_AGENT = "anothel.github.io repo watchlist";

export const repoDefinitions = [
    { fullName: "react/react", category: "UI", focus: "frontend runtime" },
    { fullName: "vercel/next.js", category: "Framework", focus: "React framework" },
    { fullName: "vitejs/vite", category: "Tooling", focus: "build tool" },
    { fullName: "microsoft/playwright", category: "Testing", focus: "browser automation" },
    { fullName: "n8n-io/n8n", category: "Automation", focus: "workflow automation" },
    { fullName: "colinhacks/zod", category: "Validation", focus: "schema validation" },
    { fullName: "anthropics/skills", category: "Agent skills", focus: "official Agent Skills examples" },
    { fullName: "mattpocock/skills", category: "Agent skills", focus: "engineering workflow skills" },
    { fullName: "openai/codex", category: "AI agents", focus: "terminal coding agent" },
    { fullName: "anomalyco/opencode", category: "AI agents", focus: "open source coding agent" },
    { fullName: "aaif-goose/goose", category: "AI agents", focus: "local extensible AI agent" },
    { fullName: "Aider-AI/aider", category: "AI agents", focus: "terminal AI pair programming" },
    { fullName: "google-gemini/gemini-cli", category: "AI agents", focus: "Gemini terminal coding agent" },
    { fullName: "openai/openai-agents-js", category: "AI agents", focus: "TypeScript multi-agent framework" },
    { fullName: "openai/openai-agents-python", category: "AI agents", focus: "Python multi-agent framework" },
    { fullName: "github/awesome-copilot", category: "AI agents", focus: "Copilot agents and skills" },
    { fullName: "modelcontextprotocol/servers", category: "MCP", focus: "MCP reference servers" },
    { fullName: "modelcontextprotocol/typescript-sdk", category: "MCP", focus: "MCP TypeScript SDK" },
    { fullName: "modelcontextprotocol/python-sdk", category: "MCP", focus: "MCP Python SDK" },
    { fullName: "modelcontextprotocol/inspector", category: "MCP", focus: "MCP debugging and inspection" },
    { fullName: "modelcontextprotocol/registry", category: "MCP", focus: "MCP server registry" },
    { fullName: "lastmile-ai/mcp-agent", category: "MCP", focus: "MCP agent workflow framework" },
    { fullName: "punkpeye/awesome-mcp-servers", category: "MCP", focus: "curated MCP server directory" },
    { fullName: "contains-studio/agents", category: "AI agents", focus: "Claude Code agent packs" },
    { fullName: "karpathy/nanoGPT", category: "AI engineering", focus: "small GPT training" },
    { fullName: "karpathy/nanochat", category: "AI engineering", focus: "minimal ChatGPT stack" },
    { fullName: "karpathy/llm.c", category: "AI engineering", focus: "LLM training in C/CUDA" },
    { fullName: "karpathy/llama2.c", category: "AI engineering", focus: "single-file Llama inference" }
];

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
