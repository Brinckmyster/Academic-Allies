#!/bin/bash
# Run this from Git Bash (Windows) to commit Claude's nightly work.
# Claude cannot delete the index.lock from inside the VM — run this from your terminal.

cd ~/academic-allies

rm -f .git/index.lock .git/HEAD.lock .git/refs/heads/main.lock

git add modular/emergency.html \
        "modular/emergency.html.archive-20260301-pre-p2"

git commit -m "Priority 2: Seed defaults button + Pick from network dropdown (emergency.html)

- emergency.html: Add 'Seed Default Contacts' button (backstage-manager only)
  Seeds Mom = Dorothy Brinck (dorothy.brinck@gmail.com) and Dad = Brian Brinck
  (no email/phone yet). Skips contacts already present by name.
- emergency.html: Add 'Pick from Support Network' collapsible panel in Edit section
  Loads users/{studentUid}.supportNetwork on open, fetches name+email from each
  member's Firestore doc, and pre-fills a new contact form on selection.
  Available to all editors (admin, network-lead, student on own page).
- Archived: emergency.html.archive-20260301-pre-p2

Co-Authored-By: Claude <noreply@anthropic.com>"

echo ""
echo "=== Done! Run: git push ==="
