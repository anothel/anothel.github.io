# anothel.github.io

Static-first personal signal dashboard for deciding what technical signal to open next.

The site gathers AI engineering and developer-workflow signals from Hacker News, GitHub, npm, and checked-in references. It ships as plain HTML, CSS, JavaScript, and checked-in JSON on GitHub Pages.

## Start Here

```powershell
node scripts/serve.mjs
node scripts/validate-data.mjs
```

Then open `http://127.0.0.1:58117/`.

Use `docs/ROADMAP.md` for next work. Keep completed work out of the roadmap.

## Project Docs

- `docs/ROADMAP.md`: future work queue, decision metrics, deferred boundaries.
- `docs/IA.md`: product sentence, route jobs, vocabulary, completed information-architecture decisions.
- `docs/ARCHITECTURE.md`: static architecture and framework PoC gate.
- `docs/SIGNAL_SCHEMA.md`: normalized Signal Schema v2 contract.
- `docs/SOURCE_GOVERNANCE.md`: source, watchlist, partial, and fallback rules.
- `docs/THREAT_MODEL.md`: static-site threat model and current controls.
- `docs/RELEASE_CHECKLIST.md`: release and generated-data review checklist.
- `SECURITY.md`: vulnerability reporting and security posture.
- `CONTRIBUTING.md`: local workflow and change rules.
- `CHANGELOG.md`: user-visible and operations-visible changes.

## Runtime Surface

| Area | Files | Job |
|---|---|---|
| Decision | `index.html`, `today/index.html` | Open-now hub and generated priority brief. |
| Discovery | `explore/index.html`, `topics/*`, `notes/index.html` | Search, filter, save, and inspect focused themes. |
| Trust / state | `review/index.html`, `status/index.html` | Local saved queue and source health. |
| Source detail | `trends/index.html`, `packages/index.html`, `repos/index.html`, `links/index.html` | Inspect one source family or reference shelf. |
| Data | `data/*.json` | Checked-in source snapshots, manifest, report, watchlists, and `data/signal-policy.json` for Today and Explore scoring policy. |
| Client JS | `js/*.js` | Page renderers plus shared safe DOM, data health, local state, signal schema. |
| Refresh scripts | `scripts/update-*.mjs`, `scripts/report-refresh.mjs` | Generate data, reports, and no-JS static fallbacks. |
| Tests | `tests/*.test.mjs` | Data, UI renderer, workflow, static fallback, and governance checks. |

## Local Preview

Use the local static server so nested routes and JSON fetches match GitHub Pages:

```powershell
node scripts/serve.mjs
```

## Data Updates

Run the full local refresh in the same order as GitHub Actions:

```powershell
$env:GITHUB_TOKEN="optional-token-for-local-github-api-refresh"
node scripts/update-all.mjs
node scripts/validate-data.mjs
```

`GITHUB_TOKEN` is optional for local runs, but unauthenticated GitHub API calls can stay `partial` or `rateLimited`. `node scripts/update-all.mjs` warns when it is missing.

The full refresh order is:

1. `node scripts/update-trends.mjs`
2. `node scripts/update-packages.mjs`
3. `node scripts/update-repos.mjs`
4. `node scripts/update-links.mjs`
5. `node scripts/update-today.mjs`
6. `node scripts/update-manifest.mjs`
7. `node scripts/report-refresh.mjs`
8. `node scripts/update-static-fallbacks.mjs`

Use individual updater scripts only for focused debugging. Use `update-all` before committing generated data so Today, Manifest, refresh-report, and static fallback pages stay aligned.

## Data Refresh Automation

`.github/workflows/update-trends.yml` keeps generated data warm. The workflow name is `Update data`; the file name is legacy.

- Manual refresh: `workflow_dispatch`.
- Manual note: `reason` input appears in the refresh report.
- Scheduled refresh: `schedule` runs `17 21 * * *` UTC daily.
- Auth: GitHub API calls use `GITHUB_TOKEN` from workflow secrets.
- Scope: generated `data/*.json` files and refreshed static fallback pages are committed.
- Safety: `concurrency` prevents overlapping data refresh jobs, updater logs are grouped, and `node scripts/validate-data.mjs` runs before commit.
- Run summary: each workflow writes GitHub Step Summary, commits `data/refresh-report.json`, and uploads a `refresh-report` artifact.
- Failure model: source fetch failures are stored as `error` or `partial` when useful rows remain. Empty full refreshes reuse stale but safe previous data where supported.
- Fallback markers: source metadata uses `fallbackUsed`, `staleButSafe`, `fallbackReason`, and `rateLimited` when applicable. Status and refresh-report expose those markers.

## Verification

Primary check:

```powershell
node scripts/validate-data.mjs
git diff --check
```

Focused checks used often:

```powershell
node --test tests/ops-docs.test.mjs
node --test tests/static-fallback.test.mjs tests/site-structure.test.mjs
node --test tests/package-data.test.mjs tests/status-ui.test.mjs
node --check scripts/update-all.mjs
node --check scripts/validate-data.mjs
node --check scripts/report-refresh.mjs
```

## Publishing

Push checked-in HTML, CSS, JavaScript, JSON, and docs to the GitHub Pages branch configured for this repository.

Do not publish a refresh result if `data/manifest.json`, `data/refresh-report.json`, Today data, or static fallback pages are out of sync. Run `node scripts/validate-data.mjs` first.

## Boundaries

- No backend, account, sync, or database.
- No framework unless the architecture gate records a measured vanilla JavaScript blocker.
- No portfolio, resume, worklog, or company-history route while the product remains a signal dashboard.
- Local saved review state stays browser-only.

## Notes

The old SB Admin template files were removed. This site now uses plain HTML and CSS.
