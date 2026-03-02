#!/bin/bash
# Run this from Git Bash (Windows) to commit Claude's nightly work.
# Claude cannot delete the index.lock from inside the VM — run this from your terminal.
# Updated 2026-03-02 by Claude — 3rd commit: SpoonPal ownership, quick-entry, emoji fix.

cd ~/academic-allies

rm -f .git/index.lock .git/HEAD.lock .git/refs/heads/main.lock

# ── 2026-03-02 — 3rd commit: SpoonPal ownership fix, quick-entry UI, duplicate emoji fix ──
git add -f \
        "modular/js/aa-mirror.js" \
        "modular/js/aa-mirror.js.archive-20260302-spoonpal-nomirror" \
        "modular/components/spoon-planner/spoon-pal.html" \
        "modular/components/spoon-planner/spoon-pal.html.archive-20260302-pre-quickentry" \
        "modular/components/spoon-planner/spoon-pal.html.archive-20260302-pre-emoji-strip" \
        "NIGHTLY-SUMMARY-2026-03-02.md" \
        "do-commit.sh"

git commit -m "SpoonPal: ownership fix, quick-entry UI, duplicate emoji fix

BUG FIX — aa-mirror.js: upgraded spoon-pal from NO_BANNER → NO_MIRROR
  SpoonPal is Bruise's own personal planner, never a student page.
  AA_MIRROR_UID is now fully suppressed when on spoon-pal.
  currentUid in spoon-pal.html hardened to always use user.uid.
  Archived: aa-mirror.js.archive-20260302-spoonpal-nomirror

FEATURE — spoon-pal.html: Quick Entry tap buttons replace 1-10 scales
  Pain, fatigue, and mood inputs replaced with tap-to-pick button groups:
  None / Low / Medium / High (color-coded green/yellow/orange/red).
  Hidden inputs feed updateCheckIn() unchanged. initQuickEntry() wires
  click handlers; restoreQuickEntry() re-highlights on data load.
  Sleep hours remain a manual number input (CPAP data).
  Removed autofillFromCheckin() — it was reading from the student's
  check-in data, not Bruise's. SpoonPal is personal to the viewer.
  Archived: spoon-pal.html.archive-20260302-pre-quickentry

BUG FIX — spoon-pal.html: duplicate emojis in timeline
  Old Firestore data had emojis baked into description text.
  deriveEmoji() keyword matching changed from substring to whole-word
  (split on \\W+, indexOf) to prevent false positives.
  stripLeadingEmoji() helper strips baked-in leading emojis from
  description text at render time in renderTimeline().
  Archived: spoon-pal.html.archive-20260302-pre-emoji-strip

Co-Authored-By: Claude <noreply@anthropic.com>"

echo ""
echo "=== Done! Run: git push ==="
