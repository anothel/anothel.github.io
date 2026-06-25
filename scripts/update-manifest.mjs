import { readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const OUT_FILE = new URL("../data/manifest.json", import.meta.url);

export const moduleDefinitions = [
    {
        id: "trends",
        title: "Tech trends",
        route: "trends/index.html",
        data: "data/trends.json",
        collection: "items",
        source(data) {
            return data.sources.join(", ");
        },
        status(data) {
            return aggregateStatus(data.sourceMeta.map((source) => source.status));
        }
    },
    {
        id: "packages",
        title: "Package watchlist",
        route: "packages/index.html",
        data: "data/packages.json",
        collection: "packages"
    },
    {
        id: "repos",
        title: "Repo watchlist",
        route: "repos/index.html",
        data: "data/repos.json",
        collection: "repos"
    },
    {
        id: "links",
        title: "Reference shelf",
        route: "links/index.html",
        data: "data/links.json",
        collection: "links"
    }
];

function newestDate(values) {
    return values.filter(Boolean).sort().at(-1);
}

function sourceName(data) {
    return data.sourceMeta?.name || "unknown";
}

function sourceStatus(data) {
    return data.sourceMeta?.status || "unknown";
}

function aggregateStatus(statuses) {
    if (statuses.length === 0) return "unknown";
    if (statuses.every((status) => status === "ok")) return "ok";
    if (statuses.every((status) => status === "error")) return "error";
    return "partial";
}

function moduleCount(data, collection) {
    return Array.isArray(data[collection]) ? data[collection].length : 0;
}

export function buildManifest(definitions, datasets, generatedAt = new Date().toISOString()) {
    const modules = definitions.map((definition) => {
        const data = datasets[definition.id];

        return {
            id: definition.id,
            title: definition.title,
            route: definition.route,
            data: definition.data,
            source: definition.source ? definition.source(data) : sourceName(data),
            status: definition.status ? definition.status(data) : sourceStatus(data),
            count: moduleCount(data, definition.collection),
            updated: data.updated
        };
    });

    return {
        updated: newestDate(modules.map((module) => module.updated)),
        generatedAt,
        modules
    };
}

async function readJson(path) {
    return JSON.parse(await readFile(new URL(`../${path}`, import.meta.url), "utf8"));
}

async function collectManifest() {
    const datasets = {};
    for (const definition of moduleDefinitions) {
        datasets[definition.id] = await readJson(definition.data);
    }

    return buildManifest(moduleDefinitions, datasets);
}

async function main() {
    const data = await collectManifest();
    const output = `${JSON.stringify(data, null, 2)}\n`;

    if (process.argv.includes("--stdout")) {
        console.log(output);
    } else {
        await writeFile(OUT_FILE, output, "utf8");
        console.log(`Wrote ${data.modules.length} modules to data/manifest.json`);
    }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    await main();
}
