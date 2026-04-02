---
name: preview
description: Capture screenshots of features and insert them into docs
user_invocable: true
---

Capture visual previews of features and add them to the documentation.

## Steps

1. **Identify features that need screenshots:**
   - Check `git diff main --name-only` for new components
   - Check each `docs/*.md` — does it have a screenshot or image reference?
   - List features missing visual documentation

2. **For each feature, add an E2E screenshot test:**
   - If testable in web mode: add to appropriate `e2e/web/*.spec.js`
   - If Electron-only: inject HTML mockup into the page
   - Use `toHaveScreenshot("feature-name.png")`
   - For cross-platform: prefer layout assertions over pixel comparison

3. **Run with --update-snapshots** to generate images

4. **Read each generated PNG** and verify it shows the feature correctly

5. **Insert screenshot references into docs:**
   - For each `docs/*.md` that's missing images:
   - Add `![Feature name](screenshots/feature-name.png)` at relevant section
   - If the screenshot is from E2E snapshots, copy to `docs/screenshots/`

6. **Report:**
   - Screenshots captured (list with feature names)
   - Docs updated with image references
   - Features that couldn't be captured (need Electron)

Do NOT modify app code. Only create tests, screenshots, and update docs.
