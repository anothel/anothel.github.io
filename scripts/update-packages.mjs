import { writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const OUT_FILE = new URL("../data/packages.json", import.meta.url);
const USER_AGENT = "anothel.github.io package watchlist";

export const packageDefinitions = [
    { name: "react", category: "UI", focus: "frontend runtime" },
    { name: "typescript", category: "Language", focus: "typed JavaScript" },
    { name: "vite", category: "Tooling", focus: "build tool" },
    { name: "next", category: "Framework", focus: "React framework" },
    { name: "zod", category: "Validation", focus: "schema validation" },
    { name: "playwright", category: "Testing", focus: "browser automation" },
    { name: "eslint", category: "Tooling", focus: "linting" },
    { name: "prettier", category: "Tooling", focus: "formatting" }
];

function isoDate(date = new Date()) {
    return date.toISOString().slice(0, 10);
}

function compactNumber(value) {
    return Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

async function fetchJson(url) {
    const response = await fetch(url, {
        headers: {
            "User-Agent": USER_AGENT,
            Accept: "application/json"
        }
    });

    if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}: ${url}`);
    }

    return response.json();
}

export function buildPackageRows(downloadRecords, definitions = packageDefinitions) {
    const definitionByName = new Map(definitions.map((item) => [item.name, item]));

    return downloadRecords
        .filter((item) => definitionByName.has(item.package))
        .sort((a, b) => b.downloads - a.downloads)
        .map((item, index) => {
            const definition = definitionByName.get(item.package);
            return {
                rank: index + 1,
                name: item.package,
                category: definition.category,
                focus: definition.focus,
                downloads: item.downloads,
                downloadsLabel: `${compactNumber(item.downloads)}/week`,
                period: `${item.start} to ${item.end}`,
                url: `https://www.npmjs.com/package/${encodeURIComponent(item.package)}`
            };
        });
}

export async function collectPackages() {
    const names = packageDefinitions.map((item) => item.name).join(",");
    const data = await fetchJson(`https://api.npmjs.org/downloads/point/last-week/${names}`);
    const packages = buildPackageRows(Object.values(data));
    const generatedAt = new Date().toISOString();

    return {
        updated: isoDate(),
        generatedAt,
        sourceMeta: {
            name: "npm",
            status: "ok",
            count: packages.length,
            updatedAt: generatedAt
        },
        packages
    };
}

async function main() {
    const data = await collectPackages();
    const output = `${JSON.stringify(data, null, 2)}\n`;

    if (process.argv.includes("--stdout")) {
        console.log(output);
    } else {
        await writeFile(OUT_FILE, output, "utf8");
        console.log(`Wrote ${data.packages.length} package rows to data/packages.json`);
    }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    await main();
}
