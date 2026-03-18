# Nightly Deep Audit — 2026-03-16 (Late-Night Edition)

**Auditor:** Claude (Cowork session — nightly-deep-audit scheduled task)
**Project:** Academic Allies (brinckmyster.github.io/Academic-Allies)
**Previous audit:** NIGHTLY-SUMMARY-2026-03-16.md (end-of-day edition)
**Purpose:** Complete items carried forward + fresh deep pass

---

## Overall Health: GOOD — Live Console Check Now Complete

This late-night pass resolves the carried-forward "Run live console error check" item and performs a full re-audit of all seven audit categories. No new regressions since the earlier today audit.

---

## 1. Auth & Persistence

**Status: PASS**

- Firebase persistence uses LOCAL by default with SESSION fallback on explicit user opt-out via "Keep Me Signed In" checkbox. This is correct per the Firebase compat SDK.
- `_persistenceReady` promise with 8-second timeout prevents UI lock if IndexedDB hangs.
- GIS silent re-auth: 30-second cooldown + 3-retry-per-load cap is working. Previously was a one-shot flag that could get stuck.
- Token refresh: 45-minute interval + visibilitychange proactive refresh prevents 1-hour auth expiry.
- Admin self-heal: backstage-manager role auto-repairs on sign-in if somehow wiped. Admin emails immune to pendingUsers overrides.
- **Listener count note:** The header comment in aa-firebase.js documents 7 listeners, but actual count is 12 (5 additional read-only listeners in index.html for hero name, nope mode snapshot, cross-device sync, streak calc, and support redirect). No write collisions — the extra 5 are all read-only Firestore snapshots.
- **Recommendation:** Update the header comment in aa-firebase.js to reflect the true count of 12 listeners.

---

## 2. Console Errors — LIVE CHECK COMPLETE

**Status: PASS — Zero errors or warnings**

Pages tested live in Chrome (brinckmyster.github.io):

| Page | Errors | Warnings | Notes |
|------|--------|----------|-------|
| index.html → support-dashboard redirect | 0 | 0 | Auth resolved to USER, mirror switcher rendered correctly |
| emergency.html | 0 | 0 | Clean load, Firebase ready, auth resolved |
| spoon-pal.html | 0 | 0 | Clean load, no warnings |

All console output was clean `[AA]`-prefixed diagnostic logs only. No JS errors, no 404s, no deprecation warnings. The live console check previously carried forward is now **resolved**.

---

## 3. Broken Links & Images

**Status: PASS — Zero broken references**

Full scan of 42 active HTML files covering 213 href attributes and 111 src attributes. All local file references (images, scripts, CSS, manifests) resolve to existing files.

**Minor finding:** Two CSS files exist but are not referenced by any HTML:
- `modular/css/style.css`
- `modular/components/meal-planner/meal-planner.css`

These appear to be orphaned stylesheets (all styling is currently inline or via Google Fonts CDN). Low priority — no functional impact.

---

## 4. Cache-Bust Consistency

**Status: PASS (production) / Minor carry-over in pre-release copies**

