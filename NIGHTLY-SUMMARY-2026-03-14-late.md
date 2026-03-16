# Nightly Deep Audit — 2026-03-14 (Late Pass)
**Auditor:** Claude (Anthropic)
**Scope:** Auth, console errors, broken refs, cache-busting, code quality, mirror guards, Firestore security
**Previous audit:** 2026-03-14 (early pass) — cross-referenced for regression checks and action item follow-up

---

## Overall Status: PASS ✅ — 2 prior action items resolved, 2 minor new findings

---

## 1. Auth & Persistence

**Status: PASS — No regressions**

- `aa-firebase.js` persistence logic correct. LOCAL is the default, `setPersistence()` only called for SESSION opt-out.
- `_persistenceReady` promise chain correctly gates shared-header.html auth UI. Confirmed still intact.
- 45-minute token refresh interval (`_aaTokenRefreshInterval`) and `visibilitychange` listener both guarded against duplicate registration.
- GIS silent re-auth (`auto_select`) still in place with 5 fallback error paths, all tested.
- `sessionStorage` mirror for `AA_KEEP_SIGNED_IN` intact (guards against mid-session localStorage wipe).
- Error handling comprehensive: GIS script failure, credential exchange failure, prompt skip, and JS exceptions all route to visible sign-in fallback.

**7 onAuthStateChanged listeners — unchanged, all justified:**

| # | File | Line | Purpose | Type |
|---|------|------|---------|------|
| 1 | aa-firebase.js | ~76 | Resolve `_persistenceReady` | One-shot (unsubscribes) |
| 2 | aa-firebase.js | ~287 | Main workhorse: user doc, roles, token refresh | Persistent |
| 3 | aa-firebase.js | ~1484 | Flush queued audit entries | Persistent |
| 4 | shared-header.html | ~523 | UI state + GIS re-auth | Persistent |
| 5 | shared-header.html | ~891 | Idle timeout | Persistent |
| 6 | aa-mirror.js | ~530 | Mirror mode cache/switcher | Persistent |
| 7 | status-circle.js | ~795 | Check-in status circle | Persistent (read-only) |

No new listeners introduced. No write collisions.

**Race condition guards verified:**
- Session restoration: `_persistenceReady` promise gates UI listeners ✅
- Token refresh: visibilitychange handler with dedup flag ✅
- Audit queue: entries queued before auth, flushed when auth resolves ✅
- Re-auth loop: `AA_REAUTH_DONE` sessionStorage flag prevents infinite loops ✅

**Multi-instance Firebase note:** `google-integration.js` (placeholder credentials, dead code — not loaded by any live page) and `firebase-photo-upload.js` (modular SDK, Storage only — no auth collision) both have separate `initializeApp()` calls. No active conflict because live pages only load `aa-firebase.js`.

---

## 2. Console Errors (Live Site)

**Status: PASS — No JS errors**

Loaded `index.html`, `emergency.html`, and `spoon-planner.html` on the live site (brinckmyster.github.io). Results:

- **Zero JavaScript errors** on all tested pages
- **Zero failed network requests** for scripts or stylesheets
- One expected diagnostic warning on index.html: `PERSISTENCE DIAGNOSTIC: Expected LOCAL session for user but auth resolved null. IndexedDB may have been cleared by the browser.` — This is correct behavior for an unauthenticated browser session (no user to restore).
- Firebase initialized cleanly: `[AA] Firebase ready — project: academic-allies-464901`
- Auth listeners registered in correct order
- Shared header, mode bar, tools grid, and credit footer all rendered correctly

**Visual verification:** Homepage renders correctly with greeting, date, check-in prompt, NOPE button, and all tool cards visible. Sign-in button and "Keep me signed in" checkbox display properly.

---

## 3. Broken Links & Images

**Status: PASS — 1 minor finding, 1 cosmetic finding**

All pages linked from shared-header nav and index.html tool cards verified to exist on disk. All icon images in `modular/icons/` confirmed present. All Firebase CDN script references load successfully.

### Minor: icon-gallery.html favicon path
- **File:** `modular/icon-gallery.html` line 5–6
- **Issue:** Uses relative path `href="favicon.ico"` instead of `/Academic-Allies/favicon.ico`
- **Impact:** Favicon won't display on this page (resolves to `/modular/favicon.ico` which doesn't exist)
- **All other pages** use the correct absolute path
- **Severity:** LOW — icon-gallery is a dev/reference page, not user-facing

