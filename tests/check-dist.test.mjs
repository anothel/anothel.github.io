import test from "node:test";
import assert from "node:assert/strict";
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { checkDist } from "../scripts/check-dist.mjs";

async function fixture() {
    const root = await mkdtemp(join(tmpdir(), "anothel-dist-"));
    await cp("dist", root, { recursive: true });
    return root;
}

test("generated dist passes required route, asset, data, and link checks", () => {
    assert.doesNotThrow(() => checkDist());
});

test("a missing Astro route fixture fails the pre-commit dist gate", async () => {
    const root = await fixture();
    try {
        await rm(join(root, "status", "index.html"));
        assert.throws(() => checkDist(root), /missing required route \/status\//);
    } finally {
        await rm(root, { recursive: true, force: true });
    }
});

for (const file of ["explore.js", "home.mjs", "review.js"]) {
    test(`dist check rejects retired ${file}`, async () => {
        const root = await fixture();
        try {
            await writeFile(join(root, "js", file), "retired", "utf8");
            assert.throws(() => checkDist(root), new RegExp(`retired asset reintroduced: js/${file.replace(".", "\\.")}`));
        } finally {
            await rm(root, { recursive: true, force: true });
        }
    });
}

for (const file of ["robots.txt", "sitemap.xml"]) {
    test(`dist check fails when ${file} is removed`, async () => {
        const root = await fixture();
        try {
            await rm(join(root, file));
            assert.throws(() => checkDist(root), new RegExp(`missing required asset: ${file.replace(".", "\\.")}`));
        } finally {
            await rm(root, { recursive: true, force: true });
        }
    });
}

test("dist check rejects sitemap locations without generated routes", async () => {
    const root = await fixture();
    try {
        const sitemap = await readFile(join(root, "sitemap.xml"), "utf8");
        await writeFile(join(root, "sitemap.xml"), sitemap.replace("https://anothel.github.io/today/", "https://anothel.github.io/missing/"), "utf8");
        assert.throws(() => checkDist(root), /missing sitemap route: https:\/\/anothel\.github\.io\/missing\//);
    } finally {
        await rm(root, { recursive: true, force: true });
    }
});

test("dist check fails on malformed generated data", async () => {
    const root = await fixture();
    try {
        await writeFile(join(root, "data", "today.json"), "{", "utf8");
        assert.throws(() => checkDist(root), /malformed generated data: data\/today\.json/);
    } finally {
        await rm(root, { recursive: true, force: true });
    }
});
