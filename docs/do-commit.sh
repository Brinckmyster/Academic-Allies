#!/bin/bash
# Claude: do-commit.sh — commit + push Claude's nightly work, then clean worktrees.
# Run from Git Bash (Windows). Updated 2026-03-05 by Claude — worktree cleanup.

cd ~/academic-allies

rm -f .git/index.lock .git/HEAD.lock .git/refs/heads/main.lock

# ── Stage all changes ──
git add -A

echo ""
echo "=== Staged files ==="
git status --short
echo ""

read -p "Commit message (or Enter for default): " MSG
if [ -z "$MSG" ]; then
  MSG="Claude: nightly audit + fixes $(date +%Y-%m-%d)

Co-Authored-By: Claude <noreply@anthropic.com>"
fi

git commit -m "$MSG"

echo ""
read -p "Push to remote? (y/n): " PUSH
if [ "$PUSH" = "y" ] || [ "$PUSH" = "Y" ]; then
  git push
  echo ""
  echo "=== Pushed! Cleaning worktrees... ==="
  # Claude: auto-cleanup worktrees after push to prevent disk bloat
  if [ -d ".claude/worktrees" ]; then
    rm -rf .claude/worktrees/*
    echo "Worktrees cleaned."
  else
    echo "No worktrees to clean."
  fi
else
  echo "=== Committed locally. Run 'git push' when ready. ==="
fi

echo "=== Done! ==="
