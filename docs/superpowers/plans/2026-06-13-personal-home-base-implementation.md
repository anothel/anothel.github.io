# Personal Home Base Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the SB Admin dashboard landing page with a quiet technical personal home base for work, notes, about, and contact.

**Architecture:** Use one static HTML page and one dedicated stylesheet. Keep the public homepage independent from the existing Bootstrap/vendor template files so GitHub Pages can serve it without a build step.

**Tech Stack:** Plain HTML5, CSS3, GitHub Pages static hosting, PowerShell verification commands.

---

## File Structure

- Modify: `.gitignore`
  - Add `.superpowers/` so brainstorming companion artifacts stay local.
- Modify: `index.html`
  - Replace the SB Admin dashboard markup with a semantic personal homepage.
  - Do not reference Bootstrap, jQuery, Font Awesome, or remote fonts.
- Create: `css/site.css`
  - Own all new visual styling: layout, color, typography, cards, buttons, responsive behavior, and focus states.
- Removed after homepage verification: old vendor/template assets, demo pages, npm/gulp files, and SB Admin styles.
  - The public site now depends only on `index.html` and `css/site.css`.

## Implementation Notes

- Do not run `git add`, `git commit`, or `git push`. User owns git writes.
- Keep edits surgical: new homepage only, no broad vendor cleanup.
- Use Korean-centered copy with short English section labels.
- Avoid fake credentials, fake metrics, inflated claims, or links to unknown external profiles.
- Use `https://github.com/anothel` for GitHub link unless the user corrects the handle.
- Contact should be GitHub-only until the user provides a real public contact link.

## Task 1: Ignore Local Brainstorm Artifacts

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: Add local artifact ignore rule**

Append this block to `.gitignore`:

```gitignore

# Codex/Superpowers local planning artifacts
.superpowers/
```

- [ ] **Step 2: Verify ignore rule exists**

Run:

```powershell
rg -n "^\.superpowers/$" .gitignore
```

Expected:

```text
.gitignore:<line>:.superpowers/
```

- [ ] **Step 3: Check git status**

Run:

```powershell
git status --short
```

Expected:

```text
 M .gitignore
?? docs/
```

The `.superpowers/` directory should not appear after the ignore rule is added.

## Task 2: Create Site Stylesheet

**Files:**
- Create: `css/site.css`

- [ ] **Step 1: Create `css/site.css` with complete site styles**

Create `css/site.css` with this content:

