import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import trends from "../../data/trends.json" with { type: "json" };
import packages from "../../data/packages.json" with { type: "json" };
import repos from "../../data/repos.json" with { type: "json" };
import links from "../../data/links.json" with { type: "json" };

const requiredRoutes = [
    "/",
    "/today/",
    "/explore/",
    "/review/",
    "/status/",
    "/trends/",
    "/packages/",
    "/repos/",
    "/links/",
    "/notes/",
    "/topics/agent-skills/",
    "/topics/ai-agents/",
    "/topics/ai-engineering/",
    "/topics/ai-evals/",
    "/topics/mcp/",
    "/topics/security/",
    "/topics/workflow-automation/"
];
const topicRoutes = [
    ["Agent skills", "/topics/agent-skills/"],
    ["AI agents", "/topics/ai-agents/"],
    ["AI engineering", "/topics/ai-engineering/"],
    ["AI evals", "/topics/ai-evals/"],
    ["MCP", "/topics/mcp/"],
    ["Security", "/topics/security/"],
    ["Workflow automation", "/topics/workflow-automation/"]
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

async function openExploreAdvanced(page) {
    const disclosure = page.locator("[data-explore-filter-shell]");
    if ((await disclosure.getAttribute("open")) === null) await disclosure.locator("summary").click();
}

async function openReviewTools(page) {
    const disclosure = page.locator("[data-review-tools]");
    if ((await disclosure.getAttribute("open")) === null) await disclosure.locator("summary").click();
}

test("Notes exposes every topic and opens its Topic and Explore routes", async ({ page }) => {
    await page.goto("/notes/");

    await expect(page.getByRole("heading", { level: 1, name: "Topic notes." })).toBeVisible();
    await expect(page.locator(".topic-note-card")).toHaveCount(7);
    await expect(page.locator("[data-notes-count]")).toHaveText("7");
    await expect(page.locator("body")).not.toContainText(/\b(?:undefined|null|NaN)\b/);

    await page.getByRole("link", { name: "Open topic AI agents" }).click();
    await expect(page).toHaveURL(/\/topics\/ai-agents\/(?:index\.html)?$/);
    await expect(page.getByRole("heading", { level: 1, name: "AI agent signals." })).toBeVisible();

    await page.goto("/notes/");
    await page.getByRole("link", { name: "Explore lens AI agents" }).click();
    await expect(page).toHaveURL(/\/explore\/(?:index\.html)?\?focus=AI%20agents$/);
    await expect(page.locator('[data-focus-filter="AI agents"]')).toHaveAttribute("aria-pressed", "true");
});

test("Notes remains complete with JavaScript disabled", async ({ browser }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-chromium", "Run one deterministic no-JS pass.");
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    try {
        await page.goto("/notes/");
        await expect(page.getByRole("heading", { level: 1, name: "Topic notes." })).toBeVisible();
        await expect(page.locator(".topic-note-card")).toHaveCount(7);
        await expect(page.getByText("Security signals decide where automation needs stronger guardrails.")).toBeVisible();
        await expect(page.getByRole("link", { name: "Open topic Security" })).toHaveAttribute("href", "../topics/security/index.html");
    } finally {
        await context.close();
    }
});

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

    await expect(page.locator("[data-explore-filter-shell]")).not.toHaveAttribute("open", "");
    await page.locator("[data-explore-query]").fill("__no_such_signal__");
    await expect(page.getByRole("heading", { name: "No matching items" })).toBeVisible();
    await expect(resultCards).toHaveCount(0);

    await page.locator("[data-clear-filters]").click();
    await expect.poll(() => resultCards.count()).toBeGreaterThan(0);
    await expect(page.getByRole("heading", { name: "No matching items" })).toHaveCount(0);
});

