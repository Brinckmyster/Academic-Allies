# Nightly Deep Audit — 2026-04-07

**Auditor:** Claude
**Scope:** Full codebase audit of Academic Allies
**Files scanned:** 71 active HTML files, 22 active JS files, 1,706 archive items
**SW cache version:** `aa-shell-20260406d`
**Shared-header cache-bust:** `v=20260402` (consistent across all pages except W6 below)
**New commits since last audit (2026-04-05):** 6 (Spider Solitaire, FreeCell, Klondike Solitaire, Quick Send templates rewrite, SW pre-cache of solitaire games, nightly audit commit)

---

## CRITICAL ISSUES

*No new critical issues found today.*

---

## WARNINGS

### W1. `.fuse_hidden0000077f00000001` still git-tracked (carry-over — 8th audit)

This Linux FUSE filesystem artifact remains tracked by git and will appear in the public GitHub Pages repository. It is still in `.gitignore` but was committed before the ignore rule was added. No change since last audit.

**Fix (DO NOT RUN — for Bruise to execute):**
```bash
git rm --cached .fuse_hidden0000077f00000001
git commit -m "Claude: Remove tracked FUSE artifact .fuse_hidden0000077f00000001"
git push
```

---

### W2. Stale worktrees expanded: now THREE prunable branches (carry-over, worsened)

`git worktree list` shows **three prunable local worktrees** — up from two in the prior audit:
- `claude/affectionate-panini` at `77a7823` (prunable)
- `claude/determined-albattani` at `ef1dfad` (prunable) ← **new since 2026-04-05**
- `claude/quizzical-stonebraker` at `77a7823` (prunable)

All three branches are fully merged into `main`. No unmerged work will be lost.

**Fix (DO NOT RUN — for Bruise to execute):**
```bash
git worktree prune
git branch -D claude/affectionate-panini claude/determined-albattani claude/quizzical-stonebraker
```

---

### W3. `nope-mode.html` and `semi-nope.html` — `AA_CONFIG.load()` without `.catch()` (carry-over)

Both files call `window.AA_CONFIG.load(uid).then(...)` to apply card layout config without a `.catch()`. If config load fails (network error, offline, Firestore rule rejection), the promise rejects silently — no user feedback, no console warning. `bad-brain-day.html` had this same issue and was fixed on 2026-03-25. The same one-line fix is needed here.

**Affected lines:**
- `modular/nope-mode.html` — line 654
- `modular/semi-nope.html` — line 588

**Fix pattern:**
```js
window.AA_CONFIG.load(uid).then(function() {
  var cardsCfg = window.AA_CONFIG.get('modes.cards.nope', null);
  if (cardsCfg && Array.isArray(cardsCfg)) { _applyCardLayout(cardsCfg); }
}).catch(function(err) { console.warn('[NopMode] Card config load failed:', err.message || err); });
```

---

### W4. `spoon-planner.html` — acknowledged duplicate `onAuthStateChanged` listeners (carry-over)

Two active listeners: `_waitForFirebase()` (line ~641) and `_initSuggestions()` (line ~1301). Both fire on every auth state change. Low risk (deduplication guards exist), but flagged for future cleanup consolidation.

---

### W5. `reaction-time.html` — dynamic cache version variable (carry-over)

`modular/components/brain-check/reaction-time.html` line 494 defines `var cacheVersion = '20260402'` and builds the shared-header URL from it — unlike all other pages which hardcode the version string. Current value matches all live pages. No bug today, but this file is at risk of being missed during future cache-bust bumps.

---

### W6. ⚠️ NEW: `templates.html` — missing cache-bust version on shared-header fetch

The Quick Send templates page added in commit `32681c8` (2026-04-06) fetches shared-header without a version query string:

```js
// templates.html line 209 — CURRENT (incorrect):
fetch("/Academic-Allies/modular/shared-header.html")

// SHOULD BE:
fetch('/Academic-Allies/modular/shared-header.html?v=20260402')
```

All other 70 live HTML pages use `?v=20260402`. This is the only exception. Without the version string, browsers and the SW may serve a stale shared-header after future updates.

---

### W7. ⚠️ NEW: `templates.html` — ES5 violations (`Array.from` and NodeList `.forEach`)

Same two ES2015 patterns that were previously fixed in `bedroom-planner.html`, `floral-fill-blank.html`, and six other static pages — but reintroduced in the Quick Send rewrite:

1. `Array.from(o.attributes).forEach(...)` — `Array.from` is ES2015. Fix: `[].slice.call(o.attributes).forEach(...)`
2. `scripts.forEach(function(o){` — calling `.forEach()` directly on a `NodeList` is ES2015. Fix: `[].slice.call(scripts).forEach(function(o){`

**Location:** `modular/components/templates/templates.html` lines 215–217

The project explicitly targets ES5 compatibility for older Android WebViews. This is consistent with the fix pattern applied to many other files since March 2025.

---

### W8. ⚠️ NEW: `templates.html` — not in `NEVER_CACHE`

