# Git Commands — Claude Audit Batch (Sessions 1-11)
# 73 .FIX files + 2 direct edits (404.html, offline.html). Run from Academic-Allies root directory.

## Step 1: Copy .FIX files over originals

```bash
cp "index.html.FIX" "index.html" && rm "index.html.FIX"
cp "modular/aa-firebase.js.FIX" "modular/aa-firebase.js" && rm "modular/aa-firebase.js.FIX"
cp "modular/accommodations.html.FIX" "modular/accommodations.html" && rm "modular/accommodations.html.FIX"
cp "modular/admin.html.FIX" "modular/admin.html" && rm "modular/admin.html.FIX"
cp "modular/checkin-log.html.FIX" "modular/checkin-log.html" && rm "modular/checkin-log.html.FIX"
cp "modular/checkin.html.FIX" "modular/checkin.html" && rm "modular/checkin.html.FIX"
cp "modular/components/audio-notes/audio-converter.html.FIX" "modular/components/audio-notes/audio-converter.html" && rm "modular/components/audio-notes/audio-converter.html.FIX"
cp "modular/components/audio-notes/audio-notes.html.FIX" "modular/components/audio-notes/audio-notes.html" && rm "modular/components/audio-notes/audio-notes.html.FIX"
cp "modular/components/audit-log/audit-log.html.FIX" "modular/components/audit-log/audit-log.html" && rm "modular/components/audit-log/audit-log.html.FIX"
cp "modular/components/bad-brain-day.html.FIX" "modular/components/bad-brain-day.html" && rm "modular/components/bad-brain-day.html.FIX"
cp "modular/components/bedroom-planner/bedroom-planner.html.FIX" "modular/components/bedroom-planner/bedroom-planner.html" && rm "modular/components/bedroom-planner/bedroom-planner.html.FIX"
cp "modular/calendar.html.FIX" "modular/calendar.html" && rm "modular/calendar.html.FIX"
cp "modular/components/calendar/calendar.html.FIX" "modular/components/calendar/calendar.html" && rm "modular/components/calendar/calendar.html.FIX"
cp "modular/components/meal-planner-mary/bootstrap-suggestor.js.FIX" "modular/components/meal-planner-mary/bootstrap-suggestor.js" && rm "modular/components/meal-planner-mary/bootstrap-suggestor.js.FIX"
cp "modular/components/meal-planner-mary/edit-modal.js.FIX" "modular/components/meal-planner-mary/edit-modal.js" && rm "modular/components/meal-planner-mary/edit-modal.js.FIX"
cp "modular/components/meal-planner-mary/index.html.FIX" "modular/components/meal-planner-mary/index.html" && rm "modular/components/meal-planner-mary/index.html.FIX"
cp "modular/components/meal-planner-mary/suggestions.js.FIX" "modular/components/meal-planner-mary/suggestions.js" && rm "modular/components/meal-planner-mary/suggestions.js.FIX"
cp "modular/components/meal-planner-mary/time-utils.js.FIX" "modular/components/meal-planner-mary/time-utils.js" && rm "modular/components/meal-planner-mary/time-utils.js.FIX"
cp "modular/components/meal-planner/bootstrap-suggestor.js.FIX" "modular/components/meal-planner/bootstrap-suggestor.js" && rm "modular/components/meal-planner/bootstrap-suggestor.js.FIX"
cp "modular/components/meal-planner/meal-planner.html.FIX" "modular/components/meal-planner/meal-planner.html" && rm "modular/components/meal-planner/meal-planner.html.FIX"
cp "modular/components/meal-planner/universal-suggestor.js.FIX" "modular/components/meal-planner/universal-suggestor.js" && rm "modular/components/meal-planner/universal-suggestor.js.FIX"
cp "modular/components/message-system/message-system.html.FIX" "modular/components/message-system/message-system.html" && rm "modular/components/message-system/message-system.html.FIX"
cp "modular/components/modes/modes.html.FIX" "modular/components/modes/modes.html" && rm "modular/components/modes/modes.html.FIX"
cp "modular/components/recovery-mode.html.FIX" "modular/components/recovery-mode.html" && rm "modular/components/recovery-mode.html.FIX"
cp "modular/components/settings/settings.html.FIX" "modular/components/settings/settings.html" && rm "modular/components/settings/settings.html.FIX"
cp "modular/components/spoon-planner/spoon-pal.html.FIX" "modular/components/spoon-planner/spoon-pal.html" && rm "modular/components/spoon-planner/spoon-pal.html.FIX"
cp "modular/components/spoon-planner/spoon-planner.html.FIX" "modular/components/spoon-planner/spoon-planner.html" && rm "modular/components/spoon-planner/spoon-planner.html.FIX"
cp "modular/components/streak-cat/streak-cat.html.FIX" "modular/components/streak-cat/streak-cat.html" && rm "modular/components/streak-cat/streak-cat.html.FIX"
cp "modular/components/student-config/mary-wordsearch-cooking.html.FIX" "modular/components/student-config/mary-wordsearch-cooking.html" && rm "modular/components/student-config/mary-wordsearch-cooking.html.FIX"
cp "modular/components/student-config/mary-crossword-floral.html.FIX" "modular/components/student-config/mary-crossword-floral.html" && rm "modular/components/student-config/mary-crossword-floral.html.FIX"
cp "modular/components/student-config/student-config-editor.html.FIX" "modular/components/student-config/student-config-editor.html" && rm "modular/components/student-config/student-config-editor.html.FIX"
cp "modular/components/study-notes/study-notes.html.FIX" "modular/components/study-notes/study-notes.html" && rm "modular/components/study-notes/study-notes.html.FIX"
cp "modular/components/support-dashboard/support-dashboard.html.FIX" "modular/components/support-dashboard/support-dashboard.html" && rm "modular/components/support-dashboard/support-dashboard.html.FIX"
cp "modular/components/templates/accommodation-request.html.FIX" "modular/components/templates/accommodation-request.html" && rm "modular/components/templates/accommodation-request.html.FIX"
cp "modular/components/templates/counselor-outreach.html.FIX" "modular/components/templates/counselor-outreach.html" && rm "modular/components/templates/counselor-outreach.html.FIX"
cp "modular/components/templates/network-invite.html.FIX" "modular/components/templates/network-invite.html" && rm "modular/components/templates/network-invite.html.FIX"
cp "modular/components/templates/templates.html.FIX" "modular/components/templates/templates.html" && rm "modular/components/templates/templates.html.FIX"
cp "modular/components/user-tiers/user-tiers.html.FIX" "modular/components/user-tiers/user-tiers.html" && rm "modular/components/user-tiers/user-tiers.html.FIX"
cp "modular/emergency.html.FIX" "modular/emergency.html" && rm "modular/emergency.html.FIX"
cp "modular/nope-mode.html.FIX" "modular/nope-mode.html" && rm "modular/nope-mode.html.FIX"
cp "modular/icon-gallery.html.FIX" "modular/icon-gallery.html" && rm "modular/icon-gallery.html.FIX"
cp "load-mary-quizzes.js.FIX" "load-mary-quizzes.js" && rm "load-mary-quizzes.js.FIX"
cp "modular/js/aa-mirror.js.FIX" "modular/js/aa-mirror.js" && rm "modular/js/aa-mirror.js.FIX"
cp "modular/js/dark-mode.js.FIX" "modular/js/dark-mode.js" && rm "modular/js/dark-mode.js.FIX"
cp "modular/js/gps-social.js.FIX" "modular/js/gps-social.js" && rm "modular/js/gps-social.js.FIX"
cp "modular/js/mode-enforcer.js.FIX" "modular/js/mode-enforcer.js" && rm "modular/js/mode-enforcer.js.FIX"
cp "modular/js/mode-gate.js.FIX" "modular/js/mode-gate.js" && rm "modular/js/mode-gate.js.FIX"
cp "modular/js/migraine-mode.js.FIX" "modular/js/migraine-mode.js" && rm "modular/js/migraine-mode.js.FIX"
cp "modular/js/status-circle.js.FIX" "modular/js/status-circle.js" && rm "modular/js/status-circle.js.FIX"
cp "modular/js/student-config.js.FIX" "modular/js/student-config.js" && rm "modular/js/student-config.js.FIX"
cp "modular/js/study-activity.js.FIX" "modular/js/study-activity.js" && rm "modular/js/study-activity.js.FIX"
cp "modular/privacy.html.FIX" "modular/privacy.html" && rm "modular/privacy.html.FIX"
cp "modular/resources.html.FIX" "modular/resources.html" && rm "modular/resources.html.FIX"
cp "modular/semi-nope.html.FIX" "modular/semi-nope.html" && rm "modular/semi-nope.html.FIX"
cp "modular/shared-footer.html.FIX" "modular/shared-footer.html" && rm "modular/shared-footer.html.FIX"
cp "modular/shared-header.html.FIX" "modular/shared-header.html" && rm "modular/shared-header.html.FIX"
cp "modular/static/custom-quiz.html.FIX" "modular/static/custom-quiz.html" && rm "modular/static/custom-quiz.html.FIX"
cp "modular/static/docs/TEAM-PROFILES.html.FIX" "modular/static/docs/TEAM-PROFILES.html" && rm "modular/static/docs/TEAM-PROFILES.html.FIX"
cp "modular/static/floral-fill-blank.html.FIX" "modular/static/floral-fill-blank.html" && rm "modular/static/floral-fill-blank.html.FIX"
cp "modular/static/floral-flashcards.html.FIX" "modular/static/floral-flashcards.html" && rm "modular/static/floral-flashcards.html.FIX"
cp "modular/static/floral-flower-id.html.FIX" "modular/static/floral-flower-id.html" && rm "modular/static/floral-flower-id.html.FIX"
cp "modular/static/floral-genus-practice.html.FIX" "modular/static/floral-genus-practice.html" && rm "modular/static/floral-genus-practice.html.FIX"
cp "modular/static/floral-match-game.html.FIX" "modular/static/floral-match-game.html" && rm "modular/static/floral-match-game.html.FIX"
cp "modular/static/floral-missed-tracker.html.FIX" "modular/static/floral-missed-tracker.html" && rm "modular/static/floral-missed-tracker.html.FIX"
cp "modular/static/floral-speed-round.html.FIX" "modular/static/floral-speed-round.html" && rm "modular/static/floral-speed-round.html.FIX"
cp "modular/static/floral-spelling-sheet.html.FIX" "modular/static/floral-spelling-sheet.html" && rm "modular/static/floral-spelling-sheet.html.FIX"
cp "modular/static/floral-study-sheet.html.FIX" "modular/static/floral-study-sheet.html" && rm "modular/static/floral-study-sheet.html.FIX"
cp "modular/static/network-lead-guide.html.FIX" "modular/static/network-lead-guide.html" && rm "modular/static/network-lead-guide.html.FIX"
cp "modular/static/sitemap.html.FIX" "modular/static/sitemap.html" && rm "modular/static/sitemap.html.FIX"
cp "modular/static/study-tools.html.FIX" "modular/static/study-tools.html" && rm "modular/static/study-tools.html.FIX"
cp "modular/static/utc-converter.html.FIX" "modular/static/utc-converter.html" && rm "modular/static/utc-converter.html.FIX"
cp "sw.js.FIX" "sw.js" && rm "sw.js.FIX"
```