### Cosmetic: Empty src img placeholder in shared header
- **Observed on:** emergency.html, spoon-planner.html (and likely all pages with shared header)
- **Issue:** An `<img src="">` element (index 6 in DOM, inside a DIV) with empty src attribute
- **Impact:** Browser resolves empty src to the current page URL, showing as a "broken" image in dev tools
- **Likely cause:** User avatar or profile photo placeholder that gets populated dynamically after sign-in
- **Severity:** COSMETIC — not visible to users, no functional impact

---

## 4. Cache-Bust Version String Consistency

**Status: PASS ✅ — Prior stale item RESOLVED**

### Major improvement since early 03-14 audit:
The `aa-mirror.js` cache-bust has been **fixed**. The early audit reported it as stale (`?v=20260303b`), but it now reads `?v=20260314m` — current and matching the file's modification date.

### Live pages — all consistent ✅
All 29 live pages (index.html + 28 component pages) use `?v=20260314e` for shared-header.html.

### JS files in shared-header.html:
| File | Version String | Status |
|------|---------------|--------|
| aa-firebase.js | `?v=20260314e` | ✅ Current |
| aa-mirror.js | `?v=20260314m` | ✅ **FIXED** (was `20260303b`) |
| draggable.js | `?v=20260312a` | ✅ |
| status-circle.js | `?v=20260312g` | ✅ |
| migraine-mode.js | `?v=20260309b` | ✅ |
| dark-mode.js | `?v=20260314g` | ✅ Current |
| mode-enforcer.js | `?v=20260311a` | ✅ |
| shared-footer.html | `?v=20260314e` | ✅ Current |

**All version strings are now current. No stale cache-busts remain.** ✅

---

## 5. Code Quality

**Status: PASS — 1 minor housekeeping item**

### Stale backup file not in archive ⚠️
- **File:** `.claude.json.backup` in project root
- **Issue:** Per CLAUDE.md, all backup/archive files must be in `modular/archive/` — "No dot-files. No files next to the source."
- **Severity:** LOW — configuration file, not code
- **Action:** Move to `modular/archive/` or remove

### Stale branch resolved ✅
- `claude/loving-jackson` — no longer present as a local branch (only `main` exists locally). **RESOLVED** since early audit.

### Duplicate function definitions — properly scoped ✅
- `endDrag()` exists in both `aa-mirror.js` and `draggable.js` — both inside IIFEs, no collision
- `init()` exists in both `migraine-mode.js` and `status-circle.js` — both inside IIFEs, no collision

### TODO items (unchanged — both intentional):
1. `aa-firebase.js:251` — `TODO (Play Store launch): Change 'pending' → 'student'` — deferred
2. `audio-notes.html:1022` — `TODO: future — integrate Otter.ai or OpenAI Whisper API` — backlog

### Console.log usage — 37 instances, all use `[AA]` prefix, appropriate for development. No sensitive data exposure.

### auth-system.js — Retired stub (no-op), still present as commented-out script tag. No risk.

---

## 6. Mirror System Guards

**Status: PASS — 2 LOW-priority cosmetic writes unguarded**

### Full guard inventory:
| Page | Guard Method | Status |
|------|-------------|--------|
| checkin.html | `AA_MIRROR_CAN_WRITE` check | ✅ |
| bad-brain-day.html | `AA_MIRROR_CAN_WRITE` check | ✅ |
| emergency.html | `AA_MIRROR_CAN_WRITE` check | ✅ |
| shared-header.html | `AA_MIRROR_CAN_WRITE` check (account deletion) | ✅ |
| settings.html | `AA_MIRROR_CAN_WRITE` + toast | ✅ |
| recovery-mode.html | `AA_MIRROR_CAN_WRITE` (3 guards) | ✅ |
| audio-notes.html | `AA_MIRROR_CAN_WRITE` (4 guards: save/delete/rename/convert) | ✅ |
| message-system.html | `AA_MIRROR_CAN_WRITE` (2 guards: DM + network chat) | ✅ |
| meal-planner.html | `_isMealMirror()` blocks writes | ✅ |
| spoon-planner.html | `isMirror \|\| _isSupporterRole` | ✅ |
| modes.html | `_isSupporterRole` (intentionally allows network-lead) | ✅ |
| nope-mode.html | Mirror exempt (NO_MIRROR list) | ✅ N/A |
| semi-nope.html | Mirror exempt (NO_MIRROR list) | ✅ N/A |
| spoon-pal.html | Mirror exempt (NO_MIRROR list) | ✅ N/A |
| accommodations.html | No Firestore writes — display only | ✅ N/A |
| audit-log.html | Read-only, no writes | ✅ N/A |

