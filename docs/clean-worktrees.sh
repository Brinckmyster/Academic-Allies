#!/bin/bash
# Claude: clean-worktrees.sh — manually remove all Claude worktrees.
# Run from Git Bash anytime to free disk space.
# Created 2026-03-05 by Claude.

cd ~/academic-allies

if [ -d ".claude/worktrees" ]; then
  echo "Removing all worktrees in .claude/worktrees/..."
  rm -rf .claude/worktrees/*
  echo "Done. Worktrees cleaned."
else
  echo "No .claude/worktrees/ directory found."
fi
