# Academic Allies — Improvement Audit
**Date:** 2026-03-25 | **Auditor:** Claude | **Scope:** Full codebase (54 HTML pages, 23 JS files)

> This audit covers mobile responsiveness, offline fallbacks, error handling, auth state, loading states, accessibility, and general resilience. Organized by priority. Does NOT touch the Brinckmyster-Aestas branch.

---

## 🔴 CRITICAL (Data Loss / Broken on Mobile / Security)

### C1. Message System layout breaks on phones 480–599px
- **File:** `modular/components/message-system/message-system.html` (lines 15–25, 131–139)
- **Issue:** `.msg-layout` is a two-column flex layout. `.contacts-panel` has fixed `width: 260px` with no responsive breakpoint below 600px. On phones in the 480–599px range, the sidebar claims 36–54% of the viewport, leaving the thread panel unusable.
- **Fix:** Add `@media (max-width: 600px)` to stack layout into single column or hide sidebar behind a toggle.

### C2. No confirmation before destructive meal plan reset
- **File:** `modular/components/meal-planner/meal-planner.html` (line 128)
- **Issue:** "Clear Today" button calls `resetPlan()` with no confirmation dialog. One accidental tap deletes all meals for the day.
- **Fix:** Add `if (!confirm('Clear all meals for today?')) return;` inside `resetPlan()`.

### C3. Missing `.exists` check before `.data()` in emergency contacts
- **File:** `modular/emergency.html` (line ~544)
- **Issue:** Code reads `doc.data().supportNetwork` without verifying `doc.exists` in that path. If doc is null or missing, this throws an uncaught error.
- **Fix:** Add defensive check: `var network = doc && doc.exists ? doc.data().supportNetwork : {};`

### C4. meal-planner-mary not in sw.js NEVER_CACHE list
- **File:** `sw.js` (lines 24–39)
- **Issue:** `spoon-pal.html` and `spoon-planner.html` are in NEVER_CACHE, but `meal-planner-mary/index.html` is not. If it gets cached and then fixed, users see stale code.
- **Fix:** Add `/Academic-Allies/modular/components/meal-planner-mary/index.html` to NEVER_CACHE.

### C5. XSS risk if `esc()` is forgotten on innerHTML assignments
- **File:** `modular/js/aa-mirror.js` (lines 144–182)
- **Issue:** Student switcher dropdown uses `esc()` for HTML escaping (good), but the pattern is fragile — one missed call on a future feature = XSS. Several places use `innerHTML` with user data.
- **Fix:** Prefer `textContent` over `innerHTML` wherever possible. Add code review checklist item.

---

## 🟡 IMPORTANT (Degraded UX / Missing Fallbacks / Accessibility Gaps)

### I1. SpoonPal timeline table overflow on phones < 768px
- **File:** `modular/components/spoon-planner/spoon-pal.html` (lines 148–149, 302–310)
- **Issue:** Card layout breakpoint is at 768px (tablet). Phones 480–767px still see a horizontally-scrolling table.
- **Fix:** Lower breakpoint to 480px for earlier card layout.

### I2. Audit log table has no mobile card/stack view
- **File:** `modular/components/audit-log/audit-log.html` (lines 109–119, 251–264)
- **Issue:** Table requires horizontal scroll on mobile. No responsive alternative hides non-critical columns or switches to card view.
- **Fix:** Add `@media (max-width: 600px)` to stack or hide non-essential columns.

### I3. Calendar 7-column grid barely fits 480px
- **File:** `modular/components/calendar/calendar.html` (lines 30–65)
- **Issue:** `.cal-grid { grid-template-columns: repeat(7, 1fr) }` with `min-height: 72px` per cell = 420px minimum. Overflows on 480px phones with browser chrome.
- **Fix:** Reduce cell min-height on mobile, or allow horizontal scroll with snap.

### I4. Message System font sizes below WCAG minimum
- **File:** `modular/components/message-system/message-system.html` (lines 56–58)
- **Issue:** `.contact-preview`, `.contact-tier`, `.contact-unread` all use `0.72rem` (11.5px). WCAG AA requires 11pt (14.67px) minimum.
- **Fix:** Bump to `0.8rem` minimum for all contact list text.