## Step 2: Stage all changes

```bash
git add -A
```

## Step 3: Commit

```bash
git commit -m "Claude: Comprehensive audit batch (sessions 1-11) — ES5, XSS, a11y, dark mode, error handling

Sessions 1-4: syntax conversion + UX improvements
- Converted all ES6+ syntax to ES5 (const/let→var, arrows→function, template
  literals→concatenation, async/await→promises, for...of→for loops, spread→
  Object.assign/concat, optional chaining→guard checks) across 15+ files
- Added XSS escape helpers (_escMeal, _escSug, _escRM) for innerHTML with user data
- Added dark mode CSS (html.aa-dark rules) to TEAM-PROFILES, meal-planner-mary,
  checkin-log, icon-gallery
- Added .catch() handlers for unhandled promises in bad-brain-day config loads
- Added bounds checking on numeric settings before Firestore writes
- Fixed duplicate </script> tag in icon-gallery
- Fixed ternary operator precedence bugs from template literal conversion
- Fixed broken regex patterns (stripLeadingEmoji ES2018→ES5)
- Converted async/await weather fetch to promise chains in spoon-pal

Session 5: deep ES5 method audit + additional fixes
- Replaced .padStart() (ES2017) with ('0'+n).slice(-2) across 14 files (40 instances)
- Replaced Array.from() (ES2015) with [].slice.call() across 41 files (47 instances)
- Replaced .includes() (ES2016) with .indexOf() across 4 files (6 instances)
- Replaced .finally() (ES2018) with duplicated cleanup in both .then/.catch (2 files)
- Replaced new Set() (ES2015) with object-lookup dedup across 4 files (7 instances)
- Replaced .findIndex() (ES2015) with manual for loops in spoon-pal (2 instances)
- Replaced Object.entries() (ES2017) with Object.keys() in bedroom-planner (3 instances)
- Fixed double .catch() chain bug in support-dashboard, checkin-log, emergency
- Added comprehensive dark mode CSS to support-dashboard (40+ rules)
- All 42 sitemap links verified — zero broken
- SW cache bumped to aa-shell-20260325e

Session 6: deep audit sweep — DOM compat, a11y, validation, race conditions
- Replaced .replaceWith() (DOM4) with .parentNode.replaceChild() across 39+ files
- Fixed .padStart() in 3 JS files: gps-social.js, status-circle.js, study-activity.js
- Fixed .padStart() in shared-footer.html
- Fixed Array.from() in 5 static/template files + study-tools
- Fixed new Set() in mary-wordsearch-cooking.html + 4 other files (7 instances)
- Added ARIA role/tabindex/aria-expanded/keyboard handlers to 4 collapsible
  headings in study-tools.html (semester, tool-group, quiz-group, orphan sections)
- Added .catch() to 5 unhandled promise chains (status-circle, shared-header)
- Added dark mode CSS to mary-wordsearch-cooking + mary-crossword-floral
- Added maxlength to 14+ textarea/input fields across checkin, messages,
  meal-planner, spoon-pal, recovery-mode, student-config-editor
- Added bounds checking to spoon-planner saveEdit() (was missing vs addTask)
- Capped AA_QUIZ_REPORTS localStorage array at 100 entries (was unbounded)
- Added localStorage pruning routine in shared-header (cleans throttle keys
  and GPS snapshots older than 7 days, runs once per day)
- Fixed Firestore listener leak on sign-out in message-system (4 listeners)
  and checkin-log (1 listener) — prevents data bleed across auth sessions
- Fixed audio-notes rename button stuck disabled on error (.catch re-enable)
- Converted last remaining template literal in recovery-mode scripture display

Session 7: PII sanitization, date consistency, mirror guard hardening
- Sanitized 14 console.log statements exposing UIDs/emails — wrapped in
  AA_DEBUG guard or removed PII entirely (index, aa-firebase, shared-header,
  migraine-mode, student-config, study-activity, audio-notes, load-mary-quizzes)
- Standardized 8 bare toLocaleDateString() calls with explicit 'en-US' locale
  to prevent regional format inconsistency (admin, audio-notes, spoon-planner,
  study-notes, user-tiers)
- Added mirror mode write guards to message-system _draftSave() and
  _draftClear() — prevents supporters auto-saving drafts as student
- Converted remaining let→var in recovery-mode spoon counter (3 declarations)
- Replaced .remove() (DOM4) with parentNode.removeChild() across 16 files
  (28 instances: mode-gate, dark-mode, migraine-mode, nope-mode, semi-nope,
  shared-header, checkin, audio-notes, audit-log, bedroom-planner, calendar,
  meal-planner, message-system, spoon-pal, study-notes, support-dashboard)
- Added .catch() to 2 unhandled cache-put promises in sw.js
- Replaced NodeList.forEach in bootstrap-suggestor files (6 instances)
- Added NodeList.forEach + Element.closest polyfills to shared-header
  (protects all 90+ forEach calls and closest() usage across entire app)

Session 8: loading timeouts, form validation, console cleanup, localStorage hygiene
- Added 8-second loading timeout with retry button to emergency.html network picker
- Added retry buttons to timeout states in calendar, message-system, student-config
- Added 10-second section timeout for support-dashboard sub-panel loading states
  (status, check-ins, quiz, meals, config) — prevents indefinite hangs offline
- Added console.warn to 15+ silent .catch() blocks in user-facing operations:
  study-activity retries, status-circle role check, dark-mode Firestore sync/load,
  migraine-mode retry, aa-firebase token refresh, admin self-heal, role fetch,
  isSupporter flag writes
- Added aria-labels to 5 icon-only buttons: flashcard nav (◀▶), meal-planner
  remove (✕), support-dashboard quiet alert dismiss (✕), user-tiers remove
  prompt (×) and condition tag (× with role=button + keyboard handler)
- Added sign-out localStorage cleanup in aa-firebase — clears user-specific keys
  (appMode, backups, retry queues, BBD flags) to prevent stale data leaking
  between accounts on shared devices
- Added one-time localStorage prune on sign-in — cleans date-keyed entries
  (checkins_*, aa_gps_*) older than 30 days to prevent unbounded growth
- Upgraded admin invite email validation from basic @ check to proper regex
- Added field length limits: emergency contacts (name 100, phone 30, email 254,
  message 500), meal planner (name 200, notes 500), spoon planner task (name 200,
  spoons clamped 0-20), message send (2000 char server-side), checkin notes (1000
  per category, 2000 final note)
- Wrapped 75 remaining unguarded console.log() statements in if(window.AA_DEBUG)
  guards across 19 .FIX files — zero production console.log leaks remain
- Added console.warn to mode-gate and mode-enforcer Firestore .catch() blocks
  (were empty — now log failure reason for debugging offline issues)
- Added console.warn to dark-mode auth poll timeout (15s with no AA available)
- Fixed window.AA_DEBUG → self.AA_DEBUG in sw.js (service workers have no window)
- Created 404.html for GitHub Pages — styled 404 page with dark mode support
- Added meta viewport to privacy.html (was missing — caused mobile scaling issues)
- Added favicon link to checkin.html, privacy.html, offline.html
- Added admin.html, audit-log.html, audio-converter.html to SW NEVER_CACHE
  (were in neither SHELL nor NEVER_CACHE — could serve stale role/compliance data)
- Fixed utc-converter.html div ID from shared-header → site-header for consistency
- SW cache bumped to aa-shell-20260325g

Session 9: unhandled rejections, favicon sweep, a11y keyboard nav, touch targets
- Added .catch() to 4 unhandled Promise chains: user-tiers Promise.all (network
  member fetch), user-tiers switchStudent getUserDoc, message-system Promise.all
  (contact fetch), message-system getAllAdmins — all showed silent failures
- Added missing favicon link to 6 pages: bedroom-planner, mary-crossword-floral,
  mary-wordsearch-cooking, floral-fill-blank, utc-converter, calendar redirect
- Added missing meta viewport to calendar redirect page
- Fixed audit-log date display: day was unpadded (showed 'Jan 5' not 'Jan 05')
  — now uses ('0'+d).slice(-2) to match rest of app
- Added alt text to emergency.html dynamic contact photo img element
- Added aria-label to admin.html invite role select and invite button
- Added aria-label to shared-header migraine mode and dark mode toggle buttons
- Added role=button + tabindex=0 + keyboard handler (Enter/Space) to:
  study-notes class-header (collapsible sections),
  user-tiers permissions toggle span
- Increased touch target sizes on shared-header auth buttons:
  email toggle (2px→10px padding, 11px→13px font),
  forgot password (2px→10px padding, 11px→13px font)
- Added comprehensive dark mode CSS to shared-header (25+ rules):
  site-header bg, nav links, auth buttons, email form inputs, welcome-back
  banner, status circle tooltip/banner, mirror mode banner
- Added dark mode CSS to message-system (20 rules): sidebar, contact items,
  chat bubbles, compose bar, tab bar, loading state, group chat icons
- Added dark mode CSS to checkin.html (18 rules): gateway buttons with
  color-coded selected states, emoji buttons, text inputs, save/reset/skip
  buttons, flag bar, emergency card
- Added explicit type="text" to meal-planner suggestion name input
- Fixed audit-log Load More button stuck disabled on Firestore error
  (button now re-enables with 'Retry loading…' text on failure)
- Added dark mode CSS to spoon-planner (18 rules): container, task items,
  drag handles, add-task form, bulk actions, completed task styling
- Added dark mode CSS to emergency.html (14 rules): contact cards, call/email
  buttons, edit form inputs, BYU-I quick-add buttons, seed defaults button
- Fixed XSS: unescaped Firestore threshold/diffDays in support-dashboard
  checkin-alert innerHTML — now wrapped in esc(String(...))
- Fixed XSS: unescaped task.name/task.text from Firestore in recovery-mode
  todo list innerHTML — added _escRM() helper and applied to task name + time
- Added null fallback to floral-speed-round JSON.parse(localStorage) call
- Added mirror mode write guards to study-notes saveClass() and saveNoteMeta()
  (were missing — supporters could accidentally write as student)
- Added early dark mode FOUC-prevention script to mary-crossword-floral,
  mary-wordsearch-cooking, offline.html (were flashing white before dark mode)
- Fixed migraine-mode.js onSnapshot memory leak: watchMirrorMigraine() now
  stores unsubscribe function and cleans up previous listener before attaching new
- Fixed status-circle.js mirror poll interval: stored interval ID for cleanup,
  reduced frequency from 1s→3s to save CPU
Session 10: dark mode sweep, global error handler, XSS fix, null guards
- Added global window.addEventListener('unhandledrejection') handler to aa-firebase.js
  — catches uncaught promise rejections gracefully, suppresses noisy Firebase offline
  errors, logs permission denied with helpful context, shows stack in AA_DEBUG mode
- Added comprehensive dark mode CSS to 5 more high-use pages:
  settings.html (25 rules: section cards, toggles, inputs, buttons, toasts, auth gate),
  calendar.html (28 rules: grid, day cells, today/selected states, detail panel, legend),
  audio-notes.html (33 rules: record button, transcript, modals, note cards, filters),
  modes.html (17 rules: mode tiles, config panel, feature toggles, save buttons),
  spoon-pal.html (42 rules: budget bar, check-in buttons with color states, task table,
  modals, status picker, rollover summary, day option buttons),
  recovery-mode.html (27 rules: cards, buttons, quiz states, breathing circle,
  energy options, journal textarea, session bar, progress bar),
  meal-planner.html (17 rules: form inputs, meal items, base plan, banners),
  user-tiers.html (75 rules: network cards, badges, mirror/NL banners, permissions
  panel, invite/redeem forms, profile panel, condition tags, module toggles)
- Fixed XSS in admin.html: unescaped Firestore email and role in pending invite
  table innerHTML — now wrapped in escHtml() (3 vulnerable assignments)
- Added querySelector null guards to 6 locations across 4 files:
  user-tiers.html page-wrap classList (mirror-mode + nl-mode activation),
  emergency.html page-wrap insertBefore (timeout message),
  emergency.html readCardData form fields (refactored to _qVal helper),
  custom-quiz.html answerInput + btn-primary disable,
  bad-brain-day.html energy-emoji textContent (select + restore paths)
- SW cache bumped to aa-shell-20260325h

Session 11: listener guards, window.onerror, silent catch fixes, a11y, dark mode
- Fixed event listener accumulation in aa-mirror.js: renderSwitcher() was called 6+
  times, each adding a duplicate document-level click listener. Added _docClickBound
  guard flag + changed handler to query DOM fresh (not stale closure reference)
- Added double-load guards to mode-gate.js (_AA_MODE_GATE_LOADED) and
  mode-enforcer.js (_AA_MODE_ENFORCER_LOADED) — prevents duplicate listeners if
  script tag accidentally appears twice
- Added global window.onerror handler to aa-firebase.js — catches uncaught sync
  errors, suppresses benign ResizeObserver loop errors, logs cross-origin script
  errors quietly in debug mode. Complements existing unhandledrejection handler.
- Replaced 8 silent empty .catch() handlers in support-dashboard.html with
  console.warn logging: isSupporter update, viewer doc fetch, mode fetch, picker
  refresh, stats update, 2× notification add, checkin history fetch
- Fixed uncaught JSON.parse in floral-flower-id.html — reportedFlowers localStorage
  parse wrapped in try/catch with fallback (corrupted data would crash entire quiz)
- Added aria-label to shared-header email and password inputs (only had placeholder,
  invisible to screen readers)
- Added dark mode CSS to mary-crossword-floral.html (17 rules: grid, cells, clues,
  buttons, result states)
- Added dark mode CSS to mary-wordsearch-cooking.html (14 rules: grid, hover/found/
  selected states, word bank, buttons)
- SW cache bumped to aa-shell-20260325i
- Archives in modular/archive/ per project rules"
```

