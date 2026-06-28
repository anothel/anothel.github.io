# Threat Model

## System

Static GitHub Pages site with checked-in HTML, CSS, JavaScript, and JSON. Data refresh runs through local scripts and GitHub Actions.

There is no backend, account system, sync service, or database.

## Assets

- Public page integrity.
- Generated data integrity.
- Source health and refresh-report accuracy.
- User localStorage review queue.
- GitHub workflow write permission.
- Optional `GITHUB_TOKEN` used for refreshes.

## Trust Boundaries

- Remote sources: Hacker News, GitHub, npm.
- Checked-in watchlists and generated JSON.
- Browser localStorage.
- Public route rendering.
- GitHub Actions job with contents write permission.

## Main Threats

- External source data injects HTML or unsafe URLs into rendered pages.
- Malicious or mistaken watchlist entries create unsafe links.
- Rate-limited or failed refresh hides stale data.
- Generated data and manifest counts drift apart.
- Workflow commits incomplete generated output.
- localStorage import contains hostile text or URLs.

## Current Controls

- Shared safe DOM helpers escape HTML and restrict hrefs.
- External item links rendered from data use `rel="noopener noreferrer"`.
- Renderer tests cover unsafe links and generated text escaping.
- Source metadata exposes `ok`, `partial`, `fallback`, and `error`.
- Static fallback pages keep useful checked-in content without JavaScript.
- `validate-data` checks data, scripts, public JS syntax, and docs contracts.
- Update workflow validates generated data before commit.
- Workflow concurrency prevents overlapping refresh commits.

## Accepted Risks

- localStorage data is user-controlled and local to the browser.
- External sites may change or disappear after links are rendered.
- GitHub Actions use major-version actions today; stricter SHA pinning is deferred until CI basics are in place.
- CSP is not enforced yet; renderer safety tests remain the first control.

## Review Triggers

Revisit this threat model when adding:

- New source family.
- New public route that renders generated data.
- New localStorage import/export behavior.
- New workflow permission.
- Framework or build tooling.
- Any backend, account, sync, or server function.