### I5. Message System compose textarea too small for touch
- **File:** `modular/components/message-system/message-system.html` (lines 106–108)
- **Issue:** `textarea { min-height: 38px }` is below WCAG 44px touch target minimum.
- **Fix:** Change to `min-height: 44px`.

### I6. SpoonPlanner action bar doesn't wrap on small screens
- **File:** `modular/components/spoon-planner/spoon-planner.html` (lines 57–63)
- **Issue:** `.action-bar` uses `display: flex; justify-content: space-between` without `flex-wrap: wrap`. Buttons cramp on phones < 480px.
- **Fix:** Add `flex-wrap: wrap`.

### I7. Calendar events not cached for offline
- **File:** `modular/components/calendar/calendar.html`
- **Issue:** Calendar events from Google Calendar API have no localStorage cache. If API is down, calendar shows blank.
- **Fix:** Cache month data to localStorage after each successful fetch.

### I8. Message history not cached offline
- **File:** `modular/components/message-system/message-system.html`
- **Issue:** Draft messages are cached locally, but message history from Firestore has no offline cache. If Firestore is down, threads show blank.
- **Fix:** Add localStorage cache of recent messages per thread.

### I9. Settings page inputs not full-width on mobile
- **File:** `modular/components/settings/settings.html` (lines 80–87)
- **Issue:** `.setting-input { width: 110px }` fixed width. On mobile, should be full-width or `flex: 1`.
- **Fix:** Add `@media (max-width: 600px) { .setting-input { width: 100% } }`.

### I10. Audio Notes save buttons have no loading state
- **File:** `modular/components/audio-notes/audio-notes.html` (lines 219–221)
- **Issue:** "Save to Docs" and "Save to Drive" buttons have no disabled state or spinner during upload. Google Drive/Docs uploads can take 5–10+ seconds.
- **Fix:** Add `btn.disabled = true; btn.textContent = 'Saving…'` pattern (already used in `_saveTranscriptToDocs`, extend to Drive button).

### I11. No loading spinner during Firestore reads on several pages
- **Files:** `meal-planner.html` (line 242), `message-system.html` (line 363), `support-dashboard.html` (student load)
- **Issue:** Firestore `.get()` calls have no visual loading indicator. UI appears frozen on slow connections.
- **Fix:** Show loading text/spinner, disable interactive elements during load.

### I12. Mode save button has no disabled/loading state
- **File:** `modular/components/modes/modes.html` (lines 117–121)
- **Issue:** `.btn-mode-save` can be clicked multiple times during async save.
- **Fix:** Disable button during save, re-enable on .then()/.catch().

### I13. `reverseGeocode()` fetch has no `.catch()`
- **File:** `modular/components/audio-notes/audio-notes.html` (lines 895–900)
- **Issue:** If OSM nominatim API is unreachable, the fetch silently fails.
- **Fix:** Add `.catch()` that sets location to "Location unavailable".

### I14. Multiple onSnapshot listeners without deduplication in user-tiers
- **File:** `modular/components/user-tiers/user-tiers.html` (lines 1666, 1677)
- **Issue:** Token refresh re-fires `onAuthStateChanged`, potentially registering duplicate listeners. No unsub guard.
- **Fix:** Add `if (_unsubStatus) _unsubStatus();` before registering new listener.

### I15. Token refresh interval never cleared on sign-out
- **File:** `modular/aa-firebase.js` (lines 474–477)
- **Issue:** `window._aaTokenRefreshInterval = setInterval(...)` created once, never cleared on sign-out.
- **Fix:** Add `clearInterval(window._aaTokenRefreshInterval)` to sign-out flow.

### I16. Emergency contact photo upload has no timeout
- **File:** `modular/emergency.html` (lines 386–405)
- **Issue:** If offline, upload hangs indefinitely with no timeout.
- **Fix:** Add 15-second timeout with user-facing error message.

### I17. Meal planner form data lost on accidental navigation
- **File:** `modular/components/meal-planner/meal-planner.html` (lines 139–158)
- **Issue:** If user enters meal details and navigates away, data is lost. No draft save or `beforeunload` warning (unlike meal-planner-mary which has `_mealDraftSave()`).
- **Fix:** Add draft save on input change and `beforeunload` warning.