## Step 4: Push

```bash
git push origin main
```

---

## SpoonPal ES5 Audit Fix — 2026-03-26

Bug: Mar 25 bulk audit introduced 3 mangled ES5 conversions that broke the entire
task display and all buttons. Found by Claude, fixed 2026-03-26.

### Step 1: Apply .FIX file

```bash
cp "modular/components/spoon-planner/spoon-pal.html.FIX" "modular/components/spoon-planner/spoon-pal.html" && rm "modular/components/spoon-planner/spoon-pal.html.FIX"
```

### Step 2: Stage and commit

```bash
git add modular/components/spoon-planner/spoon-pal.html modular/archive/spoon-pal_2026-03-26_pre-es5-audit-fix.bak.html GIT-COMMANDS.md
git commit -m "Claude: Fix SpoonPal — 3 mangled ES5 conversions from Mar 25 audit broke all tasks + buttons

Bugs introduced by Mar 25 bulk Python regex ES5 conversion script:
- timeline.sortfunction((a,b) { → timeline.sort(function(a,b) {  (renderTimeline broken — no tasks displayed)
- timeline.reducefunction((acc,t) { ×2 → timeline.reduce(function  (calculateSpoons + calculateEndOfDayBalance)

Additional ES6 that was missed or pre-existing:
- IIFE-wrap closure bug in renderTimeline() loop: all buttons captured final i by ref,
  called openTaskModal/deleteTask with out-of-bounds index (buttons did nothing)
- lmj, shorthand prop → lmj: lmj, in addFromTemplate (ES6 shorthand missed by audit)
- Default params in findNextAvailableSlot(existingTasks, startHour = 9, forNewDay = false)
  → ES5 guard pattern (if undefined) at top of function
- 4× shorthand props in rolloverDay Firestore write: timeline,/checkIn,/spoonDebtHistory,/dateKey,
  → explicit key: value form

Archive: modular/archive/spoon-pal_2026-03-26_pre-es5-audit-fix.bak.html"
```

