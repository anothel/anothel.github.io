import test from "node:test";
import assert from "node:assert/strict";

import { buildRepoRows } from "../scripts/update-repos.mjs";

test("buildRepoRows sorts repos by stars and formats rows", () => {
    const rows = buildRepoRows(
        [
            {
                full_name: "vitejs/vite",
                html_url: "https://github.com/vitejs/vite",
                description: "Next generation frontend tooling.",
                stargazers_count: 75000,
                forks_count: 6800,
                pushed_at: "2026-06-01T12:00:00Z",
                topics: ["frontend", "tooling"]
            },
            {
                full_name: "react/react",
                html_url: "https://github.com/react/react",
                description: "The library for web and native user interfaces.",
                stargazers_count: 240000,
                forks_count: 48000,
                pushed_at: "2026-06-03T12:00:00Z",
                topics: ["javascript", "ui"]
            }
        ],
        [
            { fullName: "react/react", category: "UI", focus: "frontend runtime" },
            { fullName: "vitejs/vite", category: "Tooling", focus: "build tool" }
        ]
    );

    assert.deepEqual(rows, [
        {
            rank: 1,
            name: "react/react",
            category: "UI",
            focus: "frontend runtime",
            stars: 240000,
            starsLabel: "240K",
            forksLabel: "48K",
            pushedAt: "2026-06-03",
            url: "https://github.com/react/react",
            summary: "The library for web and native user interfaces.",
            topics: ["javascript", "ui"]
        },
        {
            rank: 2,
            name: "vitejs/vite",
            category: "Tooling",
            focus: "build tool",
            stars: 75000,
            starsLabel: "75K",
            forksLabel: "6.8K",
            pushedAt: "2026-06-01",
            url: "https://github.com/vitejs/vite",
            summary: "Next generation frontend tooling.",
            topics: ["frontend", "tooling"]
        }
    ]);
});
