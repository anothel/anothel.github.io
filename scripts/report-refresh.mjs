import { mkdir, readFile, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { promisify } from "node:util";

const DEFAULT_OUT_DIR = new URL("../.refresh-report/", import.meta.url);
const manifestFile = new URL("../data/manifest.json", import.meta.url);
const priorReportFile = new URL("../data/refresh-report.json", import.meta.url);
const execFileAsync = promisify(execFile);

function sourceList(sourceMeta) {
    if (Array.isArray(sourceMeta)) return sourceMeta;
    if (sourceMeta && typeof sourceMeta === "object") return [sourceMeta];
    return [];
}

function sourceErrors(source) {
    if (Array.isArray(source?.errors)) {
        return source.errors
            .map((error) => [error.name, error.error].filter(Boolean).join(": "))
            .filter(Boolean);
    }
    return source?.error ? [source.error] : [];
}

function safetyDetail(source) {
    const details = [];
    if (source?.fallbackUsed) details.push("fallback used");
    if (source?.staleButSafe) details.push("stale but safe");
    if (source?.rateLimited) details.push("rate limited");
    if (source?.consecutiveRateLimitedRuns > 1) {
        details.push(`consecutive 429 x${source.consecutiveRateLimitedRuns}`);
    }
    if (source?.fallbackReason) details.push(source.fallbackReason);
    if (source?.previousUpdated) details.push(`previous ${source.previousUpdated}`);
    return details;
}

function statusRank(status) {
    return { error: 3, partial: 2, fallback: 1, unknown: 1, ok: 0 }[status] ?? 1;
}

function worstStatus(statuses) {
    return statuses
        .filter(Boolean)
        .sort((a, b) => statusRank(b) - statusRank(a))
        .at(0) || "unknown";
}

function safeName(value) {
    return String(value || "").trim().toLowerCase();
}

function hasRateLimitedPackageError(source) {
    return Array.isArray(source.errors) && source.errors.some((error) => {
        if (typeof error === "string") {
            return /\bn8n-workflow\b/i.test(error) && /\b429\b/.test(error);
        }

        const name = safeName(error?.name);
        const message = safeName(error?.error);
        return name === "n8n-workflow" && /\b429\b/.test(message);
    });
}

function isPackageRateLimitedPartial(source) {
    const sourceName = safeName(source?.name || source?.source);
    return sourceName === "npm" && source?.status === "partial" && hasRateLimitedPackageError(source);
}

function priorPackageSource(priorReport, moduleId, sourceName) {
    const priorModule = Array.isArray(priorReport?.modules)
        ? priorReport.modules.find((entry) => safeName(entry.id) === safeName(moduleId))
        : null;
    if (!priorModule) return null;
    return (priorModule.sources || []).find((source) => safeName(source?.source) === safeName(sourceName));
}

function countConsecutiveRateLimitedRuns(current, previous) {
    if (!isPackageRateLimitedPartial(current)) return 0;
    const previousCount = isPackageRateLimitedPartial(previous)
        ? Math.max(1, previous.consecutiveRateLimitedRuns || 1)
        : 0;
    const currentCount = Math.max(1, current.consecutiveRateLimitedRuns || 1);
    return previousCount ? previousCount + 1 : currentCount;
}

function summarizeSources(module, dataset, priorReport = {}) {
    const sources = sourceList(dataset.sourceMeta);
    if (sources.length === 0) {
        return [{
            module: module.id,
            source: module.source || "unknown",
            status: module.status || "unknown",
            count: module.count || 0,
            updatedAt: module.updated || "-",
            errors: ["No source metadata"]
        }];
    }

    return sources.map((source) => {
        const consecutiveRateLimitedRuns = isPackageRateLimitedPartial(source)
            ? countConsecutiveRateLimitedRuns(source, priorPackageSource(priorReport, module.id, source.name))
            : 0;
        const row = {
            module: module.id,
            source: source.name || "unknown",
            status: source.status || "unknown",
            count: source.count || 0,
            updatedAt: source.updatedAt || source.updated || "-",
            coverage: source.coverage || "",
            fallbackUsed: Boolean(source.fallbackUsed),
            staleButSafe: Boolean(source.staleButSafe),
            rateLimited: Boolean(source.rateLimited),
            fallbackReason: source.fallbackReason || "",
            previousUpdated: source.previousUpdated || "",
            consecutiveRateLimitedRuns
        };

        row.safetyDetails = safetyDetail(row);
        row.errors = sourceErrors(source);
        return row;
    });
}

export function buildRefreshReport(manifest, datasets, generatedAt = new Date().toISOString(), priorReport = {}) {
    const modules = (manifest.modules || []).map((module) => {
        const dataset = datasets[module.id] || {};
        const sources = summarizeSources(module, dataset, priorReport);
        const changed = (datasets.__changedFiles || []).includes(module.data);

        return {
            id: module.id,
            title: module.title,
            status: module.status || worstStatus(sources.map((source) => source.status)),
            count: module.count || 0,
            updated: module.updated || "-",
            changed,
            sources
        };
    });

    const sourceRows = modules.flatMap((module) => module.sources);
    const errorRows = sourceRows.filter((source) => source.status !== "ok" || source.errors.length > 0);

    return {
        generatedAt,
        manifestUpdated: manifest.updated || "-",
        runContext: {
            reason: datasets.__runContext?.reason || "",
            eventName: datasets.__runContext?.eventName || "",
            runId: datasets.__runContext?.runId || "",
            refName: datasets.__runContext?.refName || ""
        },
        changedModules: modules
            .filter((module) => module.changed)
            .map((module) => ({ id: module.id, title: module.title, count: module.count, updated: module.updated })),
        modules,
        totals: {
            modules: modules.length,
            sources: sourceRows.length,
            items: modules.reduce((sum, module) => sum + module.count, 0),
            status: worstStatus(sourceRows.map((source) => source.status)),
            errors: errorRows.length
        }
    };
}

function markdownTable(rows) {
    const body = rows.map((row) => `| ${row.map((cell) => String(cell ?? "-").replaceAll("|", "\\|")).join(" | ")} |`);
    return body.join("\n");
}

export function renderRefreshMarkdown(report, context = {}) {
    const moduleRows = report.modules.map((module) => [
        module.id,
        module.status,
        module.count,
        module.updated
    ]);
    const sourceRows = report.modules.flatMap((module) =>
        module.sources.map((source) => [
            module.id,
            source.source,
            source.status,
            source.count,
            source.updatedAt,
            source.errors.join(" / ") || source.safetyDetails.join(" / ") || source.coverage || "-"
        ])
    );
    const reasonValue = context.reason || report.runContext?.reason;
    const reason = reasonValue ? `\nReason: ${reasonValue}\n` : "";
    const changedModules = report.changedModules?.length
        ? report.changedModules.map((module) => module.id).join(", ")
        : "none recorded";

    return [
        "# Data refresh report",
        "",
        `Generated: ${report.generatedAt}`,
        `Manifest updated: ${report.manifestUpdated}`,
        `Overall status: ${report.totals.status}`,
        `Modules: ${report.totals.modules}`,
        `Sources: ${report.totals.sources}`,
        `Items: ${report.totals.items}`,
        `Non-ok sources: ${report.totals.errors}`,
        `Changed modules: ${changedModules}`,
        reason.trimEnd(),
        "",
        "## Modules",
        "",
        "| Module | Status | Items | Updated |",
        "| --- | --- | ---: | --- |",
        markdownTable(moduleRows),
        "",
        "## Sources",
        "",
        "| Module | Source | Status | Items | Updated | Detail |",
        "| --- | --- | --- | ---: | --- | --- |",
        markdownTable(sourceRows)
    ].filter((line) => line !== undefined).join("\n").replace(/\n{3,}/g, "\n\n") + "\n";
}

async function readJson(url) {
    return JSON.parse(await readFile(url, "utf8"));
}

async function readPriorReport() {
    try {
        return await readJson(priorReportFile);
    } catch {
        return null;
    }
}

async function collectDatasets(manifest) {
    const entries = await Promise.all((manifest.modules || []).map(async (module) => {
        const data = await readJson(new URL(`../${module.data}`, import.meta.url));
        return [module.id, data];
    }));

    return Object.fromEntries(entries);
}

async function changedDataFiles() {
    try {
        const { stdout } = await execFileAsync("git", ["diff", "--name-only", "--", "data"]);
        return stdout.split(/\r?\n/).filter(Boolean).map((path) => path.replaceAll("\\", "/"));
    } catch {
        return [];
    }
}

function runContext() {
    return {
        reason: process.env.REFRESH_REASON || "",
        eventName: process.env.GITHUB_EVENT_NAME || "",
        runId: process.env.GITHUB_RUN_ID || "",
        refName: process.env.GITHUB_REF_NAME || ""
    };
}

function argValue(name) {
    const index = process.argv.indexOf(name);
    return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main() {
    const outDir = argValue("--out-dir")
        ? new URL(`${argValue("--out-dir").replace(/[\\/]?$/, "/")}`, pathToFileURL(`${process.cwd()}/`))
        : DEFAULT_OUT_DIR;
    const manifest = await readJson(manifestFile);
    const datasets = await collectDatasets(manifest);
    datasets.__changedFiles = await changedDataFiles();
    datasets.__runContext = runContext();
    const priorReport = await readPriorReport();
    const report = buildRefreshReport(manifest, datasets, new Date().toISOString(), priorReport);
    const markdown = renderRefreshMarkdown(report, { reason: process.env.REFRESH_REASON });
    const jsonOut = argValue("--json-out");

    await mkdir(outDir, { recursive: true });
    await writeFile(new URL("report.json", outDir), `${JSON.stringify(report, null, 2)}\n`, "utf8");
    await writeFile(new URL("summary.md", outDir), markdown, "utf8");
    if (jsonOut) {
        await writeFile(resolve(jsonOut), `${JSON.stringify(report, null, 2)}\n`, "utf8");
    }

    if (process.argv.includes("--stdout")) {
        console.log(markdown);
    } else {
        console.log(`Wrote refresh report to ${fileURLToPath(new URL("summary.md", outDir))}`);
    }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    await main();
}
