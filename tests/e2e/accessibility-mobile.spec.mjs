import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

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
                const targets = [...document.querySelectorAll("main button, main input:not([type=hidden]), main select, main textarea")]
                    .filter((element) => {
                        const style = getComputedStyle(element);
                        return style.display !== "none" && style.visibility !== "hidden";
                    })
                    .map((element) => {
                        const rect = element.getBoundingClientRect();
                        return { text: element.textContent?.trim() || element.getAttribute("aria-label") || element.tagName, width: rect.width, height: rect.height };
                    });
                const overflowingCardText = [...document.querySelectorAll("[data-signal-card], .explore-card, .review-card, .topic-note-card, .stat-card, .utility-card, .source-health-table tbody tr")]
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
                    heroPosition: hero && getComputedStyle(hero).position,
                    primaryPosition: primary && getComputedStyle(primary).position,
                    secondaryPosition: secondary && getComputedStyle(secondary).position,
                    primaryHeight: primary?.getBoundingClientRect().height || 0,
                    primaryLabels: primaryLinks.map((link) => link.textContent.trim()),
                    secondaryLabels: [...(secondary?.querySelectorAll("a") || [])].map((link) => link.textContent.trim()),
                    primaryRows: new Set(primaryLinks.map((link) => Math.round(link.getBoundingClientRect().top))).size,
                    primaryOverflow: primary ? primary.scrollWidth - primary.clientWidth : 0,
                    smallPrimaryTargets: primaryLinks.filter((link) => {
                        const rect = link.getBoundingClientRect();
                        return rect.width < 44 || rect.height < 44;
                    }).map((link) => link.textContent.trim()),
                    smallContentTargets: targets.filter(({ width, height }) => width < 24 || height < 24),
                    overflowingCardText
                };
            });

            expect(layout.overflow, `${route} has horizontal document overflow`).toBeLessThanOrEqual(1);
            expect(layout.smallContentTargets, `${route} has content controls smaller than 24px`).toEqual([]);
            expect(layout.overflowingCardText, `${route} has card text outside its container`).toEqual([]);

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
        await expect(firstCard).toBeVisible();
        await expect(firstCard.locator(".action-copy")).toContainText("Next action");
        const cardTop = await firstCard.evaluate((element) => element.getBoundingClientRect().top);
        expect(cardTop).toBeLessThan(844);
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
