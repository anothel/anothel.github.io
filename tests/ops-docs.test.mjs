import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const readme = readFileSync("README.md", "utf8");

test("README explains data refresh automation for operators", () => {
    assert.match(readme, /## Data Refresh Automation/);
    assert.match(readme, /workflow_dispatch/);
    assert.match(readme, /schedule/);
    assert.match(readme, /17 21 \* \* \*/);
    assert.match(readme, /GITHUB_TOKEN/);
    assert.match(readme, /checked-in JSON/);
    assert.match(readme, /partial/);
    assert.match(readme, /refresh-report/);
    assert.match(readme, /GitHub Step Summary/);
    assert.match(readme, /node --test tests\/\*\.test\.mjs/);
});

test("README keeps local and scheduled data update command order aligned", () => {
    const commands = [
        "node scripts/update-trends.mjs",
        "node scripts/update-packages.mjs",
        "node scripts/update-repos.mjs",
        "node scripts/update-links.mjs",
        "node scripts/update-today.mjs",
        "node scripts/update-manifest.mjs",
        "node --check scripts/report-refresh.mjs"
    ];

    let previousIndex = -1;
    for (const command of commands) {
        const index = readme.indexOf(command);
        assert.ok(index > previousIndex, `${command} should appear after previous update command`);
        previousIndex = index;
    }
});
