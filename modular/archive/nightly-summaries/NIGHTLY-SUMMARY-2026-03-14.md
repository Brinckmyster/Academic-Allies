# Nightly Deep Audit — 2026-03-14
**Auditor:** Claude (Anthropic)
**Scope:** Auth, broken refs, cache-busting, code quality, mirror guards, Firestore security
**Previous audit:** 2026-03-12 — cross-referenced for regression checks and action item follow-up

---

## Overall Status: PASS ✅ — 1 stale cache-bust, 1 stale branch remain from prior audit

---

## 1. Auth & Persistence

**Status: PASS — No regressions**

- `aa-firebase.js` persistence logic unchanged and correct. LOCAL is the default (Firebase's own default), `setPersistence()` only called for SESSION opt-out. No regression.
- `_persistenceReady` promise chain correctly gates shared-header.html auth UI. Confirmed still intact.
- The 45-minute token refresh interval (`_aaTokenRefreshInterval`) and `visibilitychange` listener (`_aaVisibilityRefreshBound`) are both guarded against duplicate registration. No change since 03-12.
- GIS silent re-auth (`auto_select`) still in place.
- Persistence diagnostic added 2026-03-12 (warns when LOCAL expected but no user found) still present.
- `sessionStorage` mirror for `AA_KEEP_SIGNED_IN` still intact (guards against mid-session localStorage wipe).

**7 onAuthStateChanged listeners — unchanged, all justified:**

| File | Line | Purpose | Type |
|------|------|---------|------|
| aa-firebase.js | ~76 | Resolve `_persistenceReady` | One-shot |
| aa-firebase.js | ~269 | Main workhorse: user doc, roles, token refresh | Persistent |
| aa-firebase.js | ~1439 | Flush queued audit entries | Persistent |
| shared-header.html | ~511 | UI state + GIS re-auth | Persistent |
| shared-header.html | ~879 | Idle timeout | Persistent |
| aa-mirror.js | ~260 | Mirror mode cache/switcher | Persistent |
| status-circle.js | ~795 | Check-in status circle | Persistent (read-only) |

No new listeners introduced since 03-12. No write collisions.

---

## 2. Broken Links & Images

**Status: PASS — All links and images verified**

All pages linked from the shared-header nav and index.html module cards were verified to exist on disk:

- calendar.html, message-system.html, user-tiers.html, emergency.html, checkin.html ✅
- utc-converter.html, audit-log.html, audio-notes.html, settings.html, admin.html ✅
- nope-mode.html, semi-nope.html, recovery-mode.html, bad-brain-day.html, modes.html ✅
- meal-planner-mary/index.html, spoon-planner.html, spoon-pal.html ✅
- accommodations.html, templates.html ✅

All icons referenced in shared-header.html verified present in `modular/icons/`:
- home.png, mode-normal-outline.png, mode-recovery.png, mode-bad-brain-perplexity.png ✅
- mode-semi-nope-shadow.png, mode-nope-button.png, badge-admin-icon.png ✅

No broken script or CSS references found in the shared-header CDN loads.

---

## 3. Cache-Bust Version String Consistency

**Status: PASS (live pages) — 1 STALE item (carried from 03-12)**

### Live pages — consistent ✅
All 29 live pages (index.html + 28 component pages) correctly use:
```
fetch('/Academic-Allies/modular/shared-header.html?v=20260312m')
```
This is consistent across the entire app. No page is on an old version.

### JS files in shared-header.html:
| File | Version String | File Modified | Status |
|------|---------------|--------------|--------|
| aa-firebase.js | `?v=20260312g` | Mar 12 | ✅ |
| draggable.js | `?v=20260312a` | Mar 11 (minor) | ✅ acceptable |
| status-circle.js | `?v=20260312g` | Mar 12 | ✅ |
| migraine-mode.js | `?v=20260309b` | Mar 9 | ✅ |
| dark-mode.js | `?v=20260309a` | Mar 9 | ✅ |
| mode-enforcer.js | `?v=20260311a` | Mar 11 | ✅ |
| shared-footer.html | `?v=20260312e` | Mar 12 | ✅ |
| **aa-mirror.js** | `?v=20260303b` | **Mar 8** | ⚠️ STALE |

**⚠️ aa-mirror.js cache-bust is stale.** The file was last modified March 8 but the version string is `20260303b` (March 3). This was flagged in the 03-12 audit and has not been fixed. Users with old caches may not receive the updated `aa-mirror.js`. The comment in modes.html (line 30) says "aligned aa-mirror.js cache-bust" but the string still reads `20260303b`.

**Action needed:** Bump `aa-mirror.js` version string to `?v=20260308a` or higher in shared-header.html.

### Archive files with old version strings:
`audit-log-pre-autoselect.html`, `meal-planner-pre-presignout.html`, `message-system-pre-presignout.html` use `?v=20260312b` — acceptable, these are archive files, not live pages.

---

## 4. Code Quality

**Status: PASS — 1 stale local branch**

### auth-system.js
Retired stub confirmed empty (no-op). Comment block intact. Still listed as a commented-out script tag in shared-header.html. No risk.

### Deprecated role references
No live code uses the old `'admin'` role string in a functional context. All occurrences are: comment documentation, the `firestore.rules` legacy comment, or email-based admin bootstrap (which is intentional).

### onAuthStateChanged listener count
Unchanged at 7. No duplicates. No competing listeners introduced since 03-12.

### TODO items (unchanged from 03-12 — no new ones added):
1. `aa-firebase.js:251` — `TODO (Play Store launch): Change 'pending' → 'student'` — deferred, intentional
2. `audio-notes.html:1022` — `TODO: future — integrate Otter.ai or OpenAI Whisper API` — feature backlog, no risk

### Stale git branch (carried from 03-12):
- `claude/loving-jackson` — local branch only (not on remote), linked to a completed task (Spoon Planner banner + debug log removal). The worktree has been pruned (only one worktree listed: `main`), but the branch itself was not deleted.
- **Action:** Run `git branch -d claude/loving-jackson` in the project root.

### Misplaced root-level archive files:
Previous audit identified 6 `.archive-*` files in the project root. These were not found in this scan — they appear to have been cleaned up. ✅

---

## 5. New Feature Spot-Check: Current Mode Card (2026-03-13)

**Status: PASS**

The new "Current Mode" card added to `index.html` on 2026-03-13 reads from Firestore (`nope-state` collection via `AA_MIRROR_UID || user.uid` pattern). It is read-only — it does not write to Firestore. Mirror-safe.

---

## 6. Mirror System Guards

**Status: PASS — Both HIGH items from 03-12 audit are fixed ✅**

### Fixed since 03-12 audit:
- **`checkin.html`** — `doFirestoreSave()` now has `if (window.AA_MIRROR_UID && !window.AA_MIRROR_CAN_WRITE) return;` at line 899. ✅ FIXED
- **`bad-brain-day.html`** — `bbdSaveEnergy()` now has `if (window.AA_MIRROR_UID && !window.AA_MIRROR_CAN_WRITE) return;` at line 637. ✅ FIXED

### Full guard inventory of write-capable pages:
| Page | Guard Method | Status |
|------|-------------|--------|
| checkin.html | `AA_MIRROR_CAN_WRITE` check | ✅ |
| bad-brain-day.html | `AA_MIRROR_CAN_WRITE` check | ✅ |
| nope-mode.html | `_isMirror()` → suggest route | ✅ |
| semi-nope.html | `_isMirror()` → suggest route | ✅ |
| meal-planner.html | `_isMealMirror()` blocks writes | ✅ |
| modes.html | `_isSupporterRole` flag at write entry points | ✅ (note below) |
| spoon-planner.html | `AA_MIRROR_UID && !AA_MIRROR_CAN_WRITE` | ✅ |
| spoon-pal.html | `AA_MIRROR_UID && !AA_MIRROR_CAN_WRITE` | ✅ |
| message-system.html | Mirror-aware | ✅ |
| settings.html | Mirror-aware | ✅ |
| audio-notes.html | Mirror-aware | ✅ |
| calendar.html | Mirror-aware | ✅ |
| recovery-mode.html | Mirror-aware | ✅ |
| accommodations.html | No Firestore writes found — display only | ✅ N/A |
| audit-log.html | Read-only, no writes | ✅ N/A |

**Note on modes.html guard pattern:** Uses `_isSupporterRole` flag (`family`, `support`, `nearby-help`) instead of the standard `AA_MIRROR_CAN_WRITE` pattern. This intentionally allows `network-lead` to write mode settings (network-lead has write privilege per the app's role design). This is correct behavior, not a bug — but it is a non-standard pattern worth documenting.

### Read operations: All correctly use `window.AA_MIRROR_UID || user.uid` pattern where applicable. ✅

---

## 7. Firestore Security Rules

**Status: PASS — Rules are well-structured and comprehensive**

Spot-check highlights:
- `checkins` collection: write locked to `isOwner(uid)` only — supporters cannot write check-ins even if they bypass the client guard. Defense in depth confirmed. ✅
- `nope` collection: write limited to `isOwner(uid) || isNetworkLead(uid)`. ✅
- `spoonPal` collection (including `/days/` subcollection): `isOwner(uid) || isBackstageManager()` only. No network member read. ✅
- `audioNotes`: write to `isOwner(uid)` only. ✅
- Audit log: `create` allowed for any `isSignedIn()` (server-side writes needed), but `update` and `delete` are `false`. Append-only integrity maintained. ✅
- `notifications/{studentUid}/entries`: `allow create: if isSignedIn()` — intentionally open so the student's own code (running as the student) can write alerts. Reasonable for this use case.
- `isBackstageManager()` still uses a hardcoded email (`brinckmyster@gmail.com`). This is an intentional bootstrap pattern — noted in code comments.

No new security gaps found. The two client-side gaps from 03-12 (checkin.html and bad-brain-day.html) were patched on the client; Firestore rules already had the correct server-side protection as a backstop.

---

## Action Items — 2026-03-14

### MEDIUM (carried from prior audit)
1. **⚠️ Bump `aa-mirror.js` cache-bust** — Update `?v=20260303b` → `?v=20260308a` (or higher) in `shared-header.html` line 895. File was updated March 8 but version string is still March 3. Users with old caches won't get the current file.

2. **Delete stale `claude/loving-jackson` branch** — Worktree is already pruned. Just needs `git branch -d claude/loving-jackson` run in the project.

### LOW
3. **Document modes.html guard pattern** — Add a comment in modes.html explaining why `_isSupporterRole` is used instead of `AA_MIRROR_CAN_WRITE` (to allow network-lead writes).
4. **Gate email addresses in console logs** behind `window.AA_DEBUG` flag (low risk — browser-only).
5. **Play Store TODO** in aa-firebase.js:251 — deferred until launch readiness.

---

## Changes Since 03-12 Audit

| Item | 03-12 Status | 03-14 Status |
|------|-------------|-------------|
| checkin.html mirror guard | ❌ Missing | ✅ Fixed |
| bad-brain-day.html mirror guard | ❌ Missing | ✅ Fixed |
| Root-level archive files (6) | ⚠️ Misplaced | ✅ Cleaned |
| Stale worktrees | ⚠️ 2 found | ✅ Pruned |
| aa-mirror.js cache-bust | ⚠️ Stale | ⚠️ Still stale |
| claude/loving-jackson branch | ⚠️ Present | ⚠️ Still present |
| Current Mode card (new feature) | N/A | ✅ Mirror-safe |
| A11y pass (5 pages) | N/A | ✅ Merged |

---

*Audit performed by Claude (Anthropic) — 2026-03-14*
