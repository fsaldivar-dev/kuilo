---
name: test
description: Run all tests (unit + E2E) and report results
user_invocable: true
---

Run all tests for the Kuilo project and report the results.

## Steps

1. Run unit tests: `npm test`
   - Report total files and tests passed
   - If any fail, show the failure details

2. Run E2E web tests: `npx playwright test --project=web --reporter=line`
   - Report total tests passed
   - If any fail, show which tests and the error

3. Report summary:
   - "✅ X unit + Y E2E — all green" if all pass
   - "❌ N failures" with details if any fail

Do NOT create a PR or commit anything. Just run and report.
