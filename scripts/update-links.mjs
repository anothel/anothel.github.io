import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { activeItems } from "./watchlist-governance.mjs";

const { validSourceTimestamp } = createRequire(import.meta.url)("../js/data-health.js");

const OUT_FILE = new URL("../data/links.json", import.meta.url);
const WATCHLIST_FILE = new URL("../data/watchlists.json", import.meta.url);

function readWatchlists() {
    return JSON.parse(readFileSync(WATCHLIST_FILE, "utf8"));
}

export const linkDefinitions = activeItems(readWatchlists().links);

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

export function referenceContentHash(links = linkDefinitions) {
    return createHash("sha256").update(JSON.stringify(buildLinkRows(links))).digest("hex");
}

export function collectLinks(watchlists = readWatchlists(), now = new Date()) {
    const generatedAt = now.toISOString();
    const definitions = activeItems(watchlists.links);
    const links = buildLinkRows(definitions);
    const review = watchlists.linksReview;
    // Bind human evidence to exactly the active emitted shelf, never the build clock.
    const reviewed = review && validSourceTimestamp(review.reviewedAt)
        && Date.parse(review.reviewedAt) <= now.getTime()
        && typeof review.reviewedBy === "string" && review.reviewedBy.trim()
        && typeof review.evidence === "string" && review.evidence.trim()
        && review.contentHash === referenceContentHash(definitions);

    return {
        updated: isoDate(now),
        generatedAt,
        sourceMeta: {
            name: "manual",
            status: "ok",
            count: links.length,
            tracked: definitions.length,
            emitted: links.length,
            coverage: `${links.length}/${definitions.length}`,
            ...(reviewed ? { reviewedAt: review.reviewedAt } : {})
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
