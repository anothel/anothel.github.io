# Personal Home Base Design

## Summary

Build this GitHub Pages repository as a new personal home base, not as a modified SB Admin dashboard. The first release is a small static site: one polished homepage that introduces the owner, shows selected work, includes short notes, and points visitors to contact/profile links.

The site should feel quiet, technical, and useful. It should not look like a startup landing page, admin dashboard, resume template, or generic blog theme.

## Current Context

The repository previously contained the Start Bootstrap SB Admin 2 template. The user explicitly approved discarding this template direction, and the old template files have been removed.

GitHub Pages supports static HTML, CSS, and JavaScript files served from a repository, optionally with a build step. For this project, the simplest reliable path is plain static HTML/CSS with no generator or runtime dependency.

## Goals

- Replace the dashboard-template impression with a personal homepage.
- Make the first screen explain who the site belongs to and why it exists.
- Provide useful sections for work, notes, about, and contact.
- Keep maintenance low so the site stays usable even if updates are infrequent.
- Leave a clean path to future `/notes/` and `/lab/` sections.

## Non-Goals

- No full blog engine in the first release.
- No Jekyll, React, Next.js, or other build system in the first release.
- No admin-dashboard UI.
- No marketing hero with oversized decoration.
- No fake login/register/chart/table demo pages as public navigation.
- No git staging, commits, or pushes by Codex.

## Site Structure

### Files

- `index.html`: main personal homepage.
- `css/site.css`: new site-specific stylesheet.
- `assets/`: optional folder for future images, icons, or files.

The old template files should not remain part of the public site. The repository should keep only the static homepage, site stylesheet, project docs, and basic repository metadata.

### Homepage Sections

1. Header
   - Site name: likely `anothel`.
   - Navigation: `Work`, `Notes`, `About`, `Contact`.
   - Simple text links, no sidebar.

2. Intro
   - Short identity line.
   - One concise paragraph explaining the site.
   - Primary links: GitHub and contact link.

3. Work
   - 2-4 selected project cards.
   - Each card includes title, short description, status/type, and optional link.
   - If real projects are not ready, use honest, low-noise descriptions rather than fake polished claims.

4. Notes
   - 2-3 short note entries on the homepage.
   - These are compact writing previews, not a full blog archive.
   - Future migration path: move note entries to `/notes/` when there is enough content.

5. About
   - Short paragraph about interests, working style, or technical focus.
   - Avoid resume-bulk unless user later requests job-search positioning.

6. Contact
   - GitHub, email or preferred contact, and optional external blog/profile links.

## Visual Direction

Chosen style: Quiet technical.

Characteristics:

- Light neutral background.
- Strong readable text.
- Restrained accent color.
- Thin borders and careful spacing.
- Cards only where they frame repeated items, such as projects or notes.
- No large gradients, floating decorations, dashboard chrome, or marketing-heavy hero.
- Responsive layout with stable spacing on mobile and desktop.

The page should feel like a capable developer's personal home, not a company landing page.

## Content Tone

Default language should be Korean-centered unless the user later requests English. Section labels may stay short and English-like where natural, such as `Work` and `Notes`.

Copy should be direct and modest:

- Good: "A small home for work, notes, and links worth keeping."
- Avoid: exaggerated claims, fake metrics, inflated job-title language.

## Technical Approach

Use plain HTML and CSS.

Reasons:

- GitHub Pages serves static files directly.
- No dependency install needed.
- No build pipeline needed.
- Easier to verify and maintain.
- Current template dependencies are unnecessary for the chosen scope.

Implementation should avoid adding vendor/template dependencies back into the public homepage.

## Accessibility And Responsiveness

- Use semantic HTML landmarks: `header`, `main`, `section`, `footer`.
- Ensure links have meaningful text.
- Maintain visible keyboard focus styles.
- Keep line length readable.
- Use responsive CSS grid/flex layouts.
- Test at desktop and mobile widths.

## Verification Criteria

The implementation is complete when:

- Opening `index.html` shows the new personal homepage, not SB Admin.
- Navigation links scroll or jump to the correct sections.
- No visible broken assets or missing icons.
- Layout works on mobile and desktop.
- Existing GitHub Pages static hosting remains compatible.
- No git staging, commit, or push is performed by Codex.

## Future Extensions

- `/notes/`: a simple writing archive once there are enough posts.
- `/lab/`: mini tools, experiments, demos.
- Custom domain or profile links.
- Optional English page or bilingual section if needed.
