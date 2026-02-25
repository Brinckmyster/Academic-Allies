#!/bin/bash
# Run this from Git Bash: bash ~/academic-allies/do-commit.sh
cd ~/academic-allies

rm -f .git/index.lock .git/HEAD.lock .git/refs/heads/main.lock

# Remove the bad submodule entry from the index
git rm --cached .claude/worktrees/naughty-taussig 2>/dev/null || true
git rm -r --cached .claude/ 2>/dev/null || true

if [ -f .git/index.lock ]; then
  cp .git/index.lock .git/index
  rm -f .git/index.lock
fi

rm -f .git/HEAD.lock .git/refs/heads/main.lock

# Add .gitignore to exclude .claude/ going forward
git add .gitignore

if [ -f .git/index.lock ]; then
  cp .git/index.lock .git/index
  rm -f .git/index.lock
fi

rm -f .git/HEAD.lock .git/refs/heads/main.lock

git commit -m "Remove .claude/ submodule, add .gitignore

Accidentally committed .claude/worktrees as embedded repo — broke
GitHub Pages build. Removed from index and added to .gitignore.

Co-Authored-By: Claude <noreply@anthropic.com>"

echo ""
echo "=== Done! Run: git push ==="
