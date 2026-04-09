# Nightly Deep Audit — 2026-04-04

**Auditor:** Claude
**Scope:** Full codebase audit of Academic Allies
**Files scanned:** 90+ active JS/HTML files, 1,662 archive items (top-level), 12 archive subdirectories
**SW cache version:** `aa-shell-20260403a`
**Shared-header cache-bust:** `v=20260402` (all live pages consistent)

---

## CRITICAL ISSUES

### 1. `diamond-art.html` missing from sw.js NEVER_CACHE (HIGH)
`/Academic-Allies/modular/components/comfort-games/diamond-art.html` was added as a comfort game and has been updated **four times** (v1 through v4, most recently 2026-04-03). However, it is **not listed in `sw.js` NEVER_CACHE** and is not in the SHELL pre-cache list either.

- On first visit, the SW fetches it from network and caches it via stale-while-revalidate.
- After that, every user gets the stale cached version until the cache is purged.
- The 2026-04-03 Diamond Art v4 rewrite may never reach returning users until they clear cache manually.

**Fix:** Add the following line to `NEVER_CACHE` in `sw.js` (and bump the `CACHE` version):
```js
'/Academic-Allies/modular/components/comfort-games/diamond-art.html', /* Claude: 2026-04-04 — updated 4x since creation, must be fresh */
```

### 2. `.fuse_hidden0000077f00000001` still tracked by git (MEDIUM)
This FUSE filesystem artifact (3,267 bytes) is listed in `.gitignore` but remains tracked by git (`git ls-files` returns it). It is a system-generated temp file from a mount operation and has no place in the public repo.

**Fix (provide to Bruise to run):**
```bash
git rm --cached .fuse_hidden0000077f00000001
git commit -m "Claude: Remove tracked FUSE artifact .fuse_hidden0000077f00000001"
```
*(Carries over from 2026-04-02 audit.)*

---

## WARNINGS

### Stale Worktree: `claude/blissful-fermi`
- `git worktree list` shows a **prunable** worktree at `C:/Users/brinc/Academic-Allies/.claude/worktrees/blissful-fermi`
- A stale local branch `claude/blissful-fermi` still exists.
- `.claude/worktrees/blissful-fermi/` directory is present and duplicating all repo files inside `.claude/`.

**Fix (provide to Bruise to run):**
```bash
git worktree prune
git branch -D claude/blissful-fermi
```
*(Carries over from multiple previous audits.)*

### `modular/calendar.html` not in sw.js
`modular/calendar.html` is a redirect stub (`<meta http-equiv="refresh">` pointing to `components/calendar/calendar.html`). It is not in SHELL or NEVER_CACHE. Low risk — the stub has no dynamic content and the real calendar page IS in NEVER_CACHE. Mentioning for completeness. If the stub is updated (e.g., to add dark mode init), it should be added to NEVER_CACHE at that time.

### `checkMissedMeal` / `checkLowSpoons` lack internal `.catch()`
The aa-firebase.js function definitions for `checkMissedMeal()` and `checkLowSpoons()` do not have `.catch()` internally. This was flagged in the 2026-04-02 audit. **Status: Not a bug in practice** — both call sites (checkin.html:1002 and spoon-pal.html:1099) properly add `.catch()`. Noted for documentation completeness. The pattern of relying on callers to add `.catch()` is consistent with how `updateLastSeen` works (shared-header:1041 adds `.catch()`).

---

## HOUSEKEEPING

- **SW cache bump:** `aa-shell-20260403a` reflects the 2026-04-03 Diamond Art v4 deploy. Correct.
- **Cache-bust consistency:** All 47 live pages surveyed use `v=20260402` for shared-header — consistent.
- **`reaction-time.html`** uses a dynamic `cacheVersion` variable approach instead of a hardcoded string, but the value `20260402` is current. Low risk.
- **2 intentional TODOs remain in aa-firebase.js:**
  - Line ~468: Play Store launch — change 'pending' to 'student' role
  - (audio-notes.html ~1478: Otter.ai/Whisper integration)
- **Debug logging:** All `console.log` calls in aa-firebase.js are behind `if (window.AA_DEBUG)` — clean.
- **`modular/privacy.html`** not in sw.js — static policy page, no dynamic content, no action needed.
- **`modular/icon-gallery.html`** not in sw.js — dev tool page, not user-facing. Fine.

---

## AUDIT RESULTS BY CATEGORY

### 1. Broken Resources
**Status: PASS**

All entries in `sw.js` NEVER_CACHE and SHELL arrays were verified against the filesystem. No missing paths. All 60+ NEVER_CACHE entries resolve. All 14 SHELL entries resolve. No broken script/CSS references detected in spot-checks of shared-header.html. Google Fonts, Bootstrap CDN, and Firebase SDK CDN references are properly qualified.

### 2. Auth & Security
**Status: PASS (with minor carry-over notes)**

- **Mirror guards:** Pattern `if (window.AA_MIRROR_UID && !window.AA_MIRROR_CAN_WRITE) return;` verified present in aa-firebase.js (line 685), aa-mirror.js (multiple locations), dark-mode.js (line 798), and migraine-mode.js (line 168). Consistent and correct.
- **onAuthStateChanged:** No competing listeners detected — pages use `AA.auth.onAuthStateChanged()` via the shared module. admin.html's inline Firebase module pattern (legacy compat) has its own listener, but this is an intentional architectural choice for the admin page.
- **No hardcoded credentials:** Firebase config uses public project identifiers only. No API keys, tokens, or secrets in tracked files.
- **Input sanitization:** `esc()` helper function escapes user-controlled output. `eval()` not used.
- **Audit logging infrastructure:** Present and active for mirror access, suggestions, and network membership changes.

