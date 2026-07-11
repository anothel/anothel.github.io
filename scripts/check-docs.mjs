import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const repositoryPrefixes = [".github/", "data/", "docs/", "js/", "scripts/", "src/", "tests/"];
const npmBuiltins = new Set(["ci", "install"]);
const obsoletePatterns = [
    [/Astro static output is approved for future route\/layout migration/i, "replace future-migration wording with current Astro architecture"],
    [/ships as plain HTML, CSS, JavaScript/i, "describe Astro static output instead of the deleted vanilla-only architecture"],
    [/site now uses plain HTML and CSS/i, "describe Astro components and generated static output"],
    [/^### P\d - Astro Static Build Scaffold$/m, "remove the completed Astro scaffold from active roadmap work"],
    [/\b(?:public\/index\.html|src\/main\.(?:js|jsx|ts|tsx)|src\/App\.jsx|_site\/)\b/i, "remove the obsolete entry point or build output"]
];
const requiredArchitecture = [
    [/Astro static site/i, "state that the project is an Astro static site"],
    [/Astro owns primary route generation and shared page structure/i, "state that Astro owns routes and shared components"],
    [/React is used only where browser-local interaction warrants hydration/i, "limit React to selected islands"],
    [/Reject a full React SPA|Do not[^.]*full React SPA/is, "state that the application is not a full React SPA"],
    [/data\/\*\.json[^.]*source contract/is, "identify data/*.json as the source contract"],
    [/GitHub Pages/is, "name GitHub Pages as the deployment target"],
    [/No backend[^.]*database[^.]*account\/login[^.]*cloud sync/is, "preserve backend/database/account/sync constraints"],
    [/localStorage compatibility/is, "preserve browser-local Review compatibility"]
];

function markdownFiles(root) {
    const files = readdirSync(root, { withFileTypes: true })
        .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
        .map((entry) => resolve(root, entry.name));
    const docs = resolve(root, "docs");

    function walk(directory) {
        if (!existsSync(directory)) return;
        for (const entry of readdirSync(directory, { withFileTypes: true })) {
            if (entry.name === "superpowers" || entry.name.startsWith(".")) continue;
            const path = resolve(directory, entry.name);
            if (entry.isDirectory()) walk(path);
            else if (entry.isFile() && entry.name.endsWith(".md")) files.push(path);
        }
    }

    walk(docs);
    return files.sort();
}

function issue(root, file, line, message) {
    return `${relative(root, file).replaceAll("\\", "/")}:${line}: ${message}`;
}

function internalTarget(raw) {
    const value = raw.replace(/^<|>$/g, "");
    if (!value || value.startsWith("#") || value.startsWith("/") || value.startsWith("//") || /^[a-z][a-z\d+.-]*:/i.test(value)) return null;
    return decodeURIComponent(value.split("#")[0].split("?")[0]);
}

function checkMarkdownFile(root, file, scripts, issues) {
    const content = readFileSync(file, "utf8");
    const lines = content.split(/\r?\n/);
    let fenced = false;

    lines.forEach((line, index) => {
        const lineNumber = index + 1;
        if (/^\s*```/.test(line)) {
            fenced = !fenced;
            return;
        }

        if (!fenced) {
            const linkTargets = [
                ...[...line.matchAll(/!?\[[^\]]*\]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/g)].map((match) => match[1]),
                ...[...line.matchAll(/^\s*\[[^\]]+\]:\s*(\S+)/g)].map((match) => match[1])
            ];

            for (const raw of linkTargets) {
                const target = internalTarget(raw);
                if (!target) continue;
                const path = resolve(dirname(file), target);
                const outside = relative(root, path).startsWith("..");
                if (outside || !existsSync(path)) issues.push(issue(root, file, lineNumber, `broken relative link: ${raw}`));
            }

        }

        const code = fenced ? [line] : [...line.matchAll(/`([^`\n]+)`/g)].map((match) => match[1]);
        for (const segment of code) {
            for (const token of segment.split(/\s+/)) {
                const path = token.replace(/^["'($]+|["'),.;:]+$/g, "").replaceAll("\\", "/");
                if (!repositoryPrefixes.some((prefix) => path.startsWith(prefix)) || /[*?<>]/.test(path)) continue;
                if (!existsSync(resolve(root, path))) issues.push(issue(root, file, lineNumber, `missing repository path: ${path}`));
            }
        }

        if (!/\b(?:no|not|doesn't|does not|isn't|is not)\b/i.test(line)) {
            for (const command of code) {
                for (const match of command.matchAll(/\bnpm(?:\.cmd)?\s+(?:(run)\s+)?([a-zA-Z\d:_-]+)/g)) {
                    const name = match[2];
                    if (!match[1] && npmBuiltins.has(name)) continue;
                    if (!Object.hasOwn(scripts, name)) issues.push(issue(root, file, lineNumber, `documented npm script does not exist: ${name}`));
                }
            }
        }
    });

    if (file === resolve(root, "CHANGELOG.md")) return;
    for (const [pattern, message] of obsoletePatterns) {
        const match = pattern.exec(content);
        if (!match) continue;
        const line = content.slice(0, match.index).split(/\r?\n/).length;
        issues.push(issue(root, file, line, message));
    }
}

export function checkDocs(root = process.cwd()) {
    const manifestPath = resolve(root, "package.json");
    const issues = [];
    if (!existsSync(manifestPath)) return ["package.json:1: missing package manifest"];
    const scripts = JSON.parse(readFileSync(manifestPath, "utf8")).scripts || {};

    for (const file of markdownFiles(root)) checkMarkdownFile(root, file, scripts, issues);

    const architecture = resolve(root, "docs/ARCHITECTURE.md");
    if (!existsSync(architecture)) {
        issues.push("docs/ARCHITECTURE.md:1: missing canonical architecture document");
    } else {
        const content = readFileSync(architecture, "utf8");
        for (const [pattern, message] of requiredArchitecture) {
            if (!pattern.test(content)) issues.push(`docs/ARCHITECTURE.md:1: missing required architecture statement: ${message}`);
        }
    }

    return issues;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    const issues = checkDocs();
    if (issues.length > 0) {
        console.error(issues.join("\n"));
        console.error(`documentation check failed: ${issues.length} issue(s)`);
        process.exitCode = 1;
    } else {
        console.log("documentation check passed");
    }
}
