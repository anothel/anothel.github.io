import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const criticalRoutes = [
    "/", "/today/", "/explore/", "/review/", "/status/",
    "/topics/agent-skills/", "/topics/ai-agents/", "/topics/ai-engineering/",
    "/topics/ai-evals/", "/topics/mcp/", "/topics/security/", "/topics/workflow-automation/"
];
const controlNameRules = ["aria-command-name", "button-name", "input-button-name", "label", "link-name", "select-name"];
const summarize = (violations) => violations.map(({ id, impact, nodes }) => ({
    id,
    impact,
    targets: nodes.map(({ target }) => target.join(" "))
}));

test.describe("critical route accessibility", () => {
    test.beforeEach(({ }, testInfo) => test.skip(testInfo.project.name !== "desktop-chromium", "Run one deterministic accessibility pass."));

    for (const route of criticalRoutes) {
        test(`${route} has no serious accessibility failures`, async ({ page }) => {
            await page.goto(route);

            await expect(page).toHaveTitle(/\S/);
            await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
            await expect(page.getByRole("main")).toHaveCount(1);
            await expect(page.getByRole("navigation", { name: "Primary" })).toHaveCount(1);

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

    for (const route of criticalRoutes) {
        test(`${route} fits the mobile viewport`, async ({ page }) => {
            await page.goto(route);

            const layout = await page.evaluate(() => {
                const nav = document.querySelector(".primary-nav");
                const links = [...nav.querySelectorAll("a")];
                const centers = links.map((link) => {
                    const rect = link.getBoundingClientRect();
                    return rect.top + rect.height / 2;
                });
                const targets = [...document.querySelectorAll(".primary-nav a, main button, main input:not([type=hidden]), main select")]
                    .filter((element) => {
                        const style = getComputedStyle(element);
                        return style.display !== "none" && style.visibility !== "hidden";
                    })
                    .map((element) => {
                        const rect = element.getBoundingClientRect();
                        return { text: element.textContent?.trim() || element.getAttribute("aria-label") || element.tagName, width: rect.width, height: rect.height };
                    });
                const overflowingCardText = [...document.querySelectorAll("[data-signal-card], .explore-card, .review-card, .stat-card, .utility-card, .source-health-table tbody tr")]
                    .flatMap((card) => {
                        const cardRect = card.getBoundingClientRect();
                        return [...card.querySelectorAll("strong, em, small, p, li, dt, dd")]
                            .filter((element) => {
                                const rect = element.getBoundingClientRect();
                                const style = getComputedStyle(element);
                                return style.visibility !== "hidden" && rect.width > 0 && (rect.left < cardRect.left - 1 || rect.right > cardRect.right + 1);
                            })
                            .map((element) => element.textContent.trim());
                    });

                return {
                    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
                    navRows: new Set(centers.map((center) => Math.round(center))).size,
                    smallTargets: targets.filter(({ width, height }) => width < 24 || height < 24),
                    overflowingCardText
                };
            });

            expect(layout.overflow, `${route} has horizontal document overflow`).toBeLessThanOrEqual(1);
            expect(layout.navRows, `${route} primary navigation wrapped onto multiple rows`).toBe(1);
            expect(layout.smallTargets, `${route} has primary controls smaller than 24px`).toEqual([]);
            expect(layout.overflowingCardText, `${route} has card text outside its container`).toEqual([]);
        });
    }

    test("Today shows an actionable, contained card near the initial viewport", async ({ page }) => {
        await page.goto("/today/");

        const firstCard = page.locator("[data-signal-card]").first();
        await expect(firstCard).toBeVisible();
        await expect(firstCard.locator(".action-copy")).toContainText("Next action");
        const cardTop = await firstCard.evaluate((element) => element.getBoundingClientRect().top);
        expect(cardTop).toBeLessThan(844);

    });

    test("sticky navigation does not cover anchored or focused content", async ({ page }) => {
        await page.goto("/today/#start");
        const section = page.locator("#start");
        await expect(section).toBeVisible();

        const anchorPosition = await section.evaluate((element) => {
            const header = document.querySelector(".topbar").getBoundingClientRect();
            return { targetTop: element.getBoundingClientRect().top, headerBottom: header.bottom };
        });
        expect(anchorPosition.targetTop).toBeGreaterThanOrEqual(anchorPosition.headerBottom - 1);

        const lastCard = page.locator("[data-signal-card]").last();
        await lastCard.focus();
        const focusPosition = await lastCard.evaluate((element) => {
            const header = document.querySelector(".topbar").getBoundingClientRect();
            const rect = element.getBoundingClientRect();
            return { top: rect.top, bottom: rect.bottom, headerBottom: header.bottom, viewportHeight: innerHeight };
        });
        expect(focusPosition.top).toBeGreaterThanOrEqual(focusPosition.headerBottom - 1);
        expect(focusPosition.bottom).toBeLessThanOrEqual(focusPosition.viewportHeight + 1);
    });
});
