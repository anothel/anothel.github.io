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
- Home Polish v1 makes the first action concrete, compresses topic movement to three cards, and removes the duplicated topic strip.
- Today priority brief exists.
- Explore cross-source search exists.
- Topic lenses exist for recurring themes.
- Topic focus pages now have top movers, related signals, source mix, and cross-topic routes.
- Topic Depth v1 adds topic-specific context, why-now framing, and topic-specific action routes.
- Data Expansion v1 covers AI agents, MCP, and Agent skills across repos, packages, and curated links.
- Review later workflow exists in local browser storage.
- Status page and refresh reporting exist.
- Data refresh has fallback safety for empty or rate-limited refreshes.

## Next Big Work

### 1. Personalization

Local preferences may be useful now that Home, Today, Explore, Review, Status, and topic pages exist.

- pinned topics
- hidden sources
- preferred sort
- saved searches

Success check: preferences make repeat visits faster without adding accounts or sync.

### 2. Data Expansion v2

The source list is now useful for AI agents, MCP, and Agent skills. Later expansion should happen only after checking whether the current feed feels noisy.

- Add AI evals only if they improve Today or Explore.
- Add workflow automation only if it connects to agent work.
- Add developer tooling only when it supports the core signal dashboard.
- Keep broad baseline packages from dominating priority views.

Success check: added coverage increases useful saved/review items, not raw count only.

### 3. Topic Notes

Topic pages may need short notes only after the signal pages produce useful saved/review items.

- one lightweight note per topic
- linked from topic focus pages
- no blog engine

Success check: notes explain judgment, not raw source summaries.

## Later Work

### Notes

Add lightweight notes only when there is a clear use case. Avoid turning the site into a blog by default.

Possible scope:
- `/notes/` as short private-to-public writeups.
- Notes linked from topics.
- No full CMS unless writing volume justifies it.

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
