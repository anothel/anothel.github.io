# Security Policy

## Supported Surface

This repository publishes a static GitHub Pages signal dashboard.

Supported security scope:

- Astro route/components, generated `dist/`, preserved 404 HTML, pass-through metadata assets, CSS, JavaScript, and checked-in JSON.
- Data refresh scripts under `scripts/`.
- GitHub Actions data refresh workflow.
- npm build/test dependencies and lockfile.
- Public rendering of external titles, summaries, URLs, source metadata, and watchlist entries.
- Browser-only localStorage Review, saved-search, and topic-pin state.

Out of scope:

- Account takeover, server-side auth, database, payment, or API issues. This project has none.
- Third-party sites linked from the dashboard.
- Browser extensions or local machine compromise.

## Reporting

Do not open a public issue for a suspected vulnerability.

Use GitHub private vulnerability reporting if enabled for the repository. If it is not available, contact the maintainer through a private channel already known to you and include:

- Affected file, route, or workflow.
- Reproduction steps.
- Expected and actual behavior.
- Impact.
- Whether the issue requires malicious checked-in data, malicious remote source data, or only user interaction.

## Current Controls

- Static-first deployment: no server runtime, account system, sync service, or database.
- Astro build-time escaping plus safe URL handling in data-driven components.
- Topic content uses Astro escaping and shared safe external-URL handling; its native pin module updates only text and ARIA state.
- Notes taxonomy text is escaped by Astro and its internal Topic/Explore links come only from the canonical route model.
- Safe rendering helpers in `js/safe-dom.js` remain for retained renderer modules and their security regression tests; native Astro routes do not load them.
- URL allowlist behavior for public links through `safeHref` and `setSafeLink`.
- Source health metadata for `ok`, `partial`, `fallback`, and `error`.
- Stale-but-safe fallback behavior for supported refresh failures.
- localStorage state is browser-only and treated as user-controlled data; malformed or unavailable topic-pin storage must fail safely.
- `npm run check` validates data, Astro output, repository tests/syntax, accessibility, and mobile behavior.

## Security Review Triggers

Run a focused security review when changing:

- Astro or browser rendering of external data.
- Link normalization or external link attributes.
- Watchlist ingestion.
- Refresh scripts or workflow permissions.
- Build dependencies, lockfile, or GitHub Pages publishing configuration.
- localStorage schema, topic pinning, or import/export.
- Any public route that renders generated text.

## Secrets

`GITHUB_TOKEN` may be used for authenticated GitHub API refreshes. Do not commit tokens, copied API responses containing secrets, or local environment files.

The scheduled data refresh uses repository workflow credentials only to read sources and commit generated data.
