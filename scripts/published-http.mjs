export async function publishedBytes(baseUrl, path, { nonce, signal, fetchImpl = fetch } = {}) {
    const base = new URL(baseUrl);
    if (!["http:", "https:"].includes(base.protocol) || base.username || base.password || base.search || base.hash) {
        throw new Error("Expected a public HTTP(S) base URL without credentials, query, or fragment");
    }
    base.pathname = `${base.pathname.replace(/\/$/, "")}/`;
    const url = new URL(path, base);
    url.searchParams.set("verify", nonce ?? crypto.randomUUID());
    const response = await fetchImpl(url, {
        headers: { "Cache-Control": "no-cache, no-store", Pragma: "no-cache" },
        cache: "no-store",
        signal: signal ?? AbortSignal.timeout(10000),
        redirect: "error"
    });
    if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
    return Buffer.from(await response.arrayBuffer());
}
