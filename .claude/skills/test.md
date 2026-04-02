---
name: test
description: Run all tests (unit + E2E) and report detailed results
user_invocable: true
---

Run all tests and report results with timing and error classification.

## Steps

1. **Unit tests:** `npm test 2>&1`
   - Report: files passed/failed, tests passed/failed
   - Report: total duration
   - If failures: classify each as assertion error, timeout, or runtime error
   - Show the failing test name + error message

2. **E2E web tests:** `npx playwright test --project=web --reporter=line 2>&1`
   - Report: tests passed/failed
   - Report: total duration
   - If failures: show test name + error type
   - If snapshot mismatch: note which snapshots differ

3. **Summary:**
   - "X unit (Ys) + Z E2E (Ws) — all green" if all pass
   - "N failures:" with classified details if any fail
   - If unhandled errors detected, flag separately

Do NOT create a PR or commit anything. Just run and report.
