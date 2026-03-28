# Git Commands — lastSeen cache fix (2026-03-26)
# Run from: C:/Users/brinc/Academic-Allies

## Step 1: Copy fixed files from worktree

```bash
WORKTREE="C:/Users/brinc/Academic-Allies/.claude/worktrees/flamboyant-shannon"

cp "$WORKTREE/modular/aa-firebase.js.FIX" "modular/aa-firebase.js"
cp "$WORKTREE/modular/shared-header.html.FIX" "modular/shared-header.html"
cp "$WORKTREE/modular/archive/aa-firebase_2026-03-26_pre-lastseen-fix.bak.js" "modular/archive/aa-firebase_2026-03-26_pre-lastseen-fix.bak.js"
cp "$WORKTREE/modular/archive/shared-header_2026-03-26_pre-lastseen-fix.bak.html" "modular/archive/shared-header_2026-03-26_pre-lastseen-fix.bak.html"
```

## Step 2: Stage and commit

```bash
git add modular/aa-firebase.js modular/shared-header.html modular/archive/aa-firebase_2026-03-26_pre-lastseen-fix.bak.js modular/archive/shared-header_2026-03-26_pre-lastseen-fix.bak.html GIT-COMMANDS.md
git commit -m "Claude: Fix lastSeen staleness — server read, throttle race, debug log"
```

## Step 3: Push

```bash
git push
```
