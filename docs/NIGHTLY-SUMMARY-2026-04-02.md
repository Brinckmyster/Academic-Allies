# Nightly Deep Audit — 2026-04-02

**Auditor:** Claude
**Scope:** Full codebase audit of Academic Allies
**Files scanned:** 87+ active JS/HTML files, 1,673 archive items, 60 cached resources

---

## CRITICAL ISSUES

### 1. `.bash_history` committed to repo (HIGH)
A 500-line shell history file is tracked in the repo root. This should never be in version control — it can leak command history and local paths.

### 2. `.fuse_hidden0000077f00000001` committed to repo (HIGH)
A FUSE filesystem artifact (3,267 bytes) is tracked in the repo root. This is a system-generated hidden file from a merge/rebase operation and should be removed from git tracking.

### 3. Notification functions missing error handlers (MEDIUM-HIGH)
- `checkMissedMeal()` (aa-firebase.js ~line 1788) and `checkLowSpoons()` (~line 1825) have nested promise chains where the final `addNotification()` call lacks `.catch()` handlers.
- `updateLastSeen()` (~line 1841) returns a bare promise without `.catch()`.
- Impact: Silent failures in meal/spoon alerts; stale activity timestamps.

### 4. Stale worktree: blissful-fermi (MEDIUM)
- `git worktree list` shows a prunable worktree at `C:/Users/brinc/Academic-Allies/.claude/worktrees/blissful-fermi`
- Corresponding stale local branch: `claude/blissful-fermi`
- `.git/worktrees/blissful-fermi/` directory still exists

---

## WARNINGS

### Auth & Security
- **Two onAuthStateChanged listeners in shared-header.html** (lines ~765 and ~1307): One for auth routing, one for session timeout. Functional but fragile — consider consolidating.
- **localStorage used for settings backup** (settings.html ~line 672): Stores personal preferences to `AA_SETTINGS_BACKUP_{uid}`. Low risk but exposes data on shared devices.

### Error Handling & Redundancy
- **Mirror-mode listener cleanup incomplete**: aa-mirror.js adds document click listener with guard flag `_docClickBound` but never removes it on mirror exit. After repeated mode switches, stale listeners accumulate.
- **Message unread badge listener** (shared-header.html ~line 669): Properly unsubscribes on sign-out but may not clean up during mirror-mode switches.
- **Offline mode has no user-facing banner**: Offline errors are suppressed silently (aa-firebase.js ~line 2527). Users don't see that data may be stale.
- **Inconsistent try-catch on storage access**: Most localStorage/sessionStorage calls are wrapped, but some aren't (e.g., line ~1033, line ~281). Could fail in strict private-browsing modes.
- **roleLoadCatch** (shared-header.html ~line 1076): Catches Firestore failures but provides limited fallback — dashboard cards may not render correctly without role data.

### Code Quality
- **Duplicate variable declaration** in spoon-planner.js (lines 2-3): `var btn = document.getElementById("add-task-btn");` appears twice. Harmless but messy.
- **Data validation sparse on free-form text**: Email validation and invite-code trimming exist, but notes, suggestions, and meal names have no length/format validation.

### Archive Hygiene
- **53 archive naming violations** inside modular/archive/ (3.2% of 1,673 items):
  - 13 files use old dash format (`.bak-20260219`)
  - 8 files use `.backup.` format
  - 8 files have double `.bak.bak` extension
  - 18 lock-file variants
  - 2 special-case files
- **12 archive subdirectories** exist (e.g., `components-audio-notes/`, `js/`, `old-flower-system/`). Convention expects a flat structure.
- **88 .bak files in stale worktree** (`.claude/worktrees/blissful-fermi/`): Will be cleaned when worktree is pruned.

---

## HOUSEKEEPING

- **2 intentional TODOs remain**:
  1. aa-firebase.js:468 — Play Store launch: change 'pending' to 'student' role
  2. audio-notes.html:1478 — Future: Otter.ai/OpenAI Whisper integration
- **Debug logging properly guarded**: 21 console.log calls in aa-firebase.js all behind `if (window.AA_DEBUG)`.
- **Brinckmyster-Aestas branch**: Present on remote. Not touched per audit rules.

---

## AUDIT RESULTS BY CATEGORY

### 1. Broken Resources
**Status: PASS**
All script, CSS, manifest, image, and internal link references resolve. 100% of referenced files exist on disk. Cache-bust strings synchronized to `v=20260402`.

### 2. Auth & Security
**Status: PASS (with warnings)**
- Mirror guards: Comprehensive across all student-facing pages. Pattern `if (window.AA_MIRROR_UID && !window.AA_MIRROR_CAN_WRITE) return;` consistently applied.
- Input sanitization: `esc()` function escapes all user-controlled output. No `eval()` usage.
- No hardcoded credentials beyond public Firebase config.
- Token refresh: Silent refresh every 45 min, proactive on tab visibility, force-refresh before critical reads.
- Audit logging infrastructure present for network membership, suggestions, mirror access.

### 3. Cache Consistency
**Status: PASS — FULLY CONSISTENT**
- sw.js CACHE_VERSION: `aa-shell-20260402h`
- SHELL array: 16 entries, all files exist (100%)
- NEVER_CACHE array: 44 entries, all files exist (100%)
- All 38+ pages use identical cache-bust string `?v=20260402`
- All inline scripts in shared-header synchronized to same version
- No overlap between SHELL and NEVER_CACHE arrays
- Crisis pages (nope-mode, semi-nope) properly pre-cached for offline access

### 4. Code Quality (ES5 Compliance)
**Status: PASS — EXCELLENT**
- 0 `let`/`const` declarations
- 0 arrow functions in live code
- 0 template literals in live code
- 0 ES6 class declarations
- Only issue: duplicate `var btn` in spoon-planner.js (harmless)

### 5. Archive Hygiene
**Status: PASS (with naming warnings)**
- 0 .bak files outside modular/archive/
- 0 dot-file archives
- 0 misplaced .FIX/.NEW files
- 0 temp/swap files committed
- 53 naming convention violations (legacy, non-structural)
- 96.8% naming compliance rate

### 6. Redundancy & Error Handling
**Status: PASS (with improvements needed)**
- Global error handlers well-implemented (unhandled rejection + onerror)
- Most Firestore operations have `.catch()` handlers
- Auth flows have error recovery paths
- Gaps: notification promise chains, listener cleanup on mode switches, offline UX, storage-quota edge cases

### 7. Misplaced Files
**Status: FAIL — 2 tracked files should be removed**
- `.bash_history` — tracked, should be in .gitignore
- `.fuse_hidden0000077f00000001` — tracked, should be in .gitignore
- Root otherwise clean (404.html, offline.html are expected)

---

## RECOMMENDED GIT COMMANDS

> **DO NOT RUN — for Bruise to execute**

```bash
# 1. Remove tracked files that shouldn't be in repo
git rm --cached .bash_history
git rm --cached .fuse_hidden0000077f00000001

# 2. Add to .gitignore (if not already present)
echo ".bash_history" >> .gitignore
echo ".fuse_hidden*" >> .gitignore

# 3. Commit the cleanup
git add .gitignore
git commit -m "Claude: Remove tracked shell/FUSE artifacts, update .gitignore"

# 4. Prune stale worktree
git worktree prune

# 5. Delete stale local branch
git branch -d claude/blissful-fermi

# 6. (Optional) Batch-rename archive files to standard format
# This is low priority — 53 files with legacy naming, all functional
```

---

*Report generated by Claude — Nightly Deep Audit 2026-04-02*
