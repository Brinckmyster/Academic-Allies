# Nightly Deep Audit — Academic Allies
**Date:** 2026-03-08
**Time:** ~21:00 CST (post-evening commits)
**Audited by:** Claude

---

## ⚠️ CRITICAL ISSUES SUMMARY

| # | File | Issue |
|---|------|-------|
| 1 | `modular/components/modes/modes_assignment.html` | 5 broken image paths — all icons use `icons/` (relative), but icons are in `../../icons/` |
| 2 | `modular/components/bad-brain-day.html` | Broken icon path `../../icons/mode-bad-brain-day.jpg` resolves to non-existent `/icons/` (root level); correct path is `../icons/` |

---

## Summary

| Category | Status | Pass | Warning | Critical |
|----------|--------|------|---------|----------|
| Broken Images | ⚠️ | 84 OK | — | **6 broken** |
| Dead Links / Missing Files | ✅ | — | 1 | 0 |
| JavaScript Issues | ✅ | All OK | 0 | 0 |
| Auth & Firebase | ✅ | Consistent | 3 info | 0 |
| Archive Compliance | ⚠️ | — | **4 files** | 0 |
| CSS / Layout | ✅ | OK | 0 | 0 |

**Total: 2 CRITICAL, 5 WARNING, 3 INFO**

---

## 1. Broken Image Check

### Flower Images (Priority)
- **flowers.json** is present and correctly structured
- **481 files** exist in `modular/icons/flowers/` (includes non-image utility files)
- All **441 images** referenced in `flowers.json` were verified to exist on disk ✅
- `recovery-mode.html` loads flowers via `fetch("../icons/flowers/flowers.json")` — path resolves correctly ✅

### Non-Flower Image Broken References

**CRITICAL — `modular/components/modes/modes_assignment.html`**

This file is at `modular/components/modes/` and references icons with the path `icons/MODE.png` (no `../`). These resolve to the non-existent folder `modular/components/modes/icons/`. The actual files are in `modular/icons/`. Five images broken:

- `icons/mode-normal-outline.png` → should be `../../icons/mode-normal-outline.png`
- `icons/mode-bad-brain-day.jpg` → should be `../../icons/mode-bad-brain-day.jpg`
- `icons/mode-nope-button.png` → should be `../../icons/mode-nope-button.png`
- `icons/mode-semi-nope-extra-n-odd.png` → should be `../../icons/mode-semi-nope-extra-n-odd.png`
- `icons/mode-recovery.png` → should be `../../icons/mode-recovery.png`

**CRITICAL — `modular/components/bad-brain-day.html`**

