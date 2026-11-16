import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

test("refresh output checks accept fresh sources and safely escaped external text", () => {
    const root = mkdtempSync(join(tmpdir(), "refresh-build-"));
    try {
        for (const path of ["src", "scripts", "js", "css", "data", "tests", "astro.config.mjs", "package.json"]) {
            cpSync(path, join(root, path), { recursive: true });
        }
        symlinkSync(resolve("node_modules"), join(root, "node_modules"), process.platform === "win32" ? "junction" : "dir");
        const env = { ...process.env };
        // Child node --test must run its own tests rather than inherit this runner.
        delete env.NODE_TEST_CONTEXT;
        const now = new Date().toISOString();
        for (const name of ["trends", "packages", "repos", "links"]) {
            const path = join(root, "data", `${name}.json`);
            const data = JSON.parse(readFileSync(path, "utf8"));
            for (const source of [data.sourceMeta].flat()) {
                source.status = "ok";
                source.updatedAt = now;
            }
            if (name === "trends" || name === "repos") {
                const item = (data.items || data.repos)[0];
                item.summary = `A developer's "quoted" <script>alert('x')</script> & reference`;
            }
            writeFileSync(path, JSON.stringify(data));
        }
        execFileSync(process.execPath, [resolve("node_modules/astro/bin/astro.mjs"), "build"], { cwd: root, env, stdio: "pipe" });
        // Exercise the actual scheduled-workflow assertions, not a duplicate of them.
        let output;
        try {
            output = execFileSync(process.execPath, ["--test", "--test-reporter=tap", "--test-name-pattern=Astro build output renders migrated|Astro source routes render complete", "tests/astro-build.test.mjs"], { cwd: root, env, encoding: "utf8" });
        } catch (error) {
            assert.fail(error.stdout?.toString() || error.message);
        }
        assert.match(output, /# fail 0/);
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});
