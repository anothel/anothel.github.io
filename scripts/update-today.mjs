import { readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const OUT_FILE = new URL("../data/today.json", import.meta.url);

const sourceFiles = {
    trends: new URL("../data/trends.json", import.meta.url),
    repos: new URL("../data/repos.json", import.meta.url),
    packages: new URL("../data/packages.json", import.meta.url),
    links: new URL("../data/links.json", import.meta.url)
};

export const sectionCounts = {
    start: 3,
    skim: 6,
    reference: 4
};

const sectionSummaries = {
    start: "Three signals worth opening first.",
    skim: "Useful movement that does not need first attention.",
    reference: "Stable references and projects worth keeping nearby."
};

function isoDate(date = new Date()) {
    return date.toISOString().slice(0, 10);
}

function sourceStatus(source) {
    if (Array.isArray(source?.sourceMeta)) {
        return source.sourceMeta.every((item) => item.status === "ok") ? "ok" : "error";
    }

    return source?.sourceMeta?.status || "unknown";
}

function newestDate(values) {
    return values.filter(Boolean).sort().at(-1) || isoDate();
}

function trendReason(item) {
    return [item.velocity, item.signal].filter(Boolean).join(" / ") || item.summary || "Ranked trend signal";
}

function repoScore(repo) {
    if (typeof repo.score === "number") {
        return repo.score;
    }

    return repo.rank ? Math.max(65, 86 - repo.rank) : 80;
}

function packageScore(item) {
    if (typeof item.score === "number") {
        return item.score;
    }

    return item.rank ? Math.max(60, 76 - item.rank) : 70;
}

function linkScore(link) {
    if (typeof link.score === "number") {
        return link.score;
    }

    return link.rank ? Math.max(50, 66 - link.rank) : 60;
}

function stableSort(items) {
    return [...items].sort(
        (a, b) =>
            b.score - a.score ||
            a.module.localeCompare(b.module) ||
            a.title.localeCompare(b.title) ||
            a.url.localeCompare(b.url)
    );
}

function createPicker(candidates) {
    const usedUrls = new Set();
    const usedTitles = new Set();

    function alreadyUsed(item) {
        const titleKey = item.title.trim().toLowerCase();
        const urlKey = item.url.trim().toLowerCase();
        return usedTitles.has(titleKey) || usedUrls.has(urlKey);
    }

    function mark(item) {
        usedTitles.add(item.title.trim().toLowerCase());
        usedUrls.add(item.url.trim().toLowerCase());
        return item;
    }

    function pickFrom(pool, count) {
        const picked = [];
        for (const item of pool) {
            if (picked.length >= count) {
                break;
            }

            if (!alreadyUsed(item)) {
                picked.push(mark(item));
            }
        }

        return picked;
    }

    function fill(sectionItems, count, pool) {
        sectionItems.push(...pickFrom(pool, count - sectionItems.length));
        return sectionItems;
    }

    return { candidates, pickFrom, fill };
}

function stripItem(item) {
    return {
        title: item.title,
        module: item.module,
        origin: item.origin,
        category: item.category,
        metric: item.metric,
        reason: item.reason,
        url: item.url,
        score: item.score
    };
}

function sourceMetaFor(sources, generatedAt, count) {
    const statuses = Object.values(sources).map(sourceStatus);
    const sourceStatusValue = statuses.every((value) => value === "ok") ? "ok" : "error";
    const status = count === sectionCounts.start + sectionCounts.skim + sectionCounts.reference
        ? sourceStatusValue
        : "partial";

    return {
        name: "generated",
        status,
        count,
        updatedAt: generatedAt
    };
}

export function normalizeCandidates({ trends = {}, repos = {}, packages = {}, links = {} } = {}) {
    const trendItems = (trends.items || []).map((item) => ({
        title: item.title,
        module: "Trends",
        origin: item.source || "trend",
        category: item.category || "Trend",
        metric: `${item.score ?? 0} score`,
        reason: trendReason(item),
        url: item.url,
        score: item.score ?? 0
    }));

    const repoItems = (repos.repos || []).map((repo) => ({
        title: repo.name,
        module: "Repos",
        origin: "GitHub",
        category: repo.category || "Repository",
        metric: `${repo.starsLabel || "0"} stars`,
        reason: repo.focus || repo.summary || "Repository traction",
        url: repo.url,
        score: repoScore(repo)
    }));

    const packageItems = (packages.packages || []).map((item) => ({
        title: item.name,
        module: "Packages",
        origin: "npm",
        category: item.category || "Package",
        metric: item.downloadsLabel || "0/week",
        reason: item.focus || "Weekly npm demand",
        url: item.url,
        score: packageScore(item)
    }));

    const linkItems = (links.links || []).map((link) => ({
        title: link.title,
        module: "Links",
        origin: link.kind || "Link",
        category: link.category || "Reference",
        metric: link.kind || "Reference",
        reason: link.summary || "Reference shelf item",
        url: link.url,
        score: linkScore(link)
    }));

    return [...trendItems, ...repoItems, ...packageItems, ...linkItems].filter(
        (item) => item.title && item.url
    );
}

export function buildTodayBrief(sources = {}, generatedAt = new Date().toISOString()) {
    const candidates = normalizeCandidates(sources);
    const picker = createPicker(candidates);

    const trends = stableSort(candidates.filter((item) => item.module === "Trends"));
    const repos = stableSort(candidates.filter((item) => item.module === "Repos"));
    const packages = stableSort(candidates.filter((item) => item.module === "Packages"));
    const links = stableSort(candidates.filter((item) => item.module === "Links"));
    const skimPool = stableSort(candidates.filter((item) => ["Trends", "Repos", "Packages"].includes(item.module)));
    const allByScore = stableSort(candidates);

    const startItems = picker.fill(
        picker.pickFrom(trends, sectionCounts.start),
        sectionCounts.start,
        allByScore
    );

    const skimItems = [];
    const skimModules = [trends, repos, packages];
    while (skimItems.length < sectionCounts.skim) {
        const before = skimItems.length;
        for (const pool of skimModules) {
            if (skimItems.length < sectionCounts.skim) {
                picker.fill(skimItems, skimItems.length + 1, pool);
            }
        }

        if (skimItems.length === before) {
            break;
        }
    }
    picker.fill(skimItems, sectionCounts.skim, skimPool);
    picker.fill(skimItems, sectionCounts.skim, allByScore);

    const referenceItems = picker.fill(
        picker.pickFrom(links, sectionCounts.reference),
        sectionCounts.reference,
        repos
    );

    const sections = [
        {
            id: "start",
            title: "Start here",
            summary: sectionSummaries.start,
            items: startItems.map(stripItem)
        },
        {
            id: "skim",
            title: "Worth skimming",
            summary: sectionSummaries.skim,
            items: skimItems.map(stripItem)
        },
        {
            id: "reference",
            title: "Reference shelf",
            summary: sectionSummaries.reference,
            items: referenceItems.map(stripItem)
        }
    ];
    const count = sections.reduce((total, section) => total + section.items.length, 0);

    return {
        updated: newestDate(Object.values(sources).map((source) => source?.updated)),
        generatedAt,
        sourceMeta: sourceMetaFor(sources, generatedAt, count),
        sections
    };
}

async function readJson(url) {
    return JSON.parse(await readFile(url, "utf8"));
}

export async function collectToday(generatedAt = new Date().toISOString()) {
    const sources = {
        trends: await readJson(sourceFiles.trends),
        repos: await readJson(sourceFiles.repos),
        packages: await readJson(sourceFiles.packages),
        links: await readJson(sourceFiles.links)
    };

    return buildTodayBrief(sources, generatedAt);
}

async function main() {
    const data = await collectToday();
    const output = `${JSON.stringify(data, null, 2)}\n`;

    if (process.argv.includes("--stdout")) {
        console.log(output);
    } else {
        await writeFile(OUT_FILE, output, "utf8");
        console.log(`Wrote ${data.sourceMeta.count} today items to data/today.json`);
    }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    await main();
}
