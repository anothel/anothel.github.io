# Release Checklist

Use this before publishing meaningful site, data, or operations changes.

## Release Policy

This repo uses dated `CHANGELOG.md` entries and normal GitHub Pages publish. No Git tag is required until versioned releases exist.

## Required Checks

```powershell
npm run check
node scripts/validate-data.mjs
git diff --check
```

Run focused tests for touched areas:

```powershell
node --test tests/ops-docs.test.mjs
node --test tests/static-fallback.test.mjs tests/site-structure.test.mjs
```

## Minimum Checks By Work Type

| Work type | Minimum extra checks |
|---|---|
| Docs-only | `node --test tests/ops-docs.test.mjs` |
| UI | `node --test tests/site-structure.test.mjs` plus the touched renderer test |
| Data refresh | `node scripts/validate-data.mjs` and generated data review below |
| Fallback generator | `node --test tests/static-fallback.test.mjs tests/site-structure.test.mjs` |

## Generated Data Review

Check before publishing generated data:

- `data/manifest.json` counts match module data.
- `data/refresh-report.json` explains source health.
- Today data exists and has expected sections.
- Static fallback pages were regenerated after data changes.
- `sitemap.xml` data-driven route `lastmod` values match `data/manifest.json` `updated`.
- Any `partial`, `fallback`, `staleButSafe`, or `rateLimited` state is visible and acceptable.

## Security Review

Check when rendering or source handling changed:

- Unsafe URLs are blocked or replaced.
- Generated text is escaped.
- External links keep safe attributes where rendered.
- Referrer policy still matches the external-link `noreferrer` decision.
- GitHub Actions pinning and Dependabot decisions still match the current dependency-free workflow posture.
- localStorage import/export treats payload as untrusted.

## Docs Review

Update docs when behavior changes:

- `README.md` for commands or surface changes.
- `docs/ROADMAP.md` for future work only.
- `docs/IA.md` for product, route, or vocabulary decisions.
- `docs/SIGNAL_SCHEMA.md` for normalized data contract changes.
- `docs/SOURCE_GOVERNANCE.md` for source policy changes.
- `docs/THREAT_MODEL.md` or `SECURITY.md` for security posture changes.
- `CHANGELOG.md` for user-visible or operator-visible changes.

## Publish Decision

Publish when:

- Required checks pass.
- A dated `CHANGELOG.md` entry covers user-visible or operator-visible changes.
- Known partial/fallback states are intentional and documented.
- No unrelated generated changes are mixed into the change.
- Roadmap contains only future work.
- Public reuse boundary still matches `LICENSE`.
- GitHub Pages publish can be explained from the checks and generated-data review above.
