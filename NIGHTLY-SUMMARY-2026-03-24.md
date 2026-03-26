# Nightly Deep Audit — Academic Allies
**Date:** 2026-03-24
**Auditor:** Claude (automated scheduled task — read-only)
**Branch audited:** `main`
**Brinckmyster-Aestas branch:** NOT TOUCHED (off-limits to AI per standing rule)

---

## Overall Health Status

| Area | Status | Notes |
|------|--------|-------|
| Broken Resources | ✅ CLEAN | All scripts, styles, images, fetch paths resolve |
| Auth & Security | ⚠️ WARNING | 1 unguarded Firestore write in support-dashboard |
| Cache Consistency | ✅ CLEAN | All pages on v=20260324, SW up to date |
| Code Quality | ⚠️ WARNING | ES6+ syntax widespread; 3 dead code files; 1 dupe var |
| Archive Hygiene | ⚠️ WARNING | 2 files outside modular/archive/; naming inconsistencies |
| Error Handling | 🔴 CRITICAL | 3 critical missing .catch() handlers |
| Offline Fallbacks | 🔴 CRITICAL | SpoonPal, SpoonPlanner, MealPlanner have no offline safety |
| Data Validation | 🔴 CRITICAL | NaN can be written to Firestore from spoon calculations |
| Null Guards | ⚠️ WARNING | studentsInNetwork[0] deref without size check |
| Race Conditions | ⚠️ WARNING | Mirror mode timing race in spoon-pal.html |
| Git Hygiene | ✅ CLEAN | 1 worktree (main), no stale branches, no stash |

---

## 🔴 Critical Issues (Action Required)

### CRIT-01 — SpoonPal: NaN can be written to Firestore
**File:** `modular/components/spoon-planner/spoon-pal.html` — Lines ~1754–1757, 2034
**Issue:** `calculateEndOfDayBalance()` result is written directly to Firestore without NaN validation. If the calculation fails (e.g. bad time string input), `borrowedSpoons` and related fields become NaN in the database. This silently poisons all future spoon calculations.
**Impact:** Data corruption; history graphs break; streak cat can lose state.
**Fix needed:** Before the `.set()` call, add: `if (isNaN(endOfDayBalance)) { console.error('[SpoonPal] NaN in end-of-day balance — aborting save'); return; }`

---

### CRIT-02 — SpoonPlanner: Task spoon/time values not validated before Firestore write
**File:** `modular/components/spoon-planner/spoon-planner.html` — Line ~651
**Issue:** The `tasks` array is written to Firestore without validating that spoon counts are numeric and time strings are valid. A task with `spoon: undefined` or `spoon: ''` persists to the database.
**Fix needed:** In `saveTasks()`, validate: `tasks[i].spoon = parseInt(tasks[i].spoon, 10) || 0;` before writing.

---

### CRIT-03 — Audio Notes: Missing .catch() on .add() call
**File:** `modular/components/audio-notes/audio-notes.html` — Lines ~1410–1413
**Issue:** `.add(noteData)` has `.then()` but no `.catch()`. If the Firestore write fails (network down, permissions error), the UI never updates to reflect the failure. User thinks the note was saved when it wasn't.
**Fix needed:** Add `.catch(function(err) { console.error('[AudioNotes] Note save failed:', err); showToast('⚠️ Note could not be saved. Try again.', 5000); });`

---

### CRIT-04 — Message System: Missing .catch() on thread .set()
**File:** `modular/components/message-system/message-system.html` — Lines ~651–655
**Issue:** `threadRef.set({...}, { merge: true })` has no `.catch()`. Silent failure = user believes message was sent, thread is never persisted in Firestore.
**Fix needed:** Add `.catch(function(err) { console.error('[Messages] Thread write failed:', err); showToast('⚠️ Message could not be sent.', 5000); });`

---

### CRIT-05 — SpoonPal: Promise.all() without .catch()
**File:** `modular/components/spoon-planner/spoon-pal.html` — Lines ~2065–2068
**Issue:** `Promise.all([plannerPromise, trackingPromise]).then(...)` has no `.catch()`. If either Firestore read fails (e.g. Firestore down, network loss), the page initialization stalls silently — user sees a blank or frozen page with no error message.
**Fix needed:** Add `.catch(function(err) { console.error('[SpoonPal] Data load failed:', err); showToast('⚠️ Could not load data — check connection.', 6000); });`

---

### CRIT-06 — SpoonPal + SpoonPlanner: No offline fallback
**Files:** `modular/components/spoon-planner/spoon-pal.html`, `modular/components/spoon-planner/spoon-planner.html`
**Issue:** Both pages read exclusively from Firestore with no localStorage or IndexedDB fallback. If the network is down, both pages show empty/broken state. SpoonPal is the most-used daily page — this is a significant UX risk.
**Note:** Firestore's built-in offline persistence is disabled app-wide (per aa-firebase.js).
**Fix needed:** On successful Firestore read, cache the result to localStorage. On Firestore read failure, load from localStorage cache.

---

