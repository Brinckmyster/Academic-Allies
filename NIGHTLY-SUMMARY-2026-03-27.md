# Nightly Deep Audit Summary — 2026-03-27

**Auditor:** Claude
**Scope:** Full codebase audit (all HTML pages, all JS files, icons, sw.js, git branches/worktrees)
**Branch:** main (commit 433ec81)
**Audit time:** ~2026-03-27 (automated scheduled task)

---

## Overall Health: GOOD — No Critical Issues

The app is functional and secure. Auth guards, mirror mode write-guards, and onSnapshot cleanup handles are all in good shape. No broken resource references. The issues below are all in the Warning or Housekeeping tier.

---

## CRITICAL ISSUES

None.

---

## WARNINGS

### W1 — 6 Stale Prunable Worktrees (Git Hygiene)

Six local worktrees remain in `C:/Users/brinc/Academic-Allies/.claude/worktrees/` and all are marked **prunable** with no unique commits ahead of main:

- `claude/confident-black`
- `claude/dazzling-maxwell`
- `claude/flamboyant-shannon`
- `claude/inspiring-brown`
- `claude/silly-pike`
- `claude/zealous-turing`

These are safe to prune. Run these commands when ready:

```bash
git worktree prune
git branch -D claude/confident-black claude/dazzling-maxwell claude/flamboyant-shannon claude/inspiring-brown claude/silly-pike claude/zealous-turing
```

---

### W2 — Misplaced React JSX File (Dead Code)

**File:** `modular/components/status-circle/status-circle.html`

This file is a React component (`import React from 'react'; const UserNotRegisteredError = () => { ... }`). It is:
- Not a valid HTML page
- Not linked from any navigation, index.html, or shared-header
- Incompatible with the vanilla JS / no-framework architecture
- Dead code — no user can reach it

It appears to have landed here by mistake (possibly from a Cowork artifact). It should be archived. When ready:

```bash
cp modular/components/status-circle/status-circle.html modular/archive/status-circle_2026-03-27_misplaced-react-component.bak.html
git rm modular/components/status-circle/status-circle.html
git commit -m "Claude: Archive misplaced React JSX stub in status-circle — dead code, not linked"
```

---

### W3 — ES6 Violations in bedroom-planner.html

**File:** `modular/components/bedroom-planner/bedroom-planner.html`

This page uses `const`, `let`, and arrow functions (`const ROOM = {...}`, `const def = id => ...`, `let placed={}`, etc.) throughout its script block. The project rule is ES5-compatible `var`/`function` style only. This page was last updated in commit `155a466` (Mar 25 audit batch) but the ES6 was not caught then.

Additionally: this page does not appear in any navigation link (index.html, shared-header.html, study-tools.html, or sitemap.html). It is functionally orphaned — a user cannot navigate to it through the UI.

**Action needed:** Either link it in the nav, or archive it. If keeping, convert to ES5 first. No git commands provided here since this requires a decision call.

---

### W4 — bedroom-planner.html Not in NEVER_CACHE or SHELL

Because bedroom-planner.html is in neither list, the service worker will cache it indefinitely on first visit (cache-first strategy with stale-while-revalidate). If the file is later updated, users may receive stale versions. If the page is kept and linked, add it to NEVER_CACHE.

---

### W5 — Cache-Bust Version Strings Are 2 Days Stale

