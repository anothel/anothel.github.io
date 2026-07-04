# Signal Schema v2

Signal Schema v2 is the normalized item contract shared by Today, Explore, topic pages, and Review identity matching.

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

## Contract Gate

`node scripts/validate-data.mjs` is the data contract gate. It runs checked-in contract tests before generated HTML is accepted.

- Manifest contract: `data/manifest.json` owns module ids, titles, routes, data paths, counts, status, updated date, and generated timestamp.
- Refresh report contract: `data/refresh-report.json` owns generated timestamp, manifest date, totals, changed modules, run context, module rows, source rows, errors, and safety details.
- Signal policy contract: `data/signal-policy.json` owns baseline penalty, intent threshold, and baseline titles.
- Normalized item example: any rendered signal must validate through `js/signal-schema.js`, keep `schemaVersion: 2`, carry a stable id, source module, source kind, canonical key, source list, safe URL, and bounded scores.

JSON Schema files stay deferred. Add them only when `tests/data-schema.test.mjs` and current validator tests miss real mismatches.

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

Source detail copy:

- Non-ok source details must preserve usable-data context and name the recovery action.
- Partial rate-limit details name the failed source, remove long API URLs from the rendered error, keep `rateLimited` visible, and say to retry data refresh.
- Error details remove long API URLs and name `retry data refresh` as the recovery action.
- Source coverage must not report more emitted rows than tracked rows.

## Validation

Current validation lives in:

- `tests/data-schema.test.mjs`
- `tests/signal-quality-golden.test.mjs`
- `tests/today-generator.test.mjs`
- `tests/explore-ui.test.mjs`
- `scripts/validate-data.mjs`

Future JSON Schema files should start only when they catch mismatches that current tests miss.
