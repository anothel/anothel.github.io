import { readFileSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const OUT_FILE = new URL("../data/links.json", import.meta.url);
const WATCHLIST_FILE = new URL("../data/watchlists.json", import.meta.url);

function readWatchlists() {
    return JSON.parse(readFileSync(WATCHLIST_FILE, "utf8"));
}

export const linkDefinitions = readWatchlists().links;

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