All pages (index.html, all modular/*.html, all component/*.html) request shared-header with `?v=20260324`. The actual shared-header.html was updated and the footer/sw.js were bumped to `20260326` after that. The SW bypasses the cache for shared-header regardless of query string (it uses `url.pathname` for NEVER_CACHE matching, stripping the `?v=` part), so this is **not a functional bug**. However the version strings are misleading documentation. Low priority.

---

### W6 — study-notes.html Has No localStorage Offline Fallback

**File:** `modular/components/study-notes/study-notes.html`

The page reads and writes to Firestore (class notes, study notes collections) and has solid `.catch()` coverage on all Firestore operations. However, unlike calendar.html and meal-planner.html, there is no `localStorage` read-first or write-backup pattern. If the user is offline, the page will simply show empty content with a logged error — no cached data surfaced.

Since study-notes.html IS in NEVER_CACHE (fetched fresh), this means the page is also more exposed to offline failure than cached pages. Low urgency but worth adding a draft/cache layer for the notes list in a future session.

---

## HOUSEKEEPING ITEMS

### H1 — 5 Duplicate Home Icon Formats

`modular/icons/` contains: `home.jpeg`, `home.jpg`, `home.png`, `home.svg`, `home.webp`. Only `home.png` is referenced in shared-header.html. The other four variants appear to be leftover from format testing. Consider archiving the unused formats when it's convenient.

---

## CHECKS THAT PASSED ✓

- **Broken resources**: All icons referenced in shared-header.html and index.html exist on disk. No 404-prone image or script paths found.
- **Broken fetch() paths**: All `fetch('/Academic-Allies/modular/shared-header.html?v=...')` calls reference a valid file. No dead fetch targets.
- **Mirror mode write guards**: Properly implemented across checkin, spoon-planner, spoon-pal, user-tiers, support-dashboard, message-system, nope-mode, semi-nope. Guard pattern `if (window.AA_MIRROR_UID && !window.AA_MIRROR_CAN_WRITE) return;` found consistently.
- **Auth gate coverage**: All Firestore-reading pages use `AA.auth.onAuthStateChanged()` or the `_waitBoot()` pattern. No page skips auth before reading user data.
- **Error handling**: Good `.catch()` coverage on all key pages audited (meal-planner, audio-notes, support-dashboard, checkin-log, calendar, message-system). No critical unhandled promise chains found.
- **Null/undefined guards**: `||{}`, `||null`, `||''`, `isNaN()` guards present on Firestore read paths in checkin.html and spoon-planner. Spoon math has explicit NaN protection (commit 091f1a2 fix).
- **onSnapshot cleanup**: message-system, user-tiers, support-dashboard, and spoon-planner all use named unsub handles (`unsubMessages = null`, `_unsubStatusNope = null`, etc.) and clean up before re-subscribing.
- **Duplicate listener prevention**: No stacking onAuthStateChanged calls found. The two in semi-nope.html are for separate purposes (main auth + config loading) and use the `_waitBoot()` guard pattern.
- **NEVER_CACHE completeness**: All actively-changing pages (audio-notes, spoon-planner, support-dashboard, user-tiers, message-system, calendar, checkin, recovery-mode, etc.) are in the NEVER_CACHE list. sw.js is at `aa-shell-20260326c`.
- **Archive hygiene**: No `.bak` files found outside `modular/archive/`. Archive directory is clean and properly organized (1,458 files — all correctly named).
- **ES5 compliance**: All core files (aa-firebase.js, aa-mirror.js, mode-enforcer.js, mode-gate.js, dark-mode.js, status-circle.js, student-config.js, study-activity.js) are clean ES5. bedroom-planner.html is the only outlier.
- **Data validation on write**: spoon-planner validates NaN/undefined before Firestore writes. checkin.html uses `|| null` and `|| ''` guards on all entry fields.
- **Graceful feature degradation**: Each page wraps its feature init in `.catch()` that shows user-facing messages rather than crashing the page.
- **Service worker staleness**: CACHE name `aa-shell-20260326c` reflects the most recent change (support-dashboard quiet alert window). NEVER_CACHE list is comprehensive.
- **Remote branch safety**: `remotes/origin/Brinckmyster-Aestas` untouched. No audit actions were taken against it.

---

## SUMMARY TABLE

| Category | Status | Count |
|---|---|---|
| Critical issues | ✅ None | 0 |
| Warnings | ⚠️ See above | 6 |
| Housekeeping | 🧹 Minor | 1 |
| Checks passed | ✅ All clear | 14 |

---

*Claude — automated nightly audit, 2026-03-27*
