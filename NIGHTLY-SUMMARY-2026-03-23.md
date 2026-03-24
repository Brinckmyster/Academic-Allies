# Nightly Deep Audit — 2026-03-23

**Audited by:** Claude
**Scope:** Full audit — Broken Resources, Auth & Security, Cache Consistency, Code Quality, Archive Hygiene, Redundancy (9 sub-checks), Misplaced Files & Branches
**Previous audit:** 2026-03-22

---

## Overall Status: HEALTHY with CACHE SYNC + RESILIENCE WORK NEEDED

No critical security issues. Auth and mirror mode protections remain solid. One broken navigation link found (streak-cat → spoon-pal wrong path). Cache-bust versions are split across two dates (15 pages stuck on `20260322` while 40+ are on `20260323`). ES6 compliance violations persist in the meal-planner modules. Several resilience gaps flagged in the redundancy checks — unhandled promises, missing offline fallbacks, and a duplicate listener in bootstrap-suggestor.js.

---

## 1. Broken Resources

**Status: ONE BROKEN LINK**

- **CRITICAL:** `streak-cat.html` (line 239) links to `/Academic-Allies/modular/components/spoon-pal/spoon-pal.html` — that directory does not exist. The correct path is `/Academic-Allies/modular/components/spoon-planner/spoon-pal.html`.
- All other `<script src>`, `<img src>`, `<link href>`, and `fetch()` references resolve correctly.
- All shared components (`shared-header.html`, `shared-footer.html`, `aa-firebase.js`) exist and are referenced properly.
- All icons, JSON data files, and SW pre-cache entries verified present on disk.

---

## 2. Auth & Security

**Status: CLEAN — No regressions**

- Auth persistence logic is correct: `AA_KEEP_SIGNED_IN` checkbox properly toggles LOCAL/SESSION with try/catch wrappers.
- Mirror guard pattern (`_mirrorWriteBlocked()`) is applied on all Firestore write functions in `aa-firebase.js`.
- Component-level guards verified in: audio-notes (3), message-system (2), spoon-pal (3), streak-cat (1), user-tiers (2), modes, student-config.
- `AA_MIRROR_CAN_WRITE` is only `true` for `network-lead` role — all other roles are read-only.
- NO_MIRROR pages (admin, user-tiers, message-system, spoon-pal) correctly bypass mirror mode.
- All Firestore operations route through `window.AA.*` wrappers, centralizing security.
- No auth bypasses found. No unguarded writes on active pages.

**Static/utility pages intentionally without auth:** audio-converter, bedroom-planner, crossword/wordsearch, printable templates — no personal data writes.

---

## 3. Cache Consistency

**Status: SPLIT VERSIONS — needs sync**

| Component | Current Version | Notes |
|-----------|----------------|-------|
| `sw.js` CACHE_VERSION | `20260324e` | Latest |
| shared-header.html fetch (majority) | `?v=20260323` | 40 pages |
| shared-header.html fetch (stale) | `?v=20260322` | **15 pages** |

**15 pages still on `20260322`:**
1. `modular/admin.html`
2. `modular/components/spoon-planner/spoon-pal.html`
3. `modular/components/student-config/student-config-editor.html`
4. `modular/components/support-dashboard/support-dashboard.html`
5. `modular/shared-header.html` (self-reference + footer reference)
6. `modular/static/custom-quiz.html`
7. `modular/static/floral-fill-blank.html`
8. `modular/static/floral-flashcards.html`
9. `modular/static/floral-flower-id.html`
10. `modular/static/floral-genus-practice.html`
11. `modular/static/floral-match-game.html`
12. `modular/static/floral-missed-tracker.html`
13. `modular/static/floral-speed-round.html`
14. `modular/static/network-lead-guide.html`
15. `modular/static/study-tools.html`

**Also inside shared-header.html:** Script references for `draggable.js`, `study-activity.js`, `status-circle.js`, `migraine-mode.js`, `dark-mode.js`, `mode-enforcer.js`, and `shared-footer.html` all use `?v=20260322`.

**Impact:** These pages may serve stale cached versions of the header/footer, potentially missing recent fixes.

---

## 4. Code Quality

**Status: ES6 VIOLATIONS PERSIST**

### ES6 Syntax in Production (per rules, should be ES5 `var`/`function` style)

| File | const | let | arrow | backtick |
|------|-------|-----|-------|----------|
| `meal-planner-mary/bootstrap-suggestor.js` | 16 | 9 | 0 | 0 |
| `meal-planner-mary/edit-modal.js` | 7 | 0 | 2 | 0 |
| `meal-planner-mary/firebase-photo-upload.js` | 7 | 0 | 0 | 0 |
| `meal-planner-mary/suggestions.js` | 14 | 0 | 6 | 1 |
| `meal-planner-mary/time-utils.js` | 5 | 0 | 0 | 0 |
| `meal-planner/bootstrap-suggestor.js` | 16 | 8 | 0 | 0 |
| `meal-planner/universal-suggestor.js` | 10 | 2 | 0 | 0 |
| `js/aa-mirror.js` | 0 | 1 | 0 | 0 |
| `js/app.js` | 0 | 0 | 2 | 0 |
| `js/header-loader.js` | 7 | 0 | 6 | 0 |
| `js/main.js` | 3 | 0 | 0 | 0 |

**Worst offenders:** Both `bootstrap-suggestor.js` files (24-25 violations each) and `suggestions.js` (20 violations).

