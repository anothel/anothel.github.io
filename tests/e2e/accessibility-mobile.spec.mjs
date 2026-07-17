import AxeBuilder from "@axe-core/playwright";
import { devices, expect, test } from "@playwright/test";

const routeCases = [
    { route: "/", current: "Home" },
    { route: "/today/", current: "Today" },
    { route: "/explore/", current: "Explore" },
    { route: "/review/", current: "Review" },
    { route: "/status/", current: "Status" },
    { route: "/trends/", current: "Trends" },
    { route: "/packages/", current: "Packages" },
    { route: "/repos/", current: "Repos" },
    { route: "/links/", current: "Reference shelf" },
    { route: "/notes/", current: "Notes" },
    { route: "/topics/agent-skills/", topic: "Agent skills" },
    { route: "/topics/ai-agents/", topic: "AI agents" },
    { route: "/topics/ai-engineering/", topic: "AI engineering" },
    { route: "/topics/ai-evals/", topic: "AI evals" },
    { route: "/topics/mcp/", topic: "MCP" },
    { route: "/topics/security/", topic: "Security" },
    { route: "/topics/workflow-automation/", topic: "Workflow automation" },
    { route: "/404.html", noNavigation: true }
];
const primaryLabels = ["Home", "Today", "Explore", "Review"];
const secondaryLabels = ["Status", "Trends", "Packages", "Repos", "Reference shelf", "Notes"];
const controlNameRules = ["aria-command-name", "button-name", "input-button-name", "label", "link-name", "select-name"];
const summarize = (violations) => violations.map(({ id, impact, nodes }) => ({
    id,
    impact,
    targets: nodes.map(({ target }) => target.join(" "))
}));

test.describe("route accessibility", () => {
    for (const { route, current, topic, noNavigation } of routeCases) {
        test(`${route} has no serious accessibility failures`, async ({ page }) => {
            await page.goto(route);

            await expect(page).toHaveTitle(/\S/);
            await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
            await expect(page.getByRole("main")).toHaveCount(1);
            await expect(page.locator("main#main-content[tabindex='-1']")).toHaveCount(1);
            const headingJumps = await page.locator("h1, h2, h3, h4, h5, h6").evaluateAll((headings) => headings
                .map((heading) => Number(heading.tagName.slice(1)))
                .filter((level, index, levels) => index > 0 && level > levels[index - 1] + 1));
            expect(headingJumps, `${route} skips a heading level`).toEqual([]);

            const primary = page.getByRole("navigation", { name: "Primary" });
            const secondary = page.getByRole("navigation", { name: "Secondary" });
            if (noNavigation) {
                await expect(primary).toHaveCount(0);
                await expect(secondary).toHaveCount(0);
            } else {
                await expect(primary).toHaveCount(1);
                await expect(secondary).toHaveCount(1);
                const currentLinks = page.locator(".primary-nav a[aria-current='page'], .secondary-nav a[aria-current='page']");
                if (current) {
                    await expect(currentLinks).toHaveCount(1);
                    await expect(currentLinks).toHaveText(current);
                } else {
                    await expect(currentLinks).toHaveCount(0);
                }
            }

            if (topic) {
                const breadcrumb = page.getByRole("navigation", { name: "Breadcrumb" });
                await expect(breadcrumb.getByRole("link", { name: "Notes" })).toHaveCount(1);
                await expect(breadcrumb.locator("[aria-current='page']")).toHaveText(topic);
            }

            await page.keyboard.press("Tab");
            await expect(page.locator(".skip-link")).toBeFocused();
            await expect(page.locator(".skip-link")).toHaveAttribute("href", "#main-content");
            await page.keyboard.press("Enter");
            await expect(page.locator("main#main-content")).toBeFocused();

            const scan = await new AxeBuilder({ page }).analyze();
            expect(summarize(scan.violations.filter(({ impact }) => impact === "serious" || impact === "critical"))).toEqual([]);
            expect(summarize(scan.violations.filter(({ id }) => controlNameRules.includes(id)))).toEqual([]);
        });
    }

    test("health and score states have text equivalents", async ({ page }) => {
        await page.goto("/status/");
        const healthLabels = page.locator(".health-label, .validation-label");
        expect(await healthLabels.count()).toBeGreaterThan(0);
        for (const label of await healthLabels.all()) {
            await expect(label).not.toHaveText(/^\s*$/);
        }

        await page.goto("/today/");
        const cards = page.locator("[data-signal-card]");
        expect(await cards.count()).toBeGreaterThan(0);
        for (const card of await cards.all()) {
            await expect(card.locator("em")).not.toHaveText(/^\s*$/);
            await expect(card.locator(".why-copy")).toContainText("Why now");
        }
    });
});

