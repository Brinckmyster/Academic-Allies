# Nightly Deep Audit — 2026-03-22

**Audited by:** Claude
**Scope:** Full audit — Broken Resources, Auth & Security, Cache Consistency, Code Quality, Archive Hygiene, Redundancy (7 sub-checks), Misplaced Files & Branches
**Previous audit:** 2026-03-21

---

## Overall Status: HEALTHY

No critical bugs. No broken file references. No unguarded Firestore writes on active user-facing pages. The main items this cycle are housekeeping carryovers from yesterday that haven't been actioned yet, one new cache version inconsistency from the streak-cat feature added yesterday, and a persistent ES5 style note on spoon-pal.html.

---

## 1. Broken Resources

**Status: CLEAN**

All `<script src>`, `<link href>`, and `<img src>` references across all active HTML files resolve to files that exist on disk. All JS modules, icons, CSS, and HTML components are correctly in place. The `streak-cat.html` page (added 2026-03-21) is wired up correctly.

No broken references found.

---

## 2. Auth & Security

**Status: CLEAN on active user pages — context notes on utility pages**

Core auth is solid:
- `aa-firebase.js` correctly uses `_persistenceReady` promise with 8s/15s timeout before any auth-dependent operations.
- All primary user-facing pages (`checkin.html`, `admin.html`, `nope-mode.html`, `semi-nope.html`, `spoon-pal.html`, `audio-notes.html`, `message-system.html`, `calendar.html` via shared-header, `streak-cat.html`) gate on auth via `onAuthStateChanged` or the shared header.
- Mirror guard pattern (`if (window.AA_MIRROR_UID && !window.AA_MIRROR_CAN_WRITE) return;`) is consistently applied on all active user-facing writes (verified in previous audit; no regressions found in new code added 2026-03-21).

**Context notes (not bugs — utility/static pages):**

The following pages have no `onAuthStateChanged` and/or Firestore writes without mirror guards. These appear to be intentionally public static or admin seeder pages, not user-facing features:

- `floral-flashcards.html`, `floral-match-game.html`, `floral-study-sheet.html`, `floral-flower-id.html`, `floral-genus-practice.html`, `floral-speed-round.html`, `floral-missed-tracker.html` — Static study tools, no auth needed
- `templates.html`, `accommodation-request.html`, `counselor-outreach.html` — Template/printable pages, no write ops on personal data
- `seed-mary-contacts.html`, `network-invite.html` — Admin seeder tools, intentionally unguarded
- `resources.html`, `network-lead-guide.html` — Public info pages
- `bedroom-planner.html` — Static planner tool

If any of these pages are intended to write personal user data in the future, mirror guards will need to be added at that time.

---

## 3. Cache Consistency

**Status: WARNING — streak-cat.html on a different version than all other pages**

- `sw.js` cache name: `aa-shell-20260321u` — current, no issues.
- `NEVER_CACHE` list covers: `shared-header.html`, `shared-footer.html`, `aa-firebase.js`, `dark-mode.js`, `mode-enforcer.js`, `status-circle.js`, `aa-mirror.js`, `study-activity.js`, `sw.js` — comprehensive, no gaps found.
- `shared-footer.html` is fetched from `shared-header.html` at `v=20260316c` — older but footer hasn't changed since, so no user impact. Bump when footer next changes.

**Version split:**
- 42 active pages load `shared-header.html?v=20260320`
- **`streak-cat.html` (added 2026-03-21) loads `shared-header.html?v=20260321`** — this page was created after the others, so it got a newer version string. Since all 43 pages point to the same actual file, this is cosmetically inconsistent but has no functional impact. Recommend aligning all pages to `v=20260321` at the next shared-header edit to re-sync the fleet.

**Stale version strings on nope-mode and semi-nope:**
- Both pages load `aa-firebase.js?v=20260316a` — the actual file was last modified 2026-03-21. Since `aa-firebase.js` is in NEVER_CACHE for the service worker, the SW always serves the latest version. However, browsers may still cache based on URL query string for direct page loads. Low risk, but worth bumping these version strings on the next edit to those pages.
- Both pages load `aa-mirror.js?v=20260319a` — shared-header uses `v=20260320b`. Same reasoning as above. Low risk but worth aligning.

---

## 4. Code Quality

**Status: LOW-LEVEL WARNING — ES5 style violations in a few files**

CLAUDE.md specifies ES5-compatible `var/function` style (no `let`/`const`/arrow functions) for production code.

**Violations found:**

| File | `let` | `const` | Arrows | Notes |
|------|-------|---------|--------|-------|
| `modular/js/main.js` | 0 | 3 | 0 | Lines 6, 15, 24 |
| `modular/js/app.js` | 0 | 0 | 2 | Lines 40, 147 |
| `modular/js/aa-mirror.js` | 0 | 0 | 0 | "let" appears only in a comment — false alarm, no actual violation |
| `modular/components/spoon-planner/spoon-pal.html` | 47 | 179 | 0 | Heavy ES6+; async/await also used |

