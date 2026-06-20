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
- Review later workflow exists in local browser storage.
- Status page and refresh reporting exist.
- Data refresh has fallback safety for empty or rate-limited refreshes.

## Next Big Work

### 1. Topic Pages v2

Topic pages should become focused dashboards, not just filtered lists.

- Add top movers per topic.
- Add related packages, repos, links, and Today picks.
- Add "why this topic matters now" from current signals.
- Add cross-links between related topics.

Success check: `/topics/ai-agents/`, `/topics/mcp/`, and `/topics/agent-skills/` each feel worth opening directly.

### 2. Data Expansion

The site needs more useful signal coverage, but only if the data stays reliable.

- Expand tracked repos and packages for AI agents, MCP, evals, workflow automation, and developer tooling.
- Add more curated links for stable references.
- Keep broad baseline packages from dominating priority views.
- Keep refresh fallback behavior intact.

Success check: Explore and Today have enough useful items without becoming noisy.

### 3. Home Polish

Home now has a decision layer. Later polish should be based on actual use, not more structure.

- Tune topic movement card density.
- Remove duplicated route links if they stop helping.
- Improve mobile scan order after checking real viewport behavior.

Success check: Home stays useful without becoming another dashboard.

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
