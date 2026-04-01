---
name: snapshots
description: Update visual regression snapshot baselines
user_invocable: true
---

Update Playwright visual regression snapshots to match the current UI.

## Steps

1. Run `npx playwright test --project=web --update-snapshots --reporter=line`

2. Check which snapshot files changed: `git diff --name-only -- '*.png'`

3. If new snapshots were created, verify them by reading the image files

4. Run again WITHOUT --update-snapshots to confirm they pass: `npx playwright test --project=web --reporter=line`

5. Report:
   - How many snapshots updated
   - How many new snapshots created
   - Whether all tests pass with the new baselines

Do NOT commit or create PRs. Just update the files.