- All 31 active production pages load `shared-header.html?v=20260316a` — fully consistent.
- shared-footer.html fetched from one location with `?v=20260316c` — correct.
- 3 pre-release/archive copies in `components/` still reference old `?v=20260312b`:
  - `audit-log-pre-autoselect-20260305.html`
  - `meal-planner-pre-presignout-20260306.html`
  - `message-system-pre-presignout-20260306.html`

  These are not production pages (they're backup copies that should be in `modular/archive/`). No functional impact but they contribute to the misplaced archive file count.

---

## 5. Code Quality

**Status: MOSTLY PASS — Same ongoing items as earlier audit**

| Item | Status | Details |
|------|--------|---------|
| Archive naming convention (.bak) | Ongoing | ~662 older files missing .bak extension |
| Misplaced archive files | Ongoing | ~45 files with archive-style names outside modular/archive/ |
| Orphaned google-integration.js | Ongoing | Archives created but originals still in live tree (dead code) |
| Double-click gap on admin Approve | Ongoing | Low risk (admin-only page) |
| Stale git worktrees | PASS | Only main worktree present |
| Stale local branches | PASS | No dangling local branches |
| TODO/FIXME comments | PASS | 2 legitimate future-work items only |
| Console.log statements | PASS | 42 statements, all [AA]-prefixed diagnostic (intentional) |
| Duplicate event listeners | PASS | None detected |

---

## 6. Mirror System

**Status: PASS — With 5 unguarded write paths identified (pre-existing)**

Mirror system initialization is correct:
- `window.AA_MIRROR_UID` set to student UID or null
- `window.AA_MIRROR_CAN_WRITE` true only for network-lead role
- Both initialized from sessionStorage cache before onAuthStateChanged fires

**Properly guarded writes (compliant):**
- emergency.html `persistContacts()` — guarded at line 457
- shared-header.html `requestAccountDeletion()` — guarded at line 470
- migraine-mode.js `AA_toggleMigraineMode()` — sends suggestion in mirror mode
- audio-notes.html `saveNote()` — guarded at line 1251
- support-dashboard.html self-heal — only runs outside mirror mode
- user-tiers.html `resetPersonPerms()` — guarded at line 992
- shared-footer.html nudge/quick-checkin — guarded with mirror check

**Unguarded writes (vulnerability — pre-existing, not new):**

| File | Function | Risk | Severity |
|------|----------|------|----------|
| dark-mode.js line 785 | `syncToFirestore()` — writes darkMode pref | Supporter can change student dark mode | Medium |
| message-system.html lines 614-641 | Message send + thread create | Supporter can send messages as student | **High** |
| modes.html line 430 | `saveModeConfig()` — save is unguarded (reset at 459 IS guarded) | Supporter can change student mode config | Medium |
| settings.html line 660 | Settings save | Supporter can modify student settings | Medium |
| user-tiers.html line 972 | `savePersonPerms()` — save is unguarded (reset at 1001 IS guarded) | Supporter can modify network permissions | **High** |

**Note:** admin.html writes are intentionally unguarded because admin.html is in the NO_MIRROR exclusion list in aa-mirror.js.

---

## 7. Firestore Security

**Status: PASS — Role caps in place**

- `MAX_BACKSTAGE_MANAGERS = 2` and `MAX_NETWORK_LEADS_PER_STUDENT = 2` enforced at pre-registration.
- localStorage backup for emergency contacts is read-only fallback (no guard needed).
- All new writes from the redundancy sprint are properly guarded.
- The 5 unguarded write paths listed above in Mirror System are pre-existing and should be addressed in a future hardening pass.

---

## Resolved Since Earlier Today Audit

| Item | Resolution |
|------|-----------|
| Run live console error check | **RESOLVED** — Zero errors/warnings across 3 pages tested live in Chrome |

---

## Action Items Summary

| Priority | Item | Status |
|----------|------|--------|
| **High** | Add mirror guard to message-system.html send function (lines 614-641) | Pre-existing — needs fix |
| **High** | Add mirror guard to user-tiers.html savePersonPerms (line 972) | Pre-existing — needs fix |
| Medium | Add mirror guard to dark-mode.js syncToFirestore (line 785) | Pre-existing — needs fix |
| Medium | Add mirror guard to modes.html saveModeConfig (line 430) | Pre-existing — needs fix |
| Medium | Add mirror guard to settings.html save (line 660) | Pre-existing — needs fix |
| Medium | Remove live google-integration.js files (archived but not deleted) | Ongoing |
| Medium | Update aa-firebase.js header comment: 7 listeners → 12 | New finding |
| Low | Add double-click protection to admin.html Approve button | Ongoing |
| Low | Rename ~662 archive files to include .bak extension | Ongoing |
| Low | Relocate ~45 misplaced archive files to modular/archive/ | Ongoing |
| Low | Investigate 2 orphaned CSS files (style.css, meal-planner.css) | New finding |
| Future | Rename pending → student role (Play Store launch) | Known/scoped |

---

*Audit performed by Claude — nightly-deep-audit scheduled task, 2026-03-16 (late-night edition)*