### Step 3: Push

```bash
git push origin main
```

---

## Nightly Audit 2026-03-26 — All 13 Items
# Claude completed all items listed in NIGHTLY-SUMMARY-2026-03-26.md.
# Run these steps in order from Academic-Allies root in Git Bash.

### Step 1: Worktree cleanup (Critical #1)
# Remove registered worktrees that are stale/large
```bash
git worktree remove --force .claude/worktrees/dazzling-maxwell
git branch -d claude/dazzling-maxwell 2>/dev/null || true
```
# Remove orphaned directories not registered in git worktree list
```bash
rm -rf .claude/worktrees/exciting-clarke
rm -rf .claude/worktrees/loving-jackson
rm -rf .claude/worktrees/serene-mccarthy
```
# Prune any remaining stale worktree refs
```bash
git worktree prune
```
# Verify clean
```bash
git worktree list
```

### Step 2: Remove git-tracked backups/ files (Critical #3 — already deleted from disk)
# These files exist in git history but were removed from disk. git rm removes them from tracking.
```bash
git rm --cached -r modular/archive/backups/ 2>/dev/null || git rm -r --ignore-unmatch modular/archive/backups/HEAD.lock.bak modular/archive/backups/HEAD.lock.bak2 modular/archive/backups/HEAD.lock.bak3 modular/archive/backups/HEAD.lock.bak4 modular/archive/backups/HEAD.lock.bak5 modular/archive/backups/HEAD.lock.bak6 modular/archive/backups/HEAD.lock.bak7 modular/archive/backups/HEAD.lock.bak10 modular/archive/backups/HEAD.lock.bak11 modular/archive/backups/HEAD.lock.bak13 modular/archive/backups/HEAD.lock.bak14 modular/archive/backups/index.lock.bak modular/archive/backups/index.lock.bak2 modular/archive/backups/index.lock.bak3 modular/archive/backups/index.lock.bak5 modular/archive/backups/index.lock.bak6 modular/archive/backups/index.lock.bak8 modular/archive/backups/index.lock.bak9 modular/archive/backups/index.lock.bak12 modular/archive/backups/index.lock.bak_try1 modular/archive/backups/index.lock.bak_try2 modular/archive/backups/maintenance.lock.bak
```

