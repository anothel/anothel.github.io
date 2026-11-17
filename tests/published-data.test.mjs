import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { createExpectation, verifyPublished } from "../scripts/verify-published.mjs";
import { readRefreshInput, assessRefresh } from "../scripts/check-refresh.mjs";

const sha = "a".repeat(40);
async function fixture(t, respond) {
    const root = await mkdtemp(join(tmpdir(), "published-data-"));
    await cp("dist", root, { recursive: true });
    const expected = await createExpectation(root, sha);
    const requests = [];
    const server = createServer(async (req, res) => {
        const url = new URL(req.url, "http://localhost");
        const file = url.pathname === "/status/" ? "status/index.html" : url.pathname.slice(1);
        requests.push({ url, headers: req.headers });
        try {
            if (respond && await respond(req, res, requests.length, file)) return;
            res.end(await readFile(join(root, file)));
        } catch { res.writeHead(404).end(); }
    });
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    t.after(async () => { server.closeAllConnections(); await new Promise((done) => server.close(done)); await rm(root, { recursive: true, force: true }); });
    return { root, expected, requests, url: `http://127.0.0.1:${server.address().port}/` };
}

test("published comparison checks all data and rendered Status with cache bypass", async (t) => {
    const f = await fixture(t);
    const result = await verifyPublished(f.expected, f.url, { attempts: 1 });
    assert.equal(result.sourceSha, sha);
    assert.equal(result.files, 10);
    assert.equal(f.requests.length, 10);
    assert.ok(f.requests.every(({ url, headers }) => url.searchParams.get("verify") && headers["cache-control"].includes("no-cache")));
});
for (const file of ["data/manifest.json", "data/today.json", "data/repos.json", "status/index.html"]) {
    test(`unchanged manifest cannot hide mismatched ${file}`, async (t) => {
        const f = await fixture(t);
        await writeFile(join(f.root, file), file.endsWith("json") ? '{"wrong":"deployment"}' : "<html>old Status</html>");
        await assert.rejects(verifyPublished(f.expected, f.url, { attempts: 1 }), new RegExp(`mismatch: ${file === "status/index.html" ? "status/" : file}`));
    });
}
test("propagation retry compares the complete set again", async (t) => {
    let old = true;
    const f = await fixture(t, async (_req, res, _n, file) => {
        if (old && file === "data/repos.json") { res.end("old cached data"); return true; }
        return false;
    });
    const result = await verifyPublished(f.expected, f.url, { attempts: 2, delayMs: 0, onRetry: () => { old = false; } });
    assert.equal(result.attempt, 2);
    assert.equal(f.requests.length, 20);
    assert.equal(new Set(f.requests.map(({ url }) => url.searchParams.get("verify"))).size, 2);
});
test("HTTP failures retry and fail closed after the bounded attempt count", async (t) => {
    const f = await fixture(t, async (_req, res) => { res.writeHead(503).end("unavailable"); return true; });
    await assert.rejects(verifyPublished(f.expected, f.url, { attempts: 2, delayMs: 0, onRetry: () => {} }), /HTTP 503/);
    assert.equal(f.requests.length, 20);
});
test("timeouts cannot produce a successful verification", async (t) => {
    const f = await fixture(t, async () => true);
    await assert.rejects(verifyPublished(f.expected, f.url, { attempts: 1, timeoutMs: 30 }), /Published verification failed/);
});
test("incomplete receipts and invalid retry budgets cannot silently pass", async (t) => {
    const f = await fixture(t);
    await assert.rejects(verifyPublished({ ...f.expected, files: {} }, f.url), /Invalid deployment expectation/);
    await assert.rejects(verifyPublished(f.expected, f.url, { attempts: 0 }), /Invalid verification budget/);
    await assert.rejects(verifyPublished(f.expected, f.url, { delayMs: -1 }), /Invalid verification budget/);
});
test("remote refresh checking reads actual generated data and fails on unreadable output", async (t) => {
    const f = await fixture(t);
    const input = await readRefreshInput(f.url);
    assert.equal(input.manifest.generatedAt, JSON.parse(await readFile(join(f.root, "data/manifest.json"))).generatedAt);
    assert.equal(assessRefresh(input, "2027-01-01T00:00:00.000Z").pipeline.state, "overdue");
    await writeFile(join(f.root, "data/manifest.json"), "<html>404</html>");
    await assert.rejects(readRefreshInput(f.url), /JSON|Unexpected token/);
});
test("published CLI returns nonzero on mismatches", async (t) => {
    const f = await fixture(t);
    const receipt = join(f.root, "expectation.json");
    await writeFile(receipt, JSON.stringify(f.expected));
    await writeFile(join(f.root, "data/today.json"), "{}");
    const child = spawn(process.execPath, ["scripts/verify-published.mjs", "--expectation", receipt, "--site-url", f.url, "--attempts", "1"], { stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    const [code] = await once(child, "close");
    assert.equal(code, 1);
    assert.match(stderr, /mismatch: data\/today.json/);
});

test("well-formed but incomplete published schemas fail the refresh monitor", async (t) => {
    const f = await fixture(t);
    await writeFile(join(f.root, "data/manifest.json"), '{"generatedAt":"2026-11-16T06:00:00.000Z","modules":[]}');
    await assert.rejects(readRefreshInput(f.url), /data contract failed/);
});

test("refresh CLI reports source uncertainty as nonzero, independently of fresh generation", async (t) => {
    const f = await fixture(t);
    const manifestPath = join(f.root, "data/manifest.json");
    const manifest = JSON.parse(await readFile(manifestPath));
    manifest.generatedAt = new Date().toISOString();
    await writeFile(manifestPath, JSON.stringify(manifest));
    const linksPath = join(f.root, "data/links.json");
    const links = JSON.parse(await readFile(linksPath));
    delete links.sourceMeta.updatedAt;
    await writeFile(linksPath, JSON.stringify(links));
    const child = spawn(process.execPath, ["scripts/check-refresh.mjs", "--site-url", f.url], { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    const [code] = await once(child, "close");
    assert.equal(code, 1);
    const result = JSON.parse(stdout);
    assert.equal(result.pipeline.state, "current");
    assert.equal(result.sources.find(({ name }) => name === "manual").health, "unknown");
});

test("independent generation CLI failure and recovery drill over HTTP", async (t) => {
    let unavailable = false;
    const f = await fixture(t, async (_req, res) => {
        if (unavailable) { res.writeHead(503).end(); return true; }
        return false;
    });
    const manifestPath = join(f.root, "data/manifest.json");
    const manifest = JSON.parse(await readFile(manifestPath));
    async function run() {
        const child = spawn(process.execPath, ["scripts/check-refresh.mjs", "--generation-only", "--site-url", f.url], { stdio: ["ignore", "pipe", "pipe"] });
        let stdout = "", stderr = "";
        child.stdout.on("data", chunk => { stdout += chunk; });
        child.stderr.on("data", chunk => { stderr += chunk; });
        const [code] = await once(child, "close");
        return { code, stdout, stderr };
    }
    manifest.generatedAt = new Date(Date.now() - 37 * 3600000).toISOString();
    await writeFile(manifestPath, JSON.stringify(manifest));
    const stale = await run();
    assert.equal(stale.code, 1);
    assert.equal(JSON.parse(stale.stdout).pipeline.state, "overdue");
    manifest.generatedAt = new Date().toISOString();
    await writeFile(manifestPath, JSON.stringify(manifest));
    const recovered = await run();
    assert.equal(recovered.code, 0);
    assert.equal(JSON.parse(recovered.stdout).manualSources[0].freshness, "unknown");
    unavailable = true;
    const failed = await run();
    assert.equal(failed.code, 1);
    assert.match(failed.stderr, /HTTP 503/);
    unavailable = false;
    assert.equal((await run()).code, 0);
});
