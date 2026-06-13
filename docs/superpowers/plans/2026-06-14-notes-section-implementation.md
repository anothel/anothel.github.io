# Notes Section Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a static `/notes/` archive and two individual note pages to the personal home base.

**Architecture:** Keep using plain HTML and one shared stylesheet. The homepage previews notes; `/notes/index.html` is the archive; individual note pages are static article pages.

**Tech Stack:** HTML5, CSS3, GitHub Pages static hosting.

---

## Tasks

- [ ] Create `notes/index.html` with archive entries for two notes.
- [ ] Create `notes/github-pages-personal-home.html`.
- [ ] Create `notes/small-first-version.html`.
- [ ] Update `index.html` nav and Notes preview links.
- [ ] Extend `css/site.css` with archive/article responsive styles.
- [ ] Verify links and desktop/mobile rendering.

## File Responsibilities

- `index.html`: homepage summary and links.
- `notes/index.html`: notes archive.
- `notes/*.html`: individual article pages.
- `css/site.css`: shared layout, note cards, article typography, responsive behavior.

## Verification Commands

```powershell
rg -n "notes/index.html|notes/github-pages-personal-home.html|notes/small-first-version.html" index.html notes
rg -n "href=\"../index.html\"|href=\"index.html\"|href=\"github-pages-personal-home.html\"|href=\"small-first-version.html\"" notes
rg -n "vendor/|js/|img/|scss/|sb-admin|bootstrap|jquery|fontawesome" index.html notes css\site.css
```

Expected:

- First two commands find links.
- Third command returns no output.

## Self-Review

- Covers `/notes/` archive and individual pages.
- Keeps implementation static and dependency-free.
- Avoids build tooling and git write actions.
