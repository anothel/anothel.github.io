# Roadmap

This site is a personal technical signal dashboard. It is not a portfolio, resume, blog, or company-history page.

## Direction

- Keep the site static and GitHub Pages-friendly.
- Track useful technical signals from HN, GitHub, npm, and curated references.
- Make Home a calm entry point, not a marketing page.
- Make Today useful for first-pass reading.
- Make Explore useful for search, topic lenses, and saved follow-up.
- Make Status useful for trusting the data refresh pipeline.

## Current Baseline

- Home hub exists.
- Home decision layer exists.
- Today priority brief exists.
- Explore cross-source search exists.
- Topic lenses exist for recurring themes.
- Topic focus pages now have top movers, related signals, source mix, and cross-topic routes.
- Data Expansion v1 covers AI agents, MCP, and Agent skills across repos, packages, and curated links.
- Review later workflow exists in local browser storage.
- Status page and refresh reporting exist.
- Data refresh has fallback safety for empty or rate-limited refreshes.

## Next Big Work

### 1. Home Polish

Home now has a decision layer. Later polish should be based on actual use, not more structure.

- Tune topic movement card density.
- Remove duplicated route links if they stop helping.
- Improve mobile scan order after checking real viewport behavior.

Success check: Home stays useful without becoming another dashboard.

### 2. Topic Depth

Topic pages now have a useful dashboard shape. Next improvements should depend on better data, not more layout.

- Tune topic-specific copy after Data Expansion.
- Add topic-specific saved/review prompts only if they help the review flow.
- Consider one lightweight note per topic after there is something worth writing.

Success check: topic pages explain the signal without repeating Explore.

### 3. Data Expansion v2

The source list is now useful for AI agents, MCP, and Agent skills. Later expansion should happen only after checking whether the current feed feels noisy.

- Add AI evals only if they improve Today or Explore.
- Add workflow automation only if it connects to agent work.
- Add developer tooling only when it supports the core signal dashboard.
- Keep broad baseline packages from dominating priority views.

Success check: added coverage increases useful saved/review items, not raw count only.

## Later Work

### Notes

Add lightweight notes only when there is a clear use case. Avoid turning the site into a blog by default.

Possible scope:
- `/notes/` as short private-to-public writeups.
- Notes linked from topics.
- No full CMS unless writing volume justifies it.

### Personalization

Local preferences may be useful after the core reading flow is stable.

Possible scope:
- pinned topics
- hidden sources
- preferred sort
- saved searches

### Visual Polish

Improve density, spacing, and scan quality after the content model settles.

Possible scope:
- better topic cards
- better mobile filter controls
- compact mode for Explore
- clearer source/status hierarchy

## Not Now

- Full portfolio/resume content.
- Company history content.
- Server-side backend.
- Accounts or sync.
- Large design-system rewrite.
- Blog engine before actual notes exist.

## Working Rules

- User owns git staging, commits, and pushes.
- Public project docs live at repo root when they guide future work.
- Private implementation plans stay under `.superpowers/`.
- Before each large task, update or consult this roadmap.
- After each large task, decide whether the roadmap changed.
