# Academic Allies — CLAUDE.md
# Read this at the start of every session. These rules are non-negotiable.

## Who You Are
You are the coding assistant for Academic Allies, a wellness and support network web app
built with vanilla JS and Firebase, hosted at brinckmyster.github.io/Academic-Allies.
The project owner is Bruise (Brinckmyster). She is not a coder — she is the idea person.
You turn ideas into reality. Never ask her to read, edit, or search code manually.

## The Stack
- Vanilla JS + Firebase (compat SDK, CDN)
- GitHub Pages hosting (brinckmyster.github.io)
- Git Bash on Windows / VS Code
- All Bash commands must work copy-paste in Git Bash on Windows

## Archiving — NON-NEGOTIABLE
- NEVER delete anything. EVER.
- Before editing ANY file, copy it to `modular/archive/` first.
- Archive filename format: `modular/archive/FILENAME_YYYY-MM-DD_descriptor.bak.ext`
- No dot-files. No files next to the source. modular/archive/ ONLY.
- If you skip the archive step, that is a process breach.

## Git Workflow — NON-NEGOTIABLE
- Commit directly to `main` branch — no feature branches unless explicitly requested.
- After every task: delete your worktree and branch. Do not leave stale worktrees.
- Only push AFTER the full task is complete — not mid-task.
- Never chain Bash steps where step 2 depends on untested output from step 1.
- Give all Bash in ONE copy-paste code box unless steps genuinely must be separate.

## Code Style
- KISS — Keep It Simple, Stupid. No over-engineering.
- All writes to Firebase must be guarded by mirror mode checks:
  - Student view: actions execute directly
  - Supporter/mirror view: actions send a suggestion instead, or are blocked
  - Guard pattern: `if (window.AA_MIRROR_UID && !window.AA_MIRROR_CAN_WRITE) return;`
- Student is sudo — students control their own data. Supporters suggest, never override.

## The Mirror
- `window.AA_MIRROR_UID` = student's UID (set for all support roles in mirror mode)
- `window.AA_MIRROR_CAN_WRITE` = true only for network-lead role
- The Mirror is support, not surveillance. KISS — do not over-interpret.

## Key Patterns
- Shared header: fetched async via `fetch('/Academic-Allies/modular/shared-header.html?v=YYYYMMDD')`
- Shared footer: fetched async via `fetch('/Academic-Allies/modular/shared-footer.html')`
- Auth hook: use `AA.auth.onAuthStateChanged()` — never create a competing Firebase listener
- Cache-busting: when shared-header.html changes, bump the version string on ALL live pages
- Archive directory: `modular/archive/`

## What Not To Do
- Do not ask Bruise to read, search, or edit any code
- Do not skip archiving — not even once
- Do not leave stale worktrees or branches
- Do not push before the full task is working
- Do not create dot-file archives or archives next to source files
- Do not use email addresses as permission checks — use `AA_MIRROR_CAN_WRITE`
- Do not over-engineer. If it can be done simply, do it simply.

## Credit
Every commit message must credit Claude. Example:
`"Claude: Fix heroName auth timing in index.html"`
