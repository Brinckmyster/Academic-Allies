# Nightly Audit Summary — 2026-04-20

**Audit Date:** April 20, 2026 (Monday)
**Branch:** `main` — `Brinckmyster-Aestas` NOT touched (per SOP)
**Audited by:** Claude (automated scheduled task)
**Gap since last audit:** 04-19 ran but its summary file is **still untracked** tonight (along with 04-12 and 04-18 — see **W5**). Today saw **7 commits** land and push to `origin/main`, including a full Service Worker cache bump that closed last night's W1.

> **Path note (informational):** the scheduled task specifies `modular/static/docs/NIGHTLY-SUMMARY-{date}.md`, which matches the template location (`modular/static/docs/nightly-audit-2026-03-08.md`). All recent nightly summaries have been written to `docs/` instead. Tonight's report follows the scheduled-task instruction and lands at `modular/static/docs/`. If Bruise prefers everything in `docs/` going forward, the scheduled task definition or the convention should be updated so future runs are consistent.

> **Lock files clear tonight ✓** — `.git/index.lock` and `.git/HEAD.lock` are both gone. The auto-commit step *can* run if Bruise approves it. (Per global rules, Claude does not auto-commit audit files; commands are listed at the bottom.)

---

## CRITICAL ISSUES

Two **NEW critical** mirror-write gaps surfaced today in the comfort-games study modes. Both are write paths to per-student Firestore documents using `AA_uid(user.uid)` (the mirror UID) with **no `AA_MIRROR_CAN_WRITE` guard**. In mirror mode this means a supporter logged in as themselves but viewing a student's account can silently mutate that student's saved game data. Per CLAUDE.md: *"All writes to Firebase must be guarded by mirror mode checks."*

### C1. `farm-mode.html` — `saveVillage()` writes student data with no mirror-write guard
- **File:** `modular/components/comfort-games/farm-mode.html` lines **686–693**
- **Function:** `saveVillage()` writes to `farmVillage/{currentUserUid}` where `currentUserUid = window.AA_uid(user.uid)` (line 538). In mirror mode, `AA_uid()` returns the **student's** UID — so a supporter playing Farm Mode while mirrored writes coins, buildings, and `lastPlayed` straight into the student's document.
- **Required pattern:** add `if (window.AA_MIRROR_UID && !window.AA_MIRROR_CAN_WRITE) return;` at the top of `saveVillage()`.
- **Severity:** **CRITICAL** — silent data overwrite of student progress; this is a brand-new code path (commit `0bdbdc6`, 2026-04-19) so the gap has only existed for ~36 hours, but every supporter who clicks into Farm Mode while mirrored is currently writing to the student's record.

### C2. `battle-mode.html` — `saveMissedToFirestore()` writes student data with no mirror-write guard
- **File:** `modular/components/comfort-games/battle-mode.html` lines **1170–1176**
- **Function:** `saveMissedToFirestore(uid, items)` writes to `battleProgress/{uid}` where `uid` is the same `AA_uid(user.uid)` mirror-aware UID (line 1098). Same shape of bug as C1 — a supporter in mirror mode answering questions in Battle Mode silently rewrites the student's missed-questions pool.
- **Required pattern:** same — guard `saveMissedToFirestore()` with `if (window.AA_MIRROR_UID && !window.AA_MIRROR_CAN_WRITE) return;` (or block the write at the call site).
- **Severity:** **CRITICAL** — bug introduced in commit `3aa91cf` (2026-04-19, "missed questions summary + rematch + Firestore persistence"). Same exposure window as C1.

---

## WARNINGS

### W1. `battle-mode.html` Now in `sw.js` NEVER_CACHE ✓ — RESOLVED
- **Status:** **FIXED today** in commit `f651f76` ("Add templates + battle-mode + farm-mode to NEVER_CACHE, bump SW version to 20260420a"). Carried 7 days; finally closed.
- **Verified tonight:** `sw.js` `CACHE = 'aa-shell-20260420a'`. NEVER_CACHE now contains `templates.html`, `battle-mode.html`, and `farm-mode.html` with dated Claude comments. All NEVER_CACHE entries point to files that exist on disk ✓.
- Carried wins from this fix: all three of those pages now bypass the SW cache, so the rapid-fire game-mode iteration stops piling up stale-cache risk.