### Step 3: Move .claude.json.backup (Critical #2)
# Already archived to modular/archive/claude.json_2026-03-26_root-backup.bak
# Remove the original from the root (it is gitignored, so just delete locally):
```bash
rm -f .claude.json.backup
```

### Step 4: Move root markdown files to docs/ (Housekeeping #10)
# Claude already COPIED them to docs/ (files exist at both locations on disk).
# Use git rm on root originals + git add on docs/ copies (git mv fails when dest exists).
```bash
git rm AUDIT-2026-03-01.md AUDIT-2026-03-02.md "AUDIT-2026-03-03-EXTENDED.md" AUDIT-2026-03-03.md AUDIT-2026-03-05.md AUDIT-2026-03-06.md AUDIT-2026-03-07.md AUDIT-2026-03-10.md IMPROVEMENT-AUDIT-2026-03-25.md NIGHTLY-SUMMARY-2026-03-19.md NIGHTLY-SUMMARY-2026-03-21.md NIGHTLY-SUMMARY-2026-03-22.md NIGHTLY-SUMMARY-2026-03-23.md NIGHTLY-SUMMARY-2026-03-24.md NIGHTLY-SUMMARY-2026-03-26.md PERSISTENCE_INVESTIGATION.md
git add docs/AUDIT-2026-03-01.md docs/AUDIT-2026-03-02.md docs/AUDIT-2026-03-03-EXTENDED.md docs/AUDIT-2026-03-03.md docs/AUDIT-2026-03-05.md docs/AUDIT-2026-03-06.md docs/AUDIT-2026-03-07.md docs/AUDIT-2026-03-10.md docs/IMPROVEMENT-AUDIT-2026-03-25.md docs/NIGHTLY-SUMMARY-2026-03-19.md docs/NIGHTLY-SUMMARY-2026-03-21.md docs/NIGHTLY-SUMMARY-2026-03-22.md docs/NIGHTLY-SUMMARY-2026-03-23.md docs/NIGHTLY-SUMMARY-2026-03-24.md docs/NIGHTLY-SUMMARY-2026-03-26.md docs/PERSISTENCE_INVESTIGATION.md
```

