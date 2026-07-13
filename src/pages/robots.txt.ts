import { siteOrigin } from "../lib/site-routes.js";

export function GET() {
    return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${siteOrigin}/sitemap.xml\n`, {
        headers: { "content-type": "text/plain; charset=utf-8" }
    });
}
