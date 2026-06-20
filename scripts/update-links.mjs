import { writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const OUT_FILE = new URL("../data/links.json", import.meta.url);

export const linkDefinitions = [
    {
        title: "GitHub REST API",
        category: "API",
        kind: "Docs",
        url: "https://docs.github.com/en/rest",
        summary: "Reference for GitHub REST endpoints used by repo data scripts."
    },
    {
        title: "Hacker News API",
        category: "API",
        kind: "Docs",
        url: "https://github.com/HackerNews/API",
        summary: "Official public API for Hacker News stories and metadata."
    },
    {
        title: "npm Download Counts",
        category: "API",
        kind: "Docs",
        url: "https://github.com/npm/registry/blob/main/docs/download-counts.md",
        summary: "Registry download-count API used by package watchlists."
    },
    {
        title: "MDN Web Docs",
        category: "Frontend",
        kind: "Docs",
        url: "https://developer.mozilla.org/",
        summary: "Reference for web platform APIs, CSS, HTML, and JavaScript."
    },
    {
        title: "web.dev",
        category: "Frontend",
        kind: "Guide",
        url: "https://web.dev/",
        summary: "Practical guides for web performance, UX, and platform features."
    },
    {
        title: "Node.js API",
        category: "Runtime",
        kind: "Docs",
        url: "https://nodejs.org/api/",
        summary: "Node.js runtime API documentation for scripts and tooling."
    },
    {
        title: "SQLite Docs",
        category: "Data",
        kind: "Docs",
        url: "https://www.sqlite.org/docs.html",
        summary: "Reference for small durable data stores and local-first experiments."
    },
    {
        title: "OpenTelemetry Docs",
        category: "Ops",
        kind: "Docs",
        url: "https://opentelemetry.io/docs/",
        summary: "Observability concepts, instrumentation, traces, metrics, and logs."
    },
    {
        title: "Anthropic Agent Skills",
        category: "Agent skills",
        kind: "Repo",
        url: "https://github.com/anthropics/skills",
        summary: "Official examples, spec, templates, and install paths for Claude Agent Skills."
    },
    {
        title: "Agent Skills standard",
        category: "Agent skills",
        kind: "Spec",
        url: "https://agentskills.io/",
        summary: "Open specification for packaging reusable instructions, scripts, and resources for agents."
    },
    {
        title: "mattpocock/skills",
        category: "Agent skills",
        kind: "Repo",
        url: "https://github.com/mattpocock/skills",
        summary: "Practical engineering skills for agent work: grilling, TDD, diagnosis, handoff, and architecture review."
    },
    {
        title: "Claude Skills docs",
        category: "Agent skills",
        kind: "Docs",
        url: "https://support.claude.com/en/articles/11144907-what-are-skills",
        summary: "User-facing guide to what skills are and how Claude loads them for repeatable work."
    },
    {
        title: "Claude API Skills overview",
        category: "Agent skills",
        kind: "Docs",
        url: "https://docs.claude.com/en/docs/agents-and-tools/skills/overview",
        summary: "Developer overview for using skills through the Claude API."
    },
    {
        title: "GitHub Awesome Copilot",
        category: "AI agents",
        kind: "Repo",
        url: "https://github.com/github/awesome-copilot",
        summary: "Community agents, instructions, skills, hooks, workflows, and plugins for GitHub Copilot."
    },
    {
        title: "Model Context Protocol servers",
        category: "AI agents",
        kind: "Repo",
        url: "https://github.com/modelcontextprotocol/servers",
        summary: "Reference MCP servers for connecting agents to tools and data sources."
    },
    {
        title: "OpenAI Codex",
        category: "AI agents",
        kind: "Repo",
        url: "https://github.com/openai/codex",
        summary: "Lightweight coding agent that runs in the terminal."
    },
    {
        title: "OpenAI Agents SDK",
        category: "AI agents",
        kind: "Docs",
        url: "https://openai.github.io/openai-agents-js/",
        summary: "JavaScript/TypeScript SDK documentation for building OpenAI agent workflows."
    },
    {
        title: "contains-studio/agents",
        category: "AI agents",
        kind: "Repo",
        url: "https://github.com/contains-studio/agents",
        summary: "Specialized Claude Code agent files grouped by engineering, design, product, testing, and operations."
    },
    {
        title: "MCP TypeScript SDK",
        category: "MCP",
        kind: "Repo",
        url: "https://github.com/modelcontextprotocol/typescript-sdk",
        summary: "Official TypeScript SDK for building Model Context Protocol clients and servers."
    },
    {
        title: "Evalite",
        category: "AI evals",
        kind: "Docs",
        url: "https://www.evalite.dev/",
        summary: "Evaluation toolkit for measuring LLM and agent behavior in TypeScript workflows."
    },
    {
        title: "Karpathy GitHub",
        category: "AI engineering",
        kind: "Profile",
        url: "https://github.com/karpathy",
        summary: "High-signal AI engineering repos including nanoGPT, nanochat, llm.c, and llama2.c."
    }
];

function isoDate(date = new Date()) {
    return date.toISOString().slice(0, 10);
}

export function buildLinkRows(links = linkDefinitions) {
    return [...links]
        .sort((a, b) => a.category.localeCompare(b.category) || a.title.localeCompare(b.title))
        .map((link, index) => ({
            rank: index + 1,
            title: link.title,
            category: link.category,
            kind: link.kind,
            url: link.url,
            summary: link.summary
        }));
}

export function collectLinks() {
    const generatedAt = new Date().toISOString();
    const links = buildLinkRows();

    return {
        updated: isoDate(),
        generatedAt,
        sourceMeta: {
            name: "manual",
            status: "ok",
            count: links.length,
            tracked: linkDefinitions.length,
            emitted: links.length,
            coverage: `${links.length}/${linkDefinitions.length}`,
            updatedAt: generatedAt
        },
        links
    };
}

async function main() {
    const data = collectLinks();
    const output = `${JSON.stringify(data, null, 2)}\n`;

    if (process.argv.includes("--stdout")) {
        console.log(output);
    } else {
        await writeFile(OUT_FILE, output, "utf8");
        console.log(`Wrote ${data.links.length} links to data/links.json`);
    }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    await main();
}
