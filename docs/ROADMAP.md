# Roadmap

This site is a personal technical signal dashboard. It is not a portfolio, resume, blog, or company-history page.

## Direction

- Static-first: must keep working on GitHub Pages.
- Data-first: HN, GitHub, npm, and curated references should feed useful reading paths.
- Calm home base: Home should answer "what should I open first?" without becoming a marketing page.
- Repeat-use bias: each round should reduce repeated filtering, searching, or checking.
- No accounts, sync, backend, resume content, or broad blog engine for now.

## Current Surface

- Pages: Home, Today, Explore, Review, Status, Trends, Packages, Repos, Links, and 3 topic pages.
- Core topics: AI agents, MCP, Agent skills.
- Data modules: HN/GitHub/npm/reference links plus generated Today and Status metadata, with expanded AI evals and workflow automation coverage.
- Local browser state: saved review items, up to 3 pinned topics, explicit Explore defaults, and up to 5 saved Explore searches.

## Planning Metrics

- `Visit speed`: how many clicks from Home to a useful signal.
- `Repeat friction`: how much state must be re-selected on every visit.
- `Signal quality`: whether Today/Explore show specific agent-workflow signals over broad generic tooling.
- `Trust`: whether stale, partial, or rate-limited data is visible and understandable.
- `Static safety`: all features must degrade cleanly when fetch or localStorage is blocked.

## Next Work

### 1. Topic Notes v1

Goal: add judgment only after topics have enough saved/review context.

- Add 1 short note per core topic.
- Each note must be under 500 words.
- Notes must link to topic page and at least 2 current signals.
- No CMS, tags, comments, or full blog index.

Done when:
- 3 topic notes exist.
- Topic pages link to notes.
- Notes explain judgment, not raw summaries.

Success metric:
- Notes answer "why do I care?" better than source cards alone.

## Later

- Hidden sources.
- Compact Explore mode.
- Better mobile filter controls.
- More topic pages only when data justifies them.
- Lightweight `/notes/` index only after multiple notes exist.

## Not Now

- Full portfolio/resume.
- Company history.
- Backend/server functions.
- Accounts or sync.
- Large design-system rewrite.
- Blog engine.

## Working Rules

- User owns git staging, commits, and pushes.
- Public project docs live at repo root when they guide future work.
- Private implementation plans stay under `.superpowers/`.
- Before each large task, update or consult this roadmap.
- After each large task, remove completed planning detail or move the next measurable step up.
