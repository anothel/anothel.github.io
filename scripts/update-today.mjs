import { readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { classifySignal, isBaselineSignal, qualityBoost, signalPolicy, signalReason, trackedTopicLabels } from "./signal-taxonomy.mjs";

const OUT_FILE = new URL("../data/today.json", import.meta.url);
const require = createRequire(import.meta.url);
const signalSchema = require("../js/signal-schema.js");

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

const boostedCategories = new Set(
    trackedTopicLabels
        .filter((label) => label !== "Developer tooling")
        .map((label) => label.toLowerCase())
);
const expandedCoverageCategories = new Set(
    trackedTopicLabels.filter((label) => ["AI evals", "Workflow automation"].includes(label))
);

function isoDate(date = new Date()) {
    return date.toISOString().slice(0, 10);
}

function sourceStatus(source) {
    if (Array.isArray(source?.sourceMeta)) {
        return aggregateStatuses(source.sourceMeta.map((item) => item.status));
    }

    return source?.sourceMeta?.status || "unknown";
}

function aggregateStatuses(statuses) {
    if (statuses.length === 0) {
        return "unknown";
    }
    if (statuses.every((value) => value === "ok")) {
        return "ok";
    }
    if (statuses.every((value) => value === "error")) {
        return "error";
    }

    return "partial";
}

function newestDate(values) {
    return values.filter(Boolean).sort().at(-1) || isoDate();
}

function candidateText(item) {
    return [
        item.title,
        item.module,
        item.origin,
        item.category,
        item.metric,
        item.reason,
        item.url
    ].filter(Boolean).join(" ");
}

function matchesIntent(item) {
    return qualityBoost(candidateText(item)) >= signalPolicy.intentThreshold;
}

function matchesBaseline(item) {
    return isBaselineSignal(candidateText(item));
}

function intentReason(item) {
    return signalReason(candidateText(item));
}

function scoreReasons(reason, item) {
    return [...new Set([reason, ...(item.scoreReasons || [])].filter(Boolean))].slice(0, 3);
}

export function baselinePriorityPenalty(policy = signalPolicy) {
    const value = Number(policy?.baselinePenalty || 0);
    return value < 0 ? Math.abs(value) : value;
}

function qualityPriority(item) {
    let priority = item.score;

    if (item.isIntentMatch) {
        priority += item.module === "Links" ? 16 : 28;
        priority += Math.max(0, qualityBoost(candidateText(item)));
    }
    if (boostedCategories.has(classifySignal(candidateText(item)).trim().toLowerCase())) {
        priority += 10;
    }
    if (item.isBaseline) {
        priority -= baselinePriorityPenalty();
    }

    return priority;
}

function enrichCandidate(item) {
    const isIntentMatch = matchesIntent(item);
    const isBaseline = matchesBaseline(item);
    const enriched = {
        ...item,
        isIntentMatch,
        isBaseline
    };
    const reason = isIntentMatch ? intentReason(enriched) : item.reason;

    return {
        ...enriched,
        priority: qualityPriority(enriched),
        reason,
        scoreReasons: scoreReasons(reason, item)
    };
}

function stableSort(items) {
    return [...items].sort(
        (a, b) =>
            (b.priority ?? b.score) - (a.priority ?? a.score) ||
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

function baselineCount(items) {
    return items.filter((item) => item.isBaseline).length;
}

function fillStartFrom(picker, startItems, pool, options = {}) {
    const {
        limit = sectionCounts.start,
        enforceBaselineCap = true
    } = options;

    for (const item of pool) {
        if (startItems.length >= limit) {
            break;
        }
        if (enforceBaselineCap && item.isBaseline && baselineCount(startItems) >= 1) {
            continue;
        }

        picker.fill(startItems, startItems.length + 1, [item]);
    }

    return startItems;
}

function pickStartItems(picker, intentPool, primaryPool, fallbackPool) {
    const startItems = [];

    fillStartFrom(picker, startItems, intentPool, { limit: 1 });
    fillStartFrom(picker, startItems, primaryPool);
    fillStartFrom(picker, startItems, fallbackPool);

    if (startItems.length < sectionCounts.start) {
        fillStartFrom(picker, startItems, fallbackPool, { enforceBaselineCap: false });
    }

    return startItems;
}

function actionFor(sectionId, item) {
    if (sectionId === "start") {
        if (item.module === "Repos") return "Compare repo traction before saving.";
        if (item.module === "Packages") return "Check package demand, then compare related repos.";
        if (item.module === "Links") return "Open the reference and keep it nearby if useful.";
        return "Open the source now, then decide whether to save it.";
    }
    if (sectionId === "skim") return "Skim the source and save it only if it changes what to watch next.";
    if (sectionId === "reference") return "Keep as a reference when working on related agent workflows.";
    return "Open the source and decide whether it belongs in the saved queue.";
}

function stripItem(item, sectionId) {
    return {
        schemaVersion: item.schemaVersion,
        id: item.id,
        sourceModule: item.sourceModule,
        sourceKind: item.sourceKind,
        title: item.title,
        module: item.module,
        origin: item.origin,
        category: item.category,
        metric: item.metric,
        reason: item.reason,
        scoreReasons: item.scoreReasons,
        action: actionFor(sectionId, item),
        url: item.url,
        rawScore: item.rawScore,
        qualityScore: item.qualityScore,
        score: item.score,
        sources: item.sources,
        sourceContext: item.sourceContext,
        canonicalKey: item.canonicalKey,
        updated: item.updated
    };
}

function sourceMetaFor(sources, generatedAt, count) {
    const statuses = Object.values(sources).map(sourceStatus);
    const sourceStatusValue = aggregateStatuses(statuses);
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

function todayScore(item) {
    if (item.sourceModule === "trends") return item.rawScore;
    if (item.sourceModule === "repos") return item.sourceRank ? Math.max(65, 86 - item.sourceRank) : 80;
    if (item.sourceModule === "packages") return item.sourceRank ? Math.max(60, 76 - item.sourceRank) : 70;
    if (item.sourceModule === "links") return item.sourceRank ? Math.max(50, 66 - item.sourceRank) : 60;
    return item.score;
}

function todayModuleOrder(item) {
    return { Trends: 0, Repos: 1, Packages: 2, Links: 3 }[item.module] ?? 4;
}

export function normalizeCandidates({ trends = {}, repos = {}, packages = {}, links = {} } = {}) {
    return signalSchema.normalizeSignalData({ trends, repos, packages, links }, { dedupe: false })
        .map((item) => ({
            ...item,
            category: item.category || `${item.module} signal`,
            metric: item.sourceModule === "trends" ? `${item.rawScore ?? 0} score` : item.metric,
            reason: item.reason || item.summary || item.metric,
            score: todayScore(item)
        }))
        .sort((a, b) => todayModuleOrder(a) - todayModuleOrder(b));
}

export function buildTodayBrief(sources = {}, generatedAt = new Date().toISOString()) {
    const candidates = normalizeCandidates(sources).map(enrichCandidate);
    const picker = createPicker(candidates);

    const trends = stableSort(candidates.filter((item) => item.module === "Trends"));
    const repos = stableSort(candidates.filter((item) => item.module === "Repos"));
    const packages = stableSort(candidates.filter((item) => item.module === "Packages"));
    const links = stableSort(candidates.filter((item) => item.module === "Links"));
    const intentItems = stableSort(candidates.filter((item) => item.isIntentMatch));
    const expandedCoverageItems = stableSort(candidates.filter((item) => expandedCoverageCategories.has(item.category)));
    const skimPool = stableSort(candidates.filter((item) => ["Trends", "Repos", "Packages"].includes(item.module)));
    const allByScore = stableSort(candidates);

    const startItems = pickStartItems(picker, intentItems, allByScore, allByScore);

    const skimItems = picker.pickFrom(expandedCoverageItems, 1);
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
            items: startItems.map((item) => stripItem(item, "start"))
        },
        {
            id: "skim",
            title: "Worth skimming",
            summary: sectionSummaries.skim,
            items: skimItems.map((item) => stripItem(item, "skim"))
        },
        {
            id: "reference",
            title: "Reference shelf",
            summary: sectionSummaries.reference,
            items: referenceItems.map((item) => stripItem(item, "reference"))
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
