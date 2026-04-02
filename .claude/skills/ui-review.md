---
name: ui-review
description: Evaluate UI usability against Nielsen's heuristics + WCAG
user_invocable: true
---

Analyze the current UI for usability problems using screenshots and heuristic evaluation.

## Steps

1. **Capture screenshots** of the app in its current state:
   - Run `npx playwright test --project=web` to start the dev server
   - Use Playwright to navigate key views and capture full-page screenshots
   - If the app needs Electron, ask the user for screenshots instead

2. **Read the screenshots** using the Read tool (Claude can see images)

3. **Evaluate against Nielsen's 10 Heuristics:**
   - Visibility of system status
   - Match between system and real world
   - User control and freedom
   - Consistency and standards
   - Error prevention
   - Recognition rather than recall
   - Flexibility and efficiency of use
   - Aesthetic and minimalist design
   - Help users recognize, diagnose, recover from errors
   - Help and documentation

4. **Check WCAG 2.1 AA basics:**
   - Color contrast (text vs background) — scan CSS for color pairs
   - Font sizes (minimum 12px for body text)
   - Interactive target sizes (minimum 24px)
   - Missing ARIA labels — grep for buttons/inputs without aria-label
   - Keyboard navigation — check for tabIndex, onKeyDown handlers

5. **Scan CSS for consistency issues:**
   - `grep -r "color:" src/index.css | sort | uniq -c | sort -rn` — how many unique colors?
   - `grep -r "font-size:" src/index.css | sort | uniq -c | sort -rn` — how many unique sizes?
   - `grep -r "border-radius:" src/index.css | sort | uniq -c | sort -rn` — how many unique radii?

6. **Report** with severity (critical/major/minor):
   - Each issue: what's wrong, which heuristic it violates, where in code, suggested fix
   - Group by component/area
   - Prioritize by user impact

Do NOT make code changes. Report findings only.
