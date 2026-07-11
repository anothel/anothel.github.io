import { readFile } from "node:fs/promises";

const htmlFiles = [
    "404.html",
    "robots.txt",
    "sitemap.xml",
    "notes/index.html",
    "topics/agent-skills/index.html",
    "topics/ai-agents/index.html",
    "topics/ai-engineering/index.html",
    "topics/ai-evals/index.html",
    "topics/mcp/index.html",
    "topics/security/index.html",
    "topics/workflow-automation/index.html"
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
