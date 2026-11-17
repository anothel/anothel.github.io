import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { pipelineFreshness } from "../src/lib/refresh-health.mjs";
import { buildStatusDashboard } from "../src/lib/status-data.mjs";
import { dataFiles, validateDataMap } from "./data-contract.mjs";
import { publishedBytes } from "./published-http.mjs";

const moduleIds = ["trends", "packages", "repos", "links"];

export function assessRefresh({ manifest = {}, datasets = {}, report = {} } = {}, now = new Date()) {
    const pipeline = pipelineFreshness(manifest.generatedAt, now);
    const dashboard = buildStatusDashboard({ manifest, datasets, report, now });
    const sources = dashboard.rows;
    const observedModules = (manifest.modules || []).map(({ id }) => id);
    const complete = observedModules.length === moduleIds.length && moduleIds.every((id) => observedModules.includes(id));
    const ok = complete && pipeline.state === "current" && sources.length > 0
        && sources.every((source) => source.health === "healthy") && report.totals?.status === "ok";
    const generationOk = complete && pipeline.state === "current";
    const manualSources = sources.filter((source) => source.name.toLowerCase() === "manual");
    const automatedSources = sources.filter((source) => source.name.toLowerCase() !== "manual");
    return { ok, generationOk, manualSources, automatedSources, moduleCoverage: { complete, expected: moduleIds, observed: observedModules }, assessedAt: new Date(now).toISOString(), pipeline, reportStatus: dashboard.reportStatus, sources };
}

export async function readRefreshInput(siteUrl, options = {}) {
    // Fixed allowlist: do not follow paths supplied by a remote manifest.
    const entries = await Promise.all(dataFiles.map(async (file) => {
        const bytes = siteUrl ? await publishedBytes(siteUrl, file, options) : await readFile(file);
        return [file, JSON.parse(bytes.toString("utf8"))];
    }));
    const files = Object.fromEntries(entries);
    const validation = validateDataMap(files);
    if (validation.errors.length) throw new Error(`Published/local data contract failed: ${validation.errors.length} errors`);
    return {
        manifest: files["data/manifest.json"],
        report: files["data/refresh-report.json"],
        datasets: Object.fromEntries(moduleIds.map((id) => [id, files[`data/${id}.json`]]))
    };
}

async function main() {
    const index = process.argv.indexOf("--site-url");
    if (index >= 0 && !process.argv[index + 1]) throw new Error("--site-url requires a URL");
    const result = assessRefresh(await readRefreshInput(index >= 0 ? process.argv[index + 1] : null));
    console.log(JSON.stringify(result, null, 2));
    if (!(process.argv.includes("--generation-only") ? result.generationOk : result.ok)) process.exitCode = 1;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    main().catch((error) => { console.error(`Refresh check failed: ${error.message}`); process.exitCode = 1; });
}
