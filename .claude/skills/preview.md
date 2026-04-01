---
name: preview
description: Take screenshots of new/changed features for visual review
user_invocable: true
---

Capture visual previews of new or changed features by adding E2E tests with toHaveScreenshot().

## Steps

1. **Identify what changed** — check `git diff main --name-only` for new components, modals, or UI changes

2. **For each new UI feature**, add a screenshot test to the appropriate E2E file:
   - New modal → `e2e/web/full-app.spec.js`
   - New component → create dedicated spec if needed
   - If the feature can't be triggered in web mode (needs Electron), inject the HTML into the page for snapshot (like we did for publish-site and mention-dropdown)

3. **Run with --update-snapshots** to generate the baseline images

4. **Read the generated PNG files** and verify they look correct

5. **Report** which screenshots were captured and any visual issues found

Remember:
- Use `toHaveScreenshot("descriptive-name.png")` not `page.screenshot()`
- For cross-platform: use layout assertions instead of fullPage pixel comparison for injected content
- Dark mode: components that use app CSS will render in light mode in E2E (no Electron dark theme)

Do NOT commit or create PRs. Just capture and review.