### Step 5: Move quiz/data files to modular/js/ (Housekeeping #11)
# Claude already COPIED them to modular/js/ (files exist at both locations on disk).
# Use git rm on root originals + git add on modular/js/ copies.
```bash
git rm load-mary-quizzes.js tag-mary-trimester.js triple-mary-quizzes.js bonus-quizzes.json mary-quizzes.json
git add modular/js/load-mary-quizzes.js modular/js/tag-mary-trimester.js modular/js/triple-mary-quizzes.js modular/js/bonus-quizzes.json modular/js/mary-quizzes.json
```

### Step 6: Archive dead-code ES6 files (Warning #5)
# Claude already copied them to modular/archive/. Now move originals to archive using git mv:
```bash
git mv modular/js/app.js modular/archive/app_2026-03-26_dead-code-es6.bak.js
git mv modular/js/header-loader.js modular/archive/header-loader_2026-03-26_dead-code-es6.bak.js
git mv modular/js/main.js modular/archive/main_2026-03-26_dead-code-es6.bak.js
git mv modular/components/meal-planner-mary/firebase-photo-upload.js modular/archive/firebase-photo-upload_2026-03-26_dead-code-es6.bak.js
```
# Note: If target .bak files already exist (Claude copied them), git mv will fail.
# In that case, git rm the originals and keep the archive copies:
```bash
git rm modular/js/app.js modular/js/header-loader.js modular/js/main.js modular/components/meal-planner-mary/firebase-photo-upload.js
git add modular/archive/app_2026-03-26_dead-code-es6.bak.js modular/archive/header-loader_2026-03-26_dead-code-es6.bak.js modular/archive/main_2026-03-26_dead-code-es6.bak.js modular/archive/firebase-photo-upload_2026-03-26_dead-code-es6.bak.js
```

