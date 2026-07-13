import manifest from "../../data/manifest.json";
import { siteOrigin, sitemapEntries } from "../lib/site-routes.js";

export function GET() {
    const urls = sitemapEntries(manifest.updated)
        .map(({ path, lastmod }) => `    <url>\n        <loc>${siteOrigin}${path}</loc>\n        <lastmod>${lastmod}</lastmod>\n    </url>`)
        .join("\n");
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;

    return new Response(xml, {
        headers: { "content-type": "application/xml; charset=utf-8" }
    });
}
