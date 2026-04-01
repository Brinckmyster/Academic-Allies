# Nightly Audit Summary — 2026-03-31

**Auditor:** Claude
**Scope:** Full deep audit of Academic Allies repository
**Files Scanned:** 73 active HTML/JS files + sw.js, manifest, configs

---

## CRITICAL ISSUES

### 1. Missing Mirror Guards on Firestore Writes (7 locations)

The following write operations lack the required `if (window.AA_MIRROR_UID && !window.AA_MIRROR_CAN_WRITE) return;` guard:

| File | Function / Line Area | Operation |
|------|---------------------|-----------|
| `modular/components/spoon-planner/spoon-pal.html` | `saveData()` ~L2166 | `.set()` to spoonPal collection |
| `modular/components/modes/modes.html` | `saveModeConfig()` ~L459 | `.update()` to users collection |
| `modular/components/settings/settings.html` | settings save ~L708 | `.update()` to users collection |
| `modular/components/user-tiers/user-tiers.html` | `savePersonPerms()` ~L1103 | `.update()` to users collection |
| `modular/components/recovery-mode.html` | `_saveCustomPromptsToFirestore()` ~L1451 | `.set()` custom journal prompts |
| `modular/components/brain-bloom/brain-bloom.html` | `_saveToFirestore()` ~L605 | `.set()` brainBloom data |
| `modular/components/message-system/message-system.html` | mark-read ~L827 | `.update()` readAt timestamp |

**Note:** In each file, *other* write operations nearby DO have guards — these are individual misses, not systemic failures.

### 2. Firestore Write Operations Missing .catch() (6+ functions)

These core aa-firebase.js helper functions have no error handling on their Firestore writes:

- `saveCheckin()` (~L967)
- `saveMealLog()` (~L1020)
- `saveSpoonPal()` (~L1065)
- `_doCreateInvite()` (~L1133)
- `rejectSuggestion()` (~L1495)
- `respondModeSuggestion()` / `respondMealSuggestion()` (~L1545, ~L1595)

**Impact:** If Firestore write fails (offline, permission denied, quota), UI has no feedback — user thinks action succeeded.

### 3. onSnapshot Listeners Not Returning Unsubscribe Handles

`watchCheckins()`, `watchMealLog()`, and other `watchX()` helpers in aa-firebase.js return the onSnapshot listener but callers don't always store and clean up the unsubscribe function. This causes memory leaks on page navigation.

**Partially fixed (2026-03-30):** `aa-mirror.js`, `status-circle.js`, and `migraine-mode.js` now properly unsubscribe. Core watch functions still need caller-side cleanup.

---

## WARNINGS

### 4. Missing Null Guards on doc.data()

In `aa-firebase.js` (~L592, 598, 604, 629, 668), `doc.data()` is accessed without checking `doc.exists` first. If a Firestore document is missing or corrupted, this causes a TypeError.

### 5. Fetch Without r.ok Validation

`index.html` (~L323-339) fetches `shared-header.html` without checking `r.ok` before calling `r.text()`. A 404/500 response would inject error HTML into the page DOM silently.

### 6. watchCheckins() Error Not Forwarded to UI

The `watchCheckins()` onSnapshot error callback logs to console but doesn't call the callback with an error — UI stays stuck on "Loading..." forever if the listener fails. Other watch functions were fixed in the W7 patch (2026-03-30) but this one was missed.

### 7. Misplaced Files in Repo Root

Two files should not be in the repository root:

- **`.bash_history`** (24 KB) — Shell history file, not part of the project
- **`.fuse_hidden0000077f00000001`** (3.3 KB) — FUSE filesystem artifact

### 8. Uncommitted Changes

- **Modified:** `modular/components/comfort-games/emoticon-defense.html`
- **Untracked:** `modular/components/comfort-games/emoticon-defense.swf` (Flash binary)

### 9. Input Validation Before Writes