test("source routes lead with complete labelled records without mobile scrollers", async ({ page }) => {
    const routes = [
        { path: "/trends/", items: trends.items, title: "title", headers: ["Rank", "Signal", "Category", "Origin", "Score"], stats: "Trend statistics" },
        { path: "/packages/", items: packages.packages, title: "name", headers: ["Rank", "Package", "Category", "Downloads", "Focus"], stats: "Package movement stats" },
        { path: "/repos/", items: repos.repos, title: "name", headers: ["Rank", "Repo", "Category", "Stars", "Focus"], stats: "Repo movement stats" }
    ];

    for (const route of routes) {
        await page.goto(route.path);
        const table = page.locator("[data-source-record-list]");
        const rows = table.locator("tbody tr");
        await expect(rows).toHaveCount(route.items.length);
        await expect(rows.first()).toContainText(route.items[0][route.title]);
        await expect(rows.nth(1)).toContainText(route.items[1][route.title]);
        await expect(page.locator("h1")).toHaveCount(1);

        const layout = await page.evaluate(({ stats }) => {
            const summary = document.querySelector("[data-source-summary]");
            const records = document.querySelector("[data-source-record-list]");
            const secondary = document.querySelector(`[aria-label="${stats}"]`);
            const health = document.querySelector("[data-source-health]");
            const row = records.querySelector("tbody tr").getBoundingClientRect();
            const wrapper = records.closest(".source-record-table-wrap");
            return {
                firstRecord: row.top,
                recordHeight: row.height,
                order: [[summary, records], [records, secondary], [secondary, health]]
                    .every(([before, after]) => before.compareDocumentPosition(after) & Node.DOCUMENT_POSITION_FOLLOWING),
                documentOverflow: document.documentElement.scrollWidth - innerWidth,
                nestedOverflow: wrapper.scrollWidth - wrapper.clientWidth,
                wrapperOverflow: getComputedStyle(wrapper).overflowX,
                labels: [...records.querySelectorAll("thead th")].map((cell) => cell.textContent.trim()),
                longNamesContained: [...records.querySelectorAll("tbody h3")].every((title) => title.scrollWidth <= title.clientWidth)
            };
        }, { stats: route.stats });

        expect(layout.order).toBe(true);
        expect(layout.documentOverflow).toBe(0);
        expect(layout.longNamesContained).toBe(true);
        expect(layout.labels).toEqual(route.headers);

        if (page.viewportSize().width <= 720) {
            expect(layout.firstRecord).toBeLessThanOrEqual(700);
            expect(layout.nestedOverflow).toBe(0);
            expect(layout.wrapperOverflow).toBe("visible");
            expect(await rows.first().locator("td").first().evaluate((cell) => getComputedStyle(cell, "::before").content)).toContain("Rank");
            const action = rows.first().getByRole("link");
            await action.focus();
            const focused = await action.evaluate((link) => ({ top: link.getBoundingClientRect().top, railBottom: document.querySelector(".primary-nav").getBoundingClientRect().bottom, outline: getComputedStyle(link).outlineStyle }));
            expect(focused.top).toBeGreaterThanOrEqual(focused.railBottom);
            expect(focused.outline).not.toBe("none");
        } else {
            expect(layout.firstRecord).toBeLessThanOrEqual(700);
            expect(layout.nestedOverflow).toBe(0);
            await expect(table.locator("thead")).toBeVisible();
        }

        await expect(rows.first().getByRole("link")).toHaveAttribute("href", route.items[0].url);
        expect(await page.locator("body").innerText()).not.toMatch(/\b(?:undefined|null|NaN)\b/);
    }
});

test("Links renders one featured-first labelled reference list", async ({ page }) => {
    await page.goto("/links/");
    const table = page.locator("[data-link-list]");
    const rows = table.locator("tbody tr");
    const actions = rows.getByRole("link");
    await expect(rows).toHaveCount(links.links.length);
    await expect(actions).toHaveCount(links.links.length);
    await expect(rows.locator(".eyebrow")).toHaveCount(4);
    for (let index = 0; index < 4; index += 1) await expect(rows.nth(index)).toContainText("Featured");
    await expect(rows.nth(4)).not.toContainText("Featured");
    await expect(page.getByLabel("Reference highlights")).toHaveCount(0);
    await expect(page.locator("h1")).toHaveCount(1);

    const layout = await table.evaluate((records) => {
        const row = records.querySelector("tbody tr").getBoundingClientRect();
        const wrapper = records.closest(".source-record-table-wrap");
        const urls = [...records.querySelectorAll("tbody a")].map((link) => link.href);
        return {
            firstRecord: row.top,
            recordHeight: row.height,
            uniqueUrls: new Set(urls).size,
            documentOverflow: document.documentElement.scrollWidth - innerWidth,
            nestedOverflow: wrapper.scrollWidth - wrapper.clientWidth,
            wrapperOverflow: getComputedStyle(wrapper).overflowX,
            contained: [...records.querySelectorAll("h3, small")].every((node) => node.scrollWidth <= node.clientWidth),
            headings: [...records.querySelectorAll("thead th")].map((cell) => cell.textContent.trim())
        };
    });

    expect(layout.firstRecord).toBeLessThanOrEqual(page.viewportSize().width <= 720 ? 600 : 700);
    expect(layout.uniqueUrls).toBe(links.links.length);
    expect(layout.documentOverflow).toBe(0);
    expect(layout.nestedOverflow).toBe(0);
    expect(layout.contained).toBe(true);
    expect(layout.headings).toEqual(["Rank", "Reference", "Kind", "Category", "Action"]);
    if (page.viewportSize().width <= 720) expect(layout.wrapperOverflow).toBe("visible");

    await actions.first().focus();
    const focus = await actions.first().evaluate((link) => ({ top: link.getBoundingClientRect().top, railBottom: document.querySelector(".primary-nav").getBoundingClientRect().bottom, outline: getComputedStyle(link).outlineStyle }));
    expect(focus.top).toBeGreaterThanOrEqual(focus.railBottom);
    expect(focus.outline).not.toBe("none");
    await expect(actions.first()).toHaveAttribute("href", links.links[0].url);
    expect(await page.locator("body").innerText()).not.toMatch(/\b(?:undefined|null|NaN)\b/);
});

