import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { checkDocs } from "../scripts/check-docs.mjs";

const architecture = `# Architecture

This project is an Astro static site. Astro owns primary route generation and shared page structure.
React is used only for selected islands. Reject a full React SPA.
Checked-in data/*.json is the source contract. GitHub Pages is the target.
No backend, server function, database, account/login, or cloud sync. Preserve localStorage compatibility.
`;

function fixture(readme) {
    const root = mkdtempSync(join(tmpdir(), "anothel-docs-"));
    mkdirSync(join(root, "docs"));
    writeFileSync(join(root, "package.json"), JSON.stringify({ scripts: { check: "echo ok" } }));
    writeFileSync(join(root, "docs", "ARCHITECTURE.md"), architecture);
    writeFileSync(join(root, "README.md"), readme);
    return root;
}

test("documentation checker reports broken internal links with file and line", () => {
    const issues = checkDocs(fixture("# Docs\n\n[missing](docs/missing.md)\n"));
    assert.ok(issues.includes("README.md:3: broken relative link: docs/missing.md"));
});

test("documentation checker reports nonexistent npm scripts", () => {
    const issues = checkDocs(fixture("# Docs\n\nRun `npm run missing`.\n"));
    assert.ok(issues.includes("README.md:3: documented npm script does not exist: missing"));
});

test("documentation checker reports missing repository paths", () => {
    const issues = checkDocs(fixture("# Docs\n\nRun `node scripts/missing.mjs`.\n"));
    assert.ok(issues.includes("README.md:3: missing repository path: scripts/missing.mjs"));
});

test("documentation checker rejects obsolete and incomplete architecture labels", () => {
    const root = fixture("# Docs\n\nThis site ships as plain HTML, CSS, JavaScript.\n");
    writeFileSync(join(root, "docs", "ARCHITECTURE.md"), "# Architecture\n");
    const issues = checkDocs(root);

    assert.ok(issues.some((value) => value.startsWith("README.md:3: describe Astro static output")));
    assert.ok(issues.some((value) => value.startsWith("docs/ARCHITECTURE.md:1: missing required architecture statement")));
});

test("current repository documentation passes", () => {
    assert.deepEqual(checkDocs(), []);
});
