#!/bin/bash
# Run this from Git Bash: bash ~/academic-allies/do-commit.sh
cd ~/academic-allies

rm -f .git/index.lock .git/HEAD.lock .git/refs/heads/main.lock

# Stage everything — modified tracked files + all untracked
git add -A

if [ -f .git/index.lock ]; then
  cp .git/index.lock .git/index
  rm -f .git/index.lock
fi

rm -f .git/HEAD.lock .git/refs/heads/main.lock

git commit -m "Commit all pending changes: modified pages, archive files, flower images

- All version-bumped HTML pages from session work
- Archive files (admin, shared-header, aa-firebase, calendar, etc.)
- New flower images (flowers 31-40: iris, lily, calla lily, gerber daisy, etc.)
- support-dashboard component folder
- auth-system.js (retired stub)
- do-commit.sh utility script

Co-Authored-By: Claude <noreply@anthropic.com>"

echo ""
echo "=== Done! Run: git push ==="