### 3. Cache Consistency
**Status: WARNING**

- SW cache name: `aa-shell-20260403a` — current.
- Shared-header version: `v=20260402` — consistent across all pages.
- **FAIL: `diamond-art.html` not in NEVER_CACHE.** See Critical Issue #1 above.
- `modular/aa-firebase.js` internal cache-bust comment references `?v=20260402` — matches live pages.
- nope-mode.html and semi-nope.html load `aa-firebase.js?v=20260402` and `aa-mirror.js?v=20260402` independently (they skip shared-header). Both current.

### 4. Code Quality — ES5 Compliance
**Status: PASS**

- No `let` or `const` declarations found in live JS files (`modular/js/*.js`, `modular/components/**/*.js`).
- No template literals (backtick strings) in live JS files.
- No arrow functions in live JS files.
- No `class` declarations in live JS files.
- `Promise.allSettled` was previously replaced with `Promise.all` + `.catch` (noted in sw.js). SW is fully ES5-compatible.
- `.endsWith()` replaced with `.slice()` comparison in sw.js for ES5 compat.
- `.includes()` replaced with `.indexOf()` in sw.js.
- Live HTML inline scripts were checked: no `const`/`let`/`=>` found in inline script blocks (excluding archive files).

### 5. Archive Hygiene
**Status: PASS (naming violations noted, carry-over)**

- All archive files confirmed to be inside `modular/archive/` — no dot-file archives, no archives next to source files.
- **18 non-`.bak` files** at top level of `modular/archive/` with legacy naming:
  - `.archive-YYYYMMDD-descriptor` (6 files)
  - `.backup.YYYYMMDDHHMMSS` (5 files)
  - `.broken.` (1 file)
  - `LICENSE` (1 orphan file)
  - Other non-standard (5 files)
- **12 archive subdirectories** exist (e.g., `components-user-tiers/`, `js/`, `old-flower-system/`, `components-audio-notes/`). Convention prefers flat structure.
- The stale worktree `.claude/worktrees/blissful-fermi/` contains duplicate archive files — will be cleaned when worktree is pruned.
- No `.FIX`, `.NEW`, or misplaced archives found outside `modular/archive/`.

### 6. Redundancy — Error Handling, Null Guards, Race Conditions
**Status: PASS (with minor carry-overs)**

- `checkMissedMeal`, `checkLowSpoons`, and `updateLastSeen` callers all add `.catch()` — no silent failures.
- Mirror mode listener cleanup: `aa-mirror.js` uses `_docClickBound` flag to prevent duplicate click listeners. Verified guard present (line 626).
- `addNotification()` in aa-firebase.js has deduplication logic and a try-catch on localStorage throttle reads/writes.
- localStorage reads are wrapped in try-catch across most call sites (private browsing protection).
- Service worker offline fallback returns `offline.html` for navigation requests — present and functional.
- Null guards: `userDoc.exists ? userDoc.data() : null` pattern consistently used.
- Message badge listener unsubscribes on sign-out (shared-header).

### 7. Misplaced Files / Repo Root Hygiene
**Status: WARNING (carry-over)**

Allowed root files (per audit config): `index.html`, `sw.js`, `README.md`, `LICENSE`, `CLAUDE.md`, favicon files, `manifest.webmanifest`, firebase config files.

Files in root beyond allowed list:
| File | Status |
|------|--------|
| `404.html` | OK — required for GitHub Pages |
| `offline.html` | OK — referenced by sw.js as offline fallback |
| `package.json` / `package-lock.json` | OK — minimal Firebase CLI stubs (53 bytes) |
| `firestore.rules` / `storage.rules` / `firestore.indexes.json` / `firebase.json` | OK — Firebase deployment files |
| `.fuse_hidden0000077f00000001` | **TRACKED BY GIT** — see Critical Issue #2 |
| `.bash_history` | Not git-tracked (in .gitignore) — fine |
| `.nojekyll` | Required for GitHub Pages — fine |

### 8. Stale Worktrees / Branches
**Status: WARNING (carry-over)**

- `claude/blissful-fermi`: local branch present, worktree is marked **prunable** in `git worktree list`.
- `remotes/origin/Brinckmyster-Aestas`: remote branch — **not touched per audit rules**.
- No other stale branches detected.

---

## RECOMMENDED GIT COMMANDS
**DO NOT RUN — for Bruise to review and execute manually**

```bash
# Fix 1: Remove tracked FUSE artifact
git rm --cached .fuse_hidden0000077f00000001
git commit -m "Claude: Remove tracked FUSE artifact .fuse_hidden0000077f00000001"

# Fix 2: Prune stale worktree and delete branch
git worktree prune
git branch -D claude/blissful-fermi

# Fix 3: After manually adding diamond-art.html to NEVER_CACHE and bumping CACHE version in sw.js
# git add sw.js && git commit -m "Claude: Add diamond-art.html to NEVER_CACHE — stale cache fix"
```

---

*Audit completed by Claude · 2026-04-04*
