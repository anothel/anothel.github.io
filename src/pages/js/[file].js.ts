import { readFile } from "node:fs/promises";

const files = [
    "dashboard",
    "data-health",
    "link-queue",
    "local-state",
    "notes",
    "package-watchlist",
    "repo-watchlist",
    "safe-dom",
    "signal-schema",
    "topic-taxonomy",
    "topics"
];

export function getStaticPaths() {
    return files.map((file) => ({ params: { file } }));
}

export async function GET({ params }) {
    const js = await readFile(new URL(`../../../js/${params.file}.js`, import.meta.url), "utf8");
    return new Response(js, {
        headers: { "content-type": "text/javascript; charset=utf-8" }
    });
}