```css
:root {
    color-scheme: light;
    --bg: #f7f6f2;
    --surface: #ffffff;
    --surface-muted: #efede7;
    --text: #1f2523;
    --muted: #68706c;
    --line: #dedbd2;
    --accent: #2f6f63;
    --accent-strong: #1f4f46;
    --shadow: 0 20px 60px rgba(31, 37, 35, 0.08);
    --radius: 8px;
    --max: 1080px;
}

* {
    box-sizing: border-box;
}

html {
    scroll-behavior: smooth;
}

body {
    margin: 0;
    background: var(--bg);
    color: var(--text);
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    line-height: 1.6;
}

a {
    color: inherit;
    text-decoration-thickness: 1px;
    text-underline-offset: 0.2em;
}

a:hover {
    color: var(--accent-strong);
}

a:focus-visible,
button:focus-visible {
    outline: 3px solid rgba(47, 111, 99, 0.35);
    outline-offset: 3px;
}

.page {
    width: min(100% - 40px, var(--max));
    margin: 0 auto;
}

.site-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    padding: 28px 0;
    border-bottom: 1px solid var(--line);
}

.brand {
    font-weight: 800;
    letter-spacing: 0;
}

.site-nav {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    color: var(--muted);
    font-size: 0.95rem;
}

.site-nav a {
    text-decoration: none;
}

.hero {
    display: grid;
    grid-template-columns: minmax(0, 1.3fr) minmax(260px, 0.7fr);
    gap: 48px;
    align-items: end;
    padding: 88px 0 72px;
}

.eyebrow {
    margin: 0 0 14px;
    color: var(--accent);
    font-size: 0.85rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
}

h1,
h2,
h3,
p {
    margin-top: 0;
}

h1 {
    max-width: 760px;
    margin-bottom: 22px;
    font-size: clamp(2.4rem, 6vw, 5.5rem);
    line-height: 0.98;
    letter-spacing: 0;
}

.lead {
    max-width: 650px;
    margin-bottom: 30px;
    color: var(--muted);
    font-size: 1.12rem;
}

.actions {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
}

.button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 44px;
    padding: 0 16px;
    border: 1px solid var(--text);
    border-radius: var(--radius);
    background: var(--text);
    color: var(--surface);
    font-weight: 800;
    text-decoration: none;
}

.button.secondary {
    border-color: var(--line);
    background: transparent;
    color: var(--text);
}

.hero-card {
    padding: 22px;
    border: 1px solid var(--line);
    border-radius: var(--radius);
    background: rgba(255, 255, 255, 0.62);
    box-shadow: var(--shadow);
}

.hero-card p {
    margin-bottom: 12px;
    color: var(--muted);
}

.hero-card strong {
    display: block;
    margin-bottom: 4px;
    color: var(--text);
}

.section {
    padding: 54px 0;
    border-top: 1px solid var(--line);
}

.section-heading {
    display: grid;
    grid-template-columns: 180px minmax(0, 1fr);
    gap: 28px;
    margin-bottom: 24px;
}

.section-heading h2 {
    margin: 0;
    font-size: 0.95rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
}

.section-heading p {
    max-width: 650px;
    margin-bottom: 0;
    color: var(--muted);
}

.grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;
}

.card,
.note {
    min-height: 100%;
    padding: 22px;
    border: 1px solid var(--line);
    border-radius: var(--radius);
    background: var(--surface);
}

.card h3,
.note h3 {
    margin-bottom: 10px;
    font-size: 1.05rem;
}

.card p,
.note p,
.about-copy {
    color: var(--muted);
}

.meta {
    display: inline-flex;
    margin-bottom: 16px;
    color: var(--accent-strong);
    font-size: 0.78rem;
    font-weight: 800;
    letter-spacing: 0.06em;
    text-transform: uppercase;
}

.note-list {
    display: grid;
    gap: 14px;
}

.note {
    display: grid;
    grid-template-columns: 140px minmax(0, 1fr);
    gap: 20px;
}

.note time {
    color: var(--muted);
    font-size: 0.92rem;
}

.about-layout {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 32px;
}

.link-list {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    padding: 0;
    margin: 0;
    list-style: none;
}

.link-list a {
    display: inline-flex;
    min-height: 42px;
    align-items: center;
    padding: 0 14px;
    border: 1px solid var(--line);
    border-radius: var(--radius);
    background: var(--surface);
    text-decoration: none;
}

.site-footer {
    padding: 40px 0;
    border-top: 1px solid var(--line);
    color: var(--muted);
    font-size: 0.92rem;
}

@media (max-width: 820px) {
    .page {
        width: min(100% - 28px, var(--max));
    }

    .site-header,
    .hero,
    .section-heading,
    .about-layout,
    .note {
        grid-template-columns: 1fr;
    }

    .site-header {
        align-items: flex-start;
        flex-direction: column;
    }

    .hero {
        gap: 28px;
        padding: 56px 0 48px;
    }

    .grid {
        grid-template-columns: 1fr;
    }

    .section {
        padding: 42px 0;
    }
}
```

- [ ] **Step 2: Verify stylesheet has no SB Admin dependency**

Run:

```powershell
rg -n "bootstrap|sb-admin|fontawesome|jquery|gradient" css\site.css
```

Expected: no output and exit code `1`.

## Task 3: Replace Homepage Markup

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Replace `index.html` with semantic static homepage**

Replace the full contents of `index.html` with:

```html
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="anothel의 작업, 메모, 링크를 모아둔 개인 홈입니다.">
    <meta name="author" content="anothel">
    <title>anothel</title>
    <link rel="stylesheet" href="css/site.css">
</head>
<body>
    <div class="page">
        <header class="site-header">
            <a class="brand" href="#top" aria-label="anothel home">anothel</a>
            <nav class="site-nav" aria-label="Main navigation">
                <a href="#work">Work</a>
                <a href="#notes">Notes</a>
                <a href="#about">About</a>
                <a href="#contact">Contact</a>
            </nav>
        </header>

        <main id="top">
            <section class="hero" aria-labelledby="intro-title">
                <div>
                    <p class="eyebrow">Personal home base</p>
                    <h1 id="intro-title">만든 것, 배운 것, 남겨둘 링크를 정리합니다.</h1>
                    <p class="lead">
                        GitHub Pages 위에 올려두는 작은 개인 홈입니다. 프로젝트, 짧은 메모,
                        다시 찾아볼 링크를 한곳에 모읍니다.
                    </p>
                    <div class="actions">
                        <a class="button" href="https://github.com/anothel">GitHub 보기</a>
                        <a class="button secondary" href="#work">작업 보기</a>
                    </div>
                </div>

                <aside class="hero-card" aria-label="Site summary">
                    <p><strong>Work</strong>작게 만들고 다듬은 것들.</p>
                    <p><strong>Notes</strong>배운 점과 남겨둘 생각들.</p>
                    <p><strong>Contact</strong>연락처와 외부 프로필.</p>
                </aside>
            </section>

            <section class="section" id="work" aria-labelledby="work-title">
                <div class="section-heading">
                    <h2 id="work-title">Work</h2>
                    <p>완성도보다 흐름을 먼저 정리합니다. 공개할 만한 작업이 생기면 이곳에 설명과 링크를 더합니다.</p>
                </div>

                <div class="grid">
                    <article class="card">
                        <span class="meta">Portfolio</span>
                        <h3>Personal home base</h3>
                        <p>이 GitHub Pages 저장소를 개인 홈으로 재구성하는 작업입니다.</p>
                    </article>

                    <article class="card">
                        <span class="meta">Archive</span>
                        <h3>Useful links</h3>
                        <p>자주 다시 보는 도구, 문서, 글을 정리할 작은 인덱스입니다.</p>
                    </article>

                    <article class="card">
                        <span class="meta">Later</span>
                        <h3>Mini lab</h3>
                        <p>작은 실험, 데모, 도구를 올릴 수 있는 공간으로 확장할 예정입니다.</p>
                    </article>
                </div>
            </section>

            <section class="section" id="notes" aria-labelledby="notes-title">
                <div class="section-heading">
                    <h2 id="notes-title">Notes</h2>
                    <p>블로그를 크게 시작하기보다, 홈에 짧은 메모부터 쌓습니다.</p>
                </div>

                <div class="note-list">
                    <article class="note">
                        <time datetime="2026-06-13">2026.06.13</time>
                        <div>
                            <h3>GitHub Pages는 개인 홈으로 쓰기 좋다</h3>
                            <p>정적 파일만으로 충분한 정보 구조를 만들 수 있고, 유지 비용이 낮습니다.</p>
                        </div>
                    </article>

                    <article class="note">
                        <time datetime="2026-06-13">2026.06.13</time>
                        <div>
                            <h3>첫 버전은 작아야 한다</h3>
                            <p>프로젝트, 메모, 링크만 제대로 보이면 이후 블로그나 랩으로 확장하기 쉽습니다.</p>
                        </div>
                    </article>
                </div>
            </section>

            <section class="section" id="about" aria-labelledby="about-title">
                <div class="section-heading">
                    <h2 id="about-title">About</h2>
                    <p>과하게 포장하지 않고, 지금 만드는 것과 관심사를 담는 공간입니다.</p>
                </div>

                <div class="about-layout">
                    <p class="about-copy">
                        소프트웨어를 만들고, 배운 내용을 정리하고, 다시 찾을 만한 자료를 남깁니다.
                        이 페이지는 포트폴리오와 개인 노트 사이의 가벼운 시작점입니다.
                    </p>
                    <p class="about-copy">
                        더 많은 글이 쌓이면 notes를 별도 아카이브로 나누고, 작은 도구나 실험은 lab으로 분리합니다.
                    </p>
                </div>
            </section>

            <section class="section" id="contact" aria-labelledby="contact-title">
                <div class="section-heading">
                    <h2 id="contact-title">Contact</h2>
                    <p>현재는 GitHub를 중심으로 연결합니다. 다른 연락 링크는 필요할 때 추가합니다.</p>
                </div>

                <ul class="link-list">
                    <li><a href="https://github.com/anothel">GitHub</a></li>
                </ul>
            </section>
        </main>

        <footer class="site-footer">
            <p>Built as a small static site for GitHub Pages.</p>
        </footer>
    </div>
</body>
</html>
```

- [ ] **Step 2: Verify old dashboard title and assets are gone from homepage**

Run:

```powershell
rg -n "SB Admin|Dashboard|bootstrap|jquery|fontawesome|vendor/" index.html
```

Expected: no output and exit code `1`.

- [ ] **Step 3: Verify new sections exist**

Run:

```powershell
rg -n "id=\"work\"|id=\"notes\"|id=\"about\"|id=\"contact\"|css/site.css" index.html
```

Expected:

```text
index.html:<line>:    <link rel="stylesheet" href="css/site.css">
index.html:<line>:            <section class="section" id="work" aria-labelledby="work-title">
index.html:<line>:            <section class="section" id="notes" aria-labelledby="notes-title">
index.html:<line>:            <section class="section" id="about" aria-labelledby="about-title">
index.html:<line>:            <section class="section" id="contact" aria-labelledby="contact-title">
```

## Task 4: Static Verification

**Files:**
- Read: `index.html`
- Read: `css/site.css`

- [ ] **Step 1: Verify referenced local stylesheet exists**

Run:

```powershell
Test-Path -LiteralPath css\site.css
```

Expected:

```text
True
```

- [ ] **Step 2: Verify homepage has no missing local asset references**

Run:

```powershell
rg -n "href=\"(css/|js/|vendor/|img/)|src=\"(css/|js/|vendor/|img/)" index.html
```

Expected:

```text
index.html:<line>:    <link rel="stylesheet" href="css/site.css">
```

