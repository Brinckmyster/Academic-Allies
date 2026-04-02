# Nightly Audit — 2026-04-01
<!-- Claude: 2026-04-01 — Automated nightly deep audit -->

## CRITICAL ISSUES

### C1 — brain-bloom.html is TRUNCATED (uncommitted working copy)
**File:** `modular/components/brain-bloom/brain-bloom.html`
**Status:** Working copy is 8 lines shorter than HEAD. The file is missing its closing
`})(); </script> </body> </html>` block and the `onAuthStateChanged` init that loads
history from Firestore. This means Brain Bloom currently **does not load saved scores**
and **the HTML document is malformed**.

The archive backup exists at:
`modular/archive/brain-bloom_2026-04-01_pre-mirror-guard.bak.html`

The mirror guard added in the working copy (`if (window.AA_MIRROR_UID && !window.AA_MIRROR_CAN_WRITE) return;`)
is a good fix, but the edit went wrong and dropped the closing code. The fix needs to
be re-applied to HEAD cleanly.

**Recommended action:** Restore from HEAD and reapply the mirror guard manually.
```
git checkout HEAD -- modular/components/brain-bloom/brain-bloom.html
```
Then re-add the mirror guard at the top of `_saveToFirestore()`.

---

### C2 — recovery-mode.html is TRUNCATED at end (pre-existing — in HEAD too)
**File:** `modular/components/recovery-mode.html`
**Status:** Both HEAD and working copy end mid-string on the last line:
```
'🌿 Recovery Mode activated at ' + new Date().toLocaleTimeString([], { hour: '
```
The notification code is cut off. The `/* Claude: 2026-03-21 — Write mode to` comment and
all code after it is missing. The `</script></body></html>` closing tags are absent.

This file has been truncated since at least the 2026-03-21 era and was never caught.
The notification likely fails silently (uncaught syntax error at page end) but the main
recovery mode features still function because the truncation is in the last inline
`<script>` block.

**Recommended action:** This needs a dedicated fix session — restore from the most recent
pre-truncation backup or reconstruct the missing end of file. Check:
`modular/archive/recovery-mode_2026-04-01_pre-mirror-guard.bak.html` — may also be truncated.
Earliest clean backup may be needed.

---

## WARNINGS

### W1 — Missing mirror guards in 3 new brain-check games
The following files have Firestore `.set()` calls **without** a mirror write guard:
- `modular/components/brain-check/simon-says.html` — `_saveToFirestore()` at line 621
- `modular/components/brain-check/reading-check.html` — `_saveToFirestore()` at line 578
- `modular/components/brain-check/pattern-spotter.html` — `saveResults()` at line 732
  (pattern-spotter uses `AA_MIRROR_UID` as the uid, which writes a score to the *student's*
  Firestore doc when a supporter is viewing — wrong behavior)

Add `if (window.AA_MIRROR_UID && !window.AA_MIRROR_CAN_WRITE) return;` as the first
line in each save function.

---

### W2 — bedroom-planner.html missing from sw.js NEVER_CACHE
**File:** `sw.js`
**Details:** `modular/components/bedroom-planner/bedroom-planner.html` was added to
`NEVER_CACHE` in commit `e016f4c` (2026-03-27) but was dropped when subsequent sw.js
edits for comfort games rewrote the file without preserving that entry.

bedroom-planner is neither in NEVER_CACHE nor SHELL. It will be served from browser
HTTP cache with no SW control — stale code risk.

**Fix:** Add to NEVER_CACHE:
```javascript
'/Academic-Allies/modular/components/bedroom-planner/bedroom-planner.html', /* Claude: 2026-04-01 — re-add: was dropped in 2026-03-31 rewrite */
```

---

### W3 — 45 pages still using shared-header v=20260330 (should be 20260401)
The 4 new brain-check/game files added on 2026-04-01 use `v=20260401` for the
shared-header fetch, but all 45 older pages still reference `v=20260330`. Since
shared-header is in NEVER_CACHE, this technically doesn't cause stale content but
it creates inconsistency and confuses debugging. Should be bumped uniformly.

---

### W4 — 3 pages still reference aa-firebase.js?v=20260323
Pages still on the outdated version string:
- `modular/components/bad-brain-day.html` (line 540)
- `modular/nope-mode.html` (line 257)
- `modular/semi-nope.html` (line 273)

aa-firebase.js is in NEVER_CACHE so stale serving is not the risk; however these
version strings should be bumped to match the latest (shared-header.html loads
aa-firebase dynamically at `v=20260330`).

---

### W5 — 4 component HTML files have no sw.js coverage
The following files appear in no NEVER_CACHE or SHELL entry:
- `modular/components/student-config/mary-crossword-floral.html`
- `modular/components/student-config/mary-wordsearch-cooking.html`
- `modular/components/templates/accommodation-request.html`
- `modular/components/templates/counselor-outreach.html`
- `modular/components/templates/network-invite.html`
- `modular/components/templates/templates.html`

