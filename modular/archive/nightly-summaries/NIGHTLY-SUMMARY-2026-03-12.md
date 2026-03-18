# Nightly Deep Audit — 2026-03-12
**Auditor:** Claude (Anthropic)
**Scope:** Auth, console errors, broken refs, cache-busting, code quality, mirror guards, Firestore security

---

## Overall Status: PASS (with action items)

---

## 1. Auth & Persistence

**Status:** PASS — No regressions

- Firebase auth persistence logic in `aa-firebase.js` is clean and correct.
- LOCAL persistence is the default (Firebase's own default used; `setPersistence()` only called for SESSION opt-in).
- `sessionStorage` mirror (`AA_KEEP_SIGNED_IN_SS`) protects against mid-session `localStorage` wipe.
- `_persistenceReady` promise correctly gates auth UI in `shared-header.html`.
- Token refresh (45-min interval + visibilitychange) prevents 1-hour sign-outs.
- Silent re-auth via GIS `auto_select` works correctly with no infinite retry.
- Recent persistence fixes (March 11–12) verified correct.

**7 onAuthStateChanged listeners found** — all justified, no write collisions:

| File | Purpose | Type |
|------|---------|------|
| aa-firebase.js:76 | Resolve `_persistenceReady` | One-shot (unsubscribes) |
| aa-firebase.js:269 | Main workhorse (user doc, token refresh, roles) | Persistent |
| aa-firebase.js:1439 | Flush queued audit entries | Persistent |
| shared-header.html:511 | UI state + GIS re-auth | Persistent |
| shared-header.html:879 | Idle timeout | Persistent |
| aa-mirror.js:260 | Mirror mode cache/switcher | Persistent |
| status-circle.js:795 | Check-in status circle | Persistent (read-only) |

---

## 2. Console Errors — Live Site

**Status:** PASS — Zero errors, zero warnings

Loaded `index.html` on live site (brinckmyster.github.io/Academic-Allies). All 5 console messages are informational `[LOG]` level:

```
[AA] Firebase ready — project: academic-allies-464901
[AA] Auth state resolved: USER (brinckmyster@gmail.com)
[AA] aa-firebase onAuthStateChanged registering
[AA] aa-firebase onAuthStateChanged: USER
[aa-mirror] renderSwitcher: cache= true allStudents= 2
```

**Note:** Email addresses appear in console logs — low risk (browser-only) but consider gating behind `window.AA_DEBUG` flag or logging UID instead.

---

## 3. Broken Links & Images

**Status:** PASS — No broken references found

- All 25 network requests on index.html returned HTTP 200.
- All icon files in `modular/icons/` verified present on disk.
- All internal page links verified (target files exist).
- All JS modules properly loaded.
- All external CDNs (Firebase 10.7.1, Google Fonts) returning 200.
- Root assets (favicon, manifest, apple-touch-icon) all present.

**One note:** Sitemap references a legacy S3 link (`ppl-ai-code-interpreter-files.s3.amazonaws.com`) that may expire.

---

## 4. Cache-Bust Consistency

**Status:** MOSTLY CONSISTENT — aa-mirror.js needs alignment

### Consistent:
- `shared-header.html?v=20260312m` — used by 31 active files
- `shared-footer.html?v=20260312e` — 1 reference (loaded by shared-header)
- `aa-firebase.js?v=20260312g` — consistent across references
- All other JS (dark-mode, draggable, migraine-mode, mode-enforcer, status-circle) — single-reference, consistent

### Inconsistent:
- **`aa-mirror.js`** has 3 different version strings in active files:
  - `?v=20260303b` (shared-header.html) — likely the canonical/latest
  - `?v=20260301a` (7 files: accommodations, admin, checkin, audio-notes, modes, spoon-pal, resources)
  - `?v=20260308a` (spoon-planner.html)

**Action needed:** Bump all aa-mirror.js references to a single current version.

### Misplaced archive files with old versions:
- 2 `.archive-` files in `modular/` have old `?v=20260312b` — these are archives and should be in `modular/archive/` per CLAUDE.md.

---

## 5. Code Quality

**Status:** ISSUES FOUND

### Misplaced Archive Files (6 files in project root — violates CLAUDE.md):
1. `firestore.rules.archive-20260226-perms`
2. `firestore.rules.archive-20260226-rename`
3. `firestore.rules.archive-20260226-spoonplan`
4. `firestore.rules.archive-20260228-nl-edit`
5. `index.html.archive-20260226`
6. `index.html.archive-20260226-rename`

**Action:** Move to `modular/archive/` with proper naming format.

### Stale Git Worktrees (2 found):
1. `exciting-clarke` — prunable (Mar 11)
2. `loving-jackson` — prunable (Mar 12), linked to branch `claude/loving-jackson`

**Action:** Run `git worktree prune` and delete stale branches.

### Email-Based Permission Check (aa-firebase.js):
- Line 29: `ADMIN_EMAILS = ['brinckmyster@gmail.com']` used for admin role assignment.
- This is a bootstrap/seed pattern (acceptable for initial admin), but CLAUDE.md says to use `AA_MIRROR_CAN_WRITE` for permission checks.
- **Recommendation:** Consider migrating to Firestore-based admin flag long-term.

### TODO Comments in Active Code (2 found):
1. `aa-firebase.js:235` — "TODO (Play Store launch): Change 'pending' → 'student'"
2. `audio-notes.html:997` — "TODO: future — integrate Otter.ai or Whisper API"

### Deprecated Patterns: NONE found. All auth uses `AA.auth.onAuthStateChanged()` correctly.

---

## 6. Mirror System Guards

**Status:** MOSTLY PASS — 2 unguarded write paths found

### Protected (correct):
- `nope-mode.html` — `_isMirror()` guard routes to `AA.suggestMode()`
- `semi-nope.html` — `_isMirror()` guard routes to `AA.suggestMode()`
- `meal-planner.html` — `_isMealMirror()` guard blocks writes; UI buttons hidden
- `shared-header.html` — Guard at line 665 prevents mirror from writing lastSeen
- `migraine-mode.js` — Routes to `AA.suggestMode()` in mirror mode

### Unguarded (needs fix):
- **`checkin.html`** — `doFirestoreSave()` calls `AA.saveCheckin()` with no mirror check
- **`bad-brain-day.html`** — `bbdSaveEnergy()` calls `AA.saveCheckin()` with no mirror check

**Risk:** A supporter in mirror mode could submit check-in entries to the student's record.

**Fix:** Add `if (window.AA_MIRROR_UID && !window.AA_MIRROR_CAN_WRITE) return;` at entry of both write functions.

### Read operations: All correctly use `window.AA_MIRROR_UID || user.uid` pattern.

---

## 7. Firestore Security

**Status:** See Mirror System Guards above — the two unguarded writes in checkin.html and bad-brain-day.html are the only gaps found. All other Firestore write paths are properly guarded.

---

## Action Items (Priority Order)

### HIGH
1. **Add mirror guard to checkin.html** — `doFirestoreSave()` needs `if (window.AA_MIRROR_UID && !window.AA_MIRROR_CAN_WRITE) return;`
2. **Add mirror guard to bad-brain-day.html** — `bbdSaveEnergy()` needs same guard
3. **Clean stale worktrees** — `git worktree prune` + delete `claude/loving-jackson` branch

### MEDIUM
4. **Align aa-mirror.js cache-bust versions** — 7 files stuck on `?v=20260301a`, should match shared-header's `?v=20260303b` or newer
5. **Move 6 misplaced root-level archive files** to `modular/archive/` with proper naming
6. **Move 2 inline `.archive-` HTML files** from `modular/` to `modular/archive/`

### LOW
7. **Gate email addresses in console logs** behind `window.AA_DEBUG` flag
8. **Legacy S3 link in sitemap** — may expire; consider removing or replacing
9. **Document all 7 onAuthStateChanged listeners** in a comment block at top of aa-firebase.js
10. **Plan migration from ADMIN_EMAILS** to Firestore-based admin flag (long-term)

---

*Audit performed by Claude (Anthropic) — 2026-03-12*