### innerHTML Usage (12 instances across 8 files)
- `suggestions.js` uses `innerHTML` with `onclick=` attributes — potential XSS vector if user data is unsanitized.
- Other uses in `aa-mirror.js`, `header-loader.js`, `mode-gate.js`, `status-circle.js` appear lower risk but should be reviewed.

### No `document.write()` or `eval()` found — good.

---

## 5. Archive Hygiene

**Status: ONE MISPLACED FILE**

- `.claude.json.backup` exists at repo root — should be in `modular/archive/` or `.gitignore`'d.
- No `.bak` or `.old` files found outside `modular/archive/`.
- Note from previous audit: 37 misplaced archive files were flagged on 2026-03-22. Status of that cleanup is unknown — worth verifying.

---

## 6. Redundancy Checks

### 6a. Error Handling Coverage

**CRITICAL:**
- `edit-modal.js`: `fetch('base-meal-plan-mary.json')` has NO `.catch()`. Network failure = silent failure, modal never appears.
- `load-mary-quizzes.js`: Outer `.catch()` conflates quiz save + audit log failures. User sees "Error loading quizzes" even when quizzes saved but only audit failed.

**WARNING:**
- Multiple `onSnapshot()` listeners in `aa-firebase.js` have error callbacks, but some component-level HTML files lack error handlers on their `.get()` calls.

### 6b. Offline Fallbacks

**WARNING — NO OFFLINE FALLBACK FOR CRITICAL PAGES:**
- `checkin.html`, `emergency.html`, `spoon-planner.html` depend entirely on Firebase. If Firestore is down, users see blank pages or infinite loading.
- **Emergency page is the most concerning** — students in crisis cannot view emergency contacts offline.
- `checkin.html` does have a `localStorage` backup of entries, but the read path doesn't fall back to it when Firestore is unavailable.

### 6c. Retry Logic

**INFO:** No retry/backoff on core paths. Auth state + user doc init are single-attempt. If Firestore is temporarily down (maintenance window), users must manually refresh.

### 6d. Null/Undefined Guards

**CRITICAL:**
- `aa-firebase.js` lines 433, 527, 538: `.data().role` accessed without checking if `role` field exists. Could cause wrong permissions.
- `status-circle.js` lines 128-170: Nested property access on check-in categories without null guards. Malformed old data could crash the circle.

### 6e. Race Conditions

**WARNING:** Mirror mode (`AA_MIRROR_UID`) set by `aa-mirror.js` is not synchronized with the 7+ `onAuthStateChanged` listeners. Possible brief window where supporter reads/writes their own data instead of student's.

### 6f. Duplicate Listener Prevention

**CRITICAL:**
- `meal-planner/bootstrap-suggestor.js` has TWO identical `enhancePlanner()` IIFEs (lines 39-85 and 87-133). Both attach `click` listeners to `document.body`. Every page visit stacks duplicates — clicks fire multiple times.

### 6g. Graceful Degradation

**WARNING:** If any core feature crashes (audio notes, emergency, spoon planner, meal planner), entire page often fails rather than showing an error message and continuing. Features don't fail independently.

### 6h. Data Validation on Write

**WARNING:**
- Quiz loader scripts (`triple-mary-quizzes.js`, `load-mary-quizzes.js`) write to Firestore without validating: array not undefined, length within limits, quiz objects well-formed.

### 6i. Service Worker Staleness

**OK:** `sw.js` cache version (`20260324e`) is current. NEVER_CACHE list includes critical files. Network-first strategy for NEVER_CACHE items is correct.

---

## 7. Misplaced Files & Stale Branches

**Branches:**
- `origin/main` — active ✓
- `origin/Brinckmyster-Aestas` — off-limits to AI per CLAUDE.md. **Not touched.** ✓
- No stale feature/worktree branches found. ✓

**Files:**
- `.claude.json.backup` at repo root — minor housekeeping item.
- Multiple old `AUDIT-*.md` files at repo root (2026-03-01 through 2026-03-10) + `PERSISTENCE_INVESTIGATION.md` — consider archiving.
- Root-level utility scripts (`load-mary-quizzes.js`, `tag-mary-trimester.js`, `triple-mary-quizzes.js`, `clean-worktrees.sh`, `do-commit.sh`) — not standard for a web app root. Consider moving to a `scripts/` directory.

---

## Priority Fix Summary

### This Week (CRITICAL)
1. **Fix broken link:** `streak-cat.html` line 239 — change `spoon-pal/spoon-pal.html` → `spoon-planner/spoon-pal.html`
2. **Remove duplicate IIFE:** `meal-planner/bootstrap-suggestor.js` lines 87-133 (exact duplicate of 39-85)
3. **Add `.catch()`:** `edit-modal.js` `fetch()` call (line 2)
4. **Add null guards:** `aa-firebase.js` `.data().role` on lines 433, 527, 538
5. **Sync cache-bust versions:** Bump all 15 stale pages from `20260322` → `20260323` (or current)

### Next Week (HIGH)
6. **Offline fallback for emergency.html** — cache emergency contacts in localStorage
7. **Separate error handling** in `load-mary-quizzes.js` for quiz save vs. audit log
8. **Add retry logic** to auth state + user doc init in `aa-firebase.js`
9. **ES6→ES5 conversion** for meal-planner modules (biggest offenders)

### Ongoing (MEDIUM)
10. Add `onSnapshot()` unsubscribe cleanup across all component pages
11. Add data validation before Firestore writes in quiz loaders
12. Improve graceful degradation — wrap each feature in try/catch with user-facing error message
13. Archive old audit files + root utility scripts

---

*Report generated by Claude — 2026-03-23*
