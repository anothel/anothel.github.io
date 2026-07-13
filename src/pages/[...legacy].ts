import { readFile } from "node:fs/promises";

const htmlFiles = [
    "404.html",
    "robots.txt",
    "sitemap.xml"
];

export function getStaticPaths() {
    return htmlFiles.map((legacy) => ({ params: { legacy } }));
}

export async function GET({ params }) {
    const html = await readFile(new URL(`../../../${params.legacy}`, import.meta.url), "utf8");
    const contentType = params.legacy.endsWith(".xml") ? "application/xml" : params.legacy.endsWith(".txt") ? "text/plain" : "text/html";
    return new Response(html, {
        headers: { "content-type": `${contentType}; charset=utf-8` }
    });
}
