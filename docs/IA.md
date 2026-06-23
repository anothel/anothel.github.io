# Information Architecture

This site is a static-first personal signal dashboard for deciding what technical signals to open first.

It is not a portfolio, resume, broad blog, company-history page, or social product.

## Product Sentence

anothel.github.io gathers AI engineering and developer-workflow signals from Hacker News, GitHub, npm, and curated references so repeat visitors can decide what to open today.

## Route Groups

| Group | Routes | Job |
|---|---|---|
| Decision | Home, Today | Decide what to open first. |
| Discovery | Explore, Topics | Search across modules and inspect focused themes. |
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

## Terminology

- Use **Reference shelf** for checked-in curated links.
- Use **Saved queue** or **Review later** for local browser-saved items.
- Use **Tracked signals** for normalized items coming from HN, GitHub, npm, repos, packages, and links.
- Use **Data date** for checked-in data dates.
- Use **Generated at** for derived pages such as Today.
- Use **Source health** for ok, partial, error, and fallback states.
- Use **Partial** only with a short explanation of whether data remains usable.

## Deferred Decisions

- Astro + React islands remains the medium-term framework target, after P0 trust/copy/data work lands.
- Signal schema v2 should not replace current data shapes until current schema tests protect module counts, URLs, statuses, and scores.
- Notes index should wait until at least 3 real notes exist.
