# Academic Allies — Nightly Audit Summary
**Date:** 2026-04-11  
**Audited by:** Claude (automated nightly run)  
**Repo:** brinckmyster.github.io/Academic-Allies  
**Branch:** main @ b280f4d

---

## CRITICAL ISSUES

### 1. Debug filter-disable left in production (`auto-generate-classes.js`, line 462)
**Severity: HIGH**  
Commit `acc6580` ("temporarily disable class term filter to debug missing classes") changed `return isCurrentOrFutureClass(cls, windowInfo)` to `return true` inside the `studyClasses.filter()` callback. This means **all classes show regardless of their academic term dates** — the date-filtering logic is completely bypassed.

Commit `b280f4d` (the latest) fixed the IIFE guard structure but did **not** restore the filter. The debug state is live in production.

**File:** `modular/js/auto-generate-classes.js`, around line 460-462  
**Fix:** Change `return true;` back to `return isCurrentOrFutureClass(cls, windowInfo);`

```diff
-         return true;
+         return isCurrentOrFutureClass(cls, windowInfo);
```

**DO NOT RUN — for Bruise to review and run:**
```bash
# After making the edit above in VS Code:
git add modular/js/auto-generate-classes.js
git commit -m "Claude: Restore class term filter — revert debug return-true from acc6580"
git push
```

---

### 2. `auto-generate-classes.js` not in `sw.js` NEVER_CACHE (stale cache risk)
**Severity: HIGH**  
This file has had **20+ commits** since the current SW cache version (`aa-shell-20260406d`). It is not listed in `NEVER_CACHE`, so the service worker can serve a stale version to returning users. Given the active debugging work on this file, stale SW cache is a real risk.

**Fix:** Add to NEVER_CACHE in `sw.js`:
```javascript
'/Academic-Allies/modular/js/auto-generate-classes.js', /* Claude: YYYY-MM-DD — actively edited, must always be fresh */
```

---

## WARNINGS

### 3. `spring-classes.js` uses ES6 `const` (ES5 compliance violation)
**File:** `modular/data/spring-classes.js`, line 1  
`const SPRING_CLASSES = [...]` — project requires ES5-compatible `var` declarations.  
Only loaded by `battle-mode.html`. Modern browsers won't error on `const`, but it breaks the ES5 policy.  
**Fix:** Change `const SPRING_CLASSES` to `var SPRING_CLASSES`.

### 4. `battle-mode.html` not in `sw.js` NEVER_CACHE or SHELL
**File:** `modular/components/comfort-games/battle-mode.html`  
All other game files are in NEVER_CACHE (and SHELL for offline access), but `battle-mode.html` is absent from both lists. It exists in `game-center.html` as a linked game. It makes Firestore calls so serving stale code could cause silent failures.  
**Fix:** Add to NEVER_CACHE in `sw.js`.

### 5. `mode-gate.js` loaded without version query string
**Files:** `modular/checkin.html` (line 300), `modular/components/recovery-mode.html` (line 356)  
Both load `mode-gate.js` without `?v=` parameter: `<script src="/Academic-Allies/modular/js/mode-gate.js"></script>`  
All other JS files use `?v=20260402`. Because `mode-gate.js` **is** in NEVER_CACHE this is low risk, but it's inconsistent. If it's ever removed from NEVER_CACHE it will become a stale-cache bug.  
**Fix:** Add `?v=20260402` to both `<script>` tags.

### 6. Three stale prunable worktrees need cleanup
Git reports three prunable worktrees pointing to paths that no longer exist on this machine (Windows paths):
- `claude/affectionate-panini` 
- `claude/determined-albattani`  
- `claude/quizzical-stonebraker`

A fourth worktree directory (`agitated-zhukovsky`) exists in `.claude/worktrees/` but is not registered in git. This is leftover from earlier Cowork sessions.

**DO NOT RUN — for Bruise to execute (in Git Bash):**
```bash
git worktree prune
git branch -d claude/affectionate-panini claude/determined-albattani claude/quizzical-stonebraker
```

### 7. SW cache version (`aa-shell-20260406d`) is 5 days old with 20+ commits since
The service worker shell cache was last bumped on 2026-04-06. There have been 20+ commits since, with active changes to battle-mode, auto-generate-classes, game-center, and aa-mirror. Cached SHELL pages (nope-mode, semi-nope, accommodations, emergency, etc.) have **not** changed and are fine offline. However, when the debug filter fix is deployed, a SW cache bump would be a good opportunity to update.

---

## HOUSEKEEPING

### 8. Archive naming inconsistencies (pre-SOP era files)
Files in `modular/archive/` from January 2026 use pre-SOP naming formats:
- `.backup.YYYYMMDD_HHMMSS` format (e.g., `draggable.js.backup.20260122_152103`)
- `.broken.` extension (e.g., `draggable.js.broken.20260122_151318`)
- Plain `.bak-YYYYMMDD` without double-extension (e.g., `aa-firebase.js.bak-2026-02-21`)
- `LICENSE` file at `modular/archive/LICENSE` — orphaned (not an archive; appears to be an accidentally copied root LICENSE)

These are harmless historical artifacts but don't match the current `FILENAME_YYYY-MM-DD_descriptor.bak.ext` SOP. No action required unless cleaning up.

### 9. `games_2026-04-11_pre-removal` archive contains `battle-mode.html`
The archive at `modular/archive/games_2026-04-11_pre-removal/battle-mode.html` suggests battle-mode was planned for removal today, but the live file at `modular/components/comfort-games/battle-mode.html` (992 lines) was not actually deleted — it was kept. This archive is now misleadingly named. No functional impact; just confusing naming.

