# Nightly Audit Summary — 2026-03-29

**Auditor:** Claude
**Repo:** Academic-Allies (brinckmyster.github.io/Academic-Allies)
**Branch:** main
**Run:** Evening deep audit (replaces earlier morning summary)

---

## CRITICAL ISSUES

### 1. sw.js is truncated — fetch handler incomplete
**File:** `sw.js` (line 206-207)
**Impact:** The service worker's fetch event handler is cut off mid-line. The file ends with `if (req.mode === 'navigate') {\n          r` — the offline fallback return statement and closing braces are missing. This means the service worker will throw a syntax error on registration, breaking offline caching for the entire app.
**Action:** Restore the missing closing of the fetch handler. The truncated section should return `caches.match('/Academic-Allies/offline.html')` and close out the catch/event blocks.

### 2. XSS vulnerabilities — unsanitized suggestedByName in innerHTML
**Files:** `modular/nope-mode.html` (~line 480), `modular/semi-nope.html` (~line 501)
**Impact:** Both files insert `s.suggestedByName` directly into innerHTML without escaping. A malicious supporter could inject HTML/JS via the `suggestedByName` Firestore field that would execute in the student's browser.
**Action:** Escape `suggestedByName` before inserting into HTML (e.g., create/use a `textContent`-based approach or an escapeHTML helper).

### 3. Unguarded Firestore write — dark-mode.js
**File:** `modular/js/dark-mode.js` (~line 783)
**Impact:** `syncToFirestore()` is called without checking mirror mode. A supporter in mirror view could toggle dark mode directly on the student's account, bypassing the suggestion system.
**Action:** Add mirror guard: `if (window.AA_MIRROR_UID && !window.AA_MIRROR_CAN_WRITE) return;` before the Firestore sync call.

---

## WARNINGS

### 4. Cache-bust version mismatch
All 43 HTML pages use `?v=20260328` for shared-header.html and shared-footer.html fetches, but sw.js CACHE is `aa-shell-20260329b`. These should be aligned — bump HTML pages to `?v=20260329`.

### 5. ES5 violation — `.endsWith()` in sw.js
**File:** `sw.js` (line 169)
**Code:** `path.endsWith(nc)` — `.endsWith()` is ES6.
**Fix:** Replace with `path.slice(-nc.length) === nc`

### 6. Listener leaks — no cleanup on page unload
**Files:** `modular/js/aa-mirror.js` (~line 705), `modular/js/status-circle.js` (~line 1040-1167)
**Impact:** `onAuthStateChanged` and `onSnapshot` listeners are not unsubscribed on page unload. Repeated navigation accumulates stale listeners, causing memory leaks and redundant Firestore reads.
**Action:** Store unsubscribe handles and call them in a `beforeunload` event.

### 7. watchSpoonPal error callback missing
**File:** `modular/aa-firebase.js` (~line 1085)
**Impact:** The `onSnapshot` error handler logs but doesn't notify the calling page callback. If the listener fails (permissions, network), the UI hangs indefinitely waiting for data.

### 8. No offline detection on critical pages
**Files:** `modular/checkin.html`, `modular/components/meal-planner/meal-planner.html`
**Impact:** These pages rely on Firestore but have no `navigator.onLine` check or offline banner. Users on poor connections see frozen UI with no indication of what's happening.

### 9. Shared-header fetch failure has no fallback
**All pages** load shared-header.html via fetch with only a `console.warn` in the `.catch()`. If shared-header fails to load, pages lose navigation, auth, and header UI with no fallback content shown.

---

## HOUSEKEEPING

### 10. Broken image references in icon-gallery.html
**File:** `modular/icon-gallery.html`
**Missing:** `icons/home.jpeg`, `icons/home.jpg`, `icons/home.svg`, `icons/home.webp` — only `icons/home.png` exists. Gallery shows broken image placeholders for 4 variants.

### 11. Archive naming inconsistencies
8 archive files use legacy `.bak.bak*` double-suffix patterns and 1 file has a `.user-tiers` suffix appended incorrectly. These are cosmetic but violate the archive naming convention (`FILENAME_YYYY-MM-DD_descriptor.bak.ext`). Not urgent — historical artifacts.

### 12. .fuse_hidden file in repo root
**File:** `.fuse_hidden0000077f00000001` (3.2KB — Firebase deploy debug logs)
**Status:** Already in `.gitignore` — not tracked by git. Safe to delete when convenient.

### 13. Unvalidated fetch responses
**Files:** `modular/components/meal-planner/meal-planner.html` (~line 373), bootstrap-suggestor files
**Impact:** fetch().then(r => r.json()) chains don't check `r.ok` first — HTTP 4xx/5xx responses get parsed as JSON, producing garbage data silently.

---

## AUDIT RESULTS BY CATEGORY

### Broken Resources
- **Checked:** 457 local resource references across 57 HTML files
- **Broken:** 4 (all in icon-gallery.html — missing home icon variants)
- **Pass rate:** 99.1%

### Auth & Security
- **Mirror guards:** Properly applied in study-activity.js, migraine-mode.js, audio-notes.html, admin.html
- **Missing guard:** dark-mode.js (syncToFirestore)
- **XSS vectors:** 2 found (nope-mode.html, semi-nope.html)
- **API key exposure:** None found (Firebase config is expected client-side)
- **Auth listeners:** 3 in aa-firebase.js (intentional — 1 temporary, 2 persistent)

### Cache Consistency
- **sw.js CACHE version:** `aa-shell-20260329b`
- **HTML cache-bust strings:** `?v=20260328` (1 day behind)
- **NEVER_CACHE list:** 32 entries — comprehensive coverage
- **sw.js truncation:** CRITICAL — file is incomplete

### Code Quality (ES5 Compliance)
- **Violations found:** 1 (`.endsWith()` in sw.js line 169)
- **var/function usage:** Correct throughout
- **No arrow functions, template literals, classes, or async/await found**

### Archive Hygiene
- **Total archive files:** 2,952
- **All in modular/archive/:** Yes
- **Naming violations:** ~9 legacy files with non-standard naming
- **Dot-file archives:** None
- **Misplaced .FIX/.NEW files:** None

### Redundancy & Robustness
- **Listener leaks:** 3 instances (aa-mirror.js, status-circle.js, watchSpoonPal)
- **Missing offline detection:** 2 critical pages
- **Null guard gaps:** 2 instances (audio-notes getDriveToken, status-circle colorOf)
- **Unvalidated fetches:** 2 instances
- **Data validation:** Adequate — maxlength enforced, emoji values guarded with fallback

### Misplaced Files
- **Repo root:** Clean (404.html and offline.html are expected)
- **.bash_history:** In .gitignore — not tracked
- **.fuse_hidden*:** In .gitignore — not tracked
- **Stale worktrees:** None
- **Stale branches:** None (Brinckmyster-Aestas is preserved per instructions)

---

## RECOMMENDED GIT COMMANDS

> **DO NOT RUN** — for Bruise to review and execute manually.

```bash
# None tonight — all issues require code changes before committing.
# Priority fix order:
# 1. Restore sw.js truncated fetch handler
# 2. Escape suggestedByName in nope-mode.html and semi-nope.html
# 3. Add mirror guard to dark-mode.js syncToFirestore
# 4. Bump cache-bust versions to ?v=20260329 on all 43 HTML pages
# 5. Fix .endsWith() ES5 violation in sw.js
```

---

*Report generated by Claude — 2026-03-29 evening audit*