test.describe("mobile layout", () => {
    test.beforeEach(({ }, testInfo) => test.skip(testInfo.project.name !== "mobile-chromium", "Mobile viewport only."));

    for (const { route, noNavigation } of routeCases) {
        test(`${route} fits the mobile viewport`, async ({ page }) => {
            await page.goto(route);

            const layout = await page.evaluate(() => {
                const primary = document.querySelector(".primary-nav");
                const secondary = document.querySelector(".secondary-nav");
                const hero = document.querySelector(".hero-header");
                const primaryLinks = [...(primary?.querySelectorAll("a") || [])];
                const secondaryLinks = [...(secondary?.querySelectorAll("a") || [])];
                const visible = (element) => {
                    const style = getComputedStyle(element);
                    return style.display !== "none" && style.visibility !== "hidden";
                };
                const targets = [...document.querySelectorAll("main button, main input:not([type=hidden]), main select, main textarea")]
                    .filter(visible)
                    .map((element) => {
                        const rect = element.getBoundingClientRect();
                        return { text: element.textContent?.trim() || element.getAttribute("aria-label") || element.tagName, width: rect.width, height: rect.height };
                    });
                const overflowingCardText = [...document.querySelectorAll("[data-signal-card], .explore-card, .review-card, .topic-note-card, .stat-card, .utility-card, .source-health-table tbody tr")]
                    .flatMap((card) => {
                        const cardRect = card.getBoundingClientRect();
                        return [...card.querySelectorAll("h2, h3, strong, em, small, p, li, dt, dd")]
                            .filter((element) => {
                                const rect = element.getBoundingClientRect();
                                const style = getComputedStyle(element);
                                return style.visibility !== "hidden" && rect.width > 0 && (rect.left < cardRect.left - 1 || rect.right > cardRect.right + 1);
                            })
                            .map((element) => element.textContent.trim());
                    });

                return {
                    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
                    heroPosition: hero && getComputedStyle(hero).position,
                    primaryPosition: primary && getComputedStyle(primary).position,
                    secondaryPosition: secondary && getComputedStyle(secondary).position,
                    primaryHeight: primary?.getBoundingClientRect().height || 0,
                    heroHeight: hero?.getBoundingClientRect().height || 0,
                    h1Size: parseFloat(getComputedStyle(document.querySelector("h1")).fontSize),
                    h2Sizes: [...document.querySelectorAll("main h2")].filter(visible).map((heading) => parseFloat(getComputedStyle(heading).fontSize)),
                    h3Sizes: [...document.querySelectorAll("main h3")].filter(visible).map((heading) => parseFloat(getComputedStyle(heading).fontSize)),
                    textInputSizes: [...document.querySelectorAll("input:not([type=hidden]), textarea")].filter(visible).map((input) => parseFloat(getComputedStyle(input).fontSize)),
                    primaryLabels: primaryLinks.map((link) => link.textContent.trim()),
                    secondaryLabels: secondaryLinks.map((link) => link.textContent.trim()),
                    primaryRows: new Set(primaryLinks.map((link) => Math.round(link.getBoundingClientRect().top))).size,
                    primaryOverflow: primary ? primary.scrollWidth - primary.clientWidth : 0,
                    smallPrimaryTargets: primaryLinks.filter((link) => {
                        const rect = link.getBoundingClientRect();
                        return rect.width < 44 || rect.height < 44;
                    }).map((link) => link.textContent.trim()),
                    smallSecondaryTargets: secondaryLinks.filter((link) => {
                        const rect = link.getBoundingClientRect();
                        return rect.width < 24 || rect.height < 24;
                    }).map((link) => link.textContent.trim()),
                    smallContentTargets: targets.filter(({ width, height }) => width < 24 || height < 24),
                    overflowingCardText
                };
            });

            expect(layout.overflow, `${route} has horizontal document overflow`).toBeLessThanOrEqual(1);
            expect(layout.smallContentTargets, `${route} has content controls smaller than 24px`).toEqual([]);
            expect(layout.overflowingCardText, `${route} has card text outside its container`).toEqual([]);
            expect(layout.h1Size, `${route} mobile h1 size`).toBeGreaterThanOrEqual(28);
            expect(layout.h1Size, `${route} mobile h1 size`).toBeLessThanOrEqual(32);
            expect(layout.h2Sizes.every((size) => size >= 20 && size <= 24), `${route} mobile h2 sizes`).toBe(true);
            expect(layout.h3Sizes.every((size) => size <= 20), `${route} mobile h3 hierarchy`).toBe(true);
            expect(layout.textInputSizes.every((size) => size >= 16), `${route} mobile text input sizes`).toBe(true);
            if (route !== "/topics/workflow-automation/") {
                expect(layout.heroHeight, `${route} mobile hero height`).toBeLessThanOrEqual(112);
            }

            if (noNavigation) {
                expect(layout.primaryLabels).toEqual([]);
                expect(layout.secondaryLabels).toEqual([]);
                return;
            }

            expect(layout.primaryLabels).toEqual(primaryLabels);
            expect(layout.secondaryLabels).toEqual(secondaryLabels);
            expect(layout.primaryRows, `${route} primary navigation wrapped`).toBe(1);
            expect(layout.primaryOverflow, `${route} primary navigation scrolls horizontally`).toBeLessThanOrEqual(1);
            expect(layout.primaryHeight, `${route} primary rail height`).toBeGreaterThanOrEqual(44);
            expect(layout.primaryHeight, `${route} primary rail height`).toBeLessThanOrEqual(52);
            expect(layout.smallPrimaryTargets, `${route} primary links are smaller than 44px`).toEqual([]);
            expect(layout.smallSecondaryTargets, `${route} secondary links are smaller than 24px`).toEqual([]);
            expect(layout.primaryPosition).toBe("sticky");
            expect(["fixed", "sticky"]).not.toContain(layout.heroPosition);
            expect(["fixed", "sticky"]).not.toContain(layout.secondaryPosition);
        });
    }

    test("hero and secondary navigation scroll away while the primary rail stays", async ({ page }) => {
        await page.goto("/today/");
        const positions = await page.evaluate(async () => {
            scrollTo(0, document.documentElement.scrollHeight);
            await new Promise((resolve) => requestAnimationFrame(() => resolve()));
            const hero = document.querySelector(".hero-header").getBoundingClientRect();
            const primary = document.querySelector(".primary-nav").getBoundingClientRect();
            const secondary = document.querySelector(".secondary-nav").getBoundingClientRect();
            return { heroBottom: hero.bottom, primaryTop: primary.top, secondaryBottom: secondary.bottom };
        });

        expect(positions.heroBottom).toBeLessThanOrEqual(0);
        expect(positions.secondaryBottom).toBeLessThanOrEqual(0);
        expect(positions.primaryTop).toBeGreaterThanOrEqual(-1);
        expect(positions.primaryTop).toBeLessThanOrEqual(1);
    });

    test("Today shows an actionable, contained card near the initial viewport", async ({ page }) => {
        await page.goto("/today/");

        const firstCard = page.locator("[data-signal-card]").first();
        const trust = page.locator("[data-compact-trust]");
        await expect(firstCard).toBeVisible();
        await expect(trust).toBeVisible();
        await expect(trust.getByRole("link", { name: "View source evidence in Status" })).toHaveAttribute("href", "../status/index.html");
        await expect(firstCard.locator("h3[data-signal-title]")).toHaveCount(1);
        await expect(firstCard.locator(".action-copy")).toContainText("Next action");
        const cardTop = await firstCard.evaluate((element) => element.getBoundingClientRect().top);
        expect(cardTop).toBeLessThanOrEqual(330);
    });

    test("platform-sensitive mobile geometry keeps a safety margin", async ({ page }) => {
        for (const [route, title] of [
            ["/", "What is worth opening now?"],
            ["/trends/", "What is moving across HN, GitHub, and npm."],
            ["/topics/ai-engineering/", "AI engineering signals."]
        ]) {
            await page.goto(route);
            const heading = page.locator(".hero-header h1");
            await expect(heading).toHaveText(title);
            expect(await page.locator(".hero-header").evaluate((element) => element.getBoundingClientRect().height), `${route} hero safety margin`).toBeLessThanOrEqual(108);
        }

        await page.goto("/today/");
        expect(await page.locator("[data-signal-card]").first().evaluate((element) => element.getBoundingClientRect().top), "Today first card safety margin").toBeLessThanOrEqual(325);

        await page.goto("/topics/workflow-automation/");
        await expect(page.locator("[data-topic-pin-button]")).toBeEnabled();
        expect(await page.locator("[data-topic-actions] a").first().evaluate((element) => element.getBoundingClientRect().top), "Workflow automation Explore safety margin").toBeLessThanOrEqual(640);
    });

    test("source summaries contain enlarged Android text", async ({ browser }) => {
        test.setTimeout(60_000);
        const context = await browser.newContext({ ...devices["Pixel 7"], viewport: { width: 412, height: 844 } });
        const page = await context.newPage();
        const routes = [
            { path: "/links/", summary: ".source-summary", count: 4, columns: 2 },
            { path: "/trends/", summary: ".source-summary", count: 4, columns: 2 },
            { path: "/packages/", summary: ".source-summary", count: 4, columns: 2 },
            { path: "/repos/", summary: ".source-summary", count: 4, columns: 2 },
            { path: "/status/", summary: ".status-overall-facts", count: 4, columns: 2, status: true },
            { path: "/review/", summary: ".review-stats", count: 6, columns: 3 }
        ];

        try {
            for (const width of [360, 390, 412]) {
                await page.setViewportSize({ width, height: 844 });
                for (const route of routes) {
                    await page.goto(route.path);
                    await page.locator(route.summary).waitFor();
                    const textSelector = route.status ? `${route.summary} dt, ${route.summary} dd` : `${route.summary} .stat-card > span, ${route.summary} .stat-card > strong`;
                    const baseSizes = await page.locator(textSelector).evaluateAll((elements) => elements.map((element) => parseFloat(getComputedStyle(element).fontSize)));
                    for (const scale of [1, 1.25, 1.5, 2]) {
                        await page.locator(textSelector).evaluateAll((elements, values) => elements.forEach((element, index) => {
                            element.style.fontSize = `${values.baseSizes[index] * values.scale}px`;
                        }), { baseSizes, scale });
                        const layout = await page.evaluate(({ isStatus, summarySelector }) => {
                            const summary = document.querySelector(summarySelector);
                            const cards = [...summary.children];
                            const rect = (element) => element.getBoundingClientRect();
                            const textRect = (element) => {
                                const range = document.createRange();
                                range.selectNodeContents(element);
                                return range.getBoundingClientRect();
                            };
                            const overlaps = (a, b) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1
                                && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1;
                            const geometry = cards.map((card) => {
                                const box = rect(card);
                                const label = textRect(card.querySelector(isStatus ? "dt" : "span"));
                                const value = textRect(card.querySelector(isStatus ? "dd" : "strong"));
                                return {
                                    box,
                                    labelValueOverlap: overlaps(label, value),
                                    textOutside: [label, value].some((text) => text.left < box.left - 1 || text.right > box.right + 1 || text.top < box.top - 1 || text.bottom > box.bottom + 1),
                                    contentOverflow: card.scrollWidth - card.clientWidth > 1 || card.scrollHeight - card.clientHeight > 1
                                };
                            });
                            return {
                                itemCount: cards.length,
                                columns: new Set(geometry.map(({ box }) => Math.round(box.left))).size,
                                rows: new Set(geometry.map(({ box }) => Math.round(box.top))).size,
                                labelValueOverlap: geometry.some((item) => item.labelValueOverlap),
                                textOutside: geometry.some((item) => item.textOutside),
                                contentOverflow: geometry.some((item) => item.contentOverflow),
                                cardOverlap: geometry.some(({ box }, index) => geometry.slice(index + 1).some((other) => overlaps(box, other.box))),
                                documentOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
                            };
                        }, { isStatus: route.status, summarySelector: route.summary });
                        const caseLabel = `${route.path} ${width}px ${scale * 100}% text`;
                        expect(layout.itemCount, caseLabel).toBe(route.count);
                        expect(layout.columns, caseLabel).toBe(route.columns);
                        expect(layout.rows, caseLabel).toBe(Math.ceil(route.count / route.columns));
                        expect(layout.labelValueOverlap, caseLabel).toBe(false);
                        expect(layout.textOutside, caseLabel).toBe(false);
                        expect(layout.contentOverflow, caseLabel).toBe(false);
                        expect(layout.cardOverlap, caseLabel).toBe(false);
                        expect(layout.documentOverflow, caseLabel).toBe(0);
                    }
                }
            }
        } finally {
            await context.close();
        }
    });

    test("Home exposes its first signal, saved values, then trust handoff", async ({ page }) => {
        await page.goto("/");
        const layout = await page.evaluate(() => {
            const top = (selector) => document.querySelector(selector).getBoundingClientRect().top;
            const bottom = (selector) => document.querySelector(selector).getBoundingClientRect().bottom;
            return {
                cardTop: top("[data-signal-card]"),
                savedValuesBottom: bottom(".home-saved-facts"),
                savedTop: top("[data-home-review-summary]"),
                trustTop: top("[data-compact-trust]"),
                secondaryTop: top(".home-module-section")
            };
        });
        expect(layout.cardTop).toBeLessThanOrEqual(450);
        expect(layout.savedValuesBottom).toBeLessThanOrEqual(844);
        expect(layout.savedTop).toBeGreaterThan(layout.cardTop);
        expect(layout.trustTop).toBeGreaterThan(layout.savedTop);
        expect(layout.trustTop).toBeLessThan(layout.secondaryTop);
        await expect(page.getByRole("link", { name: "View source evidence in Status" })).toHaveAttribute("href", "status/index.html");
    });

    test("Status leads with a compact summary and complete source evidence", async ({ page }) => {
        await page.goto("/status/");
        const columns = await page.locator(".status-overall-facts").evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(" ").length);
        expect(columns).toBe(2);
        const positions = await page.evaluate(() => ({
            summary: document.querySelector("[data-status-overall]").getBoundingClientRect().top + scrollY,
            firstSource: document.querySelector("[data-status-source-row]").getBoundingClientRect().top + scrollY
        }));
        expect(positions.summary).toBeLessThanOrEqual(400);
        expect(positions.firstSource).toBeLessThanOrEqual(700);
    });
});

test.describe("sticky offset", () => {
    test("anchors and focused content clear the primary rail", async ({ page }) => {
        await page.goto("/today/#start");
        const section = page.locator("#start");
        await expect(section).toBeVisible();

        const anchorPosition = await section.evaluate((element) => {
            const rail = document.querySelector(".primary-nav").getBoundingClientRect();
            return { targetTop: element.getBoundingClientRect().top, railBottom: rail.bottom };
        });
        expect(anchorPosition.targetTop).toBeGreaterThanOrEqual(anchorPosition.railBottom + 7);

        const lastCard = page.locator("[data-signal-card]").last();
        await lastCard.focus();
        const focusPosition = await lastCard.evaluate((element) => {
            const rail = document.querySelector(".primary-nav").getBoundingClientRect();
            const rect = element.getBoundingClientRect();
            return { top: rect.top, bottom: rect.bottom, railBottom: rail.bottom, viewportHeight: innerHeight };
        });
        expect(focusPosition.top).toBeGreaterThanOrEqual(focusPosition.railBottom + 7);
        expect(focusPosition.bottom).toBeLessThanOrEqual(focusPosition.viewportHeight + 1);
    });
});
