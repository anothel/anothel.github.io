import { readFile } from "node:fs/promises";

const files = [
    "links",
    "manifest",
    "packages",
    "refresh-report",
    "repos",
    "signal-policy",
    "today",
    "trends",
    "watchlists"
];

export function getStaticPaths() {
    return files.map((file) => ({ params: { file } }));
}

export async function GET({ params }) {
    const json = await readFile(new URL(`../../../data/${params.file}.json`, import.meta.url), "utf8");
    return new Response(json, {
        headers: { "content-type": "application/json; charset=utf-8" }
    });
}