`templates.html` uses shared-header (loaded via `fetch`) and was just rewritten (commit `32681c8`, 2026-04-06). It is not in `NEVER_CACHE` and not in `SHELL`. Since it's not in SHELL, pre-caching is not an issue — but it should be added to NEVER_CACHE to ensure the SW never serves a stale copy after future edits. This page is actively developed.

---

## HOUSEKEEPING

### Uncommitted working-tree changes (low urgency)

`git status` shows several unstaged/untracked items that predate this audit run:

- **Modified (tracked):** `docs/NIGHTLY-SUMMARY-2026-04-04.md` — has local edits not committed
- **Modified (tracked):** `modular/archive/templates.html.2026-04-06.bak` — archive file with local changes
- **Modified (tracked):** `modular/components/comfort-games/emoticon-defense.html` — touch target fix from 2026-04-05 (`min-height: 44px` on `.ed-back` mobile selector) not yet committed
- **Untracked:** `modular/archive/NIGHTLY-SUMMARY-2026-04-04_pre-second-run.bak.md`
- **Untracked:** `modular/archive/ball-sort_2026-04-05_pre-top-render.bak.html`
- **Untracked:** `modular/archive/emoticon-defense_2026-04-05_pre-back-touch.bak.html`
- **Untracked:** `modular/archive/freecell_2026-04-06_pre-bugfix.bak.html`
- **Untracked:** `modular/components/templates/archive/` (directory)

The `emoticon-defense.html` change is a solid a11y fix (44px touch target on back button) that should be committed. The archive files should be staged. The `NIGHTLY-SUMMARY-2026-04-04.md` modification is worth reviewing before committing.

**Optional cleanup commit (DO NOT RUN — for Bruise to execute):**
```bash
git add modular/components/comfort-games/emoticon-defense.html
git add modular/archive/ball-sort_2026-04-05_pre-top-render.bak.html
git add modular/archive/emoticon-defense_2026-04-05_pre-back-touch.bak.html
git add modular/archive/freecell_2026-04-06_pre-bugfix.bak.html
git add "modular/components/templates/archive/"
git commit -m "Claude: Commit emoticon-defense touch target fix + archive backups from prior sessions"
```

---

### New solitaire games — clean integration confirmed

All three new solitaire games added in 2026-04-06 commits (klondike, spider, freecell) are correctly:
- Added to `NEVER_CACHE` in `sw.js`
- Pre-cached in `SHELL` for offline access
- No ES6 violations in `klondike.html` or `freecell.html`
- No Firebase writes in any of the three games (no mirror guard needed)
- SW cache version bumped to `aa-shell-20260406d`

---

### Floral games — Firebase write without mirror guard (informational)

`floral-fill-blank.html` and `floral-match-game.html` both write to Firebase (`messages` collection for quiz reports) and have no `AA_MIRROR_UID` guard. However: (1) neither file is reachable via the shared-header navigation; (2) both include `aa-firebase.js` and are implicitly student-context tools; (3) the write is a quiz-report message, not student health data. Risk is low but noted. No action required unless these pages become accessible to mirror/supporter users.

---

### `seed-mary-contacts.html` — email-based auth guard (informational)

`modular/static/seed-mary-contacts.html` checks `brinckmyster@gmail.com` for authorization rather than using role/tier-based access. Per CLAUDE.md ("Do not use email addresses as permission checks"). However this is a one-time admin seeding tool (`<p>One-time admin tool.</p>`) with a manual run button, not a live user-facing feature. Extremely low risk. Flagged for awareness only.

---

### Archive count growth

Archive directory now contains **1,706** entries (up from 1,684 at last audit). Consistent with active development. All archives confirmed inside `modular/archive/` hierarchy.

The archive also contains some non-standard filenames (older entries from pre-SOP era):
- Files with `.archive-*` suffix instead of `.bak.ext` (covered by `.gitignore`)
- Files with `.backup` or `.broken` suffixes
- Double-bak files (`.bak.bak-*`)

These are all in `modular/archive/` and non-standard names only. No action required — they're gitignored where needed and don't affect live code.

---

### `aa-firebase.js` — three `onAuthStateChanged` listeners

Three `auth.onAuthStateChanged` calls exist in `aa-firebase.js`:
1. Line 132 — persistence initialization (one-shot, unsubscribes after first fire)
2. Line 504 — primary auth handler (the main listener)
3. Line 1939 — audit queue flush (fires once on sign-in to drain any queued entries)

All three are intentional per the comment at line 14 of the file which documents the full listener inventory. No action needed.

---

### `Brinckmyster-Aestas` branch

Not touched. Not read. Last remote commit `bf3a655` noted at a distance. Untouched as required.

---

## AUDIT RESULTS BY CATEGORY

### 1. Broken Resources
**Status: PASS**

All NEVER_CACHE paths (64 entries) and SHELL paths verified against the filesystem — all files present on disk. All JS files referenced in `shared-header.html` confirmed present. All shared-header nav link targets exist. No broken script or CSS references detected. `calendar.html` is a redirect stub (no shared-header load is correct). No missing favicon or manifest files.