These are specialty/static pages — templates do not change often and the crossword/
wordsearch are standalone study tools. Adding them to NEVER_CACHE would be cleaner
than letting them fall through to browser HTTP cache.

---

### W6 — 4 badge icons referenced in user-tiers.html are MISSING
The file `modular/components/user-tiers/user-tiers.html` references:
- `/Academic-Allies/modular/icons/badge-network-lead.png`
- `/Academic-Allies/modular/icons/badge-family.png`
- `/Academic-Allies/modular/icons/badge-support.png`
- `/Academic-Allies/modular/icons/badge-nearby-help.png`

None of these files exist in `modular/icons/`. The tier role icons (`icon-user-*.png`)
exist and load fine. The "badge" variants appear to be referenced but never uploaded.
Broken image elements will show on the user-tiers page for supporters. The role icons
are used as fallback in most rendering paths, so impact may be limited to specific UI states.

---

### W7 — Stale prunable worktrees (4 branches)
Git worktree list reports 4 prunable entries:
- `claude/blissful-burnell`
- `claude/loving-lamarr`
- `claude/mystifying-yalow`
- `claude/vigilant-shockley`

These branches point to non-existent worktree locations (Windows paths not visible
from the Linux sandbox). They are stale and should be pruned.

---

### W8 — Uncommitted working copy changes (not committed to main)
4 files have uncommitted modifications:
- `index.html` — adds `r.ok` check before `r.text()` in header fetch (good fix)
- `modular/aa-firebase.js` — adds error handling + input validation to several
  suggestion functions (good fixes: C2 fix per last session)
- `modular/components/brain-bloom/brain-bloom.html` — **BROKEN** (see C1 above)
- `modular/components/recovery-mode.html` — adds 2 mirror guards (good fixes)

Also: `modular/components/comfort-games/ziMPa4QJ` is an untracked zip file — this is
the js-dos game bundle used by `secret-agent.html` (it expects
`secret-agent.jsdos` not `ziMPa4QJ`). The filename is wrong or it is a temp file from
an incomplete upload. The secret-agent.html page references `secret-agent.jsdos` —
this file does not exist under that name.

---

## HOUSEKEEPING

### H1 — Archive directory contains non-standard filenames
The following items in `modular/archive/` do not follow the standard naming convention
(`FILENAME_YYYY-MM-DD_descriptor.bak.ext`):
- `HEAD.lock.bak` + 11 numbered variants — git lock file backups, not code; safe to ignore
- `LICENSE` — a copy of the LICENSE file; harmless but confusing
- `backups/` subdirectory — contains old git repo snapshots from 2025-09; should stay
- `components-audio-notes/`, `components-bad-brain-day/`, etc. — subdirectory archives;
  these appear to be orphaned backup directories with no clear naming context
- `aa-firebase.js.bak-2026-02-21` and `.bak.bak-2026-02-21` — double-bak naming
- `universal-suggestor.js.bak.bak` and `universal-suggestor-local.bak.bak` — double-bak

None of these block anything, but the archive/ directory now has 1,658 files and is
growing. Recommend periodic review.

### H2 — `.fuse_hidden0000077f00000001` in repo root
This is a Linux FUSE temporary file. It is not tracked by git but lives in the repo root.
It is created by the mount system and will disappear on unmount. Not actionable.

### H3 — bad-brain-day.html in SHELL (pre-cached) but not NEVER_CACHE
bad-brain-day.html is in `SHELL` for offline pre-caching, but not in `NEVER_CACHE`.
It has been modified infrequently (last change was the comprehensive audit batch). This
is an acceptable trade-off — if it starts changing more often, move to NEVER_CACHE.

### H4 — 395 `.then()` calls across modular HTML files
Manual spot-check confirms most critical paths (audio notes, aa-firebase, checkin) have
`.catch()` coverage. The count of unmatched `.then()` calls is high but many are
one-time UI reads (e.g., `doc.get().then(...)`) where a failed load degrades gracefully.
No specific new unhandled-promise issues were found beyond those noted in C2/W1/W2.

### H5 — package.json in repo root
Contains only a husky dev dependency. Firebase config files (`firebase.json`,
`firestore.rules`, `storage.rules`, `firestore.indexes.json`) are in root intentionally
for Firebase CLI. `package.json` + `package-lock.json` are also root-required for husky hooks.
These are legitimate root files.

---

## AUDIT RESULTS BY CATEGORY

### 1. Broken Resources
- **PASS:** All mode icons referenced in `modes.html` exist ✓
- **PASS:** All tier role icons (`icon-user-*.png`) exist ✓
- **FAIL:** 4 badge icons (`badge-network-lead.png`, etc.) are missing — see W6
- **PASS:** All script/CDN references in main pages resolve correctly
- **PASS:** game-center.html is linked from recovery-mode.html ✓
- **PASS:** All brain-check games are in sitemap ✓
- **WARN:** `ziMPa4QJ` zip in comfort-games — unexpected filename; see W8

