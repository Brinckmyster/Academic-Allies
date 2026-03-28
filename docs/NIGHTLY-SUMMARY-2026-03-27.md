# Academic Allies — Nightly Deep Audit Summary
**Date:** 2026-03-27 (late run)
**Auditor:** Claude
**Overall Health:** GOOD — No critical vulnerabilities. A handful of medium-priority housekeeping items.

---

## CRITICAL ISSUES
**None found.** Auth, security, mirror guards, and Firestore write protections are all solid.

---

## WARNINGS (Medium Priority)

### 1. Stale Cache-Bust Versions (2 files)
Two pages are fetching shared-header.html with an outdated `?v=20260324` while the rest of the codebase uses `?v=20260327`:

- `modular/components/bedroom-planner/bedroom-planner.html` (line 99)
- `modular/static/sitemap.html` (line 170)

**Fix:** Update the `?v=` parameter to `20260327` in both files.

### 2. Stale Worktrees (2 orphaned)
Two Claude worktrees point to non-existent Windows paths and are marked PRUNABLE:

- `nice-jang` -> branch `claude/nice-jang` (commit 433ec81)
- `vigilant-poincare` -> branch `claude/vigilant-poincare` (commit 433ec81)

**Fix (run in Git Bash):**

```bash
git worktree prune
git branch -d claude/nice-jang
git branch -d claude/vigilant-poincare
```

### 3. Misplaced .FIX / .NEW Files in Repo (3 files)
These temp files are sitting in the source tree instead of the archive:

- `index.html.FIX` (root, 48K)
- `sw.js.NEW` (root, 11K)
- `modular/js/status-circle.js.NEW` (52K)

**Fix:** Move to `modular/archive/` or delete after confirming they are no longer needed.

### 4. Misplaced Backup in Root
- `.claude.json.backup` (root, 4K) — should be in `modular/archive/`

---

## HOUSEKEEPING (Low Priority)

### 5. Broken Images in Icon Gallery (Cosmetic)
`modular/icon-gallery.html` references 4 home icon variants that don't exist on disk:
- `icons/home.jpeg` (line 108)
- `icons/home.jpg` (line 112)
- `icons/home.svg` (line 120)
- `icons/home.webp` (line 124)

Only `icons/home.png` exists. This is purely cosmetic — icon-gallery is a dev/test page.

### 6. FUSE Filesystem Artifact
- `.fuse_hidden0000077f00000001` (root, 3.2K) — leftover from an interrupted file operation. Safe to ignore.

### 7. Duplicate DOMContentLoaded Listeners
`meal-planner/bootstrap-suggestor.js` and `meal-planner-mary/bootstrap-suggestor.js` each register 7-8 separate `onReady()` wrappers. Not a bug (they use `{once:true}`), but could be consolidated for maintainability.

---

## AUDIT RESULTS BY CATEGORY

### 1. Broken Resources — PASS
All script/CSS/manifest references resolve. All fetch() calls to shared components are valid. Only the icon-gallery cosmetic issue noted above.

### 2. Auth & Security — PASS
- Firebase persistence defaults to LOCAL with explicit SESSION opt-out via "Keep me signed in" checkbox
- All 15+ pages with Firestore writes are protected by mirror mode guards
- `AA_MIRROR_CAN_WRITE` is true ONLY for network-lead role
- All pages that access user data check `onAuthStateChanged`
- No unprotected write paths found

### 3. Cache Consistency — PASS (with 2 stale files noted above)
- sw.js CACHE_VERSION: `aa-shell-20260327d` — current
- NEVER_CACHE list is comprehensive and up-to-date (includes bedroom-planner added today)
- Shared-footer cache-bust: `?v=20260326` (fetched via shared-header only)

### 4. Code Quality — PASS
- **ES5 compliance:** No violations found. No let/const/arrow functions/template literals/classes in production code.
- **Unused variables:** None detected
- **Event listener patterns:** Acceptable with minor consolidation opportunity (see #7 above)

### 5. Archive Hygiene — PASS (with items noted above)
- All `.bak` files in `modular/archive/` are properly stored and named
- No dot-file archives found
- The 3 misplaced .FIX/.NEW files and 1 root backup are the only issues

### 6. Redundancy Checks — DETAILED RESULTS

| Check | Grade | Notes |
|-------|-------|-------|
| Error handling coverage | A | 94/94 Firestore ops have .catch(); 7/7 fetch calls have .catch() |
| Offline fallbacks | B+ | Status, Meals, Migraine, Study have offline queues; Calendar/Messages/Settings lack offline support (acceptable) |
| Retry logic | B+ | Token refresh and write queues work well; initial user doc retries implicitly on next session |
| Null/undefined guards | A- | 99% guarded; 3-4 edge cases safe due to upstream existence checks |
| Race condition prevention | A | Documented listener inventory; teardown before resubscribe; UID guards on token refresh |
| Duplicate listener prevention | A | Flags prevent stacking; teardown() called before re-subscribing |
| Graceful degradation | A | Each feature fails independently; no cascading failures; localStorage fallbacks work |
| Data validation on write | A | Critical writes (user doc, emails, roles) validated; non-critical writes trust UI + Firestore rules |
| Service worker staleness | PASS | CACHE_VERSION current; NEVER_CACHE list up-to-date |

### 7. Misplaced Files — NOTED
- 3 .FIX/.NEW temp files (see Warning #3)
- 1 misplaced root backup (see Warning #4)
- 1 FUSE artifact (see #6)
- 2 orphaned worktrees (see Warning #2)
- No stale remote branches (Brinckmyster-Aestas is off-limits and untouched)

---

## RECOMMENDED GIT COMMANDS (DO NOT RUN — for Bruise to execute)

```bash
# 1. Prune orphaned worktrees and stale branches
git worktree prune
git branch -d claude/nice-jang
git branch -d claude/vigilant-poincare

# 2. Archive misplaced files (after confirming they are no longer needed)
mv index.html.FIX modular/archive/index_2026-03-27_FIX-variant.bak.html
mv sw.js.NEW modular/archive/sw_2026-03-27_NEW-variant.bak.js
mv modular/js/status-circle.js.NEW modular/archive/status-circle_2026-03-27_NEW-variant.bak.js
mv .claude.json.backup modular/archive/claude-json_2026-03-27.bak.json

# 3. Stage and commit cleanup
git add -A
git commit -m "Claude: Nightly housekeeping — archive misplaced files, prune stale worktrees"
git push origin main
```

---

*Report generated by Claude — 2026-03-27 nightly deep audit (late run)*
