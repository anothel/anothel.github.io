import { topicByLabel, topicPageLabels } from "./topic-taxonomy.js";

export const siteOrigin = "https://anothel.github.io";

// Routes not marked dataDriven keep their published lastmod until page content changes.
export const siteRoutes = [
    { label: "Home", path: "/", nav: "primary", dataDriven: true },
    { label: "Today", path: "/today/", nav: "primary", dataDriven: true },
    { label: "Explore", path: "/explore/", nav: "primary", dataDriven: true },
    { label: "Review", path: "/review/", nav: "primary", lastmod: "2026-06-20" },
    { label: "Status", path: "/status/", nav: "secondary", dataDriven: true },
    { label: "Trends", path: "/trends/", nav: "secondary", dataDriven: true },
    { label: "Packages", path: "/packages/", nav: "secondary", dataDriven: true },
    { label: "Repos", path: "/repos/", nav: "secondary", dataDriven: true },
    { label: "Reference shelf", path: "/links/", nav: "secondary", dataDriven: true },
    { label: "Notes", path: "/notes/", nav: "secondary", lastmod: "2026-06-25" }
];

export const publicRoutes = [
    ...siteRoutes,
    ...topicPageLabels.map((label) => ({
        label,
        path: `/${topicByLabel(label).routePath.replace(/index\.html$/, "")}`,
        dataDriven: true
    }))
];

export const routeFile = (path) => path === "/" ? "index.html" : `${path.slice(1)}index.html`;

export function sitemapEntries(updated) {
    return publicRoutes.map((route) => ({
        path: route.path,
        lastmod: route.dataDriven ? updated : route.lastmod
    }));
}
