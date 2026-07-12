# Signal Schema v2

Signal Schema v2 is the normalized item contract shared by Today, Explore, topic pages, and Review identity matching.

Checked-in `data/*.json` files are the source contract consumed by refresh scripts, Astro builds, preserved browser modules, and tests. Route components do not define alternate data shapes.

## Sources

Current source families:

- `trends`: Hacker News, GitHub search, and npm trend inputs.
- `packages`: npm package watchlist.
- `repos`: GitHub repository watchlist.
- `links`: checked-in reference shelf.

## Normalized Item Contract

Required fields for a rendered signal:

- `id`: stable item id. Prefer canonical URL identity where possible.
- `title`: display title.
- `url`: external or internal URL passed through safe link handling.
- `sourceModule`: source family id.
- `source`: user-facing source label.
- `updated`: data date in `YYYY-MM-DD` form when available.

Common optional fields:

- `summary`: short reason or description.
- `metric`: user-facing count such as stars, downloads, points, or category.
- `score`: numeric source score.
- `qualityScore`: normalized quality score used for ranking.
- `topics`: matched topic labels or ids.
- `sourceContext`: list of merged source appearances for duplicate URLs.
- `legacyIds`: prior ids accepted for saved item matching.

## Identity Rules

- Canonical URL identity wins over title identity.
- Duplicate URLs merge into one normalized item.
- Legacy saved ids remain readable for Review and Explore saved queues.
- Titles alone are not enough for durable identity when a URL exists.

## Ranking Rules

- `data/signal-policy.json` owns baseline titles, baseline penalty, and intent threshold.
- Broad baseline tooling should not outrank specific agent-workflow signals by popularity alone.
- Shared normalization caps matching broad baseline packages, repos, repo short names, and npm trends before Today or Explore rank them.
- Priority ranking breaks saturated score ties by source family and source rank before title, so checked-in trend order is not displaced by alphabetic package names.
- Today and Explore may present different views, but they must share the same checked-in scoring policy.

## Score Semantics

Scores are bounded `0..100` ranking heuristics, not probabilities, percentages, quality guarantees, or absolute measurements. A score of `100` means the item reached the top of the current formula after relevance boosts and clamping; multiple items can score `100`.

Raw trend scores are source-specific:

- Hacker News: story points and comment count, plus a technical-title boost and a general-news penalty.
- GitHub trend search: logarithmic stars plus category-specific relevance boosts.
- npm trend input: logarithmic weekly downloads.

Signal Schema v2 computes `qualityScore` and sets Explore `score` to the same value:

- Trends start from the raw trend score.
- Packages use `log10(downloads + 1) / 9 * 100`.
- Repos use `log10(stars + 1) / 6 * 100`.
- Links use `max(35, 92 - rank * 3)`.
- Matching AI/agent terms add up to 20 points: 12 for AI/LLM/agent terms, 8 for skill/MCP/vendor/framework terms, and 4 for coding/workflow terms.
- Broad baseline package, repo, and npm signals with weak intent are capped at 76.
- Final values are rounded and clamped to `0..100`.

Today preserves `qualityScore` but uses a section-selection score: trends keep their raw score; repos use `max(65, 86 - sourceRank)`; packages use `max(60, 76 - sourceRank)`; links use `max(50, 66 - sourceRank)`. This behavior is unchanged.

Scores can rank items within the same view. Cross-source comparison is approximate because each source begins with a different measurement and scale. Use `scoreReasons`, source metric, source rank, and category alongside the number; do not interpret a package 80 and a repo 80 as equal real-world impact.

## Contract Gate

`node scripts/validate-data.mjs` is the data contract gate.
`npm run validate:data` is the focused JSON source contract gate.
`npm run check` runs the same data validation before broader tests and syntax checks.

- Manifest contract: `data/manifest.json` owns module ids, titles, routes, data paths, counts, status, updated date, and generated timestamp.
- Refresh report contract: `data/refresh-report.json` owns generated timestamp, manifest date, totals, changed modules, run context, module rows, source rows, errors, and safety details.
- Signal policy contract: `data/signal-policy.json` owns baseline penalty, intent threshold, and baseline titles.
- Source data contracts: `data/trends.json`, `data/packages.json`, `data/repos.json`, and `data/links.json` own ranked records, required display text, category/source values, scores/counts, safe URLs, source metadata, and stable duplicate checks.
- Today contract: `data/today.json` owns stable sections, Signal Schema v2 fields, source module/kind values, canonical keys, score reasons, bounded scores, source lists, and duplicate item identity checks.
- Watchlist contract: `data/watchlists.json` owns editable source definitions, supported categories, disabled/history governance fields, safe URLs, and duplicate source identifiers.
- Normalized item example: any rendered signal must validate through `js/signal-schema.js`, keep `schemaVersion: 2`, carry a stable id, source module, source kind, canonical key, source list, safe URL, and bounded scores.

