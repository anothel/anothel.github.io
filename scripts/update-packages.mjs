import { writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const OUT_FILE = new URL("../data/packages.json", import.meta.url);
const USER_AGENT = "anothel.github.io package watchlist";

export const packageDefinitions = [
    { name: "react", category: "UI", focus: "frontend runtime" },
    { name: "typescript", category: "Language", focus: "typed JavaScript" },
    { name: "vite", category: "Tooling", focus: "build tool" },
    { name: "next", category: "Framework", focus: "React framework" },
    { name: "zod", category: "Validation", focus: "schema validation" },
    { name: "playwright", category: "Testing", focus: "browser automation" },
    { name: "eslint", category: "Tooling", focus: "linting" },
    { name: "prettier", category: "Tooling", focus: "formatting" },
    { name: "ai", category: "AI SDK", focus: "Vercel AI SDK" },
    { name: "@ai-sdk/openai", category: "AI SDK", focus: "OpenAI provider for AI SDK" },
    { name: "@ai-sdk/provider", category: "AI SDK", focus: "AI SDK provider interface" },
    { name: "openai", category: "AI SDK", focus: "OpenAI API SDK" },
    { name: "@anthropic-ai/sdk", category: "AI SDK", focus: "Anthropic API SDK" },
    { name: "mastra", category: "AI agents", focus: "TypeScript agent framework" },
    { name: "langchain", category: "AI agents", focus: "LLM and agent orchestration" },
    { name: "@langchain/core", category: "AI agents", focus: "LangChain core primitives" },
    { name: "@modelcontextprotocol/sdk", category: "MCP", focus: "Model Context Protocol SDK" },
    { name: "fastmcp", category: "MCP", focus: "MCP server framework" },
    { name: "evalite", category: "AI evals", focus: "LLM evaluation toolkit" },
    { name: "braintrust", category: "AI evals", focus: "AI evals and observability" },
    { name: "inngest", category: "Workflow automation", focus: "durable workflow runtime" }
];

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

export async function collectPackages(
    definitions = packageDefinitions,
    fetcher = fetchJson,
    generatedAt = new Date().toISOString()
) {
    const results = await Promise.all(
        definitions.map(async (definition) => {
            try {
                return {
                    ok: true,
                    record: await fetcher(buildPackageDownloadUrl(definition.name), definition)
                };
            } catch (error) {
                return {
                    ok: false,
                    error: {
                        name: definition.name,
                        error: error.message
                    }
                };
            }
        })
    );
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

async function main() {
    const data = await collectPackages();
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
