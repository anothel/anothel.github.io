import React, { useEffect } from "react";

const scriptNames = [
    "local-state.js",
    "safe-dom.js",
    "data-health.js",
    "signal-schema.js",
    "topic-taxonomy.js",
    "explore.js"
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

export default function ExploreIsland({ prefix = "../", fallback }) {
    useEffect(() => {
        let cancelled = false;

        async function bootExplore() {
            for (const name of scriptNames) {
                if (cancelled) return;
                const attributes = name === "explore.js"
                    ? {
                        "data-manifest": `${prefix}data/manifest.json`,
                        "data-trends": `${prefix}data/trends.json`,
                        "data-packages": `${prefix}data/packages.json`,
                        "data-repos": `${prefix}data/repos.json`,
                        "data-links": `${prefix}data/links.json`,
                        "data-signal-policy": `${prefix}data/signal-policy.json`
                    }
                    : {};
                await loadScript(`${prefix}js/${name}`, attributes);
            }
        }

        bootExplore();
        return () => {
            cancelled = true;
        };
    }, [prefix]);

    return (
        <>
            <section className="explore-command-bar" aria-labelledby="explore-command-title">
                <div className="explore-command-header">
                    <div>
                        <h2 id="explore-command-title">Find signals</h2>
                        <p data-explore-summary>{fallback.summary}</p>
                    </div>
                    <div className="explore-command-actions">
                        <button className="ghost-button" type="button" data-clear-filters>Clear filters</button>
                        <a href={`${prefix}review/index.html`}>Review later</a>
                    </div>
                </div>

                <details className="explore-filter-shell" data-explore-filter-shell open>
                    <summary className="explore-filter-toggle">
                        <span>Filters and saved searches</span>
                    </summary>
                    <div className="explore-workbench">
                        <div className="explore-filter-board explore-control-rail">
                            <div className="explore-controls">
                                <label className="explore-search-field">
                                    Search
                                    <input data-explore-query type="search" placeholder="agent, skills, runtime" />
                                </label>
                                <label>
                                    Module
                                    <select data-explore-module defaultValue="all">
                                        <option value="all">All modules</option>
                                    </select>
                                </label>
                                <label>
                                    Sort
                                    <select data-explore-sort defaultValue="priority">
                                        <option value="priority">Priority</option>
                                        <option value="saved">Saved first</option>
                                        <option value="module">Module</option>
                                        <option value="category">Category</option>
                                    </select>
                                </label>
                            </div>

                            <div className="advanced-filter-grid" aria-label="Primary filters">
                                <label>
                                    Category
                                    <select data-explore-category defaultValue="all">
                                        <option value="all">All categories</option>
                                    </select>
                                </label>
                            </div>

                            <div className="quick-filter-group explore-focus-chips" aria-label="Signal focus">
                                <span>Signal focus</span>
                                <button type="button" data-focus-filter="all" aria-pressed="true">All</button>
                                <button type="button" data-focus-filter="AI agents" aria-pressed="false">AI agents</button>
                                <button type="button" data-focus-filter="MCP" aria-pressed="false">MCP</button>
                                <button type="button" data-focus-filter="Agent skills" aria-pressed="false">Agent skills</button>
                                <button type="button" data-focus-filter="AI evals" aria-pressed="false">AI evals</button>
                                <button type="button" data-focus-filter="AI engineering" aria-pressed="false">AI engineering</button>
                                <button type="button" data-focus-filter="Workflow automation" aria-pressed="false">Automation</button>
                                <button type="button" data-focus-filter="Developer tooling" aria-pressed="false">Tooling</button>
                                <button type="button" data-focus-filter="Security" aria-pressed="false">Security</button>
                                <button type="button" data-focus-filter="Packages" aria-pressed="false">Packages</button>
                            </div>
                        </div>

                        <aside className="explore-saved-tools" aria-label="Saved explore tools">
                            <div className="saved-searches" aria-label="Saved searches">
                                <div className="saved-searches-header">
                                    <strong>Saved searches</strong>
                                    <button type="button" data-save-search>Save search</button>
                                </div>
                                <div data-saved-searches>
                                    <p className="saved-search-empty">Save reusable filter sets here.</p>
                                </div>
                                <p className="saved-search-status" data-saved-search-status>Save reusable filter sets here.</p>
                            </div>
                            <div className="explore-defaults">
                                <div className="preference-actions" aria-label="Explore defaults">
                                    <button type="button" data-save-explore-default>Set as default</button>
                                    <button type="button" data-reset-explore-default>Reset default</button>
                                </div>
                                <p className="preference-status" data-explore-default-status>Default: All / All modules / All categories / priority</p>
                            </div>
                            <div className="explore-search-portability" aria-label="Saved search portability">
                                <div className="preference-actions" aria-label="Saved search portability actions">
                                    <button type="button" data-saved-search-export>Export JSON</button>
                                    <button type="button" data-saved-search-import>Import JSON</button>
                                </div>
                                <textarea className="search-portability-text" data-saved-search-import-text placeholder="Paste saved-search JSON"></textarea>
                                <button type="button" data-saved-search-import-paste>Import pasted JSON</button>
                                <input type="file" accept="application/json,.json" data-saved-search-import-file hidden />
                                <p className="preference-status" data-saved-search-portability-status>Saved searches stay local.</p>
                            </div>
                        </aside>
                    </div>
                </details>
            </section>

            <section className="stats-grid" aria-label="Explore stats">
                <article className="stat-card">
                    <span>Visible items</span>
                    <strong data-explore-total>{fallback.total}</strong>
                </article>
                <article className="stat-card">
                    <span>Saved</span>
                    <strong data-explore-saved-count>{fallback.savedCount}</strong>
                </article>
                <article className="stat-card">
                    <span>Categories</span>
                    <strong data-explore-categories>{fallback.categories}</strong>
                </article>
            </section>

            <section className="health-panel topic-lens-panel" aria-labelledby="topic-lens-title">
                <div className="panel-heading">
                    <h2 id="topic-lens-title">Topic lenses</h2>
                    <p>Apply a recurring theme, then open a focused page when it needs its own view.</p>
                </div>
                <div className="topic-lens-grid" data-topic-lenses dangerouslySetInnerHTML={{ __html: fallback.topicLensesHtml }} />
            </section>

            <section className="health-panel" aria-labelledby="explore-health-title">
                <div className="panel-heading">
                    <h2 id="explore-health-title">Source health</h2>
                    <p data-data-mode>{fallback.dataMode}</p>
                </div>
                <div className="source-health-grid" data-source-health dangerouslySetInnerHTML={{ __html: fallback.sourceHealthHtml }} />
            </section>

            <section className="explore-workspace" aria-label="Explore workspace">
                <aside className="saved-panel" aria-labelledby="saved-title">
                    <div className="panel-heading">
                        <h2 id="saved-title">Review later</h2>
                        <p><a href={`${prefix}review/index.html`}>Open Review</a></p>
                    </div>
                    <div className="saved-list" data-explore-saved dangerouslySetInnerHTML={{ __html: fallback.savedHtml }} />
                </aside>

                <section className="rank-panel" aria-labelledby="explore-results-title">
                    <div className="panel-heading">
                        <h2 id="explore-results-title">Results</h2>
                    </div>
                    <div className="explore-results" data-explore-results dangerouslySetInnerHTML={{ __html: fallback.resultsHtml }} />
                </section>
            </section>
        </>
    );
}
