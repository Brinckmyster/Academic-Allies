# Nightly Deep Audit — 2026-03-22 (Rev 2 — post-housekeeping)

**Audited by:** Claude
**Scope:** Full audit — Broken Resources, Auth & Security, Cache Consistency, Code Quality, Archive Hygiene, Redundancy (7 sub-checks), Misplaced Files & Branches
**Previous audit:** 2026-03-21
**Note:** This replaces the earlier 2026-03-22 draft written before today's housekeeping commit (bd80f2b) and Paw Points feature additions (325570b, fe43e5e).

---

## Overall Status: HEALTHY with HOUSEKEEPING NEEDED

No critical bugs. No broken file references. No unguarded Firestore writes on active user-facing pages. The Paw Points / Streak Shields economy added today is clean. Main outstanding item is **37 misplaced archive files** that the housekeeping commit did not fully address. Git commands to fix are provided in §5.

---

## 1. Broken Resources

**Status: CLEAN**

- All `<script src>`, `<img src>`, and `<link href>` references across all active HTML files resolve to files that exist on disk.
- All icons referenced in `shared-header.html` (`home.png`, `mode-*.png`) exist in `modular/icons/`.
- All JS modules listed in `sw.js` NEVER_CACHE exist: `study-activity.js`, `mode-enforcer.js`, `status-circle.js`, `aa-mirror.js`, `dark-mode.js`, `aa-firebase.js`, `shared-header.html`, `shared-footer.html` — all confirmed present.
- All pages in sw.js SHELL pre-cache list resolve correctly. (`/Academic-Allies/` root and `/Academic-Allies/index.html` are the same entry — minor cosmetic duplicate, not a bug.)
- One dynamic icon path (`/Academic-Allies/modular/icons/' + src + '`) is a JavaScript template — not a broken reference, just a flagged pattern in the grep. Expected.
- `streak-cat.html` added 2026-03-21 is NOT in the SHELL pre-cache list. Since it's not a crisis page, this is acceptable for now. Worth adding if offline play becomes a goal.

**No broken references found.**

---

## 2. Auth & Security

**Status: CLEAN — no regressions from today's commits**

Core auth is solid:
- `aa-firebase.js` correctly uses `_persistenceReady` promise with 8s/15s timeout serializing auth-dependent operations.
- Mirror guard pattern (`if (window.AA_MIRROR_UID && !window.AA_MIRROR_CAN_WRITE) return;`) is consistently applied on all active user-facing writes.
- **New this cycle — Paw Points / Streak Shields (streak-cat.html):** The save function at line 1366 checks the mirror guard before any Firestore write. `state.pawPoints` defaults to `|| 0` on all reads from Firestore. Purchase functions (`repairStreak`, `purchaseItem`) check `state.pawPoints >= cost` before deducting. No unsafe writes found.

**Utility/static pages without auth check (intentional — no personal data writes):**
- `audio-converter.html`, `bedroom-planner.html`, `status-circle.html` — tools/demos
- `mary-crossword-floral.html`, `mary-wordsearch-cooking.html` — static study tools
- `accommodation-request.html`, `counselor-outreach.html`, `templates.html` — printable templates

No regressions. No auth bypasses found.

---

## 3. Cache Consistency

**Status: CLEAN — fully synced to 20260322 after housekeeping commit**

Today's housekeeping commit (bd80f2b) synced all cache-bust strings:

- `sw.js` cache name: `aa-shell-20260322a` — current ✓
- All active pages: `shared-header.html?v=20260322` — confirmed consistent across all 43+ pages ✓
- `aa-firebase.js?v=20260322` — consistent ✓
- `aa-mirror.js?v=20260322` — consistent ✓ (previously stale in nope-mode/semi-nope — **fixed**)
- Script tags in shared-header: `draggable.js`, `aa-mirror.js`, `study-activity.js`, `status-circle.js`, `migraine-mode.js`, `dark-mode.js`, `mode-enforcer.js` — all at `v=20260322` ✓
- `shared-footer.html?v=20260322` — consistent ✓

**NEVER_CACHE list is comprehensive** (9 entries): `shared-header.html`, `shared-footer.html`, `aa-firebase.js`, `dark-mode.js`, `mode-enforcer.js`, `status-circle.js`, `aa-mirror.js`, `study-activity.js`, `sw.js` — no gaps.