Blocking errors include missing required fields, invalid field types, malformed dates, malformed URLs, score values outside allowed ranges, duplicate stable ids, invalid source/category values, empty required text, invalid `generatedAt` timestamps, invalid arrays/nested objects, and unsupported record shapes.

Warnings are non-blocking operator signals. Today this only covers extra untracked JSON files under `data/`; checked-in source files must match their known shape.

Readable diagnostics include file, record path, field, expected value/type, actual value/type, and message:

```text
[error] data/trends.json items[0] score expected number 0..100; actual integer 101 - score outside the allowed range
```

JSON Schema files stay deferred; the checked-in contract currently lives in `scripts/data-contract.mjs` and focused tests.

## Source Metadata

Source metadata states:

- `ok`: source refreshed and data is usable.
- `partial`: source produced useful data but one or more fetches failed or were rate-limited.
- `fallback`: source reused previous useful data after a failed or empty refresh.
- `error`: source failed without usable current or fallback rows.

Markers:

- `rateLimited`: source or package hit a rate limit.
- `fallbackUsed`: previous data was reused.
- `staleButSafe`: previous data is old but better than empty output.
- `fallbackReason`: short operator-facing reason.

### Timestamp Semantics

Machine timestamps use ISO 8601 UTC with timezone, for example `2026-07-07T12:40:06.462Z`.

Repository JSON uses camelCase `generatedAt`. `generated_at` is not a current field name.

- Dataset `generatedAt`: when that JSON snapshot was assembled by the data pipeline. It is pipeline generation time, not source publication time and not page build time.
- Source `updatedAt`: last successful fetch or collection time for usable source data. Partial sources may use the time of the successful partial collection.
- Source `previousUpdated`: last successful source update retained by fallback logic. It uses the same ISO timestamp format.
- Refresh report `generatedAt`: when the refresh report was assembled.
- Manifest `generatedAt`: when the manifest was assembled.
- `updated`: legacy `YYYY-MM-DD` display/compatibility date derived from pipeline output. It is not used to prove source freshness.
- Repo item `pushedAt`: source publication/activity date reported by GitHub, not fetch time.

Astro page build time is not stored as source freshness. Manual reference links have no trustworthy source fetch timestamp, so their freshness is `unknown`; regenerating `links.json` does not make those references fresh.

### Freshness Model

`js/data-health.js` centrally defines `fresh`, `aging`, `stale`, `unknown`, and `unavailable`, and returns structured `lastSuccessfulUpdate`, `ageDays`, `state`, and `staleReason` values. Status rows expose these as `lastSuccessfulUpdate`, `ageDays`, `freshnessState`, and `staleReason`.

Default thresholds for Hacker News, GitHub, npm, and generated source data:

- `fresh`: 0-1 whole UTC days old.
- `aging`: 2-3 whole UTC days old.
- `stale`: more than 3 whole UTC days old; reason is `older than 3 days`.

Manual-source thresholds are 0-30 days fresh, 31-90 days aging, and more than 90 days stale when a trustworthy source timestamp is ever supplied. Current manual reference data has no such timestamp and therefore remains `unknown`.

- `unknown`: last successful source timestamp is missing, malformed, date-only, or otherwise ambiguous. No timestamp is invented.
- `unavailable`: source is in error with zero usable rows. Availability failure is distinct from age.
- Fallback age is calculated from `previousUpdated`, never from the failed attempt or current pipeline generation time.
- Future timestamps clamp to age zero to avoid false negative ages; clock skew does not imply extra freshness.

Source detail copy:

- Non-ok source details must preserve usable-data context and name the recovery action.
- Partial rate-limit details name the failed source, remove long API URLs from the rendered error, keep `rateLimited` visible, and say to retry data refresh.
- Error details remove long API URLs and name `retry data refresh` as the recovery action.
- Source coverage must not report more emitted rows than tracked rows.

## Validation

Current validation lives in:

- `scripts/data-contract.mjs`
- `tests/data-schema.test.mjs`
- `tests/data-contract.test.mjs`
- `tests/signal-quality-golden.test.mjs`
- `tests/today-generator.test.mjs`
- `tests/explore-react-domain.test.mjs`
- `scripts/validate-data.mjs`

Use `npm run validate:data` for source contract changes and `npm run check` before accepting generated output.
