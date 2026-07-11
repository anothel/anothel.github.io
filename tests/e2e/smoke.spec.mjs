import { expect, test } from "@playwright/test";
import trends from "../../data/trends.json" with { type: "json" };

const requiredRoutes = [
    "/",
    "/today/",
    "/explore/",
    "/review/",
    "/status/",
    "/trends/",
    "/packages/",
    "/repos/",
    "/links/"
];
const reviewStorageKey = "anothel.explore.saved.v1";
const seededTrend = trends.items[0];
const seededReview = {
    version: 2,
    items: [{
        id: `url:${seededTrend.url}`,
        savedAt: "2026-07-07T12:00:00.000Z",
        status: "unread"
    }]
};

test("Today renders an actionable signal without invalid placeholder text", async ({ page }) => {
    await page.goto("/today/");

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const cards = page.locator("[data-signal-card]");
    await expect(cards.first()).toBeVisible();
    await expect(cards).not.toHaveCount(0);
    await expect(cards.first().locator("[data-signal-title]")).not.toHaveText(/^\s*$/);
    await expect(page.locator("body")).not.toContainText(/\b(?:undefined|null|NaN)\b/);
});

test("Explore search filters and restores checked-in results", async ({ page }) => {
    await page.goto("/explore/");

    await expect(page.getByRole("heading", { name: "Explore tracked signals." })).toBeVisible();
    await expect.poll(() => page.locator("[data-explore-module] option").count()).toBeGreaterThan(1);

    const resultCards = page.locator("[data-explore-results] .explore-card:not(.empty-card)");
    const initialCount = await resultCards.count();
    expect(initialCount).toBeGreaterThan(0);

    const filterShell = page.locator("[data-explore-filter-shell]");
    if ((await filterShell.getAttribute("open")) === null) {
        await page.getByText("Filters and saved searches", { exact: true }).click();
    }
    await page.locator("[data-explore-query]").fill("__no_such_signal__");
    await expect(page.getByRole("heading", { name: "No matching items" })).toBeVisible();
    await expect(resultCards).toHaveCount(0);

    await page.locator("[data-clear-filters]").click();
    await expect(resultCards).toHaveCount(initialCount);
});

test("Review reads the existing version 2 localStorage contract", async ({ page }) => {
    await page.addInitScript(({ key, value }) => {
        localStorage.setItem(key, JSON.stringify(value));
    }, { key: reviewStorageKey, value: seededReview });

    await page.goto("/review/");

    await expect(page.locator("[data-review-total]")).toHaveText("1");
    await expect(page.locator("[data-review-queue]")).toContainText(seededTrend.title);
    const stored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), reviewStorageKey);
    expect(stored).toEqual(seededReview);
});

test("Review handles malformed localStorage without crashing", async ({ page }) => {
    const pageErrors = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    await page.addInitScript((key) => localStorage.setItem(key, "{malformed"), reviewStorageKey);

    await page.goto("/review/");

    await expect(page.getByRole("heading", { name: "Review later." })).toBeVisible();
    await expect(page.locator("[data-review-total]")).toHaveText("0");
    await expect(page.getByRole("heading", { name: "No saved items yet" })).toBeVisible();
    expect(pageErrors).toEqual([]);
});

test("Home reads saved and unread counts from the existing Review localStorage contract", async ({ page }) => {
    await page.addInitScript(({ key, value }) => {
        localStorage.setItem(key, JSON.stringify(value));
    }, { key: reviewStorageKey, value: seededReview });

    await page.goto("/");

    await expect(page.locator("[data-home-review-saved]")).toHaveText("1");
    await expect(page.locator("[data-home-review-unread]")).toHaveText("1");
});

test("Home handles malformed Review localStorage without crashing", async ({ page }) => {
    const pageErrors = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    await page.addInitScript((key) => localStorage.setItem(key, "{malformed"), reviewStorageKey);

    await page.goto("/");

    await expect(page.getByRole("heading", { name: "What is worth opening now?" })).toBeVisible();
    await expect(page.locator("[data-home-review-saved]")).toHaveText("0");
    await expect(page.locator("[data-home-review-unread]")).toHaveText("0");
    expect(pageErrors).toEqual([]);
});

test("Status exposes overall and source-level data health", async ({ page }) => {
    await page.goto("/status/");

    await expect(page.getByText("Generated at", { exact: true })).toBeVisible();
    await expect(page.getByText("Overall data health", { exact: true })).toBeVisible();
    await expect(page.locator(".source-health-table tbody tr").first()).toBeVisible();
});

test("all required routes return a non-empty main region", async ({ page }) => {
    for (const route of requiredRoutes) {
        const response = await page.goto(route);
        expect(response?.ok(), `${route} should return a successful response`).toBe(true);
        const main = page.locator("main").first();
        await expect(main, `${route} should have a visible main region`).toBeVisible();
        await expect.poll(async () => (await main.innerText()).trim().length).toBeGreaterThan(0);
    }
});
