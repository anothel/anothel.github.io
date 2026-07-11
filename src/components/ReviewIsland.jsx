import React, { useEffect } from "react";

const scriptNames = [
    "local-state.js",
    "signal-schema.js",
    "safe-dom.js",
    "topic-taxonomy.js",
    "explore.js",
    "review.js"
];

function loadScript(src, attributes = {}) {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
        return existing.dataset.loaded === "true"
            ? Promise.resolve()
            : new Promise((resolve, reject) => {
                existing.addEventListener("load", resolve, { once: true });
                existing.addEventListener("error", reject, { once: true });
            });
    }

    return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = src;
        script.defer = true;
        for (const [name, value] of Object.entries(attributes)) {
            script.setAttribute(name, value);
        }
        script.addEventListener("load", () => {
            script.dataset.loaded = "true";
            resolve();
        }, { once: true });
        script.addEventListener("error", reject, { once: true });
        document.body.append(script);
    });
}

export default function ReviewIsland({ prefix = "../" }) {
    useEffect(() => {
        let cancelled = false;

        async function bootReview() {
            for (const name of scriptNames) {
                if (cancelled) return;
                const attributes = name === "review.js"
                    ? {
                        "data-trends": `${prefix}data/trends.json`,
                        "data-packages": `${prefix}data/packages.json`,
                        "data-repos": `${prefix}data/repos.json`,
                        "data-links": `${prefix}data/links.json`
                    }
                    : {};
                await loadScript(`${prefix}js/${name}`, attributes);
            }
        }

        bootReview();
        return () => {
            cancelled = true;
        };
    }, [prefix]);

    return (
        <>
            <section className="module-detail">
                <h2>Saved locally in this browser.</h2>
                <p>Items saved from Explore appear here when they still exist in current data.</p>
            </section>

            <section className="stats-grid review-stats" aria-label="Review stats">
                <article className="stat-card">
                    <span>Visible</span>
                    <strong data-review-total>0</strong>
                </article>
                <article className="stat-card">
                    <span>Unread</span>
                    <strong data-review-unread>0</strong>
                </article>
                <article className="stat-card">
                    <span>Read</span>
                    <strong data-review-read>0</strong>
                </article>
                <article className="stat-card">
                    <span>Done</span>
                    <strong data-review-done>0</strong>
                </article>
                <article className="stat-card">
                    <span>Focus areas</span>
                    <strong data-review-focus-count>0</strong>
                </article>
                <article className="stat-card">
                    <span>Sources</span>
                    <strong data-review-source-count>0</strong>
                </article>
            </section>

            <section className="review-filters" aria-label="Review status filters">
                <button type="button" data-review-filter="all" aria-pressed="true">All</button>
                <button type="button" data-review-filter="unread" aria-pressed="false">Unread</button>
                <button type="button" data-review-filter="read" aria-pressed="false">Read</button>
                <button type="button" data-review-filter="done" aria-pressed="false">Done</button>
                <button type="button" data-review-export>Export JSON</button>
                <button type="button" data-review-export-markdown>Export Markdown</button>
                <button type="button" data-review-clear>Clear Review</button>
                <button type="button" data-review-import>Import JSON</button>
                <textarea data-review-import-text placeholder="Paste Review JSON"></textarea>
                <button type="button" data-review-import-paste>Import pasted JSON</button>
                <input type="file" accept="application/json,.json" data-review-import-file hidden />
                <span data-review-portability-status>Review JSON stays local.</span>
            </section>

            <section className="review-workspace" aria-label="Review workspace">
                <aside className="review-queue-panel" aria-labelledby="review-queue-title">
                    <div className="panel-heading">
                        <h2 id="review-queue-title">Queue</h2>
                        <p>Unread first. Pick one saved signal, then open, annotate, mark done, or remove.</p>
                    </div>
                    <div className="review-queue" data-review-queue>
                        <p className="saved-empty">No saved items in current data.</p>
                    </div>
                </aside>

                <section className="review-detail" aria-labelledby="review-detail-title">
                    <div className="panel-heading">
                        <h2 id="review-detail-title">Selected item</h2>
                        <p>Next action changes with status.</p>
                    </div>
                    <div data-review-detail>
                        <article className="review-empty">
                            <h2>No saved items yet</h2>
                            <p>Saved items are local to this browser. Open Explore and save useful signals to build this queue.</p>
                            <a href={`${prefix}explore/index.html`}>Open Explore</a>
                        </article>
                    </div>
                </section>
            </section>
        </>
    );
}
