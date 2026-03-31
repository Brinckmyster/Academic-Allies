# Nightly Audit Summary — 2026-03-30

**Auditor:** Claude (automated nightly deep audit)
**Repo:** brinckmyster.github.io/Academic-Allies
**Branch:** main (commit 6e9f7b8)

---

## CRITICAL ISSUES

### 1. sw.js is truncated — offline fallback handler missing

The service worker file has been truncated since commit `404b74d` (around 2026-03-27). The last ~8 lines are missing, cutting off mid-function in the fetch event handler's `.catch()` block. The offline fallback that serves `offline.html` for navigation requests when fully offline is gone.

- **Impact:** Users who are fully offline and visit a page not in cache will get a browser error instead of the friendly `offline.html` page.
- **Last good version:** commit `655c64d` (213 lines, properly closed with `});`)
- **Current version:** 205 lines, ends mid-line inside `.catch(function () {`

**Recovery lines needed (from 655c64d):**
```
        /* Fully offline and not cached — return offline fallback for navigation
           Claude: 2026-03-16 — offline fallback page */
        if (req.mode === 'navigate') {
          return caches.match('/Academic-Allies/offline.html');
        }
        /* For other resources just fail gracefully */
      });
    })
  );
});
```

### 2. Git lock file present — .git/index.lock exists

A stale `index.lock` file is blocking git operations. This must be removed before any commits can proceed.

### 3. 51 uncommitted file changes in working tree

There are 51 modified files (not yet committed) that appear to be a cache-bust version bump from `v=20260328` to `v=20260330` plus some error handling improvements (e.g., fallback nav on shared-header load failure). These changes need to be reviewed and committed.

---

## WARNINGS

### 4. 92 dot-file archives in modular/archive/ (rule violation)

CLAUDE.md explicitly forbids dot-file archives: "No dot-files." However, 92 files starting with `.` were created in `modular/archive/` today, all named `.claude_worktrees_*_2026-03-30_pre-version-bump.bak.html`. These appear to have been created by a worktree-based operation. They are currently untracked (not committed) and should be renamed to remove the leading dot, or deleted if the non-dot-file versions already exist.

### 5. Two stale worktrees (prunable)

Per CLAUDE.md: "After every task: delete your worktree and branch."

- `.claude/worktrees/focused-merkle` [claude/focused-merkle] — prunable
- `.claude/worktrees/hardcore-poitras` [claude/hardcore-poitras] — prunable

### 6. Firestore rules — invites readable by any signed-in user

Any signed-in user can read any invite document if they know the invite code. Low risk since codes are 6-character, single-use, and short-lived, but less restrictive than ideal.

### 7. watchSpoonPal() and watchSpoonPlan() error callbacks don't notify callers

In `aa-firebase.js`, the error callback in `watchSpoonPal()` (~line 1089) and `watchSpoonPlan()` (~line 1422) log the error but never call `callback(null, err)`. If Firestore fails, the UI can get stuck in a loading state. Compare with `watchMealLog()` (~line 1058) which was already fixed to pass errors to the callback.

### 8. style.css loaded without cache-bust version parameter

`style.css` is loaded without a `?v=` query string. All JS files are properly versioned to `v=20260330`. Low risk since CSS changes are rare, but inconsistent.

---

## HOUSEKEEPING

### 9. .fuse_hidden file in repo root

`.fuse_hidden0000077f00000001` exists in root — this is a FUSE artifact. It is correctly caught by `.gitignore` pattern `.fuse_hidden*` (line 99) and will not be committed.

### 10. .bash_history in repo root

Correctly gitignored (line 73). Not a concern.

### 11. Cache-bust versions synchronized

All 45 live (non-archive) HTML files have been updated to `v=20260330` in the working tree (uncommitted). Once the lock file is cleared and changes committed, this will be current.

### 12. SW cache name vs today's date

CACHE_NAME is `aa-shell-20260329b` — this was last bumped on 2026-03-29. After the sw.js truncation is fixed and changes committed, this should be bumped to `aa-shell-20260330` to force cache refresh.

---

## AUDIT RESULTS BY CATEGORY

### 1. Broken Resources
**PASS** — Zero broken references found across all 35+ HTML files. All script, CSS, manifest, image, and fetch references resolve to existing files. External CDN links (Firebase 10.7.1, Google Fonts, GIS) are current and stable. Manifest icon references verified.

### 2. Auth & Security
**PASS** — All Firestore writes are guarded by `_mirrorWriteBlocked()` or equivalent mirror mode checks. Auth state handled via `AA.auth.onAuthStateChanged()` with 7 core listeners + ~43 component-level listeners, all properly scoped. No unprotected pages render user data before auth confirmation. Health data (checkins, nope, spoonPal, mealPlans) properly scoped to owner + network + admin. Single hardcoded admin email with role caps enforced.

### 3. Cache Consistency
**FAIL** — sw.js truncation (Critical #1). Cache-bust versions otherwise properly synchronized to v=20260330 across all live pages. NEVER_CACHE list covers all 31 dynamic files. Precache list (16 SHELL items) all verified present on disk. shared-footer loaded indirectly through shared-header at matching version.

### 4. Code Quality (ES5 Compliance)
**PASS** — Zero ES5 violations found across 22 JavaScript files and 13 HTML files with inline scripts. Consistent use of `var`, `function()` syntax, string concatenation, and `'use strict'`. No let/const, arrow functions, template literals, classes, destructuring, default parameters, spread operators, for...of, async/await, optional chaining, or nullish coalescing.

### 5. Archive Hygiene
**PARTIAL FAIL** — All 105 .bak files are correctly located in `modular/archive/` (not scattered). However, 92 dot-file archives violate the "no dot-files" rule (Warning #4). No .FIX, .NEW, .old, .tmp, .orig, or _backup files found outside archive.

### 6. Redundancy & Error Handling
**MOSTLY PASS** — Firestore persistence enabled with `synchronizeTabs: true`. Offline banner in shared-header detects `navigator.onLine`. Checkin saves to localStorage as fallback. Input validation (XSS escaping via `esc()` / `escHtml()`) applied consistently. Auth race conditions mitigated with persistence timeout (8-15s) and `_persistenceReady` promise. Two error callback gaps in watch functions (Warning #7). Listener cleanup pattern relies on callers storing unsubscribe refs — works but could be more robust.

### 7. Misplaced Files
**PASS** — Repo root contains only allowed files per CLAUDE.md. No stray code files, no temp files. `.fuse_hidden` and `.bash_history` are properly gitignored.

---

## RECOMMENDED GIT COMMANDS

> **DO NOT RUN** — These are for Bruise to review and execute manually.

```bash
# 1. Remove the stale git lock file
rm -f .git/index.lock

# 2. Prune stale worktrees
git worktree prune

# 3. Delete stale worktree branches
git branch -D claude/focused-merkle
git branch -D claude/hardcore-poitras

# 4. Rename dot-file archives (remove leading dots) — run from repo root
cd modular/archive && for f in .claude_worktrees_*; do mv "$f" "${f#.}"; done && cd ../..

# 5. After sw.js is restored and changes reviewed, commit everything:
# git add -A
# git commit -m "Claude: Fix sw.js truncation + commit cache-bust v=20260330 + archive cleanup"
# git push origin main
```

---

*Report generated by Claude — Nightly Deep Audit, 2026-03-30*
