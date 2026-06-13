# Notes Section Design

## Summary

Add a static `/notes/` section to the existing personal home base. Keep the site plain HTML/CSS, responsive, and GitHub Pages compatible.

## Goals

- Add `/notes/index.html` as a notes archive.
- Add two individual note pages under `/notes/`.
- Update the homepage notes preview to link to those pages.
- Strengthen responsive behavior for page headers, note lists, and article content.

## Non-Goals

- No Jekyll, CMS, search, RSS, comments, tags engine, or JavaScript routing.
- No dependency installation or build step.
- No git staging, commits, or pushes.

## Structure

- `notes/index.html`: archive page for all notes.
- `notes/github-pages-personal-home.html`: first note page.
- `notes/small-first-version.html`: second note page.
- `index.html`: homepage preview links to archive and note pages.
- `css/site.css`: shared styles for homepage, archive, and article pages.

## Design

The notes section should keep the current quiet technical style. Archive entries should be readable cards with date, title, summary, and link. Individual note pages should use a narrower article width, strong title hierarchy, and backlink navigation.

On mobile, archive entries and article content should become a single column with no horizontal overflow.

## Verification

- `/notes/index.html` links to both note pages.
- Each note page links back to `/notes/` and home.
- Homepage `Notes` section links to archive and individual notes.
- Desktop and mobile Chrome rendering has no horizontal overflow.
- Runtime files contain no old template dependencies.