test("JavaScript-disabled Links keeps the complete featured reference list", async ({ browser }, testInfo) => {
    const context = await browser.newContext({ javaScriptEnabled: false, viewport: testInfo.project.use.viewport });
    const page = await context.newPage();
    await page.goto("/links/");
    await expect(page.locator("[data-link-list] tbody tr")).toHaveCount(links.links.length);
    await expect(page.locator("[data-link-list] .eyebrow")).toHaveCount(4);
    await expect(page.locator("[data-link-list] tbody tr").first().getByRole("link")).toBeVisible();
    await context.close();
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
    await expect(page.getByRole("heading", { name: "Malformed Review records ignored" })).toBeVisible();
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
    await openExploreAdvanced(page);
    await page.locator('[data-focus-filter="Agent skills"]').click();
    await expect(page.locator("[data-explore-results]")).toContainText(/skills/i);

    await page.locator("[data-explore-sort]").selectOption("module");
    const sortedModules = await page.locator("[data-explore-results] .card-topline span:first-child").allTextContents();
    expect(sortedModules).toEqual([...sortedModules].sort());

    const save = page.locator("[data-explore-results] [data-save-id]").first();
    await save.click();
    await expect(save).toBeFocused();
    await expect(page.locator("[data-explore-announcement]")).toContainText(/^Saved .+ for Review later\.$/);
    await expect(page.locator("[data-explore-saved-count]")).toHaveText("1");

    await page.locator("[data-explore-saved] [data-remove-id]").click();
    await expect(save).toBeFocused();
    await expect(page.locator("[data-explore-announcement]")).toContainText(/^Removed .+ from Review later\.$/);
    await save.click();
    const stored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), reviewStorageKey);
    expect(stored.version).toBe(2);
    expect(stored.items).toHaveLength(1);

    await page.reload();
    await expect(page.locator("[data-explore-saved-count]")).toHaveText("1");
    await page.goto("/review/");
    await expect(page.locator("[data-review-total]")).toHaveText("1");
    await page.goto("/");
    await page.reload();
    await expect(page.locator("[data-home-review-saved]")).toHaveText("1");
    await expect(page.locator("[data-home-review-unread]")).toHaveText("1");
});

test("Explore defaults and saved-search CRUD survive React rerenders", async ({ page }) => {
    await page.goto("/explore/");
    await expect.poll(() => page.locator("[data-explore-module] option").count()).toBeGreaterThan(1);
    await openExploreAdvanced(page);
    await page.locator('[data-focus-filter="MCP"]').click();
    await page.locator("[data-save-explore-default]").click();
    await page.locator("[data-explore-query]").fill("server");
    await page.locator("[data-save-search]").click();
    await expect(page.locator("[data-saved-searches] .saved-search-item")).toHaveCount(1);

    await page.locator("[data-clear-filters]").click();
    await page.locator("[data-apply-search-id]").click();
    await expect(page.locator("[data-explore-query]")).toHaveValue("server");
    await expect(page.locator("[data-explore-announcement]")).toContainText("Applied saved search:");
    page.once("dialog", (dialog) => dialog.accept("MCP servers"));
    await page.locator("[data-edit-search-id]").click();
    await expect(page.locator(".saved-search-label")).toHaveText("MCP servers");

    await page.reload();
    await expect(page.locator('[data-focus-filter="MCP"]')).toHaveAttribute("aria-pressed", "true");
    expect(await page.evaluate((key) => JSON.parse(localStorage.getItem(key)).version, exploreDefaultKey)).toBe(1);
    expect(await page.evaluate((key) => JSON.parse(localStorage.getItem(key)).items[0].label, savedSearchKey)).toBe("MCP servers");
    await openExploreAdvanced(page);
    await page.locator("[data-remove-search-id]").click();
    await expect(page.locator("[data-saved-searches] .saved-search-item")).toHaveCount(0);
});