This file is at `modular/components/` and references:
- `<link rel="icon" href="../../icons/mode-bad-brain-day.jpg">` — resolves to `/icons/mode-bad-brain-day.jpg` at the repo root (doesn't exist there)
- `<img src="../../icons/mode-bad-brain-day.jpg">` — same broken path

The file is at `modular/components/`, so `../icons/` would be correct (resolves to `modular/icons/`), not `../../icons/`.

---

## 2. Dead Links / Missing Files

**WARNING — `modular/icon-gallery.html`**: References `favicon.ico` as a relative path (resolves to `modular/favicon.ico`) — that file doesn't exist. The favicon does exist at the repo root (`/favicon.ico`). This is only the icon-gallery page which is a dev/utility page (not in main nav), so low-impact.

**Shared-header fetch path**: All active pages fetch `shared-header.html?v=20260307a` or `?v=20260308a` (audit-log). `shared-header.html` exists ✅. No broken fetch paths found.

**INFO — Version string inconsistency on `aa-firebase.js`:**
- `bad-brain-day.html` loads `aa-firebase.js?v=20260226f` (old)
- `spoon-planner.html` loads `aa-firebase.js?v=20260226e` (old)
- Most pages load `aa-firebase.js` with no version or via shared-header's `AA_JS` variable

These old version strings don't break anything (GitHub Pages ignores query strings on JS files served locally), but they're inconsistent and could cause confusion.

---

## 3. JavaScript Error Scan

- **Brace/paren balance**: All 41 active HTML files checked — all script blocks have balanced `{}` and `()` ✅
- **AA method calls**: Every method called via `AA.methodName()` in pages is defined in `aa-firebase.js` ✅ (no undefined method calls found)
- **`use strict` usage**: Present in `index.html`, `audio-notes.html`, `audit-log.html`, `calendar.html`, `spoon-pal.html`. No function declarations inside `if` blocks detected ✅

**INFO — Unused AA exports** (defined but never called from HTML — not errors, may be called elsewhere or reserved):
`AA.FieldValue`, `AA.Timestamp`, `AA._currentRole`, `AA.auth`, `AA.canEditStudentProfile`, `AA.db`, `AA.getLastUser`, `AA.getMealLog`, `AA.getSpoonPal`, `AA.isNetworkLeadFor`, `AA.saveMealBasePlan`, `AA.saveSpoonPal`, `AA.watchCheckins`, `AA.watchSpoonPal`, `AA.watchSpoonPlan`, `AA.watchStudentProfile`

Note: Some of these (like `AA.auth`, `AA.db`) are accessed as properties, not called as functions, which is why they don't show up in function-call scanning.

---

## 4. Auth & Firebase Consistency

**Auth flow** (`shared-header.html`): Consistent — `onAuthStateChanged` is properly set up after `setPersistence()`, redirect result handling in place, access-denied overlay works, grace period logic present ✅

**`window.AA` exports match page expectations**: All methods used by pages are exported ✅

**Firestore paths in `aa-firebase.js`**: Consistent use of `users`, `checkins`, `mealPlans`, `mealLogs`, `nope`, `flowerQuiz`, `pendingUsers`, `networkChat` ✅

**Direct Firestore calls in pages** (bypassing AA helpers): Only in `audio-notes.html` (notes collection) and `message-system.html` (messages/msgs/dms/networkChat) — these are specialized collections not covered by AA helpers. Appears intentional ✅

**Mirror mode (`AA_MIRROR_UID`)**: Checked across all component pages:
- `checkin.html`, `checkin-log.html`, `calendar.html`, `meal-planner.html`, `audio-notes.html`, `message-system.html`, `recovery-mode.html`, `spoon-planner.html`, `spoon-pal.html` — all handle mirror mode ✅
- `modes.html`, `bad-brain-day.html` — loaded as iframes/components; mirror is handled by parent context

**INFO — Hardcoded email addresses in active files:**
- `recovery-mode.html` (lines 582, 739, 815): `dorothy.brinck@gmail.com` — hardcoded bypass for mirror-write restriction. This works but is a fragile pattern (if email changes, logic breaks).
- `recovery-mode.html` (line 982) and `nope-mode.html` (line 451): `mbrinck90@gmail.com` — similar hardcoded bypass

These aren't bugs but are worth flagging as maintenance risks.

---

## 5. Archive Compliance

**Recent commits today (2026-03-08) and their archive status:**

| File Modified | Commit | Archive Created? |
|---|---|---|
| `modular/aa-firebase.js` | `947cff3` (audit log rework) | ⚠️ **NO 20260308 archive found** (last archive: `aa-firebase.js.archive-20260306-pre-visreauth`) |
| `modular/components/audit-log/audit-log.html` | `947cff3` | ✅ `modular/archive/audit-log.20260308.bak.html` |
| `modular/js/status-circle.js` | `947cff3` | ⚠️ **NO 20260308 archive found** (last archive: `status-circle.js.archive-20260303-pre-compliance-fixes` in modular/js/) |
| `modular/shared-header.html` | `38ab996` (auth race fix) | ⚠️ **NO 20260308 archive found** (last archive: `shared-header.html.archive-20260307-pre-flex-revert`) |
| `modular/components/audio-notes/audio-notes.html` | `38ab996` + `5f333dc` | ⚠️ **NO 20260308 archive found** (last archive: `audio-notes.html.archive-20260307-pre-refresh-safety`) |

**Note:** These files are all tracked in git, so the previous versions are recoverable. But per the project's own archiving SOP, a pre-change archive should exist in the file system before each modification.

**Older files — archive compliance looks good** for earlier dates. The archive directory is healthy with consistent naming conventions.

---

## 6. CSS / Layout Quick Check

**External CSS files:**
- `modular/css/style.css` — 78 lines, braces balanced ✅, has mobile `@media` queries ✅
- `modular/components/meal-planner/meal-planner.css` — 78 lines, braces balanced ✅, has mobile `@media` queries ✅

**Inline CSS in components:** Spot checks on `recovery-mode.html` and `spoon-planner.html` show `@media`, `max-width`, `overflow`, and `min-height` usage — both have mobile-responsive styles ✅

**Shared-header:** Uses `touchstart` event listener for activity tracking ✅

No obvious CSS issues detected.

---

## Action Items (Suggestions — No fixes made, per audit-only protocol)

1. **[CRITICAL]** Fix image paths in `modes_assignment.html` — change `icons/` to `../../icons/`
2. **[CRITICAL]** Fix image path in `bad-brain-day.html` — change `../../icons/` to `../icons/`
3. **[WARNING]** Create missing archives for today's changes: `aa-firebase.js`, `status-circle.js`, `shared-header.html`, `audio-notes.html`
4. **[WARNING]** Fix `icon-gallery.html` favicon link (minor — dev-only page)
5. **[INFO]** Consider updating `aa-firebase.js` version strings in `bad-brain-day.html` and `spoon-planner.html` for consistency
6. **[INFO]** Consider replacing hardcoded email bypasses in `recovery-mode.html` with a more maintainable approach (e.g., admin flag in Firestore)

---

*Audited by Claude — 2026-03-08*
