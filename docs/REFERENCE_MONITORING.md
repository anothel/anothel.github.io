# Reference review and independent refresh monitoring

Phase 3 adds code readiness only. No whole-shelf human review, external runner, notification destination, or delivered alert is asserted by this change. Existing references deliberately retain **unknown** freshness. See [deployment operations](DEPLOYMENT.md) for refresh and publication recovery.

## Manual provenance contract

`data/watchlists.json` may contain an optional `linksReview` object with four required fields:

| Field | Meaning |
| --- | --- |
| `reviewedAt` | Actual completed whole-shelf review time, full ISO timestamp with timezone |
| `reviewedBy` | Attributable reviewer identity |
| `evidence` | Review PR/issue URL or durable review notes describing scope/results |
| `contentHash` | Lowercase SHA-256 of JSON.stringify(buildLinkRows(active links)) |

A reviewer must check every active reference for reachability, identity, accuracy of title/summary/category/kind, and continuing relevance. Resolve or explicitly document exceptions in the evidence. A partial review must not certify the shelf. Review records are assertions authenticated by normal PR review and git history, not cryptographic proof that a person performed the review.

After a real review, calculate the content hash against the final reviewed list:

```sh
node --input-type=module -e 'import {referenceContentHash} from "./scripts/update-links.mjs"; console.log(referenceContentHash())'
```

Record the actual time, reviewer, evidence and hash in `linksReview` through a reviewed PR, then run `node scripts/update-links.mjs` and the normal data-generation/build checks. Never copy the current date merely to clear an alert. Do not add the example test fixture's reviewer or times to production data.

Routine refreshes only read this record. `updated` and `generatedAt` still mean generation; neither establishes human review. Matching, attributable, valid nonfuture evidence adds `sourceMeta.reviewedAt` to generated links. Missing evidence, changed active content, malformed/impossible dates, and any future review time omit it and keep freshness unknown. Reordering the same rows does not invalidate the hash. Changes to emitted content, additions/removals and activation changes require a new review. Disabled-only history changes do not. The optional fields preserve existing row shapes, IDs, routes, Explore/Review behavior and localStorage keys.

Shared UI and Status logic uses manual `reviewedAt`, never legacy `updatedAt` or fallback generation dates. Existing manual policy remains fresh through 30 UTC calendar days, aging through 90, stale thereafter. The refresh report's existing `updatedAt` column carries the actual review time for manual sources or `-`; it is not report generation time. Status is static build-time HTML; rerun the live checker for a current assessment.

## Independent runner integration

Use an existing runner outside GitHub Actions with Node >=22.12, an approved checkout of this code, outbound HTTPS to Pages and a separate scheduler. No npm dependencies, GitHub token, new service or keepalive commit is needed. Pin an approved commit and update deliberately after reviewed releases.

Run hourly with a 60-second runner timeout:

```sh
node scripts/check-refresh.mjs --generation-only --site-url https://anothel.github.io/ > refresh-health.json 2> refresh-health.err
```

Capture the real process exit status before running another command. Preserve stdout, stderr, start/end times and exit status. Requests bypass caches, reject redirects, use a fixed data-file allowlist, validate contracts and have ten-second HTTP timeouts. HTTP/JSON/contract errors fail closed even in generation-only mode.

| Signal | Policy and action |
| --- | --- |
| `generationOk=false`, nonzero exit, or runner timeout | Operational failure: more than 36 hours since manifest generation, invalid/future clock, missing module, unreadable/invalid publication. Alert after two consecutive hourly failures; worst-case detection is about 38 hours after last generation. |
| `generationOk=true`, `ok=false` | Generation recovered; source quality still requires investigation. This must not keep a missed-generation incident open. |
| `automatedSources` partial/error/fallback/stale/unknown | Separate source advisory after two consecutive observations; inspect named errors and retained timestamps. Do not label this a stopped scheduler. |
| `manualSources` unknown | Maintainer review backlog, not an hourly pager; include in a weekly digest until genuine evidence exists. |
| Manual aging or stale | Weekly review reminder at aging (>30 days); stale (>90 days) requires review. Daily rebuilds cannot fix it. |

The default command without `--generation-only` retains strict all-source health semantics and exits nonzero for manual unknown. Existing Pages warnings remain honest. Do not attach the default exit status to a missed-generation pager.

Configure the runner's own missing-heartbeat alert after two missed hourly executions using its scheduler or a separate existing watchdog. A checker cannot detect that it was never executed. Configure notification delivery and a real recipient in the external platform; credentials stay there. Deduplicate by incident/signal. On two consecutive successful generation checks send one recovery message for generation only; retain source advisories. Never send a general “all sources healthy” message unless `ok=true`.

Notifications should contain the signal, observation time, last manifest generation, age/state, checker exit/stderr, and links to [Status](https://anothel.github.io/status/) and [Update data](https://github.com/anothel/anothel.github.io/actions/workflows/update-trends.yml). Investigate Actions enablement/runs and Pages deployment before attributing scheduler failure. Fix the cause, dispatch Update data if needed, verify deployment identity and repeat the independent check. Unknown manual freshness needs a real review, not a refresh retry.

## Failure/recovery drill and remaining maintainer actions

The regression suite includes an isolated HTTP fixture drill: 37-hour generation returns failure; current generation returns success while manual freshness stays unknown; HTTP 503 fails; restored HTTP succeeds. Run `node --test tests/manual-review.test.mjs tests/published-data.test.mjs` after building. These tests do not send notifications.

The maintainer must still:

1. Perform and document an actual whole-shelf review, or leave unknown visible.
2. Provision the independent hourly job, timeout and missing-heartbeat watchdog; assign an owner and notification recipient; verify clock synchronization and Pages access.
3. In a **separate test job/destination**, run the fixture drill and route its consecutive failure/recovery events through the real notification integration. Alternatively point that test job at a controlled fixture endpoint with generation older than 36 hours, then restore current generation. Do not change production dates or disable production scheduling for a drill.
4. Confirm receipt of both failure and recovery notifications with the recipient. Retain timestamps, runner logs, channel/message IDs (without secrets), and acknowledgement in Issue #4. Test the runner-timeout/missing-heartbeat alert separately by pausing only the test job.
5. Enable the production monitor, confirm two successful observations, and record the next real scheduled refresh and Pages verification. Until these steps have evidence, external monitoring and delivery remain **not configured/verified**.

## Rollback

Revert the Phase 3 code commit through a reviewed PR, run required checks and deploy through the existing Pages workflow. Remove optional `linksReview`/generated `reviewedAt` fields if reverting to the older strict contract. Preserve all original data, security checks and browser storage. Reverting restores Phase 2 strict checker semantics: remove `--generation-only` from external jobs and temporarily use a manifest-age check or expect manual-unknown failures. Disable or update only affected monitor jobs; never silence unrelated source/heartbeat alerts. An old deployment does not restore freshness.