**No cache version inconsistencies found this cycle.**

---

## 4. Code Quality

**Status: LOW-LEVEL NOTES — no regressions, same standing items as previous audits**

Key JS files (`aa-firebase.js`, `aa-mirror.js`, `mode-enforcer.js`, `status-circle.js`, `study-activity.js`, `migraine-mode.js`) — **zero arrow functions, zero `const`/`let`** — fully ES5-compliant ✓

**Persistent ES6+ style violations (same as previous audits, not new):**

| File | `let`/`const` | Arrows | Notes |
|------|---------------|--------|-------|
| `modular/js/header-loader.js` | Several `const` | Several `=>` | Not used in production pages — no impact |
| `modular/js/main.js` | 3 `const` | 0 | Lines 6, 15, 24 — very minor |
| `modular/js/app.js` | 0 | 2 | Lines 40, 147 — very minor |
| `modular/components/spoon-planner/spoon-pal.html` | 226 `let`/`const` | 0 | Heavy ES6+; async/await throughout |
| `modular/components/bedroom-planner/bedroom-planner.html` | Many `const`/`let` | Many `=>` | Isolated tool, no Firebase writes |

`spoon-pal.html` is the most significant — written in modern ES6+ throughout. Works on all modern browsers. If older Android support is ever required, this would need rewriting.

**No deprecated Firebase SDK patterns.** No duplicate `onAuthStateChanged` registrations. `status-circle.js` properly cleans up `onSnapshot` listeners with `_unsubNope`/`_unsubDay` before re-subscribing — good pattern.

