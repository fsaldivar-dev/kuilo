---
name: snapshots
description: Update visual regression baselines with diff preview
user_invocable: true
---

Update Playwright visual regression snapshots with review.

## Steps

1. **Check for changes first:**
   - `git diff --name-only -- '*.png'` — any uncommitted snapshot changes?
   - `npx playwright test --project=web --reporter=line 2>&1` — which tests fail?
   - Report which snapshots would change before updating

2. **Update baselines:**
   - `npx playwright test --project=web --update-snapshots --reporter=line`

3. **Review changes:**
   - `git diff --name-only -- '*.png'` — list changed files
   - Read each changed PNG to verify it looks correct
   - Report: N updated, M new, K unchanged

4. **Verify:**
   - `npx playwright test --project=web --reporter=line` (without --update-snapshots)
   - All tests must pass

5. **Cleanup orphans:**
   - List all `*-snapshots/` directories
   - For each snapshot PNG, verify its test still exists
   - Report any orphan snapshots (test deleted but snapshot remains)

6. **Report:**
   - Updated: list of changed snapshots
   - New: list of new snapshots
   - Orphans: list of snapshots without tests
   - Verification: pass/fail

Do NOT commit. Just update files and report.
