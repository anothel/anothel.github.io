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