**onSnapshot cleanup:** 28 `onSnapshot` calls across the codebase; only 3 explicitly store the unsubscribe function. Most are in single-auth-event contexts (page-level listeners that don't re-subscribe), so stacking is low risk. `status-circle.js` is the high-frequency case and handles it correctly.

---

## 5. Archive Hygiene

**Status: WARNING — 37 misplaced archive files remain**

Today's housekeeping commit (bd80f2b) moved 26 archives into `modular/archive/` but **37 archive files remain outside that directory** in `modular/components/` subdirectories and `modular/static/`. These are all in git.

**Complete list of files needing to move:**

```
# audio-notes/
modular/components/audio-notes/audio-notes.html.archive-20260307-pre-refresh-safety

# bad-brain-day/
modular/components/bad-brain-day.html.archive-20260226-firebase

# message-system/ (3 files)
modular/components/message-system/message-system.html.archive-20260226
modular/components/message-system/message-system.html.archive-20260226-rename
modular/components/message-system/message-system.html.archive-20260227-draft-save

# recovery-mode/ (11 files)
modular/components/recovery-mode.html.archive-20260226-spoonplan
modular/components/recovery-mode.html.archive-20260227-clearplan
modular/components/recovery-mode.html.archive-20260227-completed-class
modular/components/recovery-mode.html.archive-20260227-fbclear
modular/components/recovery-mode.html.archive-20260227-journal
modular/components/recovery-mode.html.archive-20260227-journal-auth
modular/components/recovery-mode.html.archive-20260227-journal-autosave
modular/components/recovery-mode.html.archive-20260227-localsave
modular/components/recovery-mode.html.archive-20260227-newday
modular/components/recovery-mode.html.archive-20260227-newday2
modular/components/recovery-mode.html.archive-20260227-newday3
modular/components/recovery-mode.html.archive-20260227-nowatch

# spoon-planner/ (7 files)
modular/components/spoon-planner/spoon-pal.html.archive-20260302-pre-emoji-strip
modular/components/spoon-planner/spoon-pal.html.archive-20260302-pre-quickentry
modular/components/spoon-planner/spoon-planner.html.archive-20260226-firebase
modular/components/spoon-planner/spoon-planner.html.archive-20260226b-scriptfix
modular/components/spoon-planner/spoon-planner.html.archive-20260227-completed-class
modular/components/spoon-planner/spoon-planner.html.archive-20260227-newday
modular/components/spoon-planner/spoon-planner.html.archive-20260227-spoonfix

# user-tiers/ (14 files)
modular/components/user-tiers/user-tiers.html.archive-20260226
modular/components/user-tiers/user-tiers.html.archive-20260226-ai-widget
modular/components/user-tiers/user-tiers.html.archive-20260226-modules
modular/components/user-tiers/user-tiers.html.archive-20260226-profile
modular/components/user-tiers/user-tiers.html.archive-20260226-rename
modular/components/user-tiers/user-tiers.html.archive-20260226b
modular/components/user-tiers/user-tiers.html.archive-20260226c
modular/components/user-tiers/user-tiers.html.archive-20260227-ai-dropdown
modular/components/user-tiers/user-tiers.html.archive-20260227-open-btn
modular/components/user-tiers/user-tiers.html.archive-20260227-open-delay
modular/components/user-tiers/user-tiers.html.archive-20260227-open-delay2500
modular/components/user-tiers/user-tiers.html.archive-20260227-paste-notify

# static/
modular/static/utc-converter.html.archive-20260227-12hr
```

**Git commands to move all 37 (Bruise runs these in Git Bash — do NOT run automatically):**

```bash
git mv "modular/components/audio-notes/audio-notes.html.archive-20260307-pre-refresh-safety" "modular/archive/audio-notes_2026-03-07_pre-refresh-safety.bak.html"
git mv "modular/components/bad-brain-day.html.archive-20260226-firebase" "modular/archive/bad-brain-day_2026-02-26_firebase.bak.html"
git mv "modular/components/message-system/message-system.html.archive-20260226" "modular/archive/message-system_2026-02-26.bak.html"
git mv "modular/components/message-system/message-system.html.archive-20260226-rename" "modular/archive/message-system_2026-02-26_rename.bak.html"
git mv "modular/components/message-system/message-system.html.archive-20260227-draft-save" "modular/archive/message-system_2026-02-27_draft-save.bak.html"
git mv "modular/components/recovery-mode.html.archive-20260226-spoonplan" "modular/archive/recovery-mode_2026-02-26_spoonplan.bak.html"
git mv "modular/components/recovery-mode.html.archive-20260227-clearplan" "modular/archive/recovery-mode_2026-02-27_clearplan.bak.html"
git mv "modular/components/recovery-mode.html.archive-20260227-completed-class" "modular/archive/recovery-mode_2026-02-27_completed-class.bak.html"
git mv "modular/components/recovery-mode.html.archive-20260227-fbclear" "modular/archive/recovery-mode_2026-02-27_fbclear.bak.html"
git mv "modular/components/recovery-mode.html.archive-20260227-journal" "modular/archive/recovery-mode_2026-02-27_journal.bak.html"
git mv "modular/components/recovery-mode.html.archive-20260227-journal-auth" "modular/archive/recovery-mode_2026-02-27_journal-auth.bak.html"
git mv "modular/components/recovery-mode.html.archive-20260227-journal-autosave" "modular/archive/recovery-mode_2026-02-27_journal-autosave.bak.html"
git mv "modular/components/recovery-mode.html.archive-20260227-localsave" "modular/archive/recovery-mode_2026-02-27_localsave.bak.html"
git mv "modular/components/recovery-mode.html.archive-20260227-newday" "modular/archive/recovery-mode_2026-02-27_newday.bak.html"
git mv "modular/components/recovery-mode.html.archive-20260227-newday2" "modular/archive/recovery-mode_2026-02-27_newday2.bak.html"
git mv "modular/components/recovery-mode.html.archive-20260227-newday3" "modular/archive/recovery-mode_2026-02-27_newday3.bak.html"
git mv "modular/components/recovery-mode.html.archive-20260227-nowatch" "modular/archive/recovery-mode_2026-02-27_nowatch.bak.html"
git mv "modular/components/spoon-planner/spoon-pal.html.archive-20260302-pre-emoji-strip" "modular/archive/spoon-pal_2026-03-02_pre-emoji-strip.bak.html"
git mv "modular/components/spoon-planner/spoon-pal.html.archive-20260302-pre-quickentry" "modular/archive/spoon-pal_2026-03-02_pre-quickentry.bak.html"
git mv "modular/components/spoon-planner/spoon-planner.html.archive-20260226-firebase" "modular/archive/spoon-planner_2026-02-26_firebase.bak.html"
git mv "modular/components/spoon-planner/spoon-planner.html.archive-20260226b-scriptfix" "modular/archive/spoon-planner_2026-02-26b_scriptfix.bak.html"
git mv "modular/components/spoon-planner/spoon-planner.html.archive-20260227-completed-class" "modular/archive/spoon-planner_2026-02-27_completed-class.bak.html"
git mv "modular/components/spoon-planner/spoon-planner.html.archive-20260227-newday" "modular/archive/spoon-planner_2026-02-27_newday.bak.html"
git mv "modular/components/spoon-planner/spoon-planner.html.archive-20260227-spoonfix" "modular/archive/spoon-planner_2026-02-27_spoonfix.bak.html"
git mv "modular/components/user-tiers/user-tiers.html.archive-20260226" "modular/archive/user-tiers_2026-02-26.bak.html"
git mv "modular/components/user-tiers/user-tiers.html.archive-20260226-ai-widget" "modular/archive/user-tiers_2026-02-26_ai-widget.bak.html"
git mv "modular/components/user-tiers/user-tiers.html.archive-20260226-modules" "modular/archive/user-tiers_2026-02-26_modules.bak.html"
git mv "modular/components/user-tiers/user-tiers.html.archive-20260226-profile" "modular/archive/user-tiers_2026-02-26_profile.bak.html"
git mv "modular/components/user-tiers/user-tiers.html.archive-20260226-rename" "modular/archive/user-tiers_2026-02-26_rename.bak.html"
git mv "modular/components/user-tiers/user-tiers.html.archive-20260226b" "modular/archive/user-tiers_2026-02-26b.bak.html"
git mv "modular/components/user-tiers/user-tiers.html.archive-20260226c" "modular/archive/user-tiers_2026-02-26c.bak.html"
git mv "modular/components/user-tiers/user-tiers.html.archive-20260227-ai-dropdown" "modular/archive/user-tiers_2026-02-27_ai-dropdown.bak.html"
git mv "modular/components/user-tiers/user-tiers.html.archive-20260227-open-btn" "modular/archive/user-tiers_2026-02-27_open-btn.bak.html"
git mv "modular/components/user-tiers/user-tiers.html.archive-20260227-open-delay" "modular/archive/user-tiers_2026-02-27_open-delay.bak.html"
git mv "modular/components/user-tiers/user-tiers.html.archive-20260227-open-delay2500" "modular/archive/user-tiers_2026-02-27_open-delay2500.bak.html"
git mv "modular/components/user-tiers/user-tiers.html.archive-20260227-paste-notify" "modular/archive/user-tiers_2026-02-27_paste-notify.bak.html"
git mv "modular/static/utc-converter.html.archive-20260227-12hr" "modular/archive/utc-converter_2026-02-27_12hr.bak.html"
git commit -m "Claude: Move 37 remaining misplaced archive files to modular/archive/ per SOP"
git push
```

**Note:** `modular/js/archive/` contains 2 files (`mode-enforcer_2026-03-10_pre-audio-nav-fix.js`, `status-circle_2026-03-03_pre-rollingavg.js`). This is a local subfolder pattern — acceptable but ideally these would be in `modular/archive/` per the strict SOP.

---

## 6. Redundancy Checks

**Status: SOLID — Paw Points additions follow all redundancy patterns correctly**

### Error Handling Coverage
- `aa-firebase.js`: All Firestore writes return their promise or have explicit `.catch()` wrappers. No unhandled promise explosions.
- `streak-cat.html` Paw Points economy: Save function has `.catch()` with retry logic (lines 1397–1406). `purchaseItem()` and `repairStreak()` validate balance before deducting — no negative-balance writes possible. ✓
- `audio-notes.html`: 8+ fetch calls with catch blocks — well covered. ✓
- No unhandled critical promise chains found.

### Offline Fallbacks
- `checkin.html`: localStorage backup in place with quota-exceeded warning ✓
- `emergency.html`: localStorage fallback in place ✓
- `streak-cat.html`: localStorage crash-recovery backup (lines 997–1039), falls back on Firestore failure (line 1441) ✓
- `spoon-pal.html`: localStorage fallback in place ✓
- No pages identified as reading Firestore without any fallback.

### Retry Logic
- `_persistenceReady` has built-in timeout retry (8s desktop / 15s mobile) ✓
- `AA_REAUTH_COUNT` caps GIS re-auth retries at 3 per page load ✓
- `streak-cat.html` save retry at lines 1404–1406 ✓

### Null/Undefined Guards
- All `doc.data()` accesses guarded by `doc.exists` checks across the codebase ✓
- Paw Points load: `d.pawPoints || 0` and `d.shields || []` fallback patterns ✓
- `supportNetwork || {}` fallback used consistently in message-system and user-tiers ✓
- `message-system.html` line 1084: `doc.exists` checked at line 1080 before `doc.data()` access ✓

### Race Condition Checks
- `onAuthStateChanged` layered via `_persistenceReady` promise in `shared-header.html` — no race ✓
- `status-circle.js` unsubscribes existing `onSnapshot` listeners before re-subscribing ✓
- `streak-cat.html` uses `_uid` guard (`if (!_uid) return;`) before all save calls ✓
- Paw Points state mutations are synchronous (in-memory) before the async Firestore save — no race between PP deduction and save ✓

### Duplicate Listener Prevention
- `status-circle.js` uses `_unsubNope`/`_unsubDay` cleanup variables ✓
- 28 `onSnapshot` calls total; most are in single-auth-state contexts (no re-subscription risk)
- No stacked event listeners found in new Paw Points code ✓

### Graceful Degradation
- Paw Points Shop: affordability check per item; insufficient funds shows inline message (line 1152) ✓
- Weather failure in spoon-pal fails gracefully with user-visible message ✓
- Audio Notes: 43 try/catch blocks — comprehensive ✓
- `streak-cat.html` shows toast messages for all user-visible errors ✓

### Data Validation on Write
- `state.pawPoints` initialized from `d.pawPoints || 0` — no NaN possible from Firestore ✓
- `state.pawPoints -= item.price` only runs after `state.pawPoints >= item.price` check ✓
- `Math.max(0, val)` at test slider (line 1805) prevents negative values ✓
- No undefined or NaN values likely to reach Firestore on active paths ✓

### Service Worker Staleness
- `sw.js` CACHE name `aa-shell-20260322a` — current ✓
- NEVER_CACHE list covers 9 frequently-changing files — comprehensive ✓
- `streak-cat.html` is NOT in the SW SHELL pre-cache list — acceptable for a game feature, but first load requires network ✓
- SW registered only from `shared-header.html` — no duplicate registrations ✓

---

## 7. Misplaced Files & Stale Branches

**Status: HOUSEKEEPING NEEDED (same carryover items)**

**Stale remote branch:**
- `origin/Brinckmyster-Aestas` — still present. **OFF-LIMITS to AI** per task rules. Bruise must manually delete if desired:
  ```bash
  git push origin --delete Brinckmyster-Aestas
  ```

**Root-level files of note (informational, not blocking):**
- `.fuse_hidden0000077f00000001` — Linux FUSE filesystem artifact, not git-tracked, harmless
- `.claude.json.backup` — old Claude config backup, not git-tracked, harmless

**No stale local worktrees.** Only the main worktree at `[main]` exists. ✓

---

## New Features Validated This Cycle

**Paw Points Economy (streak-cat.html — commit 325570b)**
- PP earned per check-in: 5 base + 2 daily bonus + milestone bonuses
- Streak Shields: consumable items purchased via Paw Shop; protect broken streak
- Streak Repair: costs 50 PP to restore a broken streak
- Mirror guard applied ✓ | localStorage backup ✓ | Firestore retry ✓ | Balance validation before deduct ✓

**Redundancy fixes for streak-cat (commit fe43e5e):**
- localStorage backup for all streak state ✓
- Photo fallback for Duchess photos ✓
- Stale ID cleanup on auth change ✓
- Visibility handler for tab-switch refresh ✓

---

## Action Items Summary

| Priority | Item | Status | Action |
|----------|------|--------|--------|
| **Medium** | Move 37 misplaced archive files | 4th+ day carryover | Bruise runs git commands in §5 |
| Low | Add `streak-cat.html` to SW SHELL pre-cache | New low-priority | Claude can do next session |
| Low | Delete `origin/Brinckmyster-Aestas` branch | Ongoing carryover | Bruise manual action only |
| Info | `spoon-pal.html` uses ES6+ style | Ongoing | 226 let/const, async/await |
| Info | `main.js` 3 `const`, `app.js` 2 arrow functions | Ongoing | Very minor ES5 spec drift |
| Info | `modular/js/archive/` holds 2 files outside `modular/archive/` | Ongoing | Optional cleanup |

---

*Report generated by Claude — 2026-03-22 (automated nightly audit, Rev 2 — post-housekeeping)*
