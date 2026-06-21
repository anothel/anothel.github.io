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
- Data modules: HN/GitHub/npm/reference links plus generated Today and Status metadata.
- Local browser state: saved review items, up to 3 pinned topics, and explicit Explore defaults.

## Planning Metrics

- `Visit speed`: how many clicks from Home to a useful signal.
- `Repeat friction`: how much state must be re-selected on every visit.
- `Signal quality`: whether Today/Explore show specific agent-workflow signals over broad generic tooling.
- `Trust`: whether stale, partial, or rate-limited data is visible and understandable.
- `Static safety`: all features must degrade cleanly when fetch or localStorage is blocked.

## Next Work

### 1. Saved Searches v1

Goal: make reusable queries first-class without building a full preferences panel.

- Save up to 5 Explore searches.
- Each saved search stores focus, module, category, query, and sort.
- Render saved searches near Explore controls.
- Add remove action.

Done when:
- Saved search can be applied in 1 click.
- Saved searches survive reload.
- Empty and full states are clear.

Success metric:
- Common filtered view opens in 1 click from Explore.

### 2. Data Expansion v2

Goal: add coverage only where it improves Today or Explore.

- Add at most 2 new source groups in one round.
- Candidate groups: AI evals, workflow automation, developer tooling.
- Each new group needs at least 5 useful checked-in items.
- Broad baseline packages must not dominate priority views.

Done when:
- Today still has fixed section counts.
- Explore quality ranking keeps specific agent-workflow items above generic tooling.
- Status reports new sources clearly.

Success metric:
- Added data creates at least 5 useful candidates without reducing Today specificity.

### 3. Topic Notes v1

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
