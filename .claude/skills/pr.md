---
name: pr
description: Full PR workflow — tests, reviews, docs, snapshots, changelog, then create PR
user_invocable: true
---

Complete PR workflow. Run each step in order, stop and fix if any step fails.

## Arguments

- First argument (optional): PR title override
- Second argument (optional): version label (`major`, `minor`, `patch`, `no-release`)
- Default: `minor` for features, `patch` for fixes, `no-release` for docs/CI

## Workflow

### Step 1: Tests
Run all tests. If any fail, STOP — do not continue.
1. `npm test` — all unit tests must pass
2. `npx playwright test --project=web` — all E2E tests must pass
Report: "X unit + Y E2E — all green" or failure details.

### Step 2: Architecture Review
Quick validation that code structure is sound.
1. Check no file in `src/` exceeds 200 lines
2. Verify App.jsx hook order matches CLAUDE.md
3. Report any violations — fix before continuing

### Step 3: Documentation
Update all docs to match current code.
1. Read `docs/*.md`, `README.md`, `CLAUDE.md`
2. Compare against actual code (hooks, components, MCP tools, IPC methods)
3. Update outdated docs, create new docs for undocumented features
4. Update README badges (test count, MCP tool count) and capabilities table
5. Update CLAUDE.md architecture if structure changed

### Step 4: Visual Previews
For any NEW UI components in this branch:
1. `git diff main --name-only` for new components/modals
2. Add E2E tests for new visual features
3. For cross-platform: use layout assertions, not pixel snapshots

### Step 5: Snapshots
1. `npx playwright test --project=web --update-snapshots`
2. Verify: `npx playwright test --project=web` (without --update-snapshots)

### Step 6: Changelog
1. `git log $(git describe --tags --abbrev=0)..HEAD --oneline --no-merges`
2. Group by: features, fixes, improvements
3. Write entry in CHANGELOG.md (Spanish, user-facing)

### Step 7: Final Tests
Run ALL tests one more time after changes.
1. `npm test`
2. `npx playwright test --project=web`
If anything fails → fix and re-run. Max 2 retries.

### Step 8: Commit & Push
1. `git add -A`
2. Commit with descriptive message
3. `git push`

### Step 9: Create PR
```
gh pr create --title "..." --label "..." --body "..."
```
Body format: Summary (bullets), New files (table), Test plan (checklist)

### Step 10: Wait for CI
1. `gh pr checks <number> --watch`
2. If CI fails → read logs, fix, push, re-watch
3. Report final status: all green or blocked

## Error Recovery

If any step fails:
1. Report which step failed and why
2. Attempt to fix (max 2 attempts)
3. If can't fix → stop, report status, do NOT create PR with known issues

## Rules

- NEVER create a PR with failing tests
- NEVER skip documentation updates
- ALWAYS run tests locally before pushing
- ALWAYS include changelog entry
- Report each step's status as you go
- Do not push more commits after saying "PR ready"
