# Nightly Audit Summary — 2026-03-28

**Auditor:** Claude
**Repo:** Academic-Allies (brinckmyster.github.io/Academic-Allies)
**Branch:** main
**Commit at audit:** 4a83753

---

## CRITICAL ISSUES

### 1. Cache-bust version mismatch (42 pages stale)

The shared-header fetch version was bumped to `v=20260328` but **42 HTML pages still reference `v=20260327`**. This means most pages are requesting a stale version of shared-header.html, defeating the purpose of the cache-bust.

**Pages already at `v=20260328` (3 only):**
- `bedroom-planner.html`, `shared-header.html`, `sitemap.html`

**Pages still at `v=20260327` (42 pages):**
- Core: `accommodations.html`, `admin.html`, `checkin.html`, `checkin-log.html`, `emergency.html`, `resources.html`, `icon-gallery.html`
- Components: `audio-notes.html`, `audio-converter.html`, `audit-log.html`, `calendar.html`, `meal-planner-mary/index.html`, `meal-planner.html`, `message-system.html`, `modes.html`, `recovery-mode.html`, `settings.html`, `spoon-pal.html`, `spoon-planner.html`, `streak-cat.html`, `student-config-editor.html`, `study-notes.html`, `support-dashboard.html`, `user-tiers.html`
- Templates: `accommodation-request.html`, `counselor-outreach.html`, `network-invite.html`, `templates.html`
- Static/study: All 10 floral quiz files, `custom-quiz.html`, `network-lead-guide.html`, `study-tools.html`, `utc-converter.html`
- Other: `docs/TEAM-PROFILES.html`

**Impact:** Users on these pages may load a stale shared-header until they hard-refresh.

---

## WARNINGS

### 2. Four ES5 compliance violations

The project targets ES5 but four files use ES6+ methods:

| File | Line | Violation | Fix |
|------|------|-----------|-----|
| `sw.js` | 108 | `Promise.allSettled()` (ES2020) | Replace with `Promise.all()` or polyfill |
| `modular/admin.html` | 729 | `Object.values()` (ES2017) | Use `Object.keys().map()` |
| `modular/components/bedroom-planner/bedroom-planner.html` | 106 | `Array.from()` (ES2015) | Use `[].slice.call()` |
| `modular/static/floral-fill-blank.html` | 653 | `Array.from()` (ES2015) | Use `[].slice.call()` |

### 3. Four stale worktrees (prunable)

| Worktree | Branch |
|----------|--------|
| nice-jang | claude/nice-jang |
| vigilant-poincare | claude/vigilant-poincare |
| wonderful-darwin | claude/wonderful-darwin |
| wonderful-khorana | claude/wonderful-khorana |

All are prunable and their branches can be deleted.

### 4. Missing icon variants in icon-gallery.html

`icon-gallery.html` references four non-existent image format variants:
- `icons/home.jpeg`, `icons/home.jpg`, `icons/home.svg`, `icons/home.webp`

Only `home.png` exists. Low impact — gallery page only.

### 5. Component HTML files not in sw.js SHELL or NEVER_CACHE

These files are not listed in either the precache or never-cache lists:
- `bedroom-planner.html`
- `student-config/mary-crossword-floral.html`
- `student-config/mary-wordsearch-cooking.html`
- `templates/*.html` (4 template files)

Also, 3 JSON data files (`bonus-quizzes.json`, `mary-quizzes.json`, `example-configs.json`) are not in NEVER_CACHE and will be cached on first fetch. If they change frequently, consider adding them.

---

## HOUSEKEEPING

### 6. Root-level files to review

Files present in repo root that the CLAUDE.md rules say shouldn't be there:

| File | Note |
|------|------|
| `404.html` | GitHub Pages requires this at root — **acceptable exception** |
| `offline.html` | Service worker fallback — **acceptable exception** |
| `.bash_history` | System artifact; should be in .gitignore |
| `.fuse_hidden0000077f00000001` | FUSE mount artifact; should be in .gitignore |

### 7. Archive hygiene

**Status: CLEAN.** All 1,466 archive files are properly located in `modular/archive/` with correct `.bak` naming. No dot-file archives, no misplaced .FIX/.NEW files found.

---

## AUDIT RESULTS BY CATEGORY

### Broken Resources
**Status: PASS**
All script, CSS, manifest, and asset references resolve correctly across all 13 HTML files. Only issue: 4 missing icon format variants in icon-gallery.html (non-critical).

### Auth & Security
**Status: PASS**
- All Firestore writes guarded by `_mirrorWriteBlocked()` in aa-firebase.js
- 7 core + 43 component `onAuthStateChanged` listeners, properly scoped, no conflicts
- No `eval()` usage, no XSS vectors found
- `escHtml()` sanitization applied consistently
- Admin page guarded by `AA.isAdmin()` check
- Role caps enforced (MAX_BACKSTAGE_MANAGERS=2, MAX_NETWORK_LEADS_PER_STUDENT=2)
- Comprehensive audit logging via `AA.logAccess()`

### Cache Consistency
**Status: FAIL — see Critical Issue #1**
- sw.js CACHE_NAME: `aa-shell-20260328a` (current)
- All SHELL precache files exist on disk
- NEVER_CACHE list is well-curated (56 entries)
- **42 pages have stale `v=20260327` cache-bust strings**

### Code Quality (ES5 Compliance)
**Status: MOSTLY PASS — 4 violations**
- No `let`/`const`, arrow functions, template literals, `class`, `import`/`export`, `async`/`await`, destructuring, or spread operator found
- `.includes()` properly replaced with `.indexOf()` throughout
- 4 isolated ES6+ method calls (see Warning #2)
- No unused variables detected in major files

### Archive Hygiene
**Status: PASS**
All archives properly in `modular/archive/` with correct naming conventions.

### Redundancy & Error Handling
**Status: PASS**
- All Firebase operations have `.catch()` handlers
- Offline support via sw.js cache-first strategy + offline.html fallback
- Null guards on `auth.currentUser`, `doc.exists`, DOM elements
- Race condition prevention via bound flags (`_docClickBound`, token-refresh guards)
- Data validation and XSS prevention consistent

### Misplaced Files
**Status: MOSTLY PASS**
- 404.html and offline.html at root are acceptable (GitHub Pages / SW requirements)
- `.bash_history` and `.fuse_hidden*` should be gitignored
- 4 stale worktrees and branches need cleanup

---

## RECOMMENDED GIT COMMANDS

> **DO NOT RUN** — for Bruise to execute manually

```bash
# 1. Prune stale worktrees
git worktree prune

# 2. Delete stale local branches (DO NOT touch Brinckmyster-Aestas)
git branch -D claude/nice-jang
git branch -D claude/vigilant-poincare
git branch -D claude/wonderful-darwin
git branch -D claude/wonderful-khorana

# 3. Add system artifacts to .gitignore (if not already)
echo ".bash_history" >> .gitignore
echo ".fuse_hidden*" >> .gitignore
```

---

*Report generated by Claude — Nightly Deep Audit, 2026-03-28*