test("Explore rejects malformed local state and imported JSON without crashing", async ({ page }) => {
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.addInitScript((keys) => keys.forEach((key) => localStorage.setItem(key, "{broken")), [reviewStorageKey, exploreDefaultKey, savedSearchKey, "anothel.preferences.pinnedTopics.v1"]);
    await page.goto("/explore/");
    await expect(page.locator("[data-explore-results] .explore-card").first()).toBeVisible();
    await openExploreAdvanced(page);
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

test("Explore mobile order keeps search and hydrated results in the first viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/explore/");
    await expect.poll(() => page.locator("[data-explore-module] option").count()).toBeGreaterThan(1);

    const layout = await page.evaluate(() => {
        const search = document.querySelector("[data-explore-query]");
        const result = document.querySelector("[data-explore-results] .explore-card:not(.empty-card)");
        const advanced = document.querySelector("[data-explore-filter-shell]");
        const review = document.querySelector("[data-explore-saved]");
        const lenses = document.querySelector("[data-topic-lenses]");
        const health = document.querySelector("[data-source-health]");
        return {
            searchTop: search.getBoundingClientRect().top,
            resultTop: result.getBoundingClientRect().top,
            inputSize: parseFloat(getComputedStyle(search).fontSize),
            overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
            order: [advanced, review, lenses, health].every((section) => result.compareDocumentPosition(section) & Node.DOCUMENT_POSITION_FOLLOWING)
        };
    });

    expect(layout.searchTop).toBeLessThanOrEqual(400);
    expect(layout.resultTop).toBeLessThan(844);
    expect(layout.inputSize).toBeGreaterThanOrEqual(16);
    expect(layout.overflow).toBeLessThanOrEqual(1);
    expect(layout.order).toBe(true);
});

test("JavaScript-disabled Explore keeps honest results-first output", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await page.goto("/explore/");
    await expect(page.getByRole("heading", { name: "Browse current signals" })).toBeVisible();
    await expect(page.locator("[data-explore-query]")).toBeHidden();
    await expect(page.locator("[data-source-health] .source-health-card").first()).toBeVisible();
    await expect(page.locator("[data-topic-lenses] .topic-lens-card").first()).toBeVisible();
    await expect(page.locator("[data-explore-results] .explore-card").first()).toBeVisible();
    await expect(page.locator("[data-explore-results] button").first()).toBeHidden();
    const resultTop = await page.locator("[data-explore-results] .explore-card").first().evaluate((card) => card.getBoundingClientRect().top);
    expect(resultTop).toBeLessThan(844);
    const resultsBeforeSecondary = await page.evaluate(() => {
        const results = document.querySelector("[data-explore-results]");
        return [document.querySelector("[data-topic-lenses]"), document.querySelector("[data-source-health]")]
            .every((section) => results.compareDocumentPosition(section) & Node.DOCUMENT_POSITION_FOLLOWING);
    });
    expect(resultsBeforeSecondary).toBe(true);
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
    await expect(page.locator("[data-review-filter], [data-review-total], [data-review-tools]")).toHaveCount(0);
    await context.close();
});

