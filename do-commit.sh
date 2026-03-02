#!/bin/bash
# Run this from Git Bash (Windows) to commit Claude's nightly work.
# Claude cannot delete the index.lock from inside the VM — run this from your terminal.
# Updated 2026-03-02 by Claude — includes 2026-03-02 nightly work.

cd ~/academic-allies

rm -f .git/index.lock .git/HEAD.lock .git/refs/heads/main.lock

# ── 2026-03-02 nightly changes ──
git add modular/shared-header.html \
        "modular/shared-header.html.archive-20260302-abs-url" \
        modular/checkin.html \
        "modular/checkin.html.archive-20260302-custom-prompts" \
        "modular/components/spoon-planner/spoon-pal.html" \
        "modular/components/spoon-planner/spoon-pal.html.archive-20260302-no-firebase" \
        AUDIT-2026-03-02.md \
        NIGHTLY-SUMMARY-2026-03-02.md \
        do-commit.sh

git commit -m "Nightly 2026-03-02: audit, shared-header URL fix, checkin prompts, SpoonPal persistence fix

AUDIT — no FAILs found; one WARNING resolved:
  FIX-1: shared-header.html — badge-admin-icon.png was loading from an
    absolute github.io URL; changed to site-root-relative
    /Academic-Allies/modular/icons/badge-admin-icon.png.
  Archived: shared-header.html.archive-20260302-abs-url

FEATURE — checkin.html: custom check-in prompts (Priority 3)
  After auth fires, reads studentProfile.checkinPrompts (string[]) from
  Firestore. If the array has entries they replace the default gateway-q
  paragraph text for each section (mental, physical, school, spiritual,
  social in that order). Partial arrays are safe. Falls back silently to
  defaults on any error. Mirror-aware (uses AA_MIRROR_UID when present).
  Archived: checkin.html.archive-20260302-custom-prompts

BUG FIX — spoon-pal.html: SpoonPal data not persisting through refresh/new browser
  Root cause: Firebase SDK scripts (firebase-app-compat.js, firebase-auth-compat.js,
    firebase-firestore-compat.js) and aa-firebase.js were completely absent from
    <head>. waitForAA() polled forever, currentUid was never set, and every
    saveData()/loadData() call silently exited through the null-check guard.
    Nothing was ever read from or written to Firestore.
  Fix 1: Added all 4 Firebase scripts + aa-mirror.js to <head>.
  Fix 2: Moved fetchWeather() inside loadData() callback to eliminate a race
    condition where weather's saveData() could overwrite Firestore with blank
    defaults before loadData() restored the saved state.
  Archived: spoon-pal.html.archive-20260302-no-firebase

Co-Authored-By: Claude <noreply@anthropic.com>"

echo ""
echo "=== Done! Run: git push ==="