Functions like `suggestMeals()`, `suggestSpoonPlan()`, and `suggestMode()` in aa-firebase.js write caller-provided data to Firestore without client-side format validation (dateKey, studentUid, meal arrays). Firestore rules are the only safety net.

---

## HOUSEKEEPING

### 10. Archive Directory

- **Status:** CLEAN
- **Total archive files:** 3,105 (273 MB)
- **All located correctly** in `modular/archive/`
- **Minor note:** 3 files have double `.bak.bak` extensions (cosmetic, not harmful)

### 11. Double .bak.bak Files in Archive

- `meal-planner-local.bak.bak`
- `universal-suggestor-local.bak.bak`
- `universal-suggestor.js.bak.bak`

These work fine but could be renamed for consistency.

### 12. .gitignore Coverage

`.bash_history` and `.fuse_hidden*` should be added to `.gitignore` to prevent accidental commits.

---

## AUDIT RESULTS BY CATEGORY

### Broken Resources
**Result: PASS** — 294 resource references checked across 59 HTML files. Zero broken references. All local files resolve, all external CDN URLs are valid (Firebase 9.23.0/10.7.1, Google APIs, lamejs, Google Fonts).

### Auth & Security
**Result: 7 ISSUES** — 7 missing mirror guards on Firestore writes (see Critical #1). No competing auth listeners found. No hardcoded credentials. No email-based permission checks. Firebase config properly exposed as public client-side config.

### Cache Consistency
**Result: PASS** — `CACHE_VERSION: aa-shell-20260331a`. All 46 pages use cache-bust version `20260330` for shared-header/footer — perfectly synchronized. All 16 precache files exist. All 33 NEVER_CACHE files exist. Service worker strategy is sound (network-first for dynamic, cache-first for static).

### ES5 Compliance
**Result: PASS (100%)** — Zero violations across 22 JS files and 46 HTML files with inline scripts. No let/const, arrow functions, template literals, classes, destructuring, async/await, import/export, for...of, spread, optional chaining, or nullish coalescing found in project code.

### Archive Hygiene
**Result: PASS** — All 3,105 backup files correctly in `modular/archive/`. No dot-file archives. No misplaced .FIX or .NEW files. No backups next to source files.

### Redundancy & Error Handling
**Result: MIXED** — Good error handling on auth/persistence paths (recently hardened 2026-03-25 to 2026-03-30). Gaps remain in Firestore write error callbacks, null guards on doc.data(), and listener cleanup. See Critical #2, #3 and Warnings #4-6.

### Misplaced Files
**Result: 2 ISSUES** — `.bash_history` and `.fuse_hidden*` in repo root. No stale worktrees. No stale branches (Brinckmyster-Aestas is intentional, not audited per instructions).

---

## RECOMMENDED GIT COMMANDS

> **DO NOT RUN** — These are recommendations for Bruise to review and execute manually.

```bash
# Add misplaced files to .gitignore
echo ".bash_history" >> .gitignore
echo ".fuse_hidden*" >> .gitignore

# Remove misplaced files from tracking (if tracked)
git rm --cached .bash_history 2>/dev/null
git rm --cached ".fuse_hidden0000077f00000001" 2>/dev/null

# Stage and commit the .gitignore update
git add .gitignore
git commit -m "Claude: Add .bash_history and .fuse_hidden* to .gitignore"

# Review uncommitted comfort-games changes
git diff modular/components/comfort-games/emoticon-defense.html

# If emoticon-defense.swf should be tracked:
git add modular/components/comfort-games/emoticon-defense.swf
git add modular/components/comfort-games/emoticon-defense.html
git commit -m "Claude: Add emoticon-defense comfort game assets"

# If emoticon-defense.swf should NOT be tracked (Flash is deprecated):
echo "*.swf" >> .gitignore
git add .gitignore
git commit -m "Claude: Exclude Flash .swf files from tracking"
```

---

*Report generated by Claude — 2026-03-31*
