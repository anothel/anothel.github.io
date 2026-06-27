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
| Review | Local browser queue for items saved from Explore. |
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

## Public Scope Triage

- Public worklog route stays out. Notes already indexes durable topic judgment notes, so another worklog would duplicate the current discovery job without improving repeat use.
- Portfolio, resume, and company-history content stay out unless the product sentence changes away from a signal dashboard.
- Active navigation and sitemap should expose signal-dashboard routes, not profile, project, worklog, resume, or company-history routes.

## Source Governance

- Watchlist ownership stays in `data/watchlists.json`; updater scripts consume active entries.
- `disabled: true` keeps retired sources documented without appearing in current generated output.
- `history` records why a source changed or retired with `date` and `note`.

## Signal Policy

- Scoring policy ownership stays in `data/signal-policy.json`.
- baseline titles list broad tools that should not dominate agent-workflow signals by raw popularity alone.
- baseline penalty and intent threshold tune generated Today ranking without editing updater code.

## Deferred Decisions

- Framework islands stay deferred until vanilla JavaScript blocks a specific Explore or Review workflow.