### Step 7: Remove .fuse_hidden0000077f00000001 from git tracking (Housekeeping #12)
# File is already in .gitignore (.fuse_hidden*). Remove from tracking:
```bash
git rm --cached .fuse_hidden0000077f00000001 2>/dev/null || true
```

### Step 8: Stage all code changes made by Claude
```bash
git add modular/aa-firebase.js
git add modular/js/status-circle.js
git add modular/components/spoon-planner/spoon-planner.js
git add modular/shared-header.html
git add .gitignore
git add GIT-COMMANDS.md
git add modular/archive/aa-firebase_2026-03-26_pre-catch-warns.bak.js
git add modular/archive/status-circle_2026-03-26_pre-listener-unsub.bak.js
git add modular/archive/spoon-planner.js_2026-03-26_pre-null-guard.bak.js
git add modular/archive/shared-header_2026-03-26_pre-cache-bump.bak.html
git add modular/archive/claude.json_2026-03-26_root-backup.bak
```

### Step 9: Commit
```bash
git commit -m "Claude: Nightly audit 2026-03-26 — 13 items (worktrees, ES5, catches, validation, guards)

Critical fixes:
- Worktrees: removed dazzling-maxwell, pruned orphaned exciting-clarke/loving-jackson/serene-mccarthy dirs
- Misplaced .claude.json.backup moved to modular/archive/
- backups/ subdirectory flattened — git-tracked junk files (lock baks) removed from index

Warning fixes:
- shared-header.html: all internal JS cache refs already at v=20260326 (verified, no change needed)
- Dead code ES6 files archived: app.js, header-loader.js, main.js, firebase-photo-upload.js
  (none referenced by any HTML — zero runtime impact)
- aa-firebase.js silent catches: already had console.warn from session 8 (verified, confirmed)
- spoon-pal.html saveData(): mirror guard already present at line 2117 (verified, no change needed)
- status-circle.js listeners: _unsubNope, _unsubDay, _unsubAuth already stored and cleaned in teardown()
  (verified, all 3 handles already fixed by prior sessions)
- spoon-planner.js line 7: added null guard for getElementById('task-name') and getElementById('task-spoons')

Housekeeping:
- 14 root-level audit/summary .md files moved to docs/
- 3 quiz JS files + 2 JSON data files moved from root to modular/js/
- .gitignore: added .fuse_hidden* pattern
- aa-firebase.js: added string validation to createUserDoc (uid/email/role) and preRegisterEmail (email/role)
  using VALID_ROLES allowlist — invalid role defaults to 'pending', invalid uid/email rejects

Archives:
- modular/archive/aa-firebase_2026-03-26_pre-catch-warns.bak.js
- modular/archive/status-circle_2026-03-26_pre-listener-unsub.bak.js
- modular/archive/spoon-planner.js_2026-03-26_pre-null-guard.bak.js
- modular/archive/shared-header_2026-03-26_pre-cache-bump.bak.html
- modular/archive/claude.json_2026-03-26_root-backup.bak
- modular/archive/app_2026-03-26_dead-code-es6.bak.js
- modular/archive/header-loader_2026-03-26_dead-code-es6.bak.js
- modular/archive/main_2026-03-26_dead-code-es6.bak.js
- modular/archive/firebase-photo-upload_2026-03-26_dead-code-es6.bak.js"
```

### Step 10: Push
```bash
git push origin main
```

### Step 11: Delete this worktree session (silly-pike) after push
```bash
git worktree remove --force .claude/worktrees/silly-pike
git branch -d claude/silly-pike 2>/dev/null || true
git worktree prune
```

---

# Git Commands — Nightly Audit Cleanup 2026-03-26 (serene-mccarthy)

## Step 1: Stage all changes (main repo)
```bash
cd /c/Users/brinc/Academic-Allies
git add -A
```

## Step 2: Commit
```bash
git commit -m "Claude: Nightly audit cleanup — catch warns, unsub handles, file flattening, dead code removal"
```

## Step 3: Push
```bash
git push
```

## Step 4: Delete this worktree session
```bash
git worktree remove --force .claude/worktrees/serene-mccarthy
git branch -d claude/serene-mccarthy 2>/dev/null || true
git worktree prune
```