### 10. Multiple HEAD.lock archives in `modular/archive/`
Files like `HEAD.lock.bak`, `HEAD.lock.bak2` through `HEAD.lock.bak14`, `index.lock.bak2` through `index.lock.bak_try2` — these are archived git lock files (correct SOP behavior). They are harmless but accumulating. 18+ lock file archives. These can be cleaned up manually when convenient.

### 11. `package.json` / `package-lock.json` in repo root
Both files are in root — `package.json` only contains `{ "devDependencies": { "husky": "^9.1.7" } }`. The audit spec notes these as acceptable (build tool config). No action needed, but worth confirming husky hooks are still active or whether this is dead config.

---

## AUDIT RESULTS BY CATEGORY

### 1. Broken Resources
**Status: PASS**  
All files referenced in `sw.js` NEVER_CACHE and SHELL lists verified to exist on disk. All JS files referenced by `shared-header.html` exist (`draggable.js`, `aa-mirror.js`, `study-activity.js`, `status-circle.js`, `migraine-mode.js`, `dark-mode.js`, `mode-enforcer.js`). Key page links from `index.html` and `game-center.html` all resolve.

One note: `battle-mode.html` is linked from `game-center.html` and exists — it just lacks SW coverage (see Warning #4).

### 2. Auth & Security
**Status: PASS with notes**  
Mirror guard pattern (`if (window.AA_MIRROR_UID && !window.AA_MIRROR_CAN_WRITE) return;`) is correctly applied in checked files: `checkin.html`, `spoon-pal.html`, `audio-notes.html`. `onAuthStateChanged` usage follows `AA.auth.onAuthStateChanged()` pattern from `aa-firebase.js`. No competing auth listeners found. No unprotected Firestore writes visible in sampled pages.

`nope-mode.html` and `semi-nope.html` correctly skip `shared-header.html` and load Firebase SDK directly — this is intentional for crash-resilient crisis pages.

### 3. Cache Consistency
**Status: PASS with notes**  
All sampled pages use `?v=20260402` for `shared-header.html`. `nope-mode.html` and `semi-nope.html` correctly skip the header fetch (they load Firebase directly). `aa-firebase.js` is in NEVER_CACHE (always fresh). Main concern is `auto-generate-classes.js` missing from NEVER_CACHE (Warning #2) and `mode-gate.js` missing version param (Warning #5).

### 4. Code Quality — ES5 Compliance
**Status: MOSTLY PASS — one violation**  
`modular/data/spring-classes.js` uses `const` (Warning #3). No `let`, arrow functions, template literals, or `class` declarations found in any other production JS or HTML files. `sw.js` correctly uses `Promise.all` with `.catch` wrappers instead of `Promise.allSettled` (ES2020).

### 5. Archive Hygiene
**Status: PASS with notes**  
No dot-file archives, no `.FIX` or `.NEW` files found outside `modular/archive/`. No misplaced archives in `modular/` root. Archive directory contains 1,731 files — healthy but large. Pre-SOP naming inconsistencies are historical. `LICENSE` orphan file present (see Housekeeping #8).

### 6. Redundancy / Error Handling
**Status: PASS**  
`audio-notes.html` has 100+ `catch` / `try` blocks with IndexedDB + localStorage dual fallback for crash recovery. `checkin.html` has null guards on user object and token-refresh re-fire protection. `sw.js` uses individual `fetch().catch()` in SHELL install instead of `Promise.allSettled`. `shared-header.html` has fallback nav on header load failure.

### 7. Misplaced Files
**Status: PASS with notes**  
Repo root contains: `index.html`, `sw.js`, `README.md`, `LICENSE`, `CLAUDE.md`, `favicon*`, `manifest.webmanifest`, `firebase.json`, `firestore.*`, `storage.rules`, `offline.html`, `404.html`, `package.json`, `package-lock.json`, `apple-touch-icon-180.png`. All are appropriate for root except `package.json` / `package-lock.json` which are marginal (see Housekeeping #11). No stale `.bak` files in root. No stale worktrees in repo (they're in `.claude/worktrees/` — see Warning #6).

---

## RECOMMENDED ACTIONS (Priority Order)

**DO NOT RUN — for Bruise to review and execute:**

### Priority 1: Fix debug filter (CRITICAL — affects production behavior)
In `modular/js/auto-generate-classes.js`, find line ~462 and change:
```
return true;
```
back to:
```
return isCurrentOrFutureClass(cls, windowInfo);
```
Then:
```bash
git add modular/js/auto-generate-classes.js
git commit -m "Claude: Restore class term date filter — revert debug return-true from acc6580"
git push
```

### Priority 2: Add auto-generate-classes.js to sw.js NEVER_CACHE
In `sw.js`, add to the NEVER_CACHE array (after the `student-config.js` line):
```javascript
'/Academic-Allies/modular/js/auto-generate-classes.js', /* Claude: 2026-04-11 — actively edited, must always be fresh */
```
Also bump the CACHE version (e.g., `aa-shell-20260411`) and commit.

### Priority 3: Fix spring-classes.js ES5 compliance
Change `const SPRING_CLASSES` to `var SPRING_CLASSES` in `modular/data/spring-classes.js`.

### Priority 4: Add battle-mode.html to sw.js NEVER_CACHE
In `sw.js`, add to NEVER_CACHE:
```javascript
'/Academic-Allies/modular/components/comfort-games/battle-mode.html', /* Claude: 2026-04-11 — Firestore game, must always be fresh */
```

### Priority 5: Clean up stale worktrees (housekeeping)
```bash
git worktree prune
git branch -d claude/affectionate-panini claude/determined-albattani claude/quizzical-stonebraker
```

---

*Audit completed automatically by Claude. Report written to `docs/NIGHTLY-SUMMARY-2026-04-11.md`.*