`spoon-pal.html` is the most significant — it's written in modern ES6+ style throughout (226 declarations, async/await). This works fine on modern browsers but technically breaks the KISS/ES5 rule. If the app must support older Android browsers, this could become a problem. Flag for discussion.

**No deprecated patterns, no stale event listener stacks, no duplicate `onAuthStateChanged` registrations, no duplicate `onSnapshot` listeners found.**

`status-circle.js` properly cleans up `onSnapshot` listeners via `_unsubNope` / `_unsubDay` before re-subscribing — good pattern.

---

## 5. Archive Hygiene

**Status: WARNING — 17 misplaced archive files (carryover + new)**

These are backup files sitting outside `modular/archive/` in violation of the archiving rule. The 7 files flagged in the 2026-03-21 audit were not moved; additional ones are now counted.

**`modular/components/` root level (13 files):**
```
bad-brain-day.html.archive-20260226-firebase
recovery-mode.html.archive-20260226-spoonplan
recovery-mode.html.archive-20260227-clearplan
recovery-mode.html.archive-20260227-completed-class
recovery-mode.html.archive-20260227-fbclear
recovery-mode.html.archive-20260227-journal
recovery-mode.html.archive-20260227-journal-auth
recovery-mode.html.archive-20260227-journal-autosave
recovery-mode.html.archive-20260227-localsave
recovery-mode.html.archive-20260227-newday
recovery-mode.html.archive-20260227-newday2
recovery-mode.html.archive-20260227-newday3
recovery-mode.html.archive-20260227-nowatch
```

**`modular/components/message-system/` (3 files):**
```
message-system.html.archive-20260226
message-system.html.archive-20260226-rename
message-system.html.archive-20260227-draft-save
```

**`modular/static/` (1 file):**
```
utc-converter.html.archive-20260227-12hr
```

**Note:** `modular/js/archive/` contains 2 files (`mode-enforcer_2026-03-10_pre-audio-nav-fix.js`, `status-circle_2026-03-03_pre-rollingavg.js`). This is a local archive subfolder within js/ and is acceptable as a pattern, though ideally these would be in `modular/archive/` per the SOP.

**Git commands to move the misplaced archives (run in Git Bash — do NOT run automatically):**
```bash
# Move 13 component root archives
git mv modular/components/bad-brain-day.html.archive-20260226-firebase "modular/archive/bad-brain-day_2026-02-26_firebase.bak.html"
git mv modular/components/recovery-mode.html.archive-20260226-spoonplan "modular/archive/recovery-mode_2026-02-26_spoonplan.bak.html"
git mv modular/components/recovery-mode.html.archive-20260227-clearplan "modular/archive/recovery-mode_2026-02-27_clearplan.bak.html"
git mv modular/components/recovery-mode.html.archive-20260227-completed-class "modular/archive/recovery-mode_2026-02-27_completed-class.bak.html"
git mv modular/components/recovery-mode.html.archive-20260227-fbclear "modular/archive/recovery-mode_2026-02-27_fbclear.bak.html"
git mv modular/components/recovery-mode.html.archive-20260227-journal "modular/archive/recovery-mode_2026-02-27_journal.bak.html"
git mv modular/components/recovery-mode.html.archive-20260227-journal-auth "modular/archive/recovery-mode_2026-02-27_journal-auth.bak.html"
git mv modular/components/recovery-mode.html.archive-20260227-journal-autosave "modular/archive/recovery-mode_2026-02-27_journal-autosave.bak.html"
git mv modular/components/recovery-mode.html.archive-20260227-localsave "modular/archive/recovery-mode_2026-02-27_localsave.bak.html"
git mv modular/components/recovery-mode.html.archive-20260227-newday "modular/archive/recovery-mode_2026-02-27_newday.bak.html"
git mv modular/components/recovery-mode.html.archive-20260227-newday2 "modular/archive/recovery-mode_2026-02-27_newday2.bak.html"
git mv modular/components/recovery-mode.html.archive-20260227-newday3 "modular/archive/recovery-mode_2026-02-27_newday3.bak.html"
git mv modular/components/recovery-mode.html.archive-20260227-nowatch "modular/archive/recovery-mode_2026-02-27_nowatch.bak.html"
# Move 3 message-system archives
git mv "modular/components/message-system/message-system.html.archive-20260226" "modular/archive/message-system_2026-02-26.bak.html"
git mv "modular/components/message-system/message-system.html.archive-20260226-rename" "modular/archive/message-system_2026-02-26_rename.bak.html"
git mv "modular/components/message-system/message-system.html.archive-20260227-draft-save" "modular/archive/message-system_2026-02-27_draft-save.bak.html"
# Move 1 static archive
git mv "modular/static/utc-converter.html.archive-20260227-12hr" "modular/archive/utc-converter_2026-02-27_12hr.bak.html"
# Commit
git commit -m "Claude: Move 17 misplaced archive files to modular/archive/ per SOP"
git push
```

---

## 6. Redundancy Checks

**Status: SOLID — minor low-priority notes only**

