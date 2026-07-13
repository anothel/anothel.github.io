# Information Architecture

anothel.github.io is a personal signal dashboard for deciding what technical signal to open next. It is not a portfolio, resume, broad blog, company-history page, or social product.

## Route Roles

| Route | Implementation | Primary job |
|---|---|---|
| `/` | `src/pages/index.astro` | Open-now hub: priority signals, trust summary, saved-count summary, and routes into deeper work. |
| `/today/` | `src/pages/today/index.astro` | Generated priority brief: what to open first, why now, and next action. |
| `/explore/` | `src/pages/explore/index.astro` + `ExploreIsland.jsx` | Cross-module discovery: search, filter, topic lenses, saved searches, and saving items. |
| `/review/` | `src/pages/review/index.astro` + `ReviewIsland.jsx` | Return workflow for browser-local saved items: annotate, change status, export/import, or remove. |
| `/status/` | `src/pages/status/index.astro` | Trust evidence: completeness, freshness, validation, partial/fallback state, and recovery clues. |
| `/trends/` | `src/pages/trends/index.astro` | Ranked movement across Hacker News, GitHub search, and npm trend inputs. |
| `/packages/` | `src/pages/packages/index.astro` | npm watchlist movement and demand. |
| `/repos/` | `src/pages/repos/index.astro` | GitHub repository traction and workflow relevance. |
| `/links/` | `src/pages/links/index.astro` | Curated reference shelf. |
| `/topics/<slug>/` | `src/pages/topics/[slug].astro` | Seven promoted static topic views: judgment, guidance, ranking context, related signals, and browser-local pinning. |
| `/notes/` | `src/pages/notes/index.astro` | Static index of the seven route-backed topic judgment notes. |

Topic pages are native Astro output built from checked-in JSON. All topic content is useful without JavaScript; only pin state uses a native client module. Notes is native Astro output with no client script. The custom 404, robots, and sitemap are also native Astro output; `src/lib/site-routes.js` supplies their canonical origin/public route model, and no pass-through files remain.

## Route Groups and Navigation

- Primary navigation: Home, Today, Explore, Review, Status.
- Source navigation: Trends, Packages, Repos, Reference shelf.
- Decision flow: Home -> Today for prioritization; Home/Today -> Explore for broader discovery.
- Save/return flow: Explore -> Review. Review never becomes a cloud or account surface.
- Trust flow: compact health appears on decision/source pages; Status owns detailed evidence and recovery context.
- Judgment flow: Explore topic lenses lead to focused topic pages; topic pages and Notes add durable context rather than duplicate raw results.

## Intentional Overlaps

- Home and Today both show priority signals. Home stays a compact starting board; Today owns the full generated brief.
- Today and Explore both expose tracked items. Today is curated/ranked; Explore is query/filter driven.
- Explore and source routes show some same records. Explore compares across modules; source routes preserve source-specific metrics and ordering.
- Explore and Review both show saved state. Explore creates/removes saves in discovery context; Review owns follow-up workflow and metadata.
- Status and health panels share source-health language. Panels summarize; Status explains evidence, freshness, failure, and recovery.
- Topics and Explore lenses share themes. Lenses filter current data; topic pages add judgment, guidance, and related paths.

## Migration Parity Decisions

- Legacy Trends exposed source, category, query, and sort controls. Legacy Links exposed category and query controls. The Astro source routes intentionally keep source-specific ordering and static inspection only. Explore is the one cross-source filtering surface, reachable from primary navigation.
- Legacy Home topic-lens cards and pin-aware ordering are not rendered by Astro Home. Topic discovery and pinned lenses are centralized in Explore; Home remains the compact open-now board.
- Browser-local saved/unread counts remain Home functionality and must use the existing Review localStorage contract.
- Legacy topic ranking, matching, notes, guidance, actions, and public URLs are preserved in one shared Astro topic implementation. Runtime content fetches and global topic renderers are intentionally removed; only the existing browser-local pin contract remains interactive.

## State and Product Boundaries

- `data/*.json` is shared build/data input; route code does not own alternate copies.
- Review items, saved searches, defaults, and topic pins remain browser-local through `localStorage`.
- Export/import JSON is portability, not account sync.
- No backend, database, login, account, server function, or cloud sync.
- Useful static/no-JS output remains where practical. Topic pages are complete without JavaScript and label pin state as browser-local/unavailable until it can be read.

## Terminology

- **Tracked signals**: normalized items from Trends, Packages, Repos, and Links.
- **Reference shelf**: curated checked-in links.
- **Saved queue** or **Review later**: browser-local saved items.
- **Data date**: date-only display/compatibility field from pipeline output.
- **Generated at**: ISO pipeline snapshot assembly timestamp; not source publication time.
- **Source health**: `ok`, `partial`, `fallback`, or `error` availability state.
- **Freshness**: `fresh`, `aging`, `stale`, `unknown`, or `unavailable`, derived from last successful source timestamps.

Detailed data, timestamp, freshness, and scoring meanings belong in `docs/SIGNAL_SCHEMA.md`. Source admission/retirement policy belongs in `docs/SOURCE_GOVERNANCE.md`.

## Topic Governance

- Promote a topic when it spans multiple modules and has durable judgment, guidance, and actions.
- Keep it lens-only when filtering is useful but a focused page would add no new judgment.
- Retire it when source movement no longer changes what to open, save, or compare.
- Notes remains a decision-support index, not a blog engine.

Current promoted topics: AI agents, MCP, Agent skills, AI evals, AI engineering, Workflow automation, and Security. Developer tooling remains lens-only because it mostly captures broad baseline tooling.

## Scope Exclusions

Portfolio, resume, company-history, social, and public worklog routes stay out while the product sentence remains a signal dashboard. New routes require a distinct job that cannot be handled by an existing route.
