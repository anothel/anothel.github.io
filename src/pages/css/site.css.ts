import { readFile } from "node:fs/promises";

export async function GET() {
    const css = await readFile(new URL("../../../css/site.css", import.meta.url), "utf8");
    return new Response(css, {
        headers: { "content-type": "text/css; charset=utf-8" }
    });
}
