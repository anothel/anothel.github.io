import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const islandRouteNames = ["explore", "review"];

function assetPath(root, url) {
    const path = resolve(root, decodeURIComponent(String(url).split(/[?#]/)[0]).replace(/^\/+/, ""));
    const fromRoot = relative(resolve(root), path);
    if (fromRoot.startsWith("..") || isAbsolute(fromRoot)) throw new Error(`asset escapes dist: ${url}`);
    if (!existsSync(path)) throw new Error(`referenced asset is missing: ${url}`);
    return path;
}

function attribute(html, name, route) {
    const value = html.match(new RegExp(`${name}="([^"]+)"`))?.[1];
    if (!value) throw new Error(`${route} HTML is missing ${name}`);
    return value;
}

function importedJavaScript(entryFiles) {
    const files = new Set();
    const queue = [...entryFiles];
    while (queue.length) {
        const file = queue.pop();
        if (files.has(file)) continue;
        files.add(file);
        const source = readFileSync(file, "utf8");
        for (const match of source.matchAll(/(?:\bfrom\s*|\bimport\s*(?:\(\s*)?)["'](\.{1,2}\/[^"']+\.js(?:[?#][^"']*)?)["']/g)) {
            const imported = resolve(dirname(file), match[1].split(/[?#]/)[0]);
            if (!existsSync(imported)) throw new Error(`referenced JavaScript is missing: ${match[1]} from ${file}`);
            queue.push(imported);
        }
    }
    return [...files];
}

function moduleScriptUrls(html) {
    return [...html.matchAll(/<script\b[^>]*>/gi)]
        .map(([tag]) => ({
            type: tag.match(/\btype=["']([^"']+)["']/i)?.[1],
            src: tag.match(/\bsrc=["']([^"']+)["']/i)?.[1]
        }))
        .filter(({ type, src }) => type === "module" && src)
        .map(({ src }) => src);
}

export function measureAssetSizes(root = resolve(process.cwd(), "dist")) {
    if (!existsSync(root)) throw new Error(`dist directory is missing: ${root}`);
    const homeHtmlFile = resolve(root, "index.html");
    const homeHtml = readFileSync(homeHtmlFile, "utf8");
    const homeEntries = [...new Set(moduleScriptUrls(homeHtml).map((url) => assetPath(root, url)))];
    if (homeEntries.length === 0) throw new Error("home HTML is missing a bundled module script");
    const homeJsFiles = importedJavaScript(homeEntries);
    const routes = {
        home: {
            html: statSync(homeHtmlFile).size,
            htmlAsset: relative(root, homeHtmlFile).replaceAll("\\", "/"),
            routeJs: homeEntries.reduce((sum, file) => sum + statSync(file).size, 0),
            routeAssets: homeEntries.map((file) => relative(root, file).replaceAll("\\", "/")).sort(),
            totalJs: homeJsFiles.reduce((sum, file) => sum + statSync(file).size, 0),
            jsAssets: homeJsFiles.map((file) => relative(root, file).replaceAll("\\", "/")).sort()
        },
        ...Object.fromEntries(islandRouteNames.map((route) => {
            const htmlFile = resolve(root, route, "index.html");
            const html = readFileSync(htmlFile, "utf8");
            const island = assetPath(root, attribute(html, "component-url", route));
            const client = assetPath(root, attribute(html, "renderer-url", route));
            const jsFiles = importedJavaScript([island, client]);
            return [route, {
                html: statSync(htmlFile).size,
                htmlAsset: relative(root, htmlFile).replaceAll("\\", "/"),
                islandJs: statSync(island).size,
                islandAsset: relative(root, island).replaceAll("\\", "/"),
                clientJs: statSync(client).size,
                clientAsset: relative(root, client).replaceAll("\\", "/"),
                totalJs: jsFiles.reduce((sum, file) => sum + statSync(file).size, 0),
                jsAssets: jsFiles.map((file) => relative(root, file).replaceAll("\\", "/")).sort()
            }];
        }))
    };
    return { routes, sharedReactClientJs: Math.max(...islandRouteNames.map((route) => routes[route].clientJs)) };
}

export function assertSizeBudgets(actual, budgets) {
    const checks = [
        ["home HTML", actual.routes.home.htmlAsset, actual.routes.home.html, budgets.home.html],
        ["home route JS", actual.routes.home.routeAssets.join(", "), actual.routes.home.routeJs, budgets.home.routeJs],
        ["home total referenced JS", actual.routes.home.jsAssets.join(", "), actual.routes.home.totalJs, budgets.home.totalJs]
    ].concat(islandRouteNames.flatMap((route) => [
        [`${route} HTML`, actual.routes[route].htmlAsset, actual.routes[route].html, budgets[route].html],
        [`${route} island JS`, actual.routes[route].islandAsset, actual.routes[route].islandJs, budgets[route].islandJs],
        [`${route} total referenced JS`, actual.routes[route].jsAssets.join(", "), actual.routes[route].totalJs, budgets[route].totalJs]
    ])).concat([["shared React client JS", actual.routes.explore.clientAsset, actual.sharedReactClientJs, budgets.sharedReactClientJs]]);
    const failures = checks.filter(([, , size, budget]) => size > budget)
        .map(([label, asset, size, budget]) => `${label} (${asset}): ${size} bytes exceeds ${budget} bytes`);
    if (failures.length) throw new Error(`asset size check failed:\n${failures.join("\n")}`);
    return checks.map(([label, asset, size, budget]) => `${label} (${asset}): ${size}/${budget} bytes`);
}

export function checkSize(root = resolve(process.cwd(), "dist"), budgetFile = resolve(process.cwd(), "asset-size-budgets.json")) {
    const budgets = JSON.parse(readFileSync(budgetFile, "utf8"));
    const actual = measureAssetSizes(root);
    return { actual, lines: assertSizeBudgets(actual, budgets), measurement: budgets.measurement };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    try {
        const result = checkSize();
        console.log(`asset size check passed (${result.measurement})`);
        result.lines.forEach((line) => console.log(line));
    } catch (error) {
        console.error(error.message);
        process.exitCode = 1;
    }
}