### 2. Auth & Security
**Status: PASS with minor warnings (W3, W4)**

`_mirrorWriteBlocked()` helper guards all exported Firebase write functions in `aa-firebase.js`. Mirror guard pattern confirmed in all live write-capable pages. `onAuthStateChanged` invoked via `AA.auth` throughout — no competing Firebase listener created independently. `admin.html` has 11 Firestore write operations but they are all gated behind email-checked admin authentication (not mirror-accessible). No unprotected writes to student health data. W3 (`nope-mode.html`/`semi-nope.html` config `.catch()` gap) remains the only open auth/error-handling gap.

### 3. Cache Consistency
**Status: WARNING (W6, W8)**

SW cache `aa-shell-20260406d` is current and includes all three new solitaire games. Shared-header `v=20260402` consistent across 70 of 71 live pages. The one exception is `templates.html` (W6) which lacks a cache-bust version string. `templates.html` is also missing from NEVER_CACHE (W8). `reaction-time.html` uses a dynamic variable for version (W5, carry-over) — current value still matches all live pages, no active bug.

### 4. Code Quality — ES5 Compliance
**Status: WARNING (W7)**

`templates.html` contains two ES2015 violations: `Array.from()` and NodeList `.forEach()` (W7). These are the same patterns fixed in eight other files since March 2025. All other live files pass ES5 compliance. No `let`, `const`, arrow functions, template literals, or class declarations in active code across the remaining 70 files — all grep hits were inside code comments, archive annotations, or template text strings (e.g., `let me know`, `let us help`).

### 5. Archive Hygiene
**Status: PASS**

All `.bak` files confirmed inside `modular/archive/` hierarchy. No dot-file archives. No `.FIX`/`.NEW` files outside archive. No archives placed next to source files. 1,706 total entries growing consistently. Some older non-standard naming conventions exist (pre-SOP era) but all are inside the archive directory and gitignored.

### 6. Redundancy — Error Handling, Null Guards, Race Conditions
**Status: PASS with minor warning (W3)**

All active Firestore `.set()`/`.update()`/`.add()` calls in live component files verified to have `.catch()` handlers. SW offline fallback to `offline.html` verified. localStorage reads wrapped in try-catch. The `nope-mode.html`/`semi-nope.html` `AA_CONFIG.load()` missing `.catch()` (W3) is the only confirmed gap. No new race conditions or missing null guards detected. New solitaire games are purely client-side with no async Firebase calls.

### 7. Misplaced Files / Repo Root Hygiene
**Status: WARNING (W1 carry-over)**

Repo root contains only expected files. Only misplaced tracked file remains `.fuse_hidden0000077f00000001` (W1 — 8th audit, pending Bruise running the fix command). `.github/` workflows are expected. `static.yml.PAUSED` is an intentionally-paused workflow, not a stray file. `package.json`/`package-lock.json` are minimal stubs for Firebase tooling. `offline.html` and `404.html` are GitHub Pages requirements.

---

## RECOMMENDED COMMANDS

### Priority 1 — Fix ES5 violations in templates.html (W6, W7, W8)
*(DO NOT RUN — for Bruise to execute after Claude makes the edits)*
```bash
git add modular/components/templates/templates.html
git add sw.js
git commit -m "Claude: Fix templates.html — ES5 compat, cache-bust version, add to NEVER_CACHE"
git push
```

### Priority 2 — Commit uncommitted working-tree changes (Housekeeping)
*(DO NOT RUN — for Bruise to execute)*
```bash
git add modular/components/comfort-games/emoticon-defense.html
git add "modular/archive/ball-sort_2026-04-05_pre-top-render.bak.html"
git add "modular/archive/emoticon-defense_2026-04-05_pre-back-touch.bak.html"
git add "modular/archive/freecell_2026-04-06_pre-bugfix.bak.html"
git add "modular/components/templates/archive/"
git commit -m "Claude: Stage emoticon-defense touch target fix + prior-session archive backups"
git push
```

### Priority 3 — Fix nope/semi-nope missing .catch() (W3)
*(DO NOT RUN — for Bruise to execute after Claude makes the edits)*
```bash
git add modular/nope-mode.html modular/semi-nope.html
git commit -m "Claude: Add .catch() to AA_CONFIG.load() in nope-mode + semi-nope"
git push
```

### Priority 4 — Clean up stale worktrees and branches (W2)
*(DO NOT RUN — for Bruise to execute)*
```bash
git worktree prune
git branch -D claude/affectionate-panini claude/determined-albattani claude/quizzical-stonebraker
```

### Priority 5 — Remove tracked FUSE artifact (W1)
*(DO NOT RUN — for Bruise to execute)*
```bash
git rm --cached .fuse_hidden0000077f00000001
git commit -m "Claude: Remove tracked FUSE artifact .fuse_hidden0000077f00000001"
git push
```
