import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
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
const exploreDefaultKey = "anothel.preferences.exploreState.v1";
const savedSearchKey = "anothel.preferences.savedSearches.v1";
const seededTrend = trends.items[0];
const secondTrend = trends.items[1];
const thirdTrend = trends.items[2];
const recordFor = (item, status = "unread") => ({
    id: `url:${item.url.toLowerCase()}`,
    savedAt: "2026-07-07T12:00:00.000Z",
    status
});
const seededReview = {
    version: 2,
    items: [recordFor(seededTrend)]
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
    await expect.poll(() => resultCards.count()).toBeGreaterThan(0);
    await expect(page.getByRole("heading", { name: "No matching items" })).toHaveCount(0);
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

test("Explore React controls filter, save, and preserve Review-compatible state", async ({ page }) => {
    await page.goto("/explore/?focus=MCP");
    await expect.poll(() => page.locator("[data-explore-module] option").count()).toBeGreaterThan(1);
    await expect(page.locator('[data-focus-filter="MCP"]')).toHaveAttribute("aria-pressed", "true");

    await page.locator("[data-clear-filters]").click();
    await page.locator("[data-explore-module]").selectOption("Repos");
    const repoCards = page.locator("[data-explore-results] .explore-card:not(.empty-card)");
    await expect(repoCards.first()).toBeVisible();
    await expect(repoCards.first().locator(".card-topline span").first()).toHaveText("Repos");

    await page.locator("[data-clear-filters]").click();
    const category = await page.locator("[data-explore-category] option").nth(1).evaluate((option) => option.value);
    await page.locator("[data-explore-category]").selectOption(category);
    await expect(page.locator("[data-explore-results] .explore-card:not(.empty-card)").first().locator(".card-topline span").nth(1)).toHaveText(category);

    await page.locator("[data-clear-filters]").click();
    await page.locator('[data-focus-filter="Agent skills"]').click();
    await expect(page.locator("[data-explore-results]")).toContainText(/skills/i);

    const save = page.locator("[data-explore-results] [data-save-id]").first();
    await save.click();
    await expect(page.locator("[data-explore-saved-count]")).toHaveText("1");
    const stored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), reviewStorageKey);
    expect(stored.version).toBe(2);
    expect(stored.items).toHaveLength(1);

    await page.reload();
    await expect(page.locator("[data-explore-saved-count]")).toHaveText("1");
    await page.goto("/review/");
    await expect(page.locator("[data-review-total]")).toHaveText("1");
});

test("Explore defaults and saved-search CRUD survive React rerenders", async ({ page }) => {
    await page.goto("/explore/");
    await expect.poll(() => page.locator("[data-explore-module] option").count()).toBeGreaterThan(1);
    await page.locator('[data-focus-filter="MCP"]').click();
    await page.locator("[data-save-explore-default]").click();
    await page.locator("[data-explore-query]").fill("server");
    await page.locator("[data-save-search]").click();
    await expect(page.locator("[data-saved-searches] .saved-search-item")).toHaveCount(1);

    await page.locator("[data-clear-filters]").click();
    await page.locator("[data-apply-search-id]").click();
    await expect(page.locator("[data-explore-query]")).toHaveValue("server");
    page.once("dialog", (dialog) => dialog.accept("MCP servers"));
    await page.locator("[data-edit-search-id]").click();
    await expect(page.locator(".saved-search-label")).toHaveText("MCP servers");

    await page.reload();
    await expect(page.locator('[data-focus-filter="MCP"]')).toHaveAttribute("aria-pressed", "true");
    expect(await page.evaluate((key) => JSON.parse(localStorage.getItem(key)).version, exploreDefaultKey)).toBe(1);
    expect(await page.evaluate((key) => JSON.parse(localStorage.getItem(key)).items[0].label, savedSearchKey)).toBe("MCP servers");
    await page.locator("[data-remove-search-id]").click();
    await expect(page.locator("[data-saved-searches] .saved-search-item")).toHaveCount(0);
});

test("Explore rejects malformed local state and imported JSON without crashing", async ({ page }) => {
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.addInitScript((keys) => keys.forEach((key) => localStorage.setItem(key, "{broken")), [reviewStorageKey, exploreDefaultKey, savedSearchKey, "anothel.preferences.pinnedTopics.v1"]);
    await page.goto("/explore/");
    await expect(page.locator("[data-explore-results] .explore-card").first()).toBeVisible();
    await page.locator("[data-saved-search-import-text]").fill('{"version":1,"items":[{"bad":true}]}');
    await page.locator("[data-saved-search-import-paste]").click();
    await expect(page.locator("[data-saved-search-portability-status]")).toHaveText("No new saved searches to import.");
    await page.locator("[data-saved-search-import-file]").setInputFiles({
        name: "saved-searches.json",
        mimeType: "application/json",
        buffer: Buffer.from('{"version":1,"items":[{"focus":"MCP","query":"server","sort":"priority"}]}')
    });
    await expect(page.locator("[data-saved-searches] .saved-search-item")).toHaveCount(1);
    expect(errors).toEqual([]);
});

test("JavaScript-disabled Explore keeps useful controls, health, lenses, and results", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto("/explore/");
    await expect(page.locator("[data-explore-query]")).toBeVisible();
    await expect(page.locator("[data-source-health] .source-health-card").first()).toBeVisible();
    await expect(page.locator("[data-topic-lenses] .topic-lens-card").first()).toBeVisible();
    await expect(page.locator("[data-explore-results] .explore-card").first()).toBeVisible();
    await expect(page.locator("[data-explore-saved]")).toContainText("Save items to review later");
    await context.close();
});