### I18. Mirror guard pattern inconsistent across pages
- **Files:** Various (spoon-planner.html, meal-planner.html, support-dashboard.html)
- **Issue:** Some pages check `if (window.AA_MIRROR_UID && !window.AA_MIRROR_CAN_WRITE) return;` before writes, but pattern is not universal. Easy to miss on new features.
- **Fix:** Standardize and document pattern. Add to CLAUDE.md checklist.

### I19. Shared header popovers can overflow on very small phones
- **File:** `modular/shared-header.html` (lines 87, 119, 1420–1650)
- **Issue:** User menu and email form popovers have no `@media (max-width: 600px)` rules. Can overflow viewport edge on phones < 360px.
- **Fix:** Add responsive positioning or full-width overlay on small screens.

---

## 🟢 ACCESSIBILITY (A11y)

### A1. SpoonPal has ~27+ buttons without aria-labels
- **File:** `modular/components/spoon-planner/spoon-pal.html` (lines 1300+)
- **Issue:** Add task, delete, reschedule, status toggle buttons all lack `aria-label`. Screen reader users cannot navigate efficiently.
- **Severity:** HIGH — SpoonPal is a core daily-use feature.

### A2. No focus traps in modals across the app
- **Files:** `spoon-pal.html`, `spoon-planner.html`, `emergency.html`, `audio-notes.html`
- **Issue:** Modal elements lack `role="dialog"`, `aria-modal="true"`, and focus trapping. Keyboard users can Tab out of modals into hidden page content.
- **Severity:** HIGH

### A3. Timeline interactions require mouse — no keyboard equivalent
- **File:** `modular/components/spoon-planner/spoon-pal.html`
- **Issue:** Click-to-edit task, drag-to-reschedule have no keyboard equivalents.
- **Severity:** HIGH — major feature inaccessible to keyboard-only users.

### A4. Missing `<label for="">` associations on ~20+ form inputs
- **Files:** `checkin.html`, `spoon-pal.html`, `meal-planner.html`, `settings.html`
- **Issue:** Many inputs (time, number, text) lack explicit `<label for="">` associations.
- **Severity:** MEDIUM

### A5. Auth buttons in shared-header missing aria-labels
- **File:** `modular/shared-header.html` (lines 59–115)
- **Issue:** Migraine, dark mode, Google/Apple/Microsoft sign-in buttons have `title=` but no `aria-label`.
- **Severity:** MEDIUM

### A6. Message System tab buttons use `onclick` only
- **File:** `modular/components/message-system/message-system.html` (lines 171–172)
- **Issue:** Tab buttons don't have keyboard handlers. Keyboard user cannot switch tabs.
- **Fix:** Use `<button>` with built-in Enter/Space handling (instead of `<div onclick>`).

### A7. No `<main id="main-content">` on most pages
- **Files:** Most component pages
- **Issue:** `shared-header.html` has a skip-to-content link targeting `#main-content`, but most pages don't have that `id` on their content wrapper.
- **Severity:** MEDIUM — skip link doesn't work.

### A8. Toast notifications not announced to screen readers
- **Files:** All pages using `showToast()`
- **Issue:** Toasts appear visually but have no `aria-live="polite"` region. Screen reader users don't hear save confirmations or errors.
- **Severity:** MEDIUM

### A9. Empty alt text on contact/avatar images
- **Files:** `emergency.html` (line 80), `message-system.html` (line 194)
- **Issue:** `<img alt="">` on contact photos. Should describe the person or use `alt="Contact photo"`.
- **Severity:** LOW

### A10. No aria-invalid or aria-describedby on form validation errors
- **File:** `modular/components/spoon-planner/spoon-pal.html`
- **Issue:** Task form validation shows errors visually but doesn't set `aria-invalid` or link error messages via `aria-describedby`.
- **Severity:** LOW

---

## 🔵 NICE-TO-HAVE (Polish / Performance / Cosmetics)

