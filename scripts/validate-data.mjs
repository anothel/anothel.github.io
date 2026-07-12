import { spawn } from "node:child_process";
import { readdir } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { dataFiles, printDiagnostics, validateDataFiles } from "./data-contract.mjs";

export const checkTargets = [
    "scripts/update-all.mjs",
    "scripts/check-docs.mjs",
    "scripts/check-dist.mjs",
    "scripts/data-contract.mjs",
    "scripts/validate-data.mjs",
    "scripts/signal-taxonomy.mjs",
    "scripts/watchlist-governance.mjs",
    "scripts/update-trends.mjs",
    "scripts/update-packages.mjs",
    "scripts/update-repos.mjs",
    "scripts/update-links.mjs",
    "scripts/update-today.mjs",
    "scripts/update-manifest.mjs",
    "scripts/update-static-fallbacks.mjs",
    "scripts/report-refresh.mjs",
    "scripts/serve.mjs",
    "js/dashboard.js",
    "js/home.mjs",
    "js/status.mjs",
    "js/today.mjs",
    "js/package-watchlist.js",
    "js/repo-watchlist.js",
    "js/link-queue.js",
    "js/explore.js",
    "js/topics.js",
    "js/topic-taxonomy.js",
    "js/signal-schema.js",
    "js/data-health.js"
];

export async function listTestFiles() {
    const files = await readdir(new URL("../tests/", import.meta.url));

    return files
        .filter((file) => file.endsWith(".test.mjs"))
        .sort()
        .map((file) => `tests/${file}`);
}

export function runCommand(command, args, options = {}) {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, {
            stdio: "inherit",
            env: process.env,
            ...options
        });

        child.on("error", reject);
        child.on("close", (code) => {
            if (code === 0) {
                resolve();
                return;
            }

            reject(new Error(`${options.label ?? args.join(" ")} failed with exit code ${code}`));
        });
    });
}

export async function runValidation(runner = runCommand, options = {}) {
    const testFiles = await listTestFiles();
    if (!options.skipData) {
        const dataResult = await validateDataFiles();

        printDiagnostics(dataResult);
        if (dataResult.errors.length > 0) {
            throw new Error(`data validation failed with ${dataResult.errors.length} error(s)`);
        }
    }

    await runner(process.execPath, ["--test", ...testFiles], { label: "tests" });

    for (const target of checkTargets) {
        await runner(process.execPath, ["--check", target], { label: target });
    }
}

async function main() {
    if (process.argv.includes("--data-only")) {
        const dataResult = await validateDataFiles();
        printDiagnostics(dataResult);
        if (dataResult.errors.length > 0) process.exitCode = 1;
        return;
    }

    if (process.argv.includes("--list")) {
        const testFiles = await listTestFiles();
        console.log(["# data", ...dataFiles, "# tests", ...testFiles, "# syntax", ...checkTargets].join("\n"));
        return;
    }

    await runValidation(runCommand, { skipData: process.argv.includes("--skip-data") });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    await main();
}