test("JavaScript-disabled Review gives honest browser-local guidance", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto("/review/");
    await expect(page.locator("[data-review-static-guidance]")).toContainText("Review is browser-local");
    await expect(page.locator("[data-review-static-guidance]")).toContainText("JavaScript and localStorage");
    await expect(page.locator("[data-review-static-guidance]").getByRole("link", { name: "Explore" })).toBeVisible();
    await expect(page.getByText("No saved items yet")).toHaveCount(0);
    await context.close();
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

test("Review migrates legacy ids and persists workflow metadata", async ({ page }) => {
    const legacyId = `trends:${seededTrend.url}`;
    await page.addInitScript(({ key, id }) => {
        if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify([id]));
    }, { key: reviewStorageKey, id: legacyId });
    await page.goto("/review/");

    await expect(page.locator("[data-review-queue]")).toContainText(seededTrend.title);
    await page.locator('[data-review-status="read"]').click();
    await expect(page.locator(".status-pill")).toHaveText("Read");
    await page.locator("[data-review-reason]").fill("Follow up");
    await page.locator("[data-review-tag]").fill("agents");
    await page.locator("[data-review-note]").fill("Compare implementations");
    await page.locator("[data-review-meta-id]").click();
    await page.locator('[data-review-status="done"]').click();
    await page.reload();

    await expect(page.locator(".status-pill")).toHaveText("Done");
    await expect(page.locator("[data-review-reason]")).toHaveValue("Follow up");
    const stored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), reviewStorageKey);
    expect(stored).toEqual({
        version: 2,
        items: [{ id: legacyId, savedAt: expect.any(String), status: "done", note: "Compare implementations", tag: "agents", reason: "Follow up" }]
    });
});

test("Review selection, filters, remove, and deliberate clear update compatible storage", async ({ page }) => {
    await page.addInitScript(({ key, value }) => {
        if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(value));
    }, {
        key: reviewStorageKey,
        value: { version: 2, items: [recordFor(seededTrend), recordFor(secondTrend, "done")] }
    });
    await page.goto("/review/");

    await page.locator(`[data-review-select-id="${recordFor(secondTrend).id}"]`).click();
    await expect(page.locator("[data-review-detail] h2")).toHaveText(secondTrend.title);
    await page.locator('[data-review-filter="done"]').click();
    await expect(page.locator("[data-review-total]")).toHaveText("1");
    await page.locator('[data-review-filter="unread"]').click();
    await expect(page.locator("[data-review-total]")).toHaveText("1");
    await page.locator('[data-review-filter="read"]').click();
    await expect(page.locator('[data-review-filter="read"]')).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("heading", { name: "No read items in Review" })).toBeVisible();
    await page.locator('[data-review-filter="all"]').click();
    await page.locator("[data-review-remove-id]").click();
    expect((await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), reviewStorageKey)).items).toHaveLength(1);

    await page.locator("[data-review-clear]").click();
    expect((await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), reviewStorageKey)).items).toHaveLength(1);
    await expect(page.locator("[data-review-clear]")).toHaveText("Confirm clear");
    await page.locator("[data-review-clear]").click();
    expect(await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), reviewStorageKey)).toEqual({ version: 2, items: [] });
    await page.goto("/");
    await expect(page.locator("[data-home-review-saved]")).toHaveText("0");
    await page.goto("/explore/");
    await expect(page.locator("[data-explore-saved-count]")).toHaveText("0");
});

test("Review previews imports and exports compatible JSON and safe Markdown", async ({ page }) => {
    await page.addInitScript(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), { key: reviewStorageKey, value: seededReview });
    await page.goto("/review/");

    const jsonDownload = page.waitForEvent("download");
    await page.locator("[data-review-export]").click();
    expect(JSON.parse(await readFile(await (await jsonDownload).path(), "utf8"))).toMatchObject({ version: 2, items: [recordFor(seededTrend)] });

    const markdownDownload = page.waitForEvent("download");
    await page.locator("[data-review-export-markdown]").click();
    expect(await readFile(await (await markdownDownload).path(), "utf8")).toContain(seededTrend.title);

    await page.locator("[data-review-import-text]").fill(JSON.stringify({ version: 2, items: [recordFor(seededTrend), recordFor(secondTrend)] }));
    await expect(page.locator("[data-review-portability-status]")).toHaveText("Import preview: 1 new, 1 existing or duplicate.");
    await page.locator("[data-review-import-paste]").click();
    await expect(page.locator("[data-review-total]")).toHaveText("2");

    await page.locator("[data-review-import-file]").setInputFiles({
        name: "review.json",
        mimeType: "application/json",
        buffer: Buffer.from(JSON.stringify({ version: 2, items: [recordFor(thirdTrend)] }))
    });
    await expect(page.locator("[data-review-portability-status]")).toHaveText("Import preview: 1 new, 0 existing or duplicate.");
    await page.locator("[data-review-import-paste]").click();
    await expect(page.locator("[data-review-total]")).toHaveText("3");
    await page.locator("[data-review-import-text]").fill("{broken");
    await expect(page.locator("[data-review-portability-status]")).toHaveText("No valid Review items to import.");
    await expect(page.locator("body")).not.toContainText(/\b(?:undefined|null|NaN)\b/);
});

test("Review reports stale saved ids alongside current matches", async ({ page }) => {
    await page.addInitScript(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), {
        key: reviewStorageKey,
        value: { version: 2, items: [recordFor(seededTrend), { id: "missing:item", savedAt: "2026-07-01", status: "unread" }] }
    });
    await page.goto("/review/");
    await expect(page.locator("[data-review-total]")).toHaveText("1");
    await expect(page.locator("[data-review-stale-count]")).toHaveAttribute("data-review-stale-count", "1");
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