### 2. Auth & Security
- **PASS:** `aa-firebase.js` has `_mirrorWriteBlocked()` helper used consistently ✓
- **PASS:** All pages use `AA.auth.onAuthStateChanged` (not `firebase.auth().onAuthStateChanged`) ✓
- **PASS:** bad-brain-day.html duplicate listeners each have UID dedup guards ✓
- **PASS:** recovery-mode.html multiple listeners each have UID dedup guards ✓
- **PASS:** reaction-time.html uses `gameState.isMirror` guard before Firestore write ✓
- **PASS:** pattern-spotter.html mirror UID is used as target uid (though writes to student doc — see W1)
- **FAIL:** simon-says.html missing mirror guard in `_saveToFirestore()` — see W1
- **FAIL:** reading-check.html missing mirror guard in `_saveToFirestore()` — see W1
- **FAIL:** brain-bloom.html mirror guard added but file is broken — see C1

### 3. Cache Consistency
- **INFO:** `CACHE = 'aa-shell-20260401c'` — correct for today's game center changes
- **PASS:** NEVER_CACHE includes all frequently-changing files ✓
- **PASS:** sw.js offline fallback present (`offline.html`) ✓
- **FAIL:** bedroom-planner.html missing from NEVER_CACHE — see W2
- **WARN:** 45 pages on `shared-header v=20260330` instead of `v=20260401` — see W3
- **WARN:** 3 pages on `aa-firebase v=20260323` instead of `v=20260330` — see W4
- **WARN:** 6 static/template pages have no sw.js coverage — see W5

### 4. Code Quality (ES5 Compliance)
- **PASS:** No `const` or `let` statements found in production JavaScript ✓
- **PASS:** No arrow functions (`=>`) found in production JavaScript ✓
- **PASS:** No template literals (backtick strings) in production code
  (5 occurrences found are all in code comments, not executable code) ✓
- **PASS:** `Promise.allSettled` replaced with ES5-compatible pattern in sw.js ✓

### 5. Archive Hygiene
- **PASS:** No dot-file archives outside `modular/archive/` ✓
- **PASS:** No `.FIX` or `.NEW` files ✓
- **PASS:** No archives next to source files ✓
- **WARN:** 1,658 files in archive — several non-standard filenames — see H1

### 6. Redundancy / Error Handling / Null Guards
- **PASS:** aa-firebase.js has 123 try/catch/`.catch()` coverage points ✓
- **PASS:** audio-notes.html has 100 error handling points ✓
- **PASS:** saveCheckin and rejectSuggestion now have `.catch()` (uncommitted) ✓
- **PASS:** suggestMode and suggestMeals now have input validation (uncommitted) ✓
- **FAIL:** brain-bloom.html `_saveToFirestore` missing `onAuthStateChanged` init — C1
- **WARN:** brain-check games (simon-says, reading-check, pattern-spotter) missing mirror guards

### 7. Misplaced Files / Stale Worktrees
- **PASS:** Repo root contains only expected files ✓
- **FAIL:** 4 stale prunable worktrees — see W7
- **WARN:** 4 stale claude/* branches (blissful-burnell, loving-lamarr, mystifying-yalow, vigilant-shockley)
- **WARN:** Uncommitted working copy changes (some broken) — see W8

---

## RECOMMENDED GIT COMMANDS
<!-- DO NOT RUN — for Bruise to review and execute in Git Bash -->

### Step 1: Restore broken brain-bloom.html from HEAD
```bash
# DO NOT RUN — restore brain-bloom.html from last good commit
git checkout HEAD -- modular/components/brain-bloom/brain-bloom.html
```

### Step 2: Prune stale worktrees
```bash
# DO NOT RUN — prune 4 stale worktrees
git worktree prune
```

### Step 3: Delete stale Claude branches (after pruning worktrees)
```bash
# DO NOT RUN — delete 4 stale claude/* branches
git branch -d claude/blissful-burnell claude/loving-lamarr claude/mystifying-yalow claude/vigilant-shockley
```

### Step 4: Stage and commit the good uncommitted changes (AFTER brain-bloom is fixed)
```bash
# DO NOT RUN — commit the good fixes (index.html r.ok check, aa-firebase error handling)
# NOTE: Do NOT include brain-bloom.html until it is fixed. Do NOT include recovery-mode.html until truncation is resolved.
git add modular/archive/aa-firebase_2026-04-01_pre-audit-fixes.bak.js
git add modular/archive/index_2026-04-01_pre-rok-check.bak.html
git add modular/aa-firebase.js
git add index.html
git commit -m "Claude: W5 r.ok header check + C2 Firestore error handling + input validation"
```

### Step 5: Add bedroom-planner back to NEVER_CACHE and bump sw.js
(Requires editing sw.js — flag for next session)

### Step 6: Add mirror guards to simon-says, reading-check, pattern-spotter
(Requires editing 3 files — flag for next session)

### Step 7: Fix recovery-mode.html truncation
(Requires dedicated investigation — find last clean version in archive)

---

*Audit completed by Claude — 2026-04-01*
