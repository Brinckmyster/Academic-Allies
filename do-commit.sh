#!/bin/bash
# Run this from Git Bash (Windows) to commit Claude's nightly work.
# Claude cannot delete the index.lock from inside the VM — run this from your terminal.
# Updated 2026-03-02 by Claude — includes 2026-03-02 nightly work.

cd ~/academic-allies

rm -f .git/index.lock .git/HEAD.lock .git/refs/heads/main.lock

# ── 2026-03-02 nightly + hotfix changes ──
git add modular/shared-header.html \
        "modular/shared-header.html.archive-20260302-abs-url" \
        modular/checkin.html \
        "modular/checkin.html.archive-20260302-custom-prompts" \
        "modular/components/spoon-planner/spoon-pal.html" \
        "modular/components/spoon-planner/spoon-pal.html.archive-20260302-no-firebase" \
        "modular/components/spoon-planner/spoon-pal.html.archive-20260302-pre-autofill" \
        modular/js/aa-mirror.js \
        "modular/js/aa-mirror.js.archive-20260302-spoonpal-switcher" \
        AUDIT-2026-03-02.md \
        NIGHTLY-SUMMARY-2026-03-02.md \
        do-commit.sh

git commit -m "SpoonPal hotfixes: hide student switcher, geolocation weather, autofill from check-in

BUG FIX — aa-mirror.js: student switcher showing on SpoonPal for backstage-manager
  SpoonPal is a personal tool; the multi-student switcher makes no sense there.
  Added 'spoon-pal' to NO_BANNER list so switcher is suppressed on that page.
  Archived: aa-mirror.js.archive-20260302-spoonpal-switcher

BUG FIX — spoon-pal.html: weather hardcoded to Grand Junction, CO
  Replaced fixed lat/lon with navigator.geolocation.getCurrentPosition().
  NWS API now uses actual device location. Falls back gracefully if
  location permission is denied.

FEATURE — spoon-pal.html: pain/fatigue/mood autofill from daily check-in
  After auth + loadData(), reads checkins/{uid}/days/{dateKey} from Firestore.
  Maps the check-in flag (green/yellow/orange/red) + physical category checkboxes
  to approximate pain and fatigue values. Maps mood to SpoonPal select.
  Sleep hours intentionally left alone (filled manually from CPAP data).
  Does NOT call saveData() on autofill — only user interaction saves.
  Archived: spoon-pal.html.archive-20260302-pre-autofill

Also includes earlier 2026-03-02 nightly work:
  - shared-header.html: badge-admin-icon absolute URL fixed
  - checkin.html: custom check-in prompts from studentProfile.checkinPrompts
  - spoon-pal.html: Firebase scripts added (persistence fix)

Co-Authored-By: Claude <noreply@anthropic.com>"

echo ""
echo "=== Done! Run: git push ==="