### W2. `spring-classes.js` Still Uses ES6 `const` (carried — 7 days)
- **File:** `modular/data/spring-classes.js` line 1 — `const SPRING_CLASSES = [...]`
- **Status:** unchanged from 04-19. Only ES6 violation in any live `.js` file in the project. Loaded only by `battle-mode.html`, so impact bounded to modern-browser-only.
- **Severity:** Low-medium (carried). One-line fix when convenient.

### W3. `battle-mode.html` Uses Competing Firebase Auth Listener (carried — 7 days)
- **File:** `modular/components/comfort-games/battle-mode.html` line **1089** (was 804 in 04-19; file grew with the new village/COMM 130 work).
- **Problem unchanged:** calls `firebase.auth().onAuthStateChanged(...)` directly instead of `AA.auth.onAuthStateChanged(...)`. The `waitForAA()` polling shim at lines 1082–1087 still exists as a workaround.
- **Severity:** Low-medium (carried). Both this and the workaround should be replaced together — switch to `AA.auth.onAuthStateChanged` and delete `waitForAA`.

### W4. `farm-mode.html` Uses the Same Competing Auth Listener (NEW — 36 hours old)
- **File:** `modular/components/comfort-games/farm-mode.html` line **531**
- **Problem:** identical pattern to W3. Calls `firebase.auth().onAuthStateChanged(...)` directly with its own `waitForAA()` shim (lines 521–527). Copy-paste of the battle-mode pattern when farm-mode was scaffolded in commit `0bdbdc6`.
- **Severity:** Low-medium — same root cause as W3. Fix together.

### W5. Two Live Pages Still Fetch `shared-header.html` Without Cache-Bust (carried)
- **File 1:** `modular/components/comfort-games/battle-mode.html` line **822** (was 576 on 04-19).
- **File 2:** `modular/components/templates/templates.html` line **196**.
- **Verified tonight:** scanned all 51 live HTML pages that fetch `shared-header.html`. **49 use `?v=20260402`** ✓; **2 still missing** the version string (the same two as 04-19).
- **Note:** `shared-header.html` itself hasn't been edited since 2026-04-18 (commit `682f9b2` removed Streak Cat from the nav). The current `?v=20260402` is therefore stale relative to the file — when the next header edit lands, all 49 callers will need a bump anyway, so fixing W5 + bumping every page in one pass is the natural path.
- **Severity:** Medium (carried).