test("Review queue leads mobile and desktop while mobile selection reveals detail", async ({ page }) => {
    await page.addInitScript(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), {
        key: reviewStorageKey,
        value: { version: 2, items: [recordFor(seededTrend), recordFor(secondTrend, "done")] }
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/review/");
    await expect(page.locator("[data-review-queue] [data-review-select-id]").first()).toBeVisible();

    const mobile = await page.evaluate(() => {
        const filters = document.querySelector(".review-filters");
        const queue = document.querySelector("[data-review-queue]");
        const item = queue.querySelector("[data-review-select-id]");
        const detail = document.querySelector("[data-review-detail]");
        const stats = document.querySelector(".review-stats");
        const tools = document.querySelector("[data-review-tools]");
        return {
            filtersTop: filters.getBoundingClientRect().top,
            itemTop: item.getBoundingClientRect().top,
            overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
            order: [detail, stats, tools].every((section) => queue.compareDocumentPosition(section) & Node.DOCUMENT_POSITION_FOLLOWING),
            toolsOpen: tools.open
        };
    });
    expect(mobile.filtersTop).toBeLessThanOrEqual(650);
    expect(mobile.itemTop).toBeLessThanOrEqual(650);
    expect(mobile.overflow).toBeLessThanOrEqual(1);
    expect(mobile.order).toBe(true);
    expect(mobile.toolsOpen).toBe(false);

    await page.locator(`[data-review-select-id="${recordFor(secondTrend).id}"]`).click();
    await expect(page.locator("[data-review-detail-heading]")).toBeFocused();
    const focused = await page.evaluate(() => ({
        detailTop: document.querySelector("[data-review-detail-heading]").getBoundingClientRect().top,
        railBottom: document.querySelector(".primary-nav").getBoundingClientRect().bottom
    }));
    expect(focused.detailTop).toBeGreaterThanOrEqual(focused.railBottom);

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/review/");
    await expect(page.locator(".review-detail")).toBeVisible();
    const desktop = await page.evaluate(() => {
        const queue = document.querySelector(".review-queue-panel").getBoundingClientRect();
        const detail = document.querySelector(".review-detail").getBoundingClientRect();
        return {
            aligned: Math.abs(queue.top - detail.top),
            queueWidth: queue.width,
            detailWidth: detail.width,
            overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
            toolsOpen: document.querySelector("[data-review-tools]").open
        };
    });
    expect(desktop.aligned).toBeLessThanOrEqual(1);
    expect(desktop.detailWidth).toBeGreaterThan(desktop.queueWidth);
    expect(desktop.overflow).toBeLessThanOrEqual(1);
    expect(desktop.toolsOpen).toBe(false);
    const desktopSelection = page.locator(`[data-review-select-id="${recordFor(secondTrend).id}"]`);
    await desktopSelection.click();
    await expect(desktopSelection).toBeFocused();
});

test("Review distinguishes unavailable storage from an empty queue", async ({ page }) => {
    await page.addInitScript(() => {
        Storage.prototype.getItem = () => { throw new DOMException("blocked", "SecurityError"); };
    });
    await page.goto("/review/");
    await expect(page.getByRole("heading", { name: "Review storage unavailable" })).toBeVisible();
    await expect(page.locator("[data-review-total]")).toHaveText("—");
    await openReviewTools(page);
    await expect(page.locator("[data-review-export]")).toBeDisabled();
});

test("Review distinguishes current-data failure from stale and empty queues", async ({ page }) => {
    await page.addInitScript(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), { key: reviewStorageKey, value: seededReview });
    await page.route("**/data/*.json", (route) => route.abort());
    await page.goto("/review/");
    await expect(page.getByRole("heading", { name: "Current signal data unavailable" })).toBeVisible();
    await expect(page.locator("[data-review-unread]")).toHaveText("1");
    await expect(page.getByRole("heading", { name: "Saved items not in current data" })).toHaveCount(0);
});

test("Home reads legacy saved ids from the shared localStorage contract", async ({ page }) => {
    await page.addInitScript(({ key, value }) => {
        localStorage.setItem(key, JSON.stringify(value));
    }, { key: reviewStorageKey, value: ["legacy:a", "legacy:b"] });

    await page.goto("/");

    await expect(page.locator("[data-home-review-saved]")).toHaveText("2");
    await expect(page.locator("[data-home-review-unread]")).toHaveText("2");
});

