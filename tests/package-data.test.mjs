import test from "node:test";
import assert from "node:assert/strict";

import { buildPackageRows } from "../scripts/update-packages.mjs";

test("buildPackageRows sorts packages by downloads and formats rows", () => {
    const rows = buildPackageRows(
        [
            { package: "vite", downloads: 1200, start: "2026-06-01", end: "2026-06-07" },
            { package: "react", downloads: 9000, start: "2026-06-01", end: "2026-06-07" }
        ],
        [
            { name: "react", category: "UI", focus: "frontend runtime" },
            { name: "vite", category: "Tooling", focus: "build tool" }
        ]
    );

    assert.deepEqual(rows, [
        {
            rank: 1,
            name: "react",
            category: "UI",
            focus: "frontend runtime",
            downloads: 9000,
            downloadsLabel: "9K/week",
            period: "2026-06-01 to 2026-06-07",
            url: "https://www.npmjs.com/package/react"
        },
        {
            rank: 2,
            name: "vite",
            category: "Tooling",
            focus: "build tool",
            downloads: 1200,
            downloadsLabel: "1.2K/week",
            period: "2026-06-01 to 2026-06-07",
            url: "https://www.npmjs.com/package/vite"
        }
    ]);
});
