# Phase 4 ranking audit

Tracking: [Issue #6](https://github.com/anothel/anothel.github.io/issues/6). Starting main: `50c1e3d85c22e459bf7720c9ad39dec2ca2617c7` (fetched and verified).

## Reproduce offline

Run `node scripts/audit-ranking.mjs` and `node --test tests/ranking-clarity.test.mjs`. `tests/fixtures/phase4-ranking-baseline.json` freezes the four source datasets, original normalized ranking, and original Today brief. The baseline observation time is `2026-11-17T03:52:25.773Z` for Trends. These are observations, not a fabricated history or growth series.

## Confirmed problems

- Raw Trends: 12/24 at 100; Today selection scores: 6/13 at 100. In deduplicated Explore, additional full text bonuses produced 25 scores at 100.
- GitHub search used cumulative stars, category matches and taxonomy bonuses additively. Established repositories could hit the ceiling before popularity could distinguish them. Search only requires a push in the last 30 days; it does not measure a star delta.
- Trends called cumulative stars `Velocity` and forks `Signal fit`. npm weekly volume was described as movement without a comparison interval.
- Today replaced source counts with a score metric and replaced intent-matching reasons with generic topic prose. Actions were mostly the same regardless of topic.

## Small calibration changes

GitHub retains logarithmic popularity and eligibility filters. Star weight changes from 14 to 10, category bonuses are multiplied by 0.6, and the positive taxonomy bonus divisor changes from 2 to 4. Existing category boosts and relative ordering remain recognizable; the strongest Agent skills fixture now has headroom at 100K stars. This is heuristic calibration, not a learned predictor or evidence of higher real-world quality.

Both normalization implementations multiply their existing maximum-20-point text bonus by `min(1, (100 - boundedBase) / 50)`. Low scores retain the full bonus; above the midpoint the bonus shrinks toward zero. This preserves monotonicity and avoids automatically turning an 80-point source into 100. An initial full-scale attenuation candidate allowed baseline tooling into the synthetic top eight; the selected upper-half calibration preserves that existing quality regression requirement.

The selectors, source allocations, topic reservations, baseline caps, deterministic tie breakers and duplicate identity rules are unchanged. Today section selection scores remain unchanged. Priority is a separate internal selection heuristic; it is not exposed as measured momentum.

## Before / after examples

Synthetic GitHub repositories use the identical description `Reusable coding agent skills` and category Agent skills. Only star counts vary; these are not claims about real projects.

| Cumulative stars | Previous raw score | New raw score |
| --- | --- | --- |
| 1,000 | 100 | 72 |
| 10,000 | 100 | 82 |
| 100,000 | 100 | 92 |

On the frozen actual source data, Explore saturation falls **25 → 12** without losing identities. Examples: `@ai-sdk/provider` **100 → 97**; `@modelcontextprotocol/sdk` **100 → 96**. The first 12 remain tied because their stored raw scores were already clipped. Stable source-rank tie breaking still applies.

The existing synthetic golden changes `openai/codex` **100 → 90** and `Agents SDK docs` **100 → 93**, so the durable reference appears first in Explore. This ordering expresses relevance, not recency. Topic goldens similarly allow the Agent Skills standard and enduring AI engineering references ahead of previously saturated entries. Today retains its dedicated section-selection and diversity policies.

Today Start here keeps the same three real projects: `anthropics/skills`, `activepieces/activepieces`, `awslabs/mcp`. For skills, the generic recommendation now includes `196.1K stars cumulative; growth not measured` and asks the reader to inspect skill instructions and tool access. MCP actions ask for integration requirements and permissions; eval actions ask about datasets and CI integration; automation actions ask about retries and recovery. These are suggested checks, not assertions of supported features.

## Publication, limitations and rollback

The public `velocity` field, schema v2, URLs, canonical ids, legacy ids, browser storage and Astro/GitHub Pages architecture remain compatible. Copy labels are fixed at presentation level; no time-series data is added. Today is rederived from unchanged observations using its original assembly timestamp; this does not certify a new upstream fetch or human Reference review.

Raw Trends remain **12/24** saturated and Today selection scores remain **6/13** until a successful upstream refresh supplies unrounded GitHub inputs to the new formula. Compact star strings cannot recover original topic metadata or clipped scores. This PR deliberately does not rescore stored raw observations using guessed inputs. Cross-source scales are approximate, and selected source/category quotas can place lower-scored items in a section. Very large counts can still reach 100.

Rollback: revert the Phase 4 commit (code, golden fixtures and derived Today together), run `npm run check`, then let the normal refresh regenerate data. No storage migration or source contract rollback is needed. Future calibration should use reviewed representative fixtures, not arbitrary perturbations to break ties.

Issue #4 remains separate: no external alert drill or human Reference review is performed or claimed here. Before merge, require PR CI `validate` to pass; after merge, use existing Pages publication verification.

## Validation environment

The cloud workspace uses Node 24 (CI retains Node 22.12). Run `ASTRO_TELEMETRY_DISABLED=1 npm run check`; telemetry otherwise tries to create a directory outside the writable workspace. Node tests also require permission to spawn local build/test processes in this sandbox.

The default check reaches Playwright but its bundled Chromium is absent; installing it is blocked by the browser CDN returning HTTP 403. This is an environment blocker, not a ranking assertion failure. The same complete suite can use the preinstalled `/usr/bin/chromium` through a temporary, ignored config; CI and the committed Playwright config stay unchanged:

```js
// .tmp/playwright-cloud.config.mjs
import { defineConfig } from '@playwright/test';
import config from '../playwright.config.mjs';
export default defineConfig({
  ...config,
  testDir: '../tests/e2e',
  use: { ...config.use, launchOptions: { executablePath: '/usr/bin/chromium' } },
});
```

Run `ASTRO_TELEMETRY_DISABLED=1 CI=1 npx playwright test --config .tmp/playwright-cloud.config.mjs --workers=2`. Use an independent preview server: overlapping runs can otherwise reuse a server that exits when its owning run ends. Standard GitHub CI must still pass with its installed browser before merge. `npm run check:refresh` reports automated generation healthy; manual Reference freshness remains unknown under Issue #4.