test("Home reads version 2 statuses from the shared localStorage contract", async ({ page }) => {
    await page.addInitScript(({ key, value }) => {
        localStorage.setItem(key, JSON.stringify(value));
    }, {
        key: reviewStorageKey,
        value: {
            version: 2,
            items: [
                recordFor(seededTrend),
                recordFor(secondTrend, "read"),
                recordFor(thirdTrend, "done"),
                { id: "unknown-status", savedAt: "2026-07-07T12:00:00.000Z", status: "unknown" }
            ]
        }
    });

    await page.goto("/");

    await expect(page.locator("[data-home-review-saved]")).toHaveText("4");
    await expect(page.locator("[data-home-review-unread]")).toHaveText("2");
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

test("Home exposes an unavailable state when localStorage cannot be read", async ({ page }) => {
    const pageErrors = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    await page.addInitScript(() => {
        Storage.prototype.getItem = () => { throw new DOMException("blocked", "SecurityError"); };
    });

    await page.goto("/");

    await expect(page.locator("[data-home-review-saved]")).toHaveText("??");
    await expect(page.locator("[data-home-review-unread]")).toHaveText("??");
    await expect(page.locator("[data-home-review-status]")).toContainText("unavailable");
    expect(pageErrors).toEqual([]);
});

test("JavaScript-disabled Home keeps honest saved placeholders at 390x844", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await page.goto("/");

    await expect(page.locator("[data-home-review-saved]")).toHaveText("??");
    await expect(page.locator("[data-home-review-unread]")).toHaveText("??");
    await expect(page.locator("[data-home-review-status]")).toContainText("loads when JavaScript is available");
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    await context.close();
});

test("all native Astro topic routes expose complete static decision context", async ({ page }) => {
    for (const [topic, route] of topicRoutes) {
        await page.goto(route);
        await expect(page).toHaveTitle(`${topic} - anothel`);
        await expect(page.locator("[data-topic-total]")).not.toHaveText("0");
        await expect(page.locator("[data-topic-signal]").first()).toBeVisible();
        await expect(page.locator("[data-topic-note]")).toContainText("Supporting signals");
        await expect(page.locator("[data-topic-guidance]")).toContainText("Good next action");
        await expect(page.locator("[data-topic-top-movers]")).toBeVisible();
        await expect(page.locator("[data-topic-source-mix]")).toBeVisible();
        await expect(page.locator("[data-topic-related]")).toBeVisible();
        await expect(page.locator("[data-topic-cross-links] a")).toHaveCount(6);
        await expect(page.getByRole("link", { name: /Open Notes/ })).toBeVisible();
        await expect(page.locator("body")).not.toContainText(/\b(?:undefined|null|NaN)\b/);
    }
});

test("topic pin state survives reload and stays compatible with Explore", async ({ page }) => {
    await page.goto("/topics/mcp/");
    const topicPin = page.locator("[data-topic-pin-button]");
    await expect(topicPin).toHaveText("Pin topic");
    await topicPin.click();
    await expect(topicPin).toHaveAttribute("aria-pressed", "true");
    await page.reload();
    await expect(page.locator("[data-topic-pin-button]")).toHaveAttribute("aria-pressed", "true");

    await page.goto("/explore/");
    await expect(page.locator('[data-pin-topic="MCP"]')).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("[data-topic-lenses] .topic-lens-card").first()).toContainText("MCP");

    await page.goto("/topics/mcp/");
    await page.locator("[data-topic-pin-button]").click();
    await expect(page.locator("[data-topic-pin-button]")).toHaveAttribute("aria-pressed", "false");
});

test("topic pages handle malformed and unavailable pin storage safely", async ({ browser }) => {
    const malformed = await browser.newContext();
    const malformedPage = await malformed.newPage();
    const errors = [];
    malformedPage.on("pageerror", (error) => errors.push(error.message));
    await malformedPage.addInitScript(() => localStorage.setItem("anothel.preferences.pinnedTopics.v1", "{broken"));
    await malformedPage.goto("/topics/ai-agents/");
    await expect(malformedPage.locator("[data-topic-pin-button]")).toHaveText("Pin topic");
    await expect(malformedPage.locator("[data-topic-signal]").first()).toBeVisible();
    expect(errors).toEqual([]);
    await malformed.close();

    const unavailable = await browser.newContext();
    const unavailablePage = await unavailable.newPage();
    await unavailablePage.addInitScript(() => {
        Storage.prototype.getItem = () => { throw new DOMException("blocked", "SecurityError"); };
    });
    await unavailablePage.goto("/topics/ai-agents/");
    await expect(unavailablePage.locator("[data-topic-pin-button]")).toHaveText("Pin unavailable");
    await expect(unavailablePage.locator("[data-topic-pin-status]")).toContainText("unavailable");
    await unavailable.close();
});

