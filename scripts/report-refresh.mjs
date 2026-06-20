import { mkdir, readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const DEFAULT_OUT_DIR = new URL("../.refresh-report/", import.meta.url);
const manifestFile = new URL("../data/manifest.json", import.meta.url);

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

function statusRank(status) {
    return { error: 3, partial: 2, fallback: 1, unknown: 1, ok: 0 }[status] ?? 1;
}

function worstStatus(statuses) {
    return statuses
        .filter(Boolean)
        .sort((a, b) => statusRank(b) - statusRank(a))
        .at(0) || "unknown";
}

function summarizeSources(module, dataset) {
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

    return sources.map((source) => ({
        module: module.id,
        source: source.name || "unknown",
        status: source.status || "unknown",
        count: source.count || 0,
        updatedAt: source.updatedAt || source.updated || "-",
        coverage: source.coverage || "",
        errors: sourceErrors(source)
    }));
}

export function buildRefreshReport(manifest, datasets, generatedAt = new Date().toISOString()) {
    const modules = (manifest.modules || []).map((module) => {
        const dataset = datasets[module.id] || {};
        const sources = summarizeSources(module, dataset);

        return {
            id: module.id,
            title: module.title,
            status: module.status || worstStatus(sources.map((source) => source.status)),
            count: module.count || 0,
            updated: module.updated || "-",
            sources
        };
    });

    const sourceRows = modules.flatMap((module) => module.sources);
    const errorRows = sourceRows.filter((source) => source.status !== "ok" || source.errors.length > 0);

    return {
        generatedAt,
        manifestUpdated: manifest.updated || "-",
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
            source.errors.join(" / ") || source.coverage || "-"
        ])
    );
    const reason = context.reason ? `\nReason: ${context.reason}\n` : "";

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

async function collectDatasets(manifest) {
    const entries = await Promise.all((manifest.modules || []).map(async (module) => {
        const data = await readJson(new URL(`../${module.data}`, import.meta.url));
        return [module.id, data];
    }));

    return Object.fromEntries(entries);
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
    const report = buildRefreshReport(manifest, await collectDatasets(manifest));
    const markdown = renderRefreshMarkdown(report, { reason: process.env.REFRESH_REASON });

    await mkdir(outDir, { recursive: true });
    await writeFile(new URL("report.json", outDir), `${JSON.stringify(report, null, 2)}\n`, "utf8");
    await writeFile(new URL("summary.md", outDir), markdown, "utf8");

    if (process.argv.includes("--stdout")) {
        console.log(markdown);
    } else {
        console.log(`Wrote refresh report to ${new URL("summary.md", outDir).pathname}`);
    }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    await main();
}
