import { createHash, randomUUID } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { pathToFileURL } from "node:url";
import { dataFiles } from "./data-contract.mjs";
import { publishedBytes } from "./published-http.mjs";

const paths = [...dataFiles, "status/"];
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");

export async function createExpectation(distRoot, sourceSha) {
    const files = Object.fromEntries(await Promise.all(paths.map(async (path) => [
        path, digest(await readFile(resolve(distRoot, path === "status/" ? "status/index.html" : path)))
    ])));
    const expectation = { version: 1, sourceSha, files };
    validateExpectation(expectation);
    return expectation;
}

function validateExpectation(expected) {
    if (expected?.version !== 1 || !/^[a-f0-9]{40}$/.test(expected.sourceSha || "")
        || !expected.files || Object.keys(expected.files).length !== paths.length
        || paths.some((path) => !/^[a-f0-9]{64}$/.test(expected.files[path] || ""))) {
        throw new Error("Invalid deployment expectation: require source SHA and every generated-data/Status hash");
    }
}

export async function verifyPublished(expected, siteUrl, { attempts = 12, delayMs = 10000, timeoutMs = 10000, onRetry = console.warn } = {}) {
    validateExpectation(expected);
    if (!Number.isInteger(attempts) || attempts < 1 || attempts > 12
        || !Number.isInteger(delayMs) || delayMs < 0 || delayMs > 10000
        || !Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 10000) {
        throw new Error("Invalid verification budget");
    }
    let failures = [];
    for (let attempt = 1; attempt <= attempts; attempt++) {
        const nonce = randomUUID();
        // A complete attempt must match. Never combine successes from different
        // attempts while an old and a new deployment are propagating.
        const results = await Promise.allSettled(paths.map(async (path) => {
            const bytes = await publishedBytes(siteUrl, path, { nonce, signal: AbortSignal.timeout(timeoutMs) });
            if (digest(bytes) !== expected.files[path]) throw new Error(`mismatch: ${path}`);
        }));
        failures = results.flatMap((result, index) => result.status === "rejected" ? [`${paths[index]}: ${result.reason.message}`] : []);
        if (!failures.length) return { sourceSha: expected.sourceSha, files: paths.length, attempt };
        if (attempt < attempts) {
            onRetry(`Published data not confirmed (attempt ${attempt}/${attempts}): ${failures.join("; ")}`);
            await delay(delayMs);
        }
    }
    throw new Error(`Published verification failed for source ${expected.sourceSha}: ${failures.join("; ")}`);
}

function arg(name, fallback) {
    const index = process.argv.indexOf(name);
    if (index < 0) return fallback;
    if (!process.argv[index + 1] || process.argv[index + 1].startsWith("--")) throw new Error(`${name} requires a value`);
    return process.argv[index + 1];
}
async function main() {
    const output = arg("--write-expectation");
    if (output) {
        const expectation = await createExpectation(arg("--dist", "dist"), arg("--source-sha"));
        await writeFile(output, `${JSON.stringify(expectation, null, 2)}\n`);
        console.log(`Recorded ${paths.length} files from source ${expectation.sourceSha}`);
        return;
    }
    const input = arg("--expectation");
    const siteUrl = arg("--site-url");
    if (!input || !siteUrl) throw new Error("Require --expectation and --site-url, or --write-expectation and --source-sha");
    const expected = JSON.parse(await readFile(input, "utf8"));
    const result = await verifyPublished(expected, siteUrl, { attempts: Number(arg("--attempts", "12")) });
    console.log(`Published identity verified: ${result.files} files, source ${result.sourceSha}, attempt ${result.attempt}. Freshness is a separate check.`);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    main().catch((error) => { console.error(error.message); process.exitCode = 1; });
}
