# Nightly Deep Audit Summary — 2026-03-26

**Auditor:** Claude
**Scope:** Full codebase audit (58 HTML pages, 27 JS files, all assets)
**Branch:** main (commit 155a466)

---

## Overall Health: GOOD with housekeeping needed

No critical runtime-breaking issues found. The app is functional and secure. Several hygiene and code-quality items need attention.

---

## CRITICAL ISSUES

### 1. Stale Git Worktrees (469+ MB wasted)
Three worktrees remain in `.claude/worktrees/`:
- **dazzling-maxwell** — 469MB, marked PRUNABLE, branch `claude/dazzling-maxwell`
- **exciting-clarke** — 0 bytes, stale
- **loving-jackson** — 0 bytes, stale

**Fix commands (run in Git Bash):**
```bash
cd /c/Users/brinc/Academic-Allies
git worktree prune
git branch -D claude/dazzling-maxwell 2>/dev/null
rm -rf .claude/worktrees/exciting-clarke .claude/worktrees/loving-jackson
```

### 2. Misplaced Backup File in Root
`.claude.json.backup` exists in the project root — should be in `modular/archive/`.

**Fix commands:**
```bash
mv .claude.json.backup modular/archive/claude-json_2026-03-26_config.bak.json
git add modular/archive/claude-json_2026-03-26_config.bak.json
git rm .claude.json.backup
git commit -m "Claude: Move misplaced backup to modular/archive/"
```

### 3. Nested Archive Subdirectory Violates Rules
`modular/archive/backups/` exists as a subdirectory inside the archive folder. Per CLAUDE.md, all archives should be flat in `modular/archive/` — no subdirectories.

**Action:** Flatten files from `modular/archive/backups/` into `modular/archive/` with proper naming, then remove the subdirectory. (Manual review recommended — multiple files involved.)

---

## WARNINGS

### 4. Cache Version Mismatch in shared-header.html
All 29 live pages correctly reference `shared-header.html?v=20260324`. However, **inside** shared-header.html, JS file cache-bust versions are inconsistent:
- `v=20260324`: shared-footer.html (latest)
- `v=20260323`: aa-firebase.js, aa-mirror.js (1 day behind)
- `v=20260322`: dark-mode.js, draggable.js, migraine-mode.js, mode-enforcer.js, status-circle.js, study-activity.js (2 days behind)

**Recommendation:** Bump all internal cache-bust versions to `v=20260326` on next deploy.

### 5. ES5 Violation in Production File
`modular/components/meal-planner-mary/firebase-photo-upload.js` uses ES6 features (import, const, async/await, arrow functions). This breaks ES5 compatibility required by the project style guide.

**Files confirmed clean:** aa-firebase.js, all shared-header/footer scripts, all modular/js/*.js files, all 29 live HTML pages.

**Dead code files (not loaded by any page):** app.js, header-loader.js, main.js contain ES6 but are unused — no runtime impact.

### 6. Silent Error Swallowing in aa-firebase.js
Four `.catch(function () {})` blocks silently swallow errors with no logging:
- Line 594: pendingUsers delete
- Line 605: permission-denied catch
- Line 618: role-loading chain
- Line 641: user data fetch during auth init

**Risk:** Failed Firestore operations proceed as if they succeeded. Could cause stale state or compliance gaps.

**Recommendation:** Replace with `.catch(function (err) { console.warn('[AA] op failed:', err.message); })` at minimum.

### 7. spoon-pal.html saveData() Missing Mirror Guard
The `saveData()` function (line ~2093) lacks the standard mirror-mode write guard (`if (window.AA_MIRROR_UID && !window.AA_MIRROR_CAN_WRITE) return;`). Risk is LOW because spoon-pal is in the NO_MIRROR array (page-level protection), but it's a pattern violation.

### 8. Listener Cleanup Gap in status-circle.js
`onSnapshot` listeners at lines 914, 924, 996 don't store their unsubscribe functions. If the component reloads, listeners stack. Other files (migraine-mode.js, mode-gate.js) correctly store and clean up.

### 9. Unguarded Element Access in spoon-planner.js
Line 7: `document.getElementById("task-spoons").value` — no null check on the element before accessing `.value`. If the element is missing, this throws a TypeError.

---

## HOUSEKEEPING

### 10. Root Directory Clutter — 14 Audit/Summary Markdown Files
The repo root contains 14 accumulated audit and summary files:
- 8 AUDIT-*.md files (Mar 01–10)
- 5 NIGHTLY-SUMMARY-*.md files (Mar 19–24, plus this one)
- IMPROVEMENT-AUDIT-2026-03-25.md
- PERSISTENCE_INVESTIGATION.md, GIT-COMMANDS.md

**Recommendation:** Consider moving older audit files to a `docs/audits/` folder to reduce root clutter.

### 11. Quiz Utility Scripts in Root
Three JS utility scripts sit in the repo root instead of `modular/js/`:
- `load-mary-quizzes.js` (28 KB)
- `tag-mary-trimester.js` (1 KB)
- `triple-mary-quizzes.js`

Plus two data files: `bonus-quizzes.json`, `mary-quizzes.json`

These are not breaking anything but would be better organized in a dedicated folder.

### 12. Linux Filesystem Artifact
`.fuse_hidden0000077f00000001` exists in the project — a temp file from Linux/FUSE. Should be added to `.gitignore` if not already excluded.

### 13. Data Validation Before Firestore Writes
Firestore `.set()` calls in aa-firebase.js (e.g., user creation ~line 427) don't validate that `uid`, `email`, and `role` meet expected formats before writing. Numeric fields in spoon-pal.html ARE properly NaN-guarded (good), but string fields lack length/format checks.

---

## PASSING CHECKS

| Check | Status |
|-------|--------|
| Broken images/scripts/CSS/links | ALL CLEAR — 150+ resources verified |
| Auth persistence logic | SECURE — LOCAL/SESSION correctly handled |
| Mirror mode guards on write pages | SECURE — all write pages guarded (1 pattern note above) |
| Firestore write guards in aa-firebase.js | COMPREHENSIVE — `_mirrorWriteBlocked()` used consistently |
| Auth gating on all pages | SECURE — all pages use onAuthStateChanged or polling |
| XSS/output encoding | SECURE — HTML escaping functions in all user-content paths |
| Service worker cache version | CURRENT — `aa-shell-20260325i`, NEVER_CACHE list has 54 entries |
| Duplicate listener prevention | GOOD — mode-gate, mode-enforcer, aa-mirror all use load guards |
| Graceful degradation | GOOD — features fail independently, no cascading crashes |
| Remote branches | CLEAN — only main and Brinckmyster-Aestas (off-limits, untouched) |
| .bak files outside archive | CLEAN — none found (except .claude.json.backup noted above) |

---

## SUMMARY COUNTS

- **Critical:** 3 (stale worktrees, misplaced backup, nested archive subdirectory)
- **Warnings:** 6 (cache mismatch, ES5 violation, silent catches, mirror guard pattern, listener cleanup, null guard)
- **Housekeeping:** 4 (root clutter, quiz scripts placement, fuse artifact, write validation)
- **Passing:** 11 checks green

---

*Report generated by Claude — 2026-03-26 nightly audit*