No `js/`, `vendor/`, or `img/` references should appear.

- [ ] **Step 3: Verify basic semantic landmarks**

Run:

```powershell
rg -n "<header|<main|<section|<footer|<nav" index.html
```

Expected: output includes one `header`, one `main`, four content `section` entries, one `footer`, and one `nav`.

- [ ] **Step 4: Verify responsive CSS exists**

Run:

```powershell
rg -n "@media \(max-width: 820px\)|grid-template-columns: 1fr|width: min\(100% - 28px" css\site.css
```

Expected: output includes all three patterns.

- [ ] **Step 5: Verify contact link is GitHub-only**

Run:

```powershell
$html = [System.IO.File]::ReadAllText((Resolve-Path -LiteralPath 'index.html'), [System.Text.Encoding]::UTF8)
$contact = [regex]::Match($html, '<section class="section" id="contact"[\s\S]*?</section>').Value
$contact.Contains('https://github.com/anothel')
([regex]::Matches($contact, '<a ')).Count
```

Expected:

```text
True
1
```

- [ ] **Step 6: Check git status without staging**

Run:

```powershell
git status --short
```

Expected:

```text
 M .gitignore
 M index.html
?? css/site.css
?? docs/
```

If `css/site.css` shows as modified instead of untracked, that is also acceptable if the file already existed before implementation.

## Task 5: Manual Browser Review

**Files:**
- Read: `index.html`
- Read: `css/site.css`

- [ ] **Step 1: Open the homepage locally**

Open this file in a browser:

```text
D:\project\anothel.github.io\index.html
```

Expected:

- Page title is `anothel`.
- First visible page is a personal homepage, not SB Admin.
- Header navigation is visible.
- Hero text is readable.
- Work, Notes, About, Contact sections appear in order.

- [ ] **Step 2: Check desktop layout**

At a desktop-sized viewport, verify:

- Hero uses two columns.
- Project cards appear in a row.
- Notes appear as horizontal date/content rows.
- No text overlaps.
- No missing icon boxes or broken images appear.

- [ ] **Step 3: Check mobile layout**

At a narrow viewport, verify:

- Header stacks cleanly.
- Hero becomes one column.
- Project cards become one column.
- Notes become one column.
- Buttons do not overflow.

- [ ] **Step 4: Check in-page links**

Click these links:

```text
Work
Notes
About
Contact
작업 보기
```

Expected: each link scrolls to the matching section.

## Task 6: Post-Implementation Notes For User

**Files:**
- Read: `git status --short`

- [ ] **Step 1: Summarize changed files**

Report:

```text
Changed:
- .gitignore: ignores local .superpowers artifacts.
- index.html: replaces SB Admin dashboard with personal homepage.
- css/site.css: adds quiet technical visual styling.
- docs/superpowers/specs/...: design spec.
- docs/superpowers/plans/...: implementation plan.
```

- [ ] **Step 2: Report verification commands**

Report exact commands run and whether each passed:

```text
rg -n "SB Admin|Dashboard|bootstrap|jquery|fontawesome|vendor/" index.html
rg -n "id=\"work\"|id=\"notes\"|id=\"about\"|id=\"contact\"|css/site.css" index.html
Test-Path -LiteralPath css\site.css
rg -n "href=\"(css/|js/|vendor/|img/)|src=\"(css/|js/|vendor/|img/)" index.html
rg -n "<header|<main|<section|<footer|<nav" index.html
rg -n "@media \(max-width: 820px\)|grid-template-columns: 1fr|width: min\(100% - 28px" css\site.css
$html = [System.IO.File]::ReadAllText((Resolve-Path -LiteralPath 'index.html'), [System.Text.Encoding]::UTF8)
$contact = [regex]::Match($html, '<section class="section" id="contact"[\s\S]*?</section>').Value
$contact.Contains('https://github.com/anothel')
([regex]::Matches($contact, '<a ')).Count
git status --short
```

- [ ] **Step 3: Do not stage or commit**

Confirm:

```text
No git add, commit, or push was run.
```

## Self-Review

Spec coverage:

- Personal home base: Task 3.
- Quiet technical style: Task 2.
- Plain HTML/CSS: Tasks 2 and 3.
- No public SB Admin navigation: Task 3 verification.
- Work, Notes, About, Contact sections: Task 3.
- Responsiveness and accessibility basics: Tasks 2, 3, and 4.
- No git staging/commit/push: Tasks 1, 4, and 6.
- Future `/notes/` and `/lab/` path: homepage copy in Task 3.

Content scan:

- No unresolved marker text remains in implementation steps.
- No deferred-work phrasing remains in implementation steps.

Scope check:

- This plan builds one working static homepage. It does not attempt blog engine, lab pages, template cleanup, custom domain setup, or deployment workflow changes.
