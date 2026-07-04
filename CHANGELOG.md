# Changelog

All notable project and operations changes should be recorded here.

This repository does not yet use versioned releases. Use dated entries until a tag policy is adopted.

## Unreleased

- Added Status page snapshot time copy so data date, refresh run, source health, and checked-in page generation stay distinct.
- Added a static fallback freshness contract covering Home, Today, Status, Explore, manifest, and refresh-report dates.
- Updated data-driven sitemap lastmod values from the manifest date during static fallback generation.
- Applied the 2026-07-04 freshness/framework reassessment to Roadmap triggers without adding duplicate work queues.
- Reused the static fallback tagged-text updater for single-field data-mode copy to reduce page-specific regex replacement.
- Ran 2026-07-04 token-backed publish-health refresh; GitHub-backed sources stayed `ok`, leaving npm package 429 as the accepted partial source with preserved rows.
- Pruned completed implementation details from Roadmap current-state notes so the Roadmap stays a next-work queue.
- Rewrote Roadmap as a future-work queue with concrete publish, review, signal-quality, Explore, trust, and architecture-gate bundles.
- Folded the repo analysis intake and accepted follow-up work directly into the Roadmap.
- Added public security, contribution, signal schema, source governance, threat model, and release checklist docs.
- Expanded README around operating commands, data refresh, verification, and project boundaries.
- Reworked Roadmap around future operational trust work: verification entry points, npm partial handling, renderer safety, data contract enforcement, and release discipline.
- Added dependency-free `package.json` scripts and read-only PR CI validation.
- Marked npm 429 partial refreshes as explicit `rateLimited` metadata while preserving useful package rows.
- Added shared external-link attribute rendering and static fallback coverage for renderer safety.
- Strengthened data contract negative fixtures and documented dated GitHub Pages release policy.
- Recorded the generated data publish drill outcome and promoted module-type warning cleanup as the next Roadmap item.
- Renamed Home, Today, and Status ESM browser modules to `.mjs` so Node validation runs without module-type warnings.
- Confirmed npm `n8n-workflow` still returns 429 with preserved package rows; next publish confirmation needs `GITHUB_TOKEN`.
- Ran authenticated refresh with `gh auth token`; GitHub trends recovered to `ok`, leaving npm `n8n-workflow` as the only accepted non-ok source.
- Confirmed refreshed priority, topic, and module snapshots remain publishable without watchlist or signal-policy changes.
- Confirmed generated data, static snapshots, docs, and release notes are ready for user-owned staging and commit.
- Confirmed published Home, Today, Explore, Review, Status, source detail, topic, and data JSON routes match checked-in source health.
- Ran another token-backed refresh; GitHub trends stayed `ok`, while npm `n8n-workflow` remained the only accepted partial source.
- Kept npm `n8n-workflow` active as accepted visible partial source health because preserved package rows still cover workflow automation.
- Ran unauthenticated publish-health refresh; generated data stayed publishable with GitHub trend 403 partial and npm `n8n-workflow` 429 partial visible.
- Ran token-backed publish-health rerun; all refresh sources recovered to `ok` with 108 generated items and no source errors.
- Clarified Review's stale local-saved state when saved browser records no longer match current data.
- Browser-smoked Explore save to Review, Review status and metadata updates, exports, and cleanup on the local static server.
- Added a Paste JSON Review import path so local saved queues can be restored without automating a file chooser.
- Removed the completed Saved Review Workflow bundle from the active Roadmap and queued native file chooser smoke as a later trigger.
- Ran 2026-06-29 unauthenticated publish-health refresh; generated data stayed publishable with GitHub trend 403 partial and npm `n8n-workflow` 429 partial visible.
- Updated Roadmap P0 current state to queue a token-backed rerun for full GitHub trend confirmation.
- Fixed static fallback regeneration on CRLF-checked-out Trends pages.
- Ran token-backed 2026-06-29 publish-health rerun; GitHub trends recovered to `ok`, leaving npm `n8n-workflow` 429 as the only visible partial source.
- Capped broad baseline repo scoring in shared signal normalization and updated the golden signal-quality fixture so workflow signals displace generic high-star repos in Explore priority.
- Kept Explore saved-search apply feedback visible after a saved search restores focus, query, and sort.
- Documented the referrer policy decision: keep external data links on `rel="noopener noreferrer"` and defer a site-wide meta referrer tag until outbound links cannot use `noreferrer`.
- Documented GitHub Actions pinning and Dependabot decisions for the current dependency-free workflow posture.
- Clarified partial source detail copy so npm `n8n-workflow` 429 names the failed package, hides the long API URL, and keeps retry guidance visible.
- Prevented source coverage from reporting emitted rows above tracked rows in generated data and refresh reports.
- Aligned Explore dynamic and checked-in fallback cards around score reasons, source context, signal-fit ARIA text, and source links.
- Hardened Explore card activation so external item clicks use `noopener,noreferrer` when opened from JavaScript.
- Reused shared source detail copy in Status refresh-run attention so partial errors stay sanitized and keep retry guidance.
- Moved Architecture Gate out of the active Roadmap queue so framework PoC work only starts after a measured blocker exists.
- Clarified that public repository reuse remains source-available with all rights reserved unless `LICENSE` says otherwise.
- Aligned Roadmap P0 current state with the checked-in 2026-06-30 scheduled refresh report.
- Added explicit static fallback markers for Explore source-health and result blocks to reduce generator regex fragility.
- Ran 2026-07-03 local unauthenticated publish-health refresh; generated data stayed publishable partial with GitHub trend 403 rate limits and npm `n8n-workflow` 429 visible.
- Clarified Roadmap working rules for explicitly approved agent staging and commits while keeping push, deploy, release, and external changes approval-gated.
- Aligned contribution Git ownership guidance with the approval-gated agent staging and commit rules.
- Ran 2026-07-03 token-backed publish-health refresh; GitHub trend health recovered to `ok`, leaving npm `n8n-workflow` 429 as the only non-ok source.
- Aligned threat-model SHA pinning rationale with the current GitHub-owned-actions and dependency-free workflow posture.
- Fixed Explore priority tie-breaking so saturated scores keep source rank ahead of alphabetic package names.
- Kept stale Explore saved-search module/category filters from restoring obsolete empty result sets.
- Kept single-error source health details sanitized while naming retry data refresh as recovery.
- Ran 2026-07-04 KST token-backed publish-health refresh; GitHub-backed sources stayed `ok`, leaving npm `n8n-workflow` 429 as the only non-ok source.
- Aligned Roadmap P0 current state with the latest checked-in token-backed refresh report.
- Removed redundant Explore item-link copy and aligned Roadmap current-state notes with card activation behavior.
- Shortened long Explore query copy in saved search labels and active-filter summaries while preserving stored query ids.
- Capped broad repo short-name matches in shared signal normalization so Today and Explore ranking policy stay aligned.
- Removed Explore card activation attributes from cards whose item URLs are blocked by the shared safe-href policy.

## 2026-06-28

- Watchlist governance rejects `history.date` values after the current data date.
- Today baseline priority scoring derives baseline penalty from `data/signal-policy.json`.
- Source detail static pages keep top source rows in checked-in HTML for no-JS and blocked-fetch visits.
- Authenticated GitHub refresh recovered GitHub trend source health to `ok`; npm `n8n-workflow` 429 remains the active partial follow-up.