### N1. Inline dark mode detection duplicated across ~20 pages
- **Files:** Most component HTML files
- **Issue:** Each page has `<script>try{if(localStorage.getItem("AA_DARK_MODE")==="true")...` (~500 bytes × 20 = 10KB duplicated). Could be in shared-header only.
- **Fix:** Move to shared-header.html since it loads first anyway.

### N2. Student config tabs require horizontal scroll on mobile
- **File:** `modular/components/student-config/student-config-editor.html` (lines 72–84)
- **Issue:** Tab navigation overflows on phones < 600px. Scrollable but not obvious.
- **Fix:** Consider accordion or vertical tab layout on mobile.

### N3. Modes grid slightly cramped on 320px screens
- **File:** `modular/components/modes/modes.html` (lines 62–65)
- **Issue:** `grid-template-columns: repeat(auto-fill, minmax(140px, 1fr))` creates tight cards on iPhone SE (320px).
- **Fix:** Lower minmax to 120px for smallest screens.

### N4. User tiers table has no mobile card view
- **File:** `modular/components/user-tiers/user-tiers.html`
- **Issue:** Large data table requires horizontal scroll on mobile. Functional but not ideal.

### N5. Dark mode uses `!important` everywhere
- **File:** `modular/js/dark-mode.js`
- **Issue:** Every dark mode rule uses `!important` to override inline styles. Fragile if refactored.
- **Fix:** Gradually migrate inline styles to classes to remove `!important` dependency.

### N6. Inline styles in aa-mirror.js hardcode colors
- **File:** `modular/js/aa-mirror.js` (lines 145–150)
- **Issue:** Student switcher button has hardcoded `background:#fff;color:#444;` that dark mode CSS must fight to override.
- **Fix:** Use CSS classes instead of inline styles.

### N7. `visibilitychange` listener never removed on sign-out
- **File:** `modular/aa-firebase.js` (lines 484–507)
- **Issue:** Global event listener added once, never cleaned up. Minor memory leak across sign-in/out cycles.

### N8. No automated mirror mode test coverage
- **Issue:** No automated tests verify supporters cannot write data in mirror mode. Manual testing required.
- **Fix:** Add QA checklist item or Firestore security rules tests.

---

## ✅ WELL-IMPLEMENTED (No Action Needed)

These areas are solid and serve as model implementations:

- **Auth state handling**: All core pages use `onAuthStateChanged` with null-user handling, token refresh guards, and grace periods. SpoonPal and Audio Notes are exemplary.
- **SpoonPal offline fallback**: Saves to `AA_SPOONPAL_OFFLINE` on Firestore failure, restores on load. Model implementation.
- **Emergency contacts offline**: Restores from `AA_EMERGENCY_BACKUP` localStorage when Firestore snapshot fails.
- **Checkin page**: Excellent error handling with multiple `.catch()` handlers and localStorage fallback.
- **All `onSnapshot` listeners in aa-firebase.js**: Every one has error callbacks.
- **Audio Notes crash recovery**: 3-layer redundancy (IndexedDB chunks + IndexedDB drafts + localStorage transcript). Fixed 10 silent failure points on 2026-03-24.
- **Viewport meta tags**: All pages have proper `<meta name="viewport">`.
- **Dark mode FOUC prevention**: Inline script runs before body renders.
- **Mirror banner**: Has `aria-live="polite"` for screen reader announcement.
- **Unread badge**: Has `role="status"` for accessibility.

---

## RECOMMENDED PRIORITY ORDER

**Sprint 1 (This Week):**
C1, C2, C3, C4, I10, I5

**Sprint 2 (Next Week):**
I1, I4, I7, I8, I11, I13, I15

**Sprint 3 (Accessibility Focus):**
A1, A2, A3, A4, A7, A8

**Sprint 4 (Polish):**
I6, I9, I12, I17, I19, A5, A6

**Ongoing/As-Needed:**
C5, I14, I16, I18, N1–N8, A9, A10

---

*Generated by Claude — 2026-03-25*
*54 HTML pages and 23 JS files audited across 7 categories.*
*Total findings: 5 critical, 19 important, 10 accessibility, 8 nice-to-have.*
