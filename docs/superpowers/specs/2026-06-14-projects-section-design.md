# Projects Section Design

## Goal

Add a static `/projects/` section that makes the site feel more like a portfolio without overstating unfinished work.

## Context

The site is a personal home base built with plain HTML and CSS for GitHub Pages. It already has:

- `index.html` as the homepage.
- `notes/index.html` and note pages.
- `css/site.css` as the shared stylesheet.
- `docs/ROADMAP.md` describing `/projects/` as the next task.

## Chosen Approach

Use a case-study archive page.

Each project entry should show:

- Status
- Problem
- Built
- Approach
- Result
- Link when available

This gives the portfolio more substance than a plain repository list while keeping the content honest.

## Page Structure

Create:

- `projects/index.html`

Update:

- `index.html`
- `css/site.css`
- `README.md`
- `docs/ROADMAP.md`

## Homepage Behavior

The homepage Work section stays compact. It should:

- Link nav Work to `projects/index.html`.
- Link the hero secondary button to `projects/index.html`.
- Show 3 featured project cards.
- Add an `All projects 보기` link.

## Projects Archive Behavior

`projects/index.html` should:

- Use the same header/footer pattern as `/notes/`.
- Mark Projects as current page in nav.
- Use 3 case-study style cards:
  - Personal home base
  - Useful links archive
  - Mini lab
- Use modest wording for unfinished work.

## Styling

Reuse existing tokens and layout. Add only small styles for project case-study content:

- `.project-list`
- `.project-card`
- `.project-points`
- `.project-links`

Mobile behavior should collapse cards to one column through the existing `max-width: 820px` media query.

## Non-Goals

- No JavaScript.
- No framework.
- No generated data file.
- No individual project detail pages yet.
- No fake demo links.

## Verification

Check:

- `index.html` links to `projects/index.html`.
- `projects/index.html` links back to home, notes, about, contact, and GitHub.
- Shared CSS loads from `../css/site.css`.
- Desktop and mobile render with no horizontal overflow.
- Old template references remain absent.

## Self-Review

- Scope is one section, not a site rewrite.
- Requirements are concrete and testable.
- No placeholder content remains.
- Unfinished items are labeled honestly.