### W6. Three Untracked Nightly Audit Files (NEW carried — accumulating)
- **Files:**
  - `docs/NIGHTLY-SUMMARY-2026-04-12.md` — untracked **8+ days**
  - `docs/NIGHTLY-SUMMARY-2026-04-18.md` — untracked 2 days
  - `docs/NIGHTLY-SUMMARY-2026-04-19.md` — untracked 1 day (last night's, blocked by index.lock at the time)
- **Status:** the lock file is gone tonight, so the commit can finally happen. But the 04-12 file has been sitting untracked over a week — the longer this drifts, the more chance one of these files gets accidentally clobbered or deleted from disk before it ever reaches git.
- **Severity:** Medium — audit history on `origin/main` is now 8+ days behind reality at the worst end.

### W7. Untracked Archive From Last Week (carried from 04-19)
- **File:** `modular/archive/battle-mode_2026-04-18_pre-ability-cards.bak.html` (47 KB, dated Apr 18)
- **Status:** still on disk, still not staged, still not committed. Commit `89720e9` (04-18, "Add Lingo Legend ability card system") shipped the source file without its archive. Today's later battle-mode archives (`battle-mode_2026-04-19_pre-card-visuals.bak.html`, etc.) **were** properly bundled with their commits — only this one is orphaned.
- **Severity:** Low (content preserved on disk + recoverable from git history of the source). Easy roll-up commit.

### W8. Stale Worktrees Still Prunable (carried — 7+ days)
- `.claude/worktrees/affectionate-panini` — prunable (commit `77a7823`)
- `.claude/worktrees/determined-albattani` — prunable (commit `ef1dfad`)
- `.claude/worktrees/quizzical-stonebraker` — prunable (commit `77a7823`)
- All three local branches `claude/affectionate-panini`, `claude/determined-albattani`, `claude/quizzical-stonebraker` still exist locally, none on `origin`.
- **Severity:** Low (local only).

---

## ACCESSIBILITY (ARIA)

This is the first nightly audit running the new ARIA check at equal weight with archive compliance. Overall the project is **in solid shape** — most interactive pages have substantial aria-label, aria-live, role=alert, and label coverage already (checkin: 23 buttons / 15 with aria-label / 1 aria-live / role=alert ✓; spoon-pal: 37 buttons / 14 aria-label / 5 aria-live / 5 role=dialog ✓; audio-notes: 19 buttons / 6 aria-label / 3 aria-live / role=alert / role=dialog ✓). Today's findings are concentrated in a few specific pages.

### A1. `message-system.html` — Two Textareas with Placeholder But No Label or aria-label (WARNING)
- **File:** `modular/components/message-system/message-system.html`
- **Lines:** 255 (`<textarea id="compose-text" placeholder="Type a message…">`) and 294 (`<textarea id="nc-compose-text" placeholder="Type a message…">`).
- **Problem:** screen readers do not announce placeholder text as a label. The Network Chat textarea has `<label for="nc-student-select">` for its student picker (line 272) but the message-compose textareas themselves have no associated label and no `aria-label`.
- **Fix:** add `aria-label="Message text"` to both textareas (or wrap in `<label>` blocks).
- **Severity:** WARNING.

### A2. `audio-notes.html` — Emoji-Only Note Action Buttons Use `title` Not `aria-label` (WARNING)
- **File:** `modular/components/audio-notes/audio-notes.html` lines **1675** (🗑️ delete) and **1697** (✏️ rename).
- **Problem:** both buttons use `title="Delete note"` / `title="Rename"` for the tooltip but have no `aria-label`. `title` attributes are inconsistently announced by screen readers — `aria-label` is the spec-recommended label for icon-only buttons.
- **Fix:** add `aria-label="Delete note"` and `aria-label="Rename note"` (keeping `title` for the visual tooltip is fine).
- **Severity:** WARNING.

### A3. `student-config-editor.html` — Symbol-Only Reorder/Remove Buttons Use `title` Not `aria-label` (WARNING)
- **File:** `modular/components/student-config/student-config-editor.html`
- **Lines:** 803 (▲ Move up), 804 (▼ Move down), 929/950/1508 (✕ Remove).
- **Problem:** same as A2 — `title="Move up"` / `title="Move down"` only. The ✕-only remove buttons have no label at all.
- **Fix:** add `aria-label` to each. For the bare ✕ buttons, `aria-label="Remove item"` (or a context-aware label using `data-idx`).
- **Severity:** WARNING.

### A4. `seed-mary-contacts.html` — 4 Images Without `alt` (WARNING — admin-only page)
- **File:** `modular/static/seed-mary-contacts.html`
- **Count:** 4 `<img>` tags with no `alt` attribute.
- **Mitigation:** this is a one-off admin seeding tool, not user-facing. Still: `alt=""` for decorative images or descriptive alt for meaningful ones.
- **Severity:** WARNING (low-impact page, but also a 5-minute fix).

### A5. Pages Missing Viewport Meta (INFO)
- `modular/shared-header.html`, `modular/shared-footer.html` — these are **fetched fragments**, not standalone pages. The host page provides the viewport meta. This is **fine, intentional** — listed for completeness.
- `modular/static/seed-mary-contacts.html` — also missing viewport. Admin-only tool, not deployed to students. **WARNING — fix when next visiting that file.**

### A6. Spot Checks That PASSED ✓
- All other 70 active HTML files have viewport meta.
- All `<img>` tags in user-facing files have `alt` attributes ✓.
- `battle-mode.html` and `farm-mode.html` both have role=alert + role=progressbar + aria-live regions on their game UI (the 04-19 commit `37edb5f` "Add ARIA roles throughout battle screen" landed; farm-mode has 4 aria-live regions and role=alert + role=dialog).
- `<nav>`/`<header>`/`<main>` landmarks present on all primary pages via `shared-header.html`.

---

## AUDIT RESULTS BY CATEGORY

### 1. BROKEN IMAGES & LINKS
**Status: ✓ PASS**
- All previously flagged criticals are **resolved**: `modes_assignment.html` (deleted entirely — no longer in tree), `bad-brain-day.html` icon path now correct (`../icons/`), `icon-gallery.html` favicon now uses absolute `/Academic-Allies/favicon.ico` ✓.
- All NEVER_CACHE paths in `sw.js` resolve to existing files ✓.
- `manifest.webmanifest`, all favicon variants, `offline.html`, `404.html` present and linked correctly.
- New today: Game Center links to `farm-mode.html` and `battle-mode.html` resolve ✓; Templates link added to message-system.html resolves ✓.
- No 404-likely paths detected.

### 2. ARCHIVE COMPLIANCE
**Status: ✓ PASS** (best showing in weeks)

Every file modified in today's 7 commits has a matching pre-change archive in `modular/archive/`:

| Source File Modified Today | Archive Created |
|---|---|
| `sw.js` | `sw_2026-04-20_pre-never-cache-templates-games.bak.js` ✓ |
| `modular/components/templates/templates.html` | `templates_2026-04-20_pre-comm130.bak.html` + `templates_2026-04-20_pre-drop-ids-hort287.bak.html` ✓ |
| `modular/components/message-system/message-system.html` | `message-system_2026-04-20_pre-templates-link.bak.html` ✓ |
| `modular/js/aa-mirror.js` | `aa-mirror_2026-04-20_pre-mirror-keep-attr.bak.js` ✓ |
| `modular/components/calendar/calendar.html` | `calendar_2026-04-20_pre-12hr-time.bak.html` ✓ |
| `modular/components/comfort-games/battle-mode.html` | `battle-mode_2026-04-20_pre-comm130.bak.html` ✓ |
| `modular/components/comfort-games/farm-mode.html` | `farm-mode_2026-04-20_pre-comm130-rebuild.bak.html` ✓ |
| `modular/components/comfort-games/game-center.html` | `game-center_2026-04-20_pre-village-desc.bak.html` ✓ |
| `modular/components/support-dashboard/support-dashboard.html` | `support-dashboard_2026-04-20_pre-12hr-time.bak.html` ✓ |
| `modular/components/user-tiers/user-tiers.html` | `user-tiers_2026-04-20_pre-12hr-time.bak.html` ✓ |

**10 of 10 today's commits properly archived.** All archive filenames follow the SOP pattern `FILENAME_YYYY-MM-DD_descriptor.bak.ext`. None next to source. None as dot-files. ✓

The only outstanding archive issue is **W7** (untracked archive from 04-18, not a 04-20 problem).

### 3. AUTH & FIREBASE
**Status: ⚠ WARNING — TWO NEW CRITICALS**
- Mirror guard count today: **109+** instances of `AA_MIRROR_UID` across live files; `AA_MIRROR_CAN_WRITE` correctly used in `message-system.html` (5×), `support-dashboard.html` (2×), `user-tiers.html` (2×).
- **NEW CRITICAL C1 + C2** — `farm-mode.html` and `battle-mode.html` write per-student Firestore docs without the mirror-write guard. See CRITICAL section above.
- **W3 + W4** — both battle-mode and farm-mode use direct `firebase.auth().onAuthStateChanged` competing listeners.
- All other `onAuthStateChanged` callers go through `AA.auth.onAuthStateChanged(...)` ✓.
- Hardcoded email addresses still present in `bad-brain-day.html`, `emergency.html`, `aa-mirror.js` (`FLOWER_EXEMPT`), `semi-nope.html`, `seed-mary-contacts.html` — same set as prior audits, same INFO-level "maintenance risk" flag.
- Firestore rules unchanged.
- Direct `firebase.firestore()` calls in `battle-mode.html`, `farm-mode.html`, `custom-quiz.html` — these specialized collections (`battleProgress`, `farmVillage`, `studentConfig`) aren't covered by AA helpers. Pattern is intentional, but the missing mirror guards make the direct-DB access more dangerous than it would be through helpers.

### 4. CACHE-BUST CONSISTENCY
**Status: ⚠ WARNING (improving)**
- `sw.js` CACHE name: **`aa-shell-20260420a`** (bumped today from `aa-shell-20260406d` — 14-day stagnation broken ✓).
- 49 of 51 live HTML pages fetch `shared-header.html?v=20260402` ✓; 2 missing version (W5).
- 4 pages explicitly version `aa-firebase.js?v=20260402` (the rest get it via `shared-header.html`).
- `aa-mirror.js?v=20260402` consistent across all 4 pages that load it directly.
- All NEVER_CACHE paths verified to exist on disk ✓.

### 5. CODE QUALITY
**Status: ⚠ WARNING**
- ES6 violations: **only one** — `modular/data/spring-classes.js` line 1 (W2). No `let`, no arrow functions, no template literals anywhere else in live JS or inline `<script>` blocks.
- Today's new code: **clean ES5** (verified — `var`, `function`, no `=>`, no template literals, no `const`/`let`).
- TODO/FIXME comments: only 2 in live code, both informational and pre-dating the 7-day window:
  - `aa-firebase.js:468` — `TODO (Play Store launch): Change 'pending' → 'student' in this function` (long-running, intentional)
  - `audio-notes.html:1478` — `TODO: future — integrate Otter.ai or OpenAI Whisper API` (aspirational)
- No `let` in worktree-pruning targets either.
- Stale worktrees still present (W8).

### 6. ACCESSIBILITY (ARIA)
**Status: ⚠ WARNING** — see dedicated **ACCESSIBILITY** section above. 4 fixable warnings (A1–A4), 1 informational (A5). No CRITICALs (every interactive element with no visible text either has `aria-label`, has `title`, or has accessible text content; no fully unlabelled controls found).

### 7. MOBILE RESPONSIVENESS
**Status: ✓ PASS**
- Viewport meta present on **70 of 73** active HTML files. 3 missing — 2 are intentional fragments (shared-header/shared-footer), 1 is the admin-only `seed-mary-contacts.html` (A5).
- `modular/css/style.css` and `modular/components/meal-planner/meal-planner.css` both have `@media` queries.
- Inline mobile styles confirmed on `recovery-mode.html`, `spoon-planner.html`, `spoon-pal.html`, `battle-mode.html` (the new compact layout commit `ddd0e04` adds `@media (max-width:600px)` rules), `farm-mode.html` (sky/soil layout has mobile breakpoints).

### 8. SERVICE WORKER / CACHE VERSION
**Status: ✓ PASS** (today's bump cleared the staleness)
- `sw.js` CACHE bumped from `aa-shell-20260406d` → `aa-shell-20260420a` ✓.
- NEVER_CACHE additions (templates, battle-mode, farm-mode) all dated and Claude-credited inline ✓.
- All NEVER_CACHE paths verified to exist on disk ✓.
- `sw.js` itself is in NEVER_CACHE — self-updating registration works.

### 9. BRINCKMYSTER-AESTAS GUARDRAIL
**Status: ✓ PASS**
- `origin/Brinckmyster-Aestas` visible in `git branch -a`. **Zero** checkout, diff, log, or read operations performed against it. Current HEAD remains on `main`. ✓

---

## SUMMARY SCORECARD

| Category | Status | Pass | Warning | Critical | Change from 04-19 |
|---|---|---|---|---|---|
| Broken Images & Links | ✓ PASS | All resolve | — | 0 | No change |
| Archive Compliance | ✓ PASS | 10/10 today | W7 (carried 04-18 archive) | 0 | **Improved** — perfect run today |
| Auth & Firebase | ⚠ CRITICAL | Mirror guards mostly present | W3, W4 | **C1, C2 NEW** | **Worsened** — 2 new critical mirror-write gaps |
| Cache-Bust Consistency | ⚠ WARNING | 49/51 ✓ | W5 (carried) | 0 | Improved (W1 closed) |
| Code Quality (ES5) | ⚠ WARNING | All new code clean | W2 (carried) | 0 | No change |
| Accessibility (ARIA) | ⚠ WARNING | Strong baseline | A1, A2, A3, A4 | 0 | New check this run |
| Mobile Responsiveness | ✓ PASS | 70/73 viewports | A5 (admin page) | 0 | No change |
| Service Worker / Cache | ✓ PASS | Bumped today ✓ | — | 0 | **Improved** — W1 closed |
| Brinckmyster-Aestas | ✓ PASS | Untouched | — | — | No change |
| Repo Hygiene | ⚠ WARNING | Locks clear ✓ | W6, W7, W8 | 0 | Improved (locks cleared); W6 grew (now 3 audit files) |

**Totals: 2 CRITICAL · 9 WARNING · A few INFO**

---

## ACTION ITEMS

In order of urgency. **Audit-only pass — no fixes have been made.**

1. **[CRITICAL — C1]** Add mirror-write guard to `farm-mode.html` `saveVillage()` (line 686). Also consider whether the function should *return early* in mirror mode or *queue a suggestion* — for a comfort-game village, return-early is probably correct (supporters shouldn't build the student's village).
2. **[CRITICAL — C2]** Add mirror-write guard to `battle-mode.html` `saveMissedToFirestore()` (line 1170). Same return-early logic — supporters playing through Battle Mode in mirror should not pollute the student's missed-questions pool.
3. **[WARNING — W6]** Commit the three orphaned audit files: `docs/NIGHTLY-SUMMARY-2026-04-12.md`, `2026-04-18.md`, `2026-04-19.md`, plus tonight's report (whichever path the team picks — see path note at top).
4. **[WARNING — W7]** Commit the orphaned archive `modular/archive/battle-mode_2026-04-18_pre-ability-cards.bak.html` (catch-up for SOP).
5. **[WARNING — W3 + W4]** Replace direct `firebase.auth().onAuthStateChanged` with `AA.auth.onAuthStateChanged` in **both** `battle-mode.html` (line 1089) and `farm-mode.html` (line 531). Delete both `waitForAA()` shims afterwards (they become redundant).
6. **[WARNING — W5]** Add `?v=20260420` (or whatever version is being bumped to) to the two `shared-header.html` fetches in `battle-mode.html` line 822 and `templates.html` line 196. If `shared-header.html` is going to be edited soon, batch this with a full version bump across all 51 callers.
7. **[WARNING — W2]** Change `const SPRING_CLASSES` → `var SPRING_CLASSES` on line 1 of `modular/data/spring-classes.js`.
8. **[WARNING — W8]** Run `git worktree prune` and delete the three stale `claude/*` local branches.
9. **[ARIA — A1]** Add `aria-label="Message text"` to the two textareas in `message-system.html` (lines 255 and 294).
10. **[ARIA — A2]** Add `aria-label="Delete note"` and `aria-label="Rename note"` to the icon-only buttons in `audio-notes.html` (lines 1675, 1697).
11. **[ARIA — A3]** Add `aria-label` to the ▲▼✕ icon buttons in `student-config-editor.html` (lines 803, 804, 929, 950, 1508).
12. **[ARIA — A4]** Add `alt=""` (or descriptive alt) to the 4 `<img>` tags in `seed-mary-contacts.html`.
13. **[ARIA — A5]** Add viewport meta to `seed-mary-contacts.html`.

---

## RECOMMENDED GIT COMMANDS

**DO NOT RUN — for Bruise to execute after reviewing this audit.** Lock files are clear tonight, so the commit *can* proceed. Run from the Academic-Allies repo root in Git Bash on Windows.

```bash
# Step 1 — Commit the four orphaned nightly summaries (W6) + tonight's report
git add docs/NIGHTLY-SUMMARY-2026-04-12.md \
        docs/NIGHTLY-SUMMARY-2026-04-18.md \
        docs/NIGHTLY-SUMMARY-2026-04-19.md \
        modular/static/docs/NIGHTLY-SUMMARY-2026-04-20.md
git commit -m "Claude: Commit nightly audits 04-12, 04-18, 04-19, 04-20 (audit catch-up)"

# Step 2 — Commit the orphaned archive (W7)
#   (Source file battle-mode.html for that change is already in commit 89720e9 from 04-18.)
git add modular/archive/battle-mode_2026-04-18_pre-ability-cards.bak.html
git commit -m "Claude: Archive battle-mode pre-ability-cards (SOP catch-up for 89720e9)"

# Step 3 — Prune stale worktrees and branches (W8)
git worktree prune
git branch -d claude/affectionate-panini
git branch -d claude/determined-albattani
git branch -d claude/quizzical-stonebraker

# Step 4 — Push when everything looks clean
git push
```

**Do NOT push until the C1 + C2 mirror-write fixes are also in.** Those are the real-impact bugs from tonight's audit; the commits above are paperwork. Recommended sequence: ask Claude to land C1 + C2 next session (with proper archives), then bundle this audit + that fix into one push.

---

*Audited by Claude — 2026-04-20*
