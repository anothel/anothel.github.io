import { readFile } from "node:fs/promises";

const files = ["home", "status", "today"];

export function getStaticPaths() {
    return files.map((file) => ({ params: { file } }));
}

export async function GET({ params }) {
    const js = await readFile(new URL(`../../../js/${params.file}.mjs`, import.meta.url), "utf8");
    return new Response(js, {
        headers: { "content-type": "text/javascript; charset=utf-8" }
    });
}