### CRIT-07 — MealPlanner: Offline Firestore read lacks error fallback
**File:** `modular/components/meal-planner/meal-planner.html` — Lines ~311–322
**Issue:** `AA.getMealBasePlan()` has a `.then()` fallback to a local JSON file, but no `.catch()`. If the Firestore read throws (rather than returning empty), the JSON fallback never fires — the meal planner loads with no data.
**Fix needed:** Chain `.catch(function() { return fetch('base-meal-plan.json').then(r => r.json()); })` on the Firestore call.

---

## ⚠️ Warnings

### WARN-01 — Auth/Security: `checkQuietAlert()` missing mirror guard
**File:** `modular/components/support-dashboard/support-dashboard.html` — Line ~1093
**Issue:** `checkQuietAlert()` writes analytics baseline data to the `quietBaseline` Firestore collection without the standard mirror mode guard (`if (window.AA_MIRROR_UID && !window.AA_MIRROR_CAN_WRITE) return;`). This means supporters viewing the support dashboard can trigger writes on behalf of the student.
**Fix needed:** Add the mirror guard at the top of `checkQuietAlert()`:
```javascript
function checkQuietAlert(uid, name) {
  if (window.AA_MIRROR_UID && !window.AA_MIRROR_CAN_WRITE) return;
  // ... rest of function
```

---

### WARN-02 — Support Dashboard: `studentsInNetwork[0]` accessed without length check
**File:** `modular/components/support-dashboard/support-dashboard.html` — Line ~629
**Issue:** In a `.catch()` fallback, `callback(studentsInNetwork[0])` is called without first checking `studentsInNetwork.length > 0`. If the network list is empty, `undefined` is passed to the callback.
**Fix needed:** `callback(studentsInNetwork.length > 0 ? studentsInNetwork[0] : null);`

---

### WARN-03 — Support Dashboard: Duplicate `.catch()` silences error logging
**File:** `modular/components/support-dashboard/support-dashboard.html` — Lines ~460–461
**Issue:** Two `.catch()` handlers are chained on the same promise. The first catch (silent) swallows the error before the second catch (logging) can see it. The error logging is effectively dead code.
**Fix needed:** Remove the first silent `.catch()` or merge both into one.

---

### WARN-04 — Cache: index.html has stale shared-header version
**File:** `index.html`
**Issue:** `index.html` fetches `shared-header.html?v=20260323` while all other pages (42 total) use `v=20260324`. This means index.html may serve a stale cached version of the header.
**Fix needed:** Update `index.html` fetch to use `v=20260324`.

---

### WARN-05 — Cache: aa-firebase.js version mismatch in shared-header
**File:** `modular/shared-header.html` — Line ~188
**Issue:** `aa-firebase.js?v=20260323` is referenced while the header/footer are both `v=20260324`. Since aa-firebase.js is in the NEVER_CACHE list, this doesn't cause caching bugs — but it's confusing and suggests an incomplete version bump on 2026-03-24.
**Fix:** Update reference to `?v=20260324` next time aa-firebase.js is edited.

---

### WARN-06 — Race Condition: Mirror mode timing in spoon-pal.html
**File:** `modular/components/spoon-planner/spoon-pal.html` — Lines ~2410–2416
**Issue:** `window.AA_CONFIG.load(_readUid)` is called inside `onAuthStateChanged()`. `_readUid` depends on `window.AA_MIRROR_UID`, which is set by `aa-mirror.js` (loaded async via shared-header). On slow loads, `AA_MIRROR_UID` may not be set yet, causing the planner to load student data instead of mirrored data.
**Impact:** Supporters may briefly see their own (empty) data before mirror kicks in.

---

### WARN-07 — Code Quality: ES6+ syntax widespread in production files
**Issue:** The project rules require ES5-compatible code (var/function, no arrow functions, no template literals, no const/let). However, many files use ES6+ syntax. **Key violators:**

- `modular/components/meal-planner-mary/time-utils.js` — const, template literals
- `modular/components/meal-planner-mary/suggestions.js` — const/let, arrow functions, spread operator `[...meals]`, template literals
- `modular/components/meal-planner-mary/firebase-photo-upload.js` — async/await, ES6 imports, const
- `modular/js/header-loader.js` — arrow functions (dead code file)
- `modular/js/app.js` — ES6 imports, arrow functions (dead code file)
- Various HTML inline scripts across spoon-pal.html, spoon-planner.html, audio-notes.html, message-system.html, streak-cat.html, status-circle.html, bedroom-planner.html

**Note:** Since the app targets modern browsers (GitHub Pages), ES6+ will work fine in practice. The rule may need re-evaluation. The meal-planner-mary files appear to be a deliberate modern JS zone. Flag for Bruise's decision.

---

### WARN-08 — Code Quality: Three dead code files remain in active directories
**Files:**
- `modular/js/main.js` — marked as dead code since 2026-03 (comment says not loaded by any page); archive copy exists
- `modular/js/header-loader.js` — marked as dead since 2026-02 (header now loaded inline per page); archive copy exists
- `modular/js/app.js` — marked as dead since 2026-02 (auth handled by aa-firebase.js); file is malformed with broken imports