test("topic Explore link and related-topic navigation preserve public routes", async ({ page }) => {
    await page.goto("/topics/mcp/");
    await page.getByRole("link", { name: /Open focused Explore/ }).click();
    await expect(page).toHaveURL(/\/explore\/(?:index\.html)?\?focus=MCP$/);
    await expect(page.locator('[data-focus-filter="MCP"]')).toHaveAttribute("aria-pressed", "true");

    await page.goto("/topics/mcp/");
    await page.locator("[data-topic-cross-links]").getByRole("link", { name: /AI agents/ }).click();
    await expect(page).toHaveURL(/\/topics\/ai-agents\/(?:index\.html)?$/);
});

test("JavaScript-disabled topic routes retain all content except resolved pin state", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    for (const [, route] of topicRoutes) {
        await page.goto(route);
        await expect(page.locator("[data-topic-signal]").first()).toBeVisible();
        await expect(page.locator("[data-topic-note]")).toBeVisible();
        await expect(page.locator("[data-topic-guidance]")).toBeVisible();
        await expect(page.locator("[data-topic-related]")).toBeVisible();
        await expect(page.locator("[data-topic-pin-button]")).toHaveAttribute("aria-pressed", "mixed");
        await expect(page.locator("[data-topic-pin-status]")).toContainText("State loads when JavaScript is available");
    }
    await context.close();
});

test("Review migrates legacy ids and persists workflow metadata", async ({ page }) => {
    const legacyId = `trends:${seededTrend.url}`;
    await page.addInitScript(({ key, id }) => {
        if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify([id]));
    }, { key: reviewStorageKey, id: legacyId });
    await page.goto("/review/");

    await expect(page.locator("[data-review-queue]")).toContainText(seededTrend.title);
    const readButton = page.locator('[data-review-status="read"]');
    await readButton.click();
    await expect(readButton).toBeFocused();
    await expect(page.locator("[data-review-announcement]")).toContainText("marked read");
    await expect(page.locator(".status-pill")).toHaveText("Read");
    await page.locator("[data-review-reason]").fill("Follow up");
    await page.locator("[data-review-tag]").fill("agents");
    await page.locator("[data-review-note]").fill("Compare implementations");
    await page.locator('[data-review-status="done"]').click();
    await expect(page.locator("[data-review-reason]")).toHaveValue("Follow up");
    await page.locator("[data-review-meta-id]").click();
    await expect(page.locator("[data-review-announcement]")).toContainText("Metadata saved for");
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
    await expect(page.locator("[data-review-unread]")).toHaveText("1");
    await expect(page.locator("[data-review-done]")).toHaveText("1");
    await page.locator('[data-review-filter="unread"]').click();
    await expect(page.locator("[data-review-total]")).toHaveText("1");
    await page.locator('[data-review-filter="read"]').click();
    await expect(page.locator('[data-review-filter="read"]')).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("heading", { name: "No read items in Review" })).toBeVisible();
    await page.getByRole("button", { name: "Choose All" }).click();
    await expect(page.locator('[data-review-filter="all"]')).toBeFocused();
    const nextQueueItem = page.locator(`[data-review-select-id="${recordFor(secondTrend).id}"]`);
    await page.locator("[data-review-remove-id]").click();
    await expect(nextQueueItem).toBeFocused();
    await expect(page.locator("[data-review-announcement]")).toContainText("removed from Review");
    expect((await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), reviewStorageKey)).items).toHaveLength(1);

    await openReviewTools(page);
    await page.locator("[data-review-clear]").click();
    expect((await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), reviewStorageKey)).items).toHaveLength(1);
    await expect(page.locator("[data-review-clear]")).toHaveText("Confirm clear");
    await page.locator("[data-review-clear]").click();
    await expect(page.getByRole("heading", { name: "Queue" })).toBeFocused();
    await expect(page.locator("[data-review-announcement]")).toHaveText("Review queue cleared.");
    expect(await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), reviewStorageKey)).toEqual({ version: 2, items: [] });
    await page.goto("/");
    await expect(page.locator("[data-home-review-saved]")).toHaveText("0");
    await page.goto("/explore/");
    await expect(page.locator("[data-explore-saved-count]")).toHaveText("0");
});

