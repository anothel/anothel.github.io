import { spawn } from "node:child_process";
import { pathToFileURL } from "node:url";

export const dataUpdateScripts = [
    "scripts/update-trends.mjs",
    "scripts/update-packages.mjs",
    "scripts/update-repos.mjs",
    "scripts/update-links.mjs",
    "scripts/update-today.mjs",
    "scripts/update-manifest.mjs",
    "scripts/update-static-fallbacks.mjs",
    "scripts/report-refresh.mjs"
];

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

            reject(new Error(`${args[0] ?? command} failed with exit code ${code}`));
        });
    });
}

function isGitHubActions(env) {
    return env.GITHUB_ACTIONS === "true";
}

function exitStatus(error) {
    const match = /exit code (\d+)/.exec(error.message);
    return match ? match[1] : "1";
}

export async function runUpdateAll(runner = runCommand, options = {}) {
    const env = options.env ?? process.env;
    const groupedLogs = isGitHubActions(env);

    for (const script of dataUpdateScripts) {
        if (groupedLogs) {
            console.log(`::group::${script}`);
        }

        try {
            const args = script === "scripts/report-refresh.mjs"
                ? [script, "--json-out", "data/refresh-report.json"]
                : [script];
            await runner(process.execPath, args, { env });
            if (groupedLogs) {
                console.log("::endgroup::");
            }
        } catch (error) {
            const status = exitStatus(error);

            if (groupedLogs) {
                console.log("::endgroup::");
                console.error(`::error::${script} failed with exit code ${status}`);
            }

            throw error;
        }
    }
}

async function main() {
    if (process.argv.includes("--list")) {
        console.log(dataUpdateScripts.join("\n"));
        return;
    }

    if (process.argv.includes("--dry-run")) {
        for (const script of dataUpdateScripts) {
            console.log(`node ${script}`);
        }
        return;
    }

    await runUpdateAll();
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    await main();
}
