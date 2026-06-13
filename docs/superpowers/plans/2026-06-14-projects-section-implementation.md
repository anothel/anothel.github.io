# Projects Section Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a static `/projects/` archive and connect it from the homepage.

**Architecture:** Keep one shared stylesheet and plain HTML pages. The homepage presents featured work; `projects/index.html` holds fuller case-study cards.

**Tech Stack:** HTML5, CSS3, GitHub Pages static hosting.

---

## File Responsibilities

- `index.html`: homepage links and featured project preview.
- `projects/index.html`: project archive page.
- `css/site.css`: shared layout plus project card styles.
- `README.md`: repository structure.
- `docs/ROADMAP.md`: roadmap state.

## Tasks

### Task 1: Add Projects Archive

**Files:**

- Create: `projects/index.html`

- [ ] **Step 1: Create the page**

Add a static archive page using the same header/footer pattern as `notes/index.html`. Include 3 cards:

- Personal home base
- Useful links archive
- Mini lab

- [ ] **Step 2: Verify page exists**

Run:

```powershell
Test-Path -LiteralPath projects\index.html
```

Expected: `True`

### Task 2: Connect Homepage

**Files:**

- Modify: `index.html`

- [ ] **Step 1: Update links**

Change Work nav and hero secondary action to `projects/index.html`. Add project links in the Work cards and an `All projects 보기` link.

- [ ] **Step 2: Verify links**

Run:

```powershell
rg -n "projects/index.html|All projects" index.html
```

Expected: matches for nav, hero action, cards, and section link.

### Task 3: Add Styles

**Files:**

- Modify: `css/site.css`

- [ ] **Step 1: Add project styles**

Add styles for:

- `.project-list`
- `.project-card`
- `.project-points`
- `.project-links`

- [ ] **Step 2: Verify style hooks**

Run:

```powershell
rg -n "project-list|project-card|project-points|project-links" css\site.css projects\index.html
```

Expected: selectors in CSS and classes in HTML.

### Task 4: Update Docs

**Files:**

- Modify: `README.md`
- Modify: `docs/ROADMAP.md`

- [ ] **Step 1: Update structure docs**

Mention `projects/` in the repository structure and current state.

- [ ] **Step 2: Verify docs**

Run:

```powershell
rg -n "projects/" README.md docs\ROADMAP.md
```

Expected: matches in both files.

### Task 5: Browser Verification

**Files:**

- Verify: `index.html`
- Verify: `projects/index.html`

- [ ] **Step 1: Render desktop and mobile**

Use Chromium/Playwright to load both pages at:

- `1440x1000`
- `390x844`

Expected:

- CSS loaded.
- No horizontal overflow.
- `projects/index.html` has 3 project cards.

- [ ] **Step 2: Check old template references**

Run:

```powershell
rg -n "vendor/|js/|img/|scss/|sb-admin|bootstrap|jquery|fontawesome" index.html projects notes css\site.css README.md
```

Expected: no output.

## Self-Review

- Spec requirements map to tasks.
- No individual project detail pages added.
- No build tooling added.
- No git stage, commit, or push steps are required because repository instructions reserve those actions for the user.