### Error Handling Coverage
- `aa-firebase.js`: All Firestore writes either return their promise (allowing callers to `.catch()`) or have explicit `.catch(function() {})` best-effort wrappers. No unhandled promise explosions found.
- `checkin.html`: 1 fetch call (for shared-header), 5 `.catch()` blocks — covered.
- `audio-notes.html`: 8 fetch calls, 16 `.catch()` blocks — well covered.
- `spoon-pal.html`: Weather API calls are wrapped in `async function fetchWeather()` with a `try/catch` inside `getCurrentPosition()` callback and graceful "Weather data unavailable" fallback — GOOD.
- No unhandled promise chains detected on critical paths.

### Offline Fallbacks
- `checkin.html`: localStorage backup for check-in data is in place with quota-exceeded warning logged.
- `spoon-pal.html`: localStorage/session fallback in place.
- `aa-firebase.js`: Auth persistence uses IndexedDB with localStorage fallback documented.
- No pages identified that read from Firestore without any fallback.

### Retry Logic
- `_persistenceReady` has a built-in timeout retry (8s desktop / 15s mobile) — GOOD.
- `AA_REAUTH_COUNT` caps GIS re-auth retries at 3 per page load — GOOD.
- Critical auth operations have retry caps.

### Null/Undefined Guards
- All `doc.data().property` accesses in `aa-firebase.js` are inside `if (doc.exists)` blocks — GOOD.
- `doc.data().supportNetwork || {}` fallback pattern used consistently — GOOD.
- No unguarded property access on Firestore documents found.

### Race Condition Checks
- `onAuthStateChanged` is called 8 times in `shared-header.html` — this is a known multi-layered auth system (persistence, UI state, GIS, idle timeout). The `_persistenceReady` promise serializes them correctly. No race condition introduced.
- `status-circle.js` properly unsubscribes existing `onSnapshot` listeners before re-subscribing on auth change — GOOD.
- No race conditions identified in the new `streak-cat.html` (added 2026-03-21).

### Duplicate Listener Prevention
- `status-circle.js` uses `_unsubNope` / `_unsubDay` variables to track and cancel existing listeners before creating new ones — GOOD.
- No stacked event listeners found.

### Graceful Degradation
- Weather failure in spoon-pal fails gracefully with user-visible message.
- Audio Notes has 43 try/catch blocks — comprehensive coverage.
- Check-in has 6 try/catch blocks covering the main submission flow.

### Data Validation on Write
- `parseFloat()`, `parseInt()` with `|| 0` fallbacks used consistently before numeric Firestore writes in spoon-pal.
- Pain/fatigue values are validated before write: `parseInt(...) || 7`, `parseInt(...) || 5`.
- No `NaN` or `undefined` values likely to reach Firestore on active paths.

### Service Worker Staleness
- `sw.js` CACHE name `aa-shell-20260321u` is current.
- NEVER_CACHE list is comprehensive (9 entries covering all frequently-changing files).
- SW is registered only from `shared-header.html` — no duplicate registrations.

---

## 7. Misplaced Files & Stale Branches

**Status: HOUSEKEEPING NEEDED**

**Stale remote branch:**
- `origin/Brinckmyster-Aestas` — still present, last commit was a CAj SOP commit (not Claude work). This was flagged in the 2026-03-21 audit and is still not removed. **This branch is OFF-LIMITS to AI** per the task rules — Bruise must delete it manually if desired:
  ```bash
  git push origin --delete Brinckmyster-Aestas
  ```

**Root-level files of note (not blocking, informational):**
- `.fuse_hidden0000077f00000001` (3.2KB, modified 2026-03-20) — Linux FUSE filesystem artifact from a file that was open when the session ended. Not tracked by git, harmless, will disappear on next clean mount.
- `.claude.json.backup` (4KB, from 2026-02-21) — old backup of Claude config, not tracked by git. Harmless.

**No stale worktrees.** Only the main worktree at `[main]` exists.

---

## Action Items Summary

| Priority | Item | Status | Details |
|----------|------|--------|---------|
| **Medium** | Move 17 misplaced archive files | Carryover (3rd day) | See §5 — git commands provided |
| Low | Delete `origin/Brinckmyster-Aestas` branch | Carryover | Manual action by Bruise only |
| Low | Align all pages to `v=20260321` header | New | 42 pages on 20260320, streak-cat on 20260321 |
| Low | Bump aa-firebase.js + aa-mirror.js cache strings in nope-mode/semi-nope | New | Currently v=20260316a / v=20260319a; stale |
| Info | spoon-pal.html uses ES6+ style | Ongoing | 226 let/const, async/await — not ES5 |
| Info | main.js has 3 `const` | Low | ES5 spec says `var` only |
| Info | app.js has 2 arrow functions | Low | ES5 spec says `function` only |
| Info | Bump footer version string | Ongoing | When shared-footer.html is next edited |
| Info | 2 known TODOs from previous audits | Carryover | aa-firebase.js: Play Store role + transcription upgrade |

---

*Report generated by Claude — 2026-03-22*
