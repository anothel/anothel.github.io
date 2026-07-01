# Contributing

## Local Setup

No package install is required today.

```powershell
npm run serve
npm run check
```

Use Node 20 or newer.

If PowerShell blocks `npm.ps1`, use `npm.cmd run check`.

## Change Rules

- Keep the site static-first.
- Prefer existing helpers over new abstractions.
- Keep public route additions out unless `docs/ROADMAP.md` accepts the route job.
- Keep completed work out of `docs/ROADMAP.md`.
- Update docs when changing source health, data contract, refresh workflow, release process, or security posture.
- Do not assume public reuse rights beyond `LICENSE`.

## Data Changes

Use the full refresh path before accepting generated data changes:

```powershell
$env:GITHUB_TOKEN="optional-token-for-local-github-api-refresh"
node scripts/update-all.mjs
npm run check
```

If `GITHUB_TOKEN` is missing, GitHub-backed sources may stay `partial` or `rateLimited`. That is acceptable only when Status and `data/refresh-report.json` explain the state.

## Verification

Before handing off a change:

```powershell
npm run check
git diff --check
```

Run focused tests for touched areas, for example:

```powershell
node --test tests/ops-docs.test.mjs
node --test tests/static-fallback.test.mjs tests/site-structure.test.mjs
```

## Git Ownership

This workspace uses user-owned staging, commits, and pushes. Contributors should not rewrite history, force push, or stage unrelated files without explicit instruction.
