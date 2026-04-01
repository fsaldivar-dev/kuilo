---
name: pr
description: Full PR workflow — tests, docs, snapshots, previews, then create PR
user_invocable: true
---

Complete PR workflow. Run each step in order, stop if any step fails.

## Arguments

- First argument (optional): PR title override
- Second argument (optional): version label (`major`, `minor`, `patch`, `no-release`)

If no label specified, default to `minor` for features, `patch` for fixes.

## Workflow

### Step 1: Tests (/test)

Run all tests locally. If any fail, STOP and report — do not create a PR with failing tests.

1. `npm test` — all unit tests must pass
2. `npx playwright test --project=web` — all E2E tests must pass

### Step 2: Documentation (/docs)

Update all documentation to match current code:

1. Read current `docs/*.md`, `README.md`, `CLAUDE.md`
2. Compare against actual code (hooks, components, MCP tools, IPC methods)
3. Update any outdated docs
4. Create new docs for undocumented features
5. Update README badges and capabilities table
6. Update CLAUDE.md architecture if structure changed

### Step 3: Visual Previews (/preview)

For any NEW UI components or visual changes in this branch:

1. Check `git diff main --name-only` for new components/modals
2. Add E2E screenshot tests for new visual features
3. Capture screenshots and verify they look correct

### Step 4: Snapshots (/snapshots)

Update visual regression baselines:

1. `npx playwright test --project=web --update-snapshots`
2. Verify all pass without `--update-snapshots`

### Step 5: Re-run Tests

Run all tests ONE MORE TIME after docs/snapshot changes to confirm nothing broke:

1. `npm test`
2. `npx playwright test --project=web`

If anything fails, fix it and re-run.

### Step 6: Commit & Push

1. Stage all changes: `git add -A`
2. Commit with descriptive message
3. Push to remote

### Step 7: Create PR

1. Use `gh pr create` with:
   - Title from argument or auto-generated from commits
   - Label: `minor`, `patch`, `major`, or `no-release`
   - Body with:
     - ## Summary (bullet points of what changed)
     - ## New files (table if any)
     - ## Test plan (checklist of what was verified)
     - Footer: 🤖 Generated with [Claude Code](https://claude.com/claude-code)

2. Report the PR URL

### Step 8: Wait for CI

1. `gh pr checks <number> --watch` — wait for CI to complete
2. If CI fails, diagnose from logs, fix, and re-push
3. Report final status

## Rules

- NEVER create a PR with failing tests
- NEVER skip documentation updates
- ALWAYS run tests locally before pushing
- ALWAYS update snapshots if UI changed
- Report each step's status as you go
