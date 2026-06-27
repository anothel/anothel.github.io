# Information Architecture

This site is a static-first personal signal dashboard for deciding what technical signals to open first.

It is not a portfolio, resume, broad blog, company-history page, or social product.

## Product Sentence

anothel.github.io gathers AI engineering and developer-workflow signals from Hacker News, GitHub, npm, and curated references so repeat visitors can decide what to open today.

## Route Groups

| Group | Routes | Job |
|---|---|---|
| Decision | Home, Today | Decide what to open first. |
| Discovery | Explore, Topics, Notes | Search across modules and inspect focused themes. |
| Source detail | Trends, Packages, Repos, Links | Inspect one source or curated list in more detail. |
| Trust / personal state | Status, Review | Check data health and revisit locally saved items. |

## Route Roles

| Route | Role |
|---|---|
| Home | Open-now board with priority picks, local review state, trust summary, and secondary module jumps. |
| Today | Generated priority brief that explains why each pick is worth opening and what to do next. |
| Explore | Cross-module search, filter, save, defaults, saved searches, and topic lenses. |
| Review | Local browser queue for items saved from Explore, with status-specific next actions. |
| Status | Source health, freshness, partial/fallback context, and recovery clues. |
| Trends | Cross-source movement across HN, GitHub, and npm. |
| Packages | npm watchlist focused on adoption and package demand. |
| Repos | GitHub watchlist focused on project traction and workflow relevance. |
| Links | Checked-in curated reference shelf. |
| Topics | Focused landing pages that add judgment and context beyond a raw Explore filter. |
| Notes | Lightweight index of topic judgment notes. |

## Terminology

- Use **Reference shelf** for checked-in curated links.
- Use **Saved queue** or **Review later** for local browser-saved items.
- Use **Tracked signals** for normalized items coming from HN, GitHub, npm, repos, packages, and links.
- Use **Data date** for checked-in data dates.
- Use **Generated at** for derived pages such as Today.
- Use **Source health** for ok, partial, error, and fallback states.
- Use **Partial** only with a short explanation of whether data remains usable.
- Signal Schema v2 is the current normalized item contract for Today, Explore, topics, and saved/review item identity.

## Freshness Vocabulary

- **Fresh** means 0-1 days old.
- **Aging** means 2-3 days old. Aging stays visible, but it is not Status attention while source health is ok.
- **Stale** means more than 3 days old. Stale or any non-ok source health becomes Status attention.

## Topic Governance

- **Promote** a topic when it helps decisions across multiple source modules and has a durable note, guidance, and actions.
- **Keep lens-only** when a theme is useful for Explore filtering but does not yet justify a focused page or Notes entry.
- **Retire** a topic when source movement no longer changes what to open, save, or compare.
- Notes stays a decision-support index for topic judgment notes, not a blog engine.

## Topic Promotion Review

- Existing seven topic pages stay promoted: AI agents, MCP, Agent skills, AI evals, AI engineering, Workflow automation, and Security.
- Developer tooling stays lens-only because it mostly catches broad baseline tooling such as TypeScript, Zod, ESLint, React, and Vite.
- No topic page is added from item count alone; promotion still requires a route job, judgment note, guidance, and actions.

## Public Scope Triage

- Public worklog route stays out. Notes already indexes durable topic judgment notes, so another worklog would duplicate the current discovery job without improving repeat use.
- Portfolio, resume, and company-history content stay out unless the product sentence changes away from a signal dashboard.
- Active navigation and sitemap should expose signal-dashboard routes, not profile, project, worklog, resume, or company-history routes.

## Source Governance

- Watchlist ownership stays in `data/watchlists.json`; updater scripts consume active entries.
- `disabled: true` keeps retired sources documented without appearing in current generated output.
- `history` records why a source changed or retired with `date` and `note`.

## Source Quality Drift Review

- Broad baseline trend inputs stay retired when they duplicate generic TypeScript, framework, linting, formatting, validation, CSS, server, or runner demand.
- Broad package, repo, and reference entries use `disabled: true` plus `history` instead of deletion, so provenance remains auditable.
- Generated data snapshots may still show retired sources until the next data refresh.

## Refresh Stability Follow-up

- Partial package and repo refreshes preserve prior active rows when transient source errors hide individual active entries.
- Trend source failures preserve prior rows for the failed source while marking that source as fallback and stale but safe.
- Disabled watchlist entries stay excluded from generated snapshots even when previous data is reused.
- Home, Today, Explore, Status, and module pages continue to share one source-health truth from generated metadata.

## Review Queue Friction Audit

- Review keeps the existing localStorage key, saved item schema, canonical ids, and legacy saved id matching.
- Empty and no-JS Review states now explain that saved items are local and should start from Explore.
- Queue copy makes unread-first ordering explicit; selected-item detail gives a status-specific next action for unread, read, and done items.
- Export and import stay local portability affordances, not sync, account, backend, or route expansion.

## Signal Quality Regression Audit

- The signal quality golden fixture still keeps agent-workflow signals above broad baseline tooling.
- Today, Explore, topic landing cards, and public structure tests stayed green against current golden expectations.
- No signal policy or watchlist change was needed because broad baseline items did not dominate priority surfaces.
- Home, Today, Explore, Status, and module source health and fallback copy stayed consistent.

## Home Visit Speed Audit

- Home utility choices are reduced to items tracked, one trust state, and the saved queue.
- Open first still points to Today as the priority brief, while Review remains the single return path for saved local work.
- The trust state keeps source health, data date, and freshness visible without three separate Home choices.
- No route, localStorage schema, refresh script, framework, backend, or account scope changed.

## Status Recovery Clarity Audit

- Home, Today, Explore, Status, and module health strips now share recovery copy for ok, partial, fallback, stale, and error states.
- Partial and fallback states keep usable data visible while naming retry data refresh as the recovery action.
- Stale source details name retry data refresh directly instead of requiring refresh-report interpretation.
- No route, localStorage schema, refresh script order, signal policy, framework, backend, or account scope changed.

## Interaction State Visual Audit

- Nested actions now get their own hover/focus target instead of also brightening the parent card.
- Review queue hover and selected states are visually distinct; selected rows keep a left accent marker.
- Saved queue remove buttons gain the same hover/focus affordance as other local action buttons.
- No route, localStorage schema, refresh script, signal policy, framework, backend, or account scope changed.

## Signal Policy

- Scoring policy ownership stays in `data/signal-policy.json`.
- baseline titles list broad tools that should not dominate agent-workflow signals by raw popularity alone.
- baseline penalty and intent threshold tune generated Today ranking without editing updater code.
- Today and Explore share baseline titles; Explore uses an embedded fallback only when the policy JSON fetch is blocked.

## Deferred Decisions

- Framework islands stay deferred until vanilla JavaScript blocks a specific Explore or Review workflow.