These files live in `modular/js/` alongside active scripts, which is confusing. They should be moved to `modular/archive/`. (Do not delete — archive first per SOP.)

---

### WARN-09 — Code Quality: Duplicate `var btn` in spoon-planner.js
**File:** `modular/components/spoon-planner/spoon-planner.js` — Lines 2–3
**Issue:** `var btn = document.getElementById("add-task-btn");` declared on two consecutive lines. Harmless in non-strict mode but sloppy.

---

### WARN-10 — Archive Hygiene: 2 files outside modular/archive/
**Files found in repository root:**
1. `.claude.json.backup` — dot-file backup sitting in root, violates the "modular/archive/ ONLY" rule. Should be moved to `modular/archive/claude.json_2026-02-21_config.bak.json` (or deleted if no longer needed).
2. `.fuse_hidden0000077f00000001` — Linux FUSE cache artifact in root. Not a code file. Safe to remove if no longer active. **Give Bruise the command to clean it:** `rm .fuse_hidden0000077f00000001`

---

### WARN-11 — Archive Hygiene: Naming convention violations inside modular/archive/
**Total archive files:** 1,231
**Violations found:**
- **8 files** with double `.bak.bak` extension (e.g., `aa-firebase.js.bak.bak-2026-02-21`)
- **8 files** using `.archive-` prefix instead of `_YYYY-MM-DD_descriptor.bak.ext` format
- **3 temp files** with `.bak.tmp` extension that should not be in archive
- **1 file** `LICENSE` in archive — this is already in root, doesn't belong in archive
- **20+ files** missing the underscore separator or descriptor portion

These are cosmetic issues and don't impact functionality, but the archive is growing large (1,231 files) and inconsistent naming makes it harder to find what you need.

---

### WARN-12 — AA-Firebase: Public API .get() functions have no internal error handling
**File:** `modular/aa-firebase.js`
**Issue:** Functions like `AA.getFlowerQuiz()`, `AA.getPendingUsers()`, `AA.getUserDoc()`, `AA.getSpoonPlan()` return raw Firestore `.get()` promises with no internal `.catch()`. Every caller is responsible for adding their own `.catch()`. Many callers don't. This is the root cause of several CRIT issues above.
**Recommendation:** Add default `.catch()` logging inside each public API function so callers get at least a console error even if they forget to catch.

---

## ✅ Clean / No Issues Found

- **Broken resources:** All 54 HTML pages — no broken script srcs, link hrefs, image srcs, or local fetch() paths. All referenced files exist. ✅
- **Auth patterns:** No competing `firebase.auth().onAuthStateChanged()` calls — all auth goes through `AA.auth` ✅
- **Email permission checks:** None found — all role checks use `AA_MIRROR_CAN_WRITE` correctly ✅
- **NO_MIRROR array:** Defined and used correctly in aa-mirror.js ✅
- **SW cache version:** `aa-shell-20260324u` — up to date ✅
- **Header/footer versions:** All 42 active pages on `v=20260324`; footer in sync ✅
- **NEVER_CACHE list:** 14 entries, covers all high-churn files ✅
- **Git worktrees:** Only 1 (main) — no stale worktrees ✅
- **Stale local branches:** None — only `main` local branch ✅
- **Stash:** Empty ✅
- **Brinckmyster-Aestas branch:** Exists as remote-only reference, not touched ✅
- **Mirror guards:** Correctly applied in spoon-pal, modes, audio-notes, user-tiers, settings, streak-cat, recovery-mode, message-system ✅
- **Script load order:** aa-firebase.js loads before component scripts on all pages ✅
- **Firestore persistence setting:** Intentionally disabled; documented in aa-firebase.js ✅

---

## Housekeeping

- Archive has grown to **1,231 files**. Consider a manual review of pre-February entries that are unlikely to ever be needed again. (Bruise decision — Claude does not delete.)
- `mode-gate.js` was added to NEVER_CACHE on 2026-03-23 — good, this is correct.
- No test files, no Thumbs.db, no desktop.ini artifacts found. ✅
- `SpoonPal.py` lives at `modular/components/spoon-planner/SpoonPal.py` — Python file in a web project. Appears to be a planning/design document, not executed code. Not a bug, but worth noting.

---

## Summary Count

| Category | Count |
|----------|-------|
| 🔴 Critical issues | 7 |
| ⚠️ Warnings | 12 |
| ✅ Clean checks | 15+ |

---

## Git Commands (for Bruise to run — DO NOT auto-run)

**Remove Linux FUSE artifact from root:**
```bash
rm .fuse_hidden0000077f00000001
```

**After applying fixes, commit with:**
```bash
git add -A
git commit -m "Claude: Nightly audit fixes 2026-03-24 — catch handlers, NaN guards, mirror guard in checkQuietAlert"
git push
```

---

*Report generated by Claude — automated nightly audit — 2026-03-24*
*All findings are read-only. No files were modified during this audit.*
