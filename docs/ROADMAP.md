# Site Roadmap

## Current Direction

This site is a personal home base.

Primary use:

- Show who owns the site.
- Surface selected projects.
- Keep short notes.
- Link out to GitHub and other useful places.

Design direction:

- Quiet technical.
- Static first.
- Fast to edit.
- No build step until it becomes useful.
- Responsive across mobile, tablet, and desktop.

## Current State

- `index.html`: personal home page.
- `projects/index.html`: project archive.
- `notes/index.html`: notes archive.
- `notes/*.html`: individual note pages.
- `css/site.css`: shared styling and responsive layout.
- `docs/superpowers/`: specs and implementation plans used while changing the site.

## Roadmap

### Phase 1: Structure

Goal: make the site feel like a real personal base, not a single page.

- Add `/projects/`. Done.
- Add `/about/`.
- Keep home page as overview.
- Keep navigation consistent across pages.
- Verify mobile, tablet, and desktop layouts.

Success criteria:

- Home page links to Notes, Projects, About.
- Each section has its own URL.
- No horizontal overflow on mobile.
- No template/vendor leftovers referenced by active pages.

### Phase 2: Portfolio Depth

Goal: make projects credible.

- Add 3 project entries.
- Use case-study format:
  - Problem
  - Built
  - Approach
  - Result
  - Link
- Add individual project pages only when a card needs more detail.

Success criteria:

- Visitor can understand what was built within 10 seconds.
- Each project has a clear outcome or learning.
- GitHub/demo links are visible when available.

### Phase 3: Writing Workflow

Goal: make notes easy to add without redesign work.

- Add a note page template.
- Add a project page template.
- Document naming and linking rules.
- Consider Markdown-to-HTML only if manual HTML becomes annoying.

Success criteria:

- New note can be added by copying one file.
- Archive update is predictable.
- No build dependency required unless chosen intentionally.

### Phase 4: Publishing Quality

Goal: make GitHub Pages output cleaner when shared.

- Add `404.html`.
- Add `robots.txt`.
- Add `sitemap.xml`.
- Add Open Graph metadata.
- Add a small social preview image if useful.

Success criteria:

- Broken URLs have a useful fallback.
- Shared links show clean title/description.
- Search crawlers can read the structure.

## Recommended Next Task

Build `/about/` next.

Reason:

- Notes and Projects now exist.
- About should get its own URL so the home page stays compact.
- Separate About page gives profile, direction, and contact context without crowding the homepage.

Recommended shape:

- `/about/index.html`: profile page.
- Home page: keep short About summary.
- CSS: reuse existing page header and content layout.

## Working Rules

- Keep plain HTML/CSS for now.
- Avoid JavaScript until it solves a real problem.
- Avoid external templates.
- Prefer small pages over a framework.
- Verify with browser at mobile and desktop sizes before calling a change done.
- Do not stage, commit, or push from agent work unless explicitly requested.

## Superpowers Usage

Superpowers is being used for planning discipline and verification flow.

Current usage:

- `karpathy-guidelines`: keep changes small, explicit, and verified.
- `caveman`: keep communication short.
- `writing-plans`: write implementation plans under `docs/superpowers/plans/`.
- `subagent-driven-development`: available when a task can be split safely.
- `verification-before-completion`: verify before claiming completion.

For this repository, Superpowers docs live in:

- `docs/superpowers/specs/`
- `docs/superpowers/plans/`