test("Review previews imports and exports compatible JSON and safe Markdown", async ({ page }) => {
    await page.addInitScript(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), { key: reviewStorageKey, value: seededReview });
    await page.goto("/review/");
    await openReviewTools(page);

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
    await expect(page.locator("[data-review-announcement]")).toContainText("Import completed:");

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
    await page.locator("[data-review-import-paste]").click();
    await expect(page.locator("[data-review-announcement]")).toContainText("Import rejected:");
    await expect(page.locator("body")).not.toContainText(/\b(?:undefined|null|NaN)\b/);
});

test("Home and Today keep priority content and trust summaries without JavaScript", async ({ browser }, testInfo) => {
    const context = await browser.newContext({ javaScriptEnabled: false, viewport: testInfo.project.use.viewport });
    const page = await context.newPage();
    try {
        await page.goto("/");
        await expect(page.locator("[data-signal-card]").first()).toBeVisible();
        await expect(page.locator("[data-home-review-saved]")).toHaveText("??");
        await expect(page.locator("[data-home-review-unread]")).toHaveText("??");
        await expect(page.locator("[data-home-review-status]")).toContainText("JavaScript is available");
        await expect(page.locator("[data-compact-trust]")).toBeVisible();

        await page.goto("/today/");
        await expect(page.locator("[data-signal-card]")).not.toHaveCount(0);
        await expect(page.locator("[data-compact-trust]")).toBeVisible();
    } finally {
        await context.close();
    }
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
    await expect(page.getByRole("heading", { name: /^Overall health:/ })).toBeVisible();
    const expectedSources = [trends, packages, repos, links].flatMap(({ sourceMeta }) => Array.isArray(sourceMeta) ? sourceMeta : [sourceMeta]);
    const rows = page.locator("[data-status-source-row]");
    await expect(rows).toHaveCount(expectedSources.length);
    await expect(rows.first()).toBeVisible();

    for (const [index, source] of expectedSources.entries()) {
        await expect(rows.nth(index).locator("th[scope=row]")).toHaveText(source.name);
    }

    const layout = await page.evaluate(() => {
        const top = (selector) => Math.round(document.querySelector(selector).getBoundingClientRect().top + scrollY);
        const wrapper = document.querySelector(".source-health-table-wrap");
        return {
            order: ["[data-status-overall]", "[data-status-sources]", "[data-status-secondary]", "[data-status-evidence]"].map(top),
            overallTop: top("[data-status-overall]"),
            firstRowTop: top("[data-status-source-row]"),
            documentOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
            sourceOverflow: wrapper.scrollWidth - wrapper.clientWidth,
            sourceOverflowStyle: getComputedStyle(wrapper).overflowX
        };
    });
    expect(layout.order.every((offset, index) => index === 0 || offset > layout.order[index - 1])).toBe(true);
    expect(layout.overallTop).toBeLessThanOrEqual(400);
    expect(layout.documentOverflow).toBeLessThanOrEqual(1);
    if (page.viewportSize().width <= 720) {
        expect(layout.firstRowTop).toBeLessThanOrEqual(700);
        expect(layout.sourceOverflow).toBeLessThanOrEqual(1);
        expect(layout.sourceOverflowStyle).toBe("visible");
    }
    await expect(page.locator("body")).not.toContainText(/\b(?:undefined|null|NaN)\b/);
});

test("JavaScript-disabled Status keeps the complete evidence dashboard", async ({ browser }, testInfo) => {
    const context = await browser.newContext({ javaScriptEnabled: false, viewport: testInfo.project.use.viewport });
    const page = await context.newPage();
    await page.goto("/status/");
    const expectedCount = [trends, packages, repos, links]
        .reduce((total, { sourceMeta }) => total + (Array.isArray(sourceMeta) ? sourceMeta.length : 1), 0);

    await expect(page.getByRole("heading", { name: /^Overall health:/ })).toBeVisible();
    await expect(page.locator("[data-status-source-row]")).toHaveCount(expectedCount);
    await expect(page.locator("[data-status-evidence]")).toBeVisible();
    await context.close();
});

test("unknown routes use the custom Astro 404", async ({ page }) => {
    const response = await page.goto("/missing-route");

    expect(response?.status()).toBe(404);
    await expect(page).toHaveTitle("Page not found - anothel");
    await expect(page.getByRole("heading", { name: "Nothing tracked here." })).toBeVisible();
    await expect(page.getByRole("link", { name: "Open home" })).toHaveAttribute("href", "/");
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