### Unguarded cosmetic writes (LOW priority):
1. **dark-mode.js line 743** — `db.collection('users').doc(uid).update({ darkMode: isDark })`
   - Not guarded by mirror check
   - Impact: A supporter could theoretically toggle the student's dark mode preference
   - Risk: MINIMAL — cosmetic only, localStorage is source of truth, update fails silently if permission denied

2. **migraine-mode.js line 82** — `.update({ migraineMode: active })`
   - Same pattern as dark mode — cosmetic preference, not sensitive data
   - Risk: MINIMAL

**Recommendation:** Add guards for consistency, but functional impact is negligible.

### Suggestion system working correctly:
- `spoon-planner.html` uses `AA.suggestSpoonPlan()` for supporters
- `meal-planner.html` uses `AA.suggestMeals()` for supporters
- Student is sudo — accepts/dismisses all suggestions

---

## 7. Firestore Security Rules

**Status: PASS — Defense in depth confirmed**

Key verifications:
- `checkins` collection: write locked to `isOwner(uid)` only — Firestore rules block even if client guard is bypassed ✅
- `nope` collection: `isOwner(uid) || isNetworkLead(uid)` ✅
- `spoonPal` (including `/days/`): `isOwner(uid) || isBackstageManager()` — no network member access ✅
- `audioNotes`: write to `isOwner(uid)` only ✅
- `auditLog`: append-only (`create: isSignedIn()`, `update/delete: false`) ✅
- `spoonPlanSuggestions`: `create` open to network members (intentional — supports suggestion workflow) ✅
- `isBackstageManager()` uses hardcoded email — intentional bootstrap pattern ✅

All client-side mirror guards are backed by server-side Firestore rules. Defense in depth is comprehensive.

---

## Action Items — 2026-03-14 (Late)

### RESOLVED since early audit ✅
1. ~~Bump `aa-mirror.js` cache-bust~~ → **Fixed to `?v=20260314m`** ✅
2. ~~Delete stale `claude/loving-jackson` branch~~ → **Branch no longer exists locally** ✅

### LOW (new findings)
1. **Move `.claude.json.backup`** from project root to `modular/archive/` per CLAUDE.md archiving rules
2. **Fix `icon-gallery.html` favicon path** — Change `href="favicon.ico"` to `href="/Academic-Allies/favicon.ico"` (line 5-6)
3. **Consider guarding dark-mode.js and migraine-mode.js** Firestore writes with `if (window.AA_MIRROR_UID && !window.AA_MIRROR_CAN_WRITE) return;` for consistency (functional impact is negligible)
4. **Document modes.html guard pattern** — Add comment explaining why `_isSupporterRole` is used instead of `AA_MIRROR_CAN_WRITE`

### DEFERRED (unchanged)
5. `TODO (Play Store launch)` in aa-firebase.js:251 — awaiting launch readiness
6. `TODO: Otter.ai/Whisper` in audio-notes.html:1022 — feature backlog

---

## Changes Since Early 03-14 Audit

| Item | Early 03-14 Status | Late 03-14 Status |
|------|-------------------|-------------------|
| aa-mirror.js cache-bust | ⚠️ Stale (`20260303b`) | ✅ Fixed (`20260314m`) |
| claude/loving-jackson branch | ⚠️ Present | ✅ Deleted |
| .claude.json.backup in root | Not flagged | ⚠️ New finding — housekeeping |
| icon-gallery.html favicon | Not flagged | ⚠️ New finding — relative path |
| dark-mode.js mirror guard | Not checked | ⚠️ New finding — cosmetic write unguarded |
| migraine-mode.js mirror guard | Not checked | ⚠️ New finding — cosmetic write unguarded |
| Live site console errors | Not tested | ✅ Zero errors confirmed |

---

*Audit performed by Claude (Anthropic) — 2026-03-14 late pass*
