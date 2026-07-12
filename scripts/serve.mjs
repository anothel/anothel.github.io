import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync, statSync } from "node:fs";
import { extname, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";

const DEFAULT_PORT = 58117;
const MIME_TYPES = new Map([
    [".html", "text/html; charset=utf-8"],
    [".css", "text/css; charset=utf-8"],
    [".js", "text/javascript; charset=utf-8"],
    [".json", "application/json; charset=utf-8"],
    [".xml", "application/xml; charset=utf-8"],
    [".txt", "text/plain; charset=utf-8"]
]);

function isInsideRoot(filePath, root) {
    const normalizedRoot = resolve(root);
    return filePath === normalizedRoot || filePath.startsWith(`${normalizedRoot}${sep}`);
}

export function resolveStaticPath(pathname, root = resolve(process.cwd(), "dist")) {
    const decoded = decodeURIComponent(pathname);
    const withIndex = decoded === "/" || decoded.endsWith("/")
        ? `${decoded}index.html`
        : decoded;
    const candidate = resolve(root, `.${withIndex}`);

    if (!isInsideRoot(candidate, root)) {
        return null;
    }

    if (existsSync(candidate) && statSync(candidate).isFile()) {
        return candidate;
    }

    const indexCandidate = resolve(root, `.${decoded}/index.html`);
    if (isInsideRoot(indexCandidate, root) && existsSync(indexCandidate) && statSync(indexCandidate).isFile()) {
        return indexCandidate;
    }

    return candidate;
}

async function handleRequest(request, response, root) {
    const url = new URL(request.url, "http://127.0.0.1");
    const filePath = resolveStaticPath(url.pathname, root);

    if (!filePath) {
        response.writeHead(403, { "content-type": "text/plain; charset=utf-8" });
        response.end("Forbidden");
        return;
    }

    try {
        const body = await readFile(filePath);
        response.writeHead(200, {
            "content-type": MIME_TYPES.get(extname(filePath)) || "application/octet-stream"
        });
        response.end(body);
    } catch {
        const fallback = resolve(root, "404.html");
        const body = await readFile(fallback);
        response.writeHead(404, { "content-type": "text/html; charset=utf-8" });
        response.end(body);
    }
}

export function createStaticServer(root = resolve(process.cwd(), "dist")) {
    return createServer((request, response) => {
        handleRequest(request, response, root);
    });
}

async function main() {
    const port = Number(process.argv[2] || DEFAULT_PORT);
    const server = createStaticServer();

    server.listen(port, "127.0.0.1", () => {
        console.log(`Serving http://127.0.0.1:${port}/`);
    });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    await main();
}
